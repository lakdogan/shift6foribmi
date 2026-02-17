import {
  normalizeSqlWhitespace,
  normalizeSqlExpression,
  stripTrailingSemicolon,
  findKeywordIndex,
  findLastKeywordIndex,
  findMatchingParenIndex,
  splitTopLevel
} from '../utils/index';
import { formatPsmBeginEndBlock } from './psm';
import { formatSelect } from './select';

// Format DDL statements as normalized single lines.
export const formatDdlStatement = (text: string, baseIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const normalized = normalizeSqlWhitespace(cleaned);
  const upper = normalized.toUpperCase();
  const nestedIndent = ' '.repeat(baseIndent.length * 2);

  const routineMatch = upper.match(/^CREATE(\s+OR\s+REPLACE)?\s+(TRIGGER|PROCEDURE|FUNCTION)\b/);
  if (routineMatch) {
    const beginIndex = findKeywordIndex(normalized, 'BEGIN');
    if (beginIndex >= 0) {
      const header = normalized.slice(0, beginIndex).trim();
      const bodyWithEnd = normalized.slice(beginIndex + 5).trimStart();
      const endIndex = findLastKeywordIndex(bodyWithEnd, 'END');
      const bodyText = endIndex >= 0 ? bodyWithEnd.slice(0, endIndex).trim() : bodyWithEnd;
      const lines: string[] = [];
      if (routineMatch[2] === 'TRIGGER') {
        lines.push(...formatTriggerHeader(header, baseIndent));
      } else {
        lines.push(...formatRoutineHeader(header, baseIndent, nestedIndent));
      }
      lines.push(...formatPsmBeginEndBlock(bodyText, baseIndent, nestedIndent));
      return lines;
    }

    const functionReturnLines = formatSqlFunctionReturnStatement(normalized, baseIndent, nestedIndent);
    if (functionReturnLines) {
      return functionReturnLines;
    }
  }

  const createTableLines = formatCreateTableStatement(normalized, baseIndent, nestedIndent);
  if (createTableLines) {
    return createTableLines;
  }

  return [baseIndent + `${normalized};`];
};

const formatTriggerHeader = (header: string, baseIndent: string): string[] => {
  const segments: string[] = [];
  const points = [
    { index: findKeywordIndex(header, 'REFERENCING') },
    { index: findKeywordIndex(header, 'FOR EACH ROW') }
  ]
    .filter((point) => point.index >= 0)
    .sort((a, b) => a.index - b.index);
  let cursor = 0;
  for (const point of points) {
    if (point.index > cursor) {
      segments.push(header.slice(cursor, point.index).trim());
    }
    cursor = point.index;
  }
  segments.push(header.slice(cursor).trim());
  return segments.map((segment) => baseIndent + normalizeSqlWhitespace(segment));
};

const formatRoutineHeader = (
  header: string,
  baseIndent: string,
  nestedIndent: string
): string[] => {
  const normalized = normalizeSqlWhitespace(header);
  const parenIndex = normalized.indexOf('(');
  if (parenIndex < 0) return [baseIndent + normalized];

  const closingIndex = findMatchingParenIndex(normalized, parenIndex);
  if (closingIndex === null) return [baseIndent + normalized];

  const prefix = normalized.slice(0, parenIndex).trim();
  const paramsText = normalized.slice(parenIndex + 1, closingIndex).trim();
  const suffixRaw = normalized.slice(closingIndex + 1).trim();
  const suffix = suffixRaw.length > 0 ? normalizeSqlWhitespace(suffixRaw) : '';
  const appendSuffix = (headLines: string[]): string[] => {
    if (suffix.length === 0) return headLines;
    const expandedSuffix = formatRoutineReturnsTableSuffix(suffix, baseIndent, nestedIndent);
    if (expandedSuffix) {
      return [...headLines, ...expandedSuffix];
    }
    const out = [...headLines];
    out[out.length - 1] = `${out[out.length - 1]} ${suffix}`.trimEnd();
    return out;
  };

  if (paramsText.length === 0) {
    return appendSuffix([baseIndent + `${prefix}()`]);
  }

  const params = splitTopLevel(paramsText, ',').map(normalizeSqlWhitespace);
  if (params.length <= 1) {
    const paramsJoined = params.join(', ');
    return appendSuffix([baseIndent + `${prefix} (${paramsJoined})`.trimEnd()]);
  }

  const lines: string[] = [];
  lines.push(baseIndent + `${prefix} (`.trimEnd());
  for (let i = 0; i < params.length; i++) {
    const suffixComma = i < params.length - 1 ? ',' : '';
    lines.push(nestedIndent + params[i] + suffixComma);
  }
  lines.push(baseIndent + ')');
  return appendSuffix(lines);
};

const formatRoutineReturnsTableSuffix = (
  suffix: string,
  baseIndent: string,
  nestedIndent: string
): string[] | null => {
  const normalizedSuffix = normalizeSqlWhitespace(suffix);
  const upper = normalizedSuffix.toUpperCase();
  if (!upper.startsWith('RETURNS TABLE')) {
    return null;
  }

  const tableTokenIndex = upper.indexOf('TABLE');
  if (tableTokenIndex < 0) return null;
  const openParenIndex = normalizedSuffix.indexOf('(', tableTokenIndex);
  if (openParenIndex < 0) return null;
  const closeParenIndex = findMatchingParenIndex(normalizedSuffix, openParenIndex);
  if (closeParenIndex === null) return null;

  const columnsText = normalizedSuffix.slice(openParenIndex + 1, closeParenIndex).trim();
  const tail = normalizeSqlWhitespace(normalizedSuffix.slice(closeParenIndex + 1).trim());
  const columns = splitTopLevel(columnsText, ',').map(normalizeSqlWhitespace);

  const lines: string[] = [];
  lines.push(baseIndent + 'returns table (');
  for (let i = 0; i < columns.length; i++) {
    const suffixComma = i < columns.length - 1 ? ',' : '';
    lines.push(nestedIndent + columns[i] + suffixComma);
  }
  lines.push(baseIndent + ')');
  if (tail.length > 0) {
    lines.push(baseIndent + tail);
  }
  return lines;
};

const formatSqlFunctionReturnStatement = (
  normalized: string,
  baseIndent: string,
  nestedIndent: string
): string[] | null => {
  const upper = normalized.toUpperCase();
  if (!/^CREATE(\s+OR\s+REPLACE)?\s+FUNCTION\b/.test(upper)) {
    return null;
  }

  const returnIndex = findKeywordIndex(normalized, 'RETURN');
  if (returnIndex < 0) return null;

  const header = normalized.slice(0, returnIndex).trim();
  const returnBody = normalized.slice(returnIndex + 'RETURN'.length).trimStart();
  if (header.length === 0 || returnBody.length === 0) {
    return null;
  }

  const lines: string[] = [...formatRoutineHeader(header, baseIndent, nestedIndent)];
  lines.push(baseIndent + 'return');

  const returnUpper = returnBody.toUpperCase();
  const deeperIndent = ' '.repeat(nestedIndent.length + (nestedIndent.length - baseIndent.length));
  if (returnUpper.startsWith('SELECT') || returnUpper.startsWith('WITH')) {
    lines.push(...formatSelect(returnBody, nestedIndent, deeperIndent));
    return lines;
  }

  lines.push(nestedIndent + `${normalizeSqlExpression(returnBody)};`);
  return lines;
};

const formatCreateTableStatement = (
  normalized: string,
  baseIndent: string,
  nestedIndent: string
): string[] | null => {
  const upper = normalized.toUpperCase();
  let header = '';
  let rest = '';
  if (upper.startsWith('CREATE TABLE ')) {
    header = 'create table';
    rest = normalized.slice('create table'.length).trimStart();
  } else if (upper.startsWith('DECLARE GLOBAL TEMPORARY TABLE ')) {
    header = 'declare global temporary table';
    rest = normalized.slice('declare global temporary table'.length).trimStart();
  } else {
    return null;
  }

  const parenIndex = rest.indexOf('(');
  if (parenIndex < 0) return null;
  const tableName = rest.slice(0, parenIndex).trim();
  if (!tableName) return null;
  const remainder = rest.slice(parenIndex);
  const closingIndex = findMatchingParenIndex(remainder, 0);
  if (closingIndex === null) return null;
  const inner = remainder.slice(1, closingIndex);
  const tail = remainder.slice(closingIndex + 1).trim();
  const columns = splitTopLevel(inner, ',').map(normalizeSqlWhitespace);
  if (columns.length === 0) return null;

  const constraintStarters = new Set([
    'CONSTRAINT',
    'PRIMARY',
    'FOREIGN',
    'UNIQUE',
    'CHECK',
    'LIKE',
    'PERIOD'
  ]);
  const columnParts: Array<{ name: string; rest: string } | null> = [];
  let maxNameLength = 0;
  for (const column of columns) {
    const trimmedColumn = column.trim();
    const match = trimmedColumn.match(/^("[^"]+"|\S+)\s+(.*)$/);
    if (!match) {
      columnParts.push(null);
      continue;
    }
    const name = match[1];
    const restText = match[2].trim();
    const upperName = name.replace(/^\"|\"$/g, '').toUpperCase();
    if (constraintStarters.has(upperName)) {
      columnParts.push(null);
      continue;
    }
    if (name.length > maxNameLength) maxNameLength = name.length;
    columnParts.push({ name, rest: restText });
  }

  const lines: string[] = [];
  lines.push(baseIndent + `${header} ${tableName} (`.trimEnd());
  for (let i = 0; i < columns.length; i++) {
    const suffix = i < columns.length - 1 ? ',' : '';
    const part = columnParts[i];
    if (part) {
      const padding = ' '.repeat(Math.max(1, maxNameLength - part.name.length + 2));
      lines.push(nestedIndent + `${part.name}${padding}${part.rest}${suffix}`);
    } else {
      lines.push(nestedIndent + `${columns[i].trim()}${suffix}`);
    }
  }
  const closeLine = tail.length > 0 ? `) ${tail}` : ')';
  lines.push(baseIndent + closeLine + ';');
  return lines;
};
