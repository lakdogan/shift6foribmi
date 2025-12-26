import {
  normalizeSqlWhitespace,
  stripTrailingSemicolon,
  findKeywordIndex,
  findLastKeywordIndex,
  splitStatementsOutsideStrings
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
