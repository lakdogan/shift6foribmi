import {
  normalizeSqlIdentifierPath,
  normalizeSqlExpression,
  stripTrailingSemicolon,
  splitTopLevel,
  findKeywordIndex
} from '../utils/index';
import { formatFromClause } from './from';
import { formatBooleanClause } from './conditions';
import { formatSelect } from './select';

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

  let afterSet = rest.slice(setIndex + 3).trimStart();
  const fromIndex = findKeywordIndex(afterSet, 'FROM');
  const whereIndex = findKeywordIndex(afterSet, 'WHERE');
  let setEnd = afterSet.length;
  if (fromIndex >= 0) setEnd = Math.min(setEnd, fromIndex);
  if (whereIndex >= 0) setEnd = Math.min(setEnd, whereIndex);
  const setText = afterSet.slice(0, setEnd).trim();
  const assignments = splitTopLevel(setText, ',').map(normalizeSqlExpression);
  afterSet = afterSet.slice(setEnd).trimStart();

  const lines: string[] = [];
  lines.push(baseIndent + `update ${tablePart}`);
  lines.push(baseIndent + 'set');
  for (let i = 0; i < assignments.length; i++) {
    const suffix = i < assignments.length - 1 ? ',' : '';
    lines.push(nestedIndent + assignments[i] + suffix);
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
      const whereLines = formatBooleanClause('where', whereText, baseIndent, nestedIndent);
      whereLines[whereLines.length - 1] = whereLines[whereLines.length - 1] + ';';
      lines.push(...whereLines);
      return lines;
    }
    lines[lines.length - 1] = lines[lines.length - 1] + ';';
    return lines;
  }

  if (upperRest.startsWith('WHERE')) {
    const whereText = afterSet.slice(5).trimStart();
    const whereLines = formatBooleanClause('where', whereText, baseIndent, nestedIndent);
    whereLines[whereLines.length - 1] = whereLines[whereLines.length - 1] + ';';
    lines.push(...whereLines);
    return lines;
  }

  lines[lines.length - 1] = lines[lines.length - 1] + ';';
  return lines;
};
