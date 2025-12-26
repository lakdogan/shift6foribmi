import { normalizeSqlWhitespace, stripTrailingSemicolon } from '../utils';

// Format DDL statements as normalized single lines.
export const formatDdlStatement = (text: string, baseIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const normalized = normalizeSqlWhitespace(cleaned);
  return [baseIndent + `${normalized};`];
};
