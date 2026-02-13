import {
  normalizeSqlIdentifierPath,
  normalizeSqlExpression,
  stripTrailingSemicolon,
  findKeywordIndex,
  splitBooleanConditions
} from '../utils/index';
import { formatFromClause } from './from';
import { formatSelect } from './select';
import { formatCaseExpressionStacked } from './case';
import { scanStringAware } from '../../../utils/string-scan';

// Format UPDATE statements with SET and optional FROM/WHERE.
export const formatUpdate = (text: string, baseIndent: string, nestedIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();
  const updateMatch = upper.match(/^UPDATE\s+/);
  if (!updateMatch) {
    return [baseIndent + cleaned + ';'];
  }

  const rest = cleaned.slice(updateMatch[0].length).trimStart();
  const setIndex = findKeywordIndex(rest, 'SET');
  if (setIndex < 0) {
    return [baseIndent + cleaned + ';'];
  }

  const tablePart = normalizeSqlIdentifierPath(rest.slice(0, setIndex).trim());
  if (tablePart.length === 0) {
    return [baseIndent + cleaned + ';'];
  }

  let afterSet = rest.slice(setIndex + 3);
  const firstNonSpace = afterSet.search(/\S/);
  const firstNewline = afterSet.search(/\r?\n/);
  const setInline = firstNonSpace >= 0 && (firstNewline === -1 || firstNonSpace < firstNewline);
  afterSet = afterSet.trimStart();
  const fromIndex = findKeywordIndex(afterSet, 'FROM');
  const whereIndex = findKeywordIndex(afterSet, 'WHERE');
  let setEnd = afterSet.length;
  if (fromIndex >= 0) setEnd = Math.min(setEnd, fromIndex);
  if (whereIndex >= 0) setEnd = Math.min(setEnd, whereIndex);
  const setTextRaw = afterSet.slice(0, setEnd).trimEnd();
  const splitTopLevelPreserve = (input: string, delimiter: string): string[] => {
    const parts: string[] = [];
    let depth = 0;
    let start = 0;
    scanStringAware(input, (ch, index) => {
      if (ch === '(') {
        depth++;
        return;
      }
      if (ch === ')') {
        depth = Math.max(0, depth - 1);
        return;
      }
      if (ch === delimiter && depth === 0) {
        parts.push(input.slice(start, index));
        start = index + 1;
      }
    });
    parts.push(input.slice(start));
    return parts.filter((part) => part.trim().length > 0);
  };
  const splitAssignment = (
    assignment: string
  ): { lhs: string; rhs: string } | null => {
    let depth = 0;
    let match = -1;
    scanStringAware(assignment, (ch, index) => {
      if (ch === '(') {
        depth++;
        return;
      }
      if (ch === ')') {
        depth = Math.max(0, depth - 1);
        return;
      }
      if (ch === '=' && depth === 0) {
        match = index;
        return true;
      }
    });
    if (match < 0) return null;
    return {
      lhs: assignment.slice(0, match).trim(),
      rhs: assignment.slice(match + 1).trim()
    };
  };
  const formatAssignment = (assignment: string): string[] => {
    const trimmed = assignment.trim();
    if (trimmed.length === 0) return [];
    const parts = splitAssignment(trimmed);
    if (!parts) {
      return [normalizeSqlExpression(trimmed)];
    }
    const lhs = normalizeSqlExpression(parts.lhs);
    const rhs = parts.rhs.trim();
    if (/^case\b/i.test(rhs)) {
      const caseLines = formatCaseExpressionStacked(rhs);
      if (caseLines) {
        const caseIndent = lhs.length + 3;
        const lines: string[] = [];
        lines.push(`${lhs} = ${caseLines[0].trimStart()}`);
        for (let i = 1; i < caseLines.length; i++) {
          lines.push(' '.repeat(caseIndent) + caseLines[i].trimStart());
        }
        return lines;
      }
    }
    return [normalizeSqlExpression(`${lhs} = ${rhs}`)];
  };
  const rawAssignments = splitTopLevelPreserve(setTextRaw, ',');
  const assignments = rawAssignments.map(formatAssignment).filter((lines) => lines.length > 0);
  afterSet = afterSet.slice(setEnd).trimStart();

  const lines: string[] = [];
  const indentStep = Math.max(0, nestedIndent.length - baseIndent.length);
  const minorIndent = Math.max(1, Math.round(indentStep / 2));
  const setIndent = baseIndent + ' '.repeat(indentStep + minorIndent);
  const assignmentIndent = setIndent + ' '.repeat(4);
  const whereIndent = baseIndent + ' '.repeat(minorIndent);
  const whereNestedIndent = whereIndent + ' '.repeat(indentStep);
  const formatWhereInlineFirst = (text: string): string[] => {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return [whereIndent + 'where'];
    }
    const conditions = splitBooleanConditions(trimmed);
    if (conditions.length <= 1) {
      return [whereIndent + `where ${normalizeSqlExpression(trimmed)}`.trim()];
    }
    const lines: string[] = [];
    lines.push(whereIndent + `where ${normalizeSqlExpression(conditions[0].text)}`);
    for (let i = 1; i < conditions.length; i++) {
      const condition = conditions[i];
      const prefix = condition.op ? `${condition.op} ` : '';
      lines.push(whereNestedIndent + prefix + normalizeSqlExpression(condition.text));
    }
    return lines;
  };

  lines.push(baseIndent + `update ${tablePart}`);
  if (assignments.length === 0) {
    lines.push(setIndent + 'set');
  } else {
    if (setInline) {
      const first = assignments[0];
      const firstLine = first[0];
      const hasMore = assignments.length > 1;
      lines.push(setIndent + `set ${firstLine}${first.length === 1 && hasMore ? ',' : ''}`);
      for (let i = 1; i < first.length; i++) {
        lines.push(assignmentIndent + first[i]);
      }
      if (first.length > 1 && assignments.length > 1) {
        lines[lines.length - 1] = lines[lines.length - 1] + ',';
      }
      for (let i = 1; i < assignments.length; i++) {
        const assignmentLines = assignments[i];
        for (let j = 0; j < assignmentLines.length; j++) {
          lines.push(assignmentIndent + assignmentLines[j]);
        }
        lines[lines.length - 1] =
          lines[lines.length - 1] + (i < assignments.length - 1 ? ',' : '');
      }
    } else {
      lines.push(setIndent + 'set');
      for (let i = 0; i < assignments.length; i++) {
        const assignmentLines = assignments[i];
        for (let j = 0; j < assignmentLines.length; j++) {
          lines.push(assignmentIndent + assignmentLines[j]);
        }
        lines[lines.length - 1] =
          lines[lines.length - 1] + (i < assignments.length - 1 ? ',' : '');
      }
    }
  }

  if (afterSet.length === 0) {
    lines[lines.length - 1] = lines[lines.length - 1] + ';';
    return lines;
  }

  const upperRest = afterSet.toUpperCase();
  if (upperRest.startsWith('FROM ')) {
    const fromText = afterSet.slice(5).trimStart();
    const whereIndexInFrom = findKeywordIndex(fromText, 'WHERE');
    const fromPart = whereIndexInFrom >= 0 ? fromText.slice(0, whereIndexInFrom).trim() : fromText;
    const fromLines = formatFromClause(fromPart, baseIndent, nestedIndent, formatSelect);
    lines.push(...fromLines);
    if (whereIndexInFrom >= 0) {
      const whereText = fromText.slice(whereIndexInFrom + 5).trimStart();
      const whereLines = formatWhereInlineFirst(whereText);
      whereLines[whereLines.length - 1] = whereLines[whereLines.length - 1] + ';';
      lines.push(...whereLines);
      return lines;
    }
    lines[lines.length - 1] = lines[lines.length - 1] + ';';
    return lines;
  }

  if (upperRest.startsWith('WHERE')) {
    const whereText = afterSet.slice(5).trimStart();
    const whereLines = formatWhereInlineFirst(whereText);
    whereLines[whereLines.length - 1] = whereLines[whereLines.length - 1] + ';';
    lines.push(...whereLines);
    return lines;
  }

  lines[lines.length - 1] = lines[lines.length - 1] + ';';
  return lines;
};
