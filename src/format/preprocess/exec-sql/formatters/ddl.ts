import {
  normalizeSqlWhitespace,
  stripTrailingSemicolon,
  findKeywordIndex,
  findLastKeywordIndex,
  splitStatementsOutsideStrings,
  findMatchingParenIndex,
  splitTopLevel
} from '../utils/index';

// Format DDL statements as normalized single lines.
export const formatDdlStatement = (text: string, baseIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const normalized = normalizeSqlWhitespace(cleaned);
  const upper = normalized.toUpperCase();
  const nestedIndent = ' '.repeat(baseIndent.length * 2);

  if (
    upper.startsWith('CREATE TRIGGER ') ||
    upper.startsWith('CREATE PROCEDURE ') ||
    upper.startsWith('CREATE FUNCTION ')
  ) {
    const beginIndex = findKeywordIndex(normalized, 'BEGIN');
    if (beginIndex >= 0) {
      const header = normalized.slice(0, beginIndex).trim();
      const bodyWithEnd = normalized.slice(beginIndex + 5).trimStart();
      const endIndex = findLastKeywordIndex(bodyWithEnd, 'END');
      const bodyText = endIndex >= 0 ? bodyWithEnd.slice(0, endIndex).trim() : bodyWithEnd;
      const lines: string[] = [];
      if (upper.startsWith('CREATE TRIGGER ')) {
        lines.push(...formatTriggerHeader(header, baseIndent));
      } else {
        lines.push(baseIndent + header);
      }
      lines.push(...formatBeginEndBlock(bodyText, baseIndent, nestedIndent));
      return lines;
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

const formatBeginEndBlock = (
  bodyText: string,
  baseIndent: string,
  nestedIndent: string
): string[] => {
  const statements = splitStatementsOutsideStrings(bodyText);
  const lines: string[] = [];
  lines.push(baseIndent + 'begin');
  for (const statement of statements) {
    lines.push(nestedIndent + normalizeSqlWhitespace(statement) + ';');
  }
  lines.push(baseIndent + 'end;');
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
