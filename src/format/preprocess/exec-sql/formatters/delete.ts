import {
  normalizeSqlWhitespace,
  normalizeSqlIdentifierPath,
  normalizeSqlExpression,
  stripTrailingSemicolon,
  findKeywordIndex
} from '../utils/index';

// Format DELETE statements with USING and WHERE variants.
export const formatDelete = (text: string, baseIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();
  const deleteMatch = upper.match(/^DELETE\s+(FROM\s+)?/);
  if (!deleteMatch) {
    return [baseIndent + cleaned + ';'];
  }

  const rest = cleaned.slice(deleteMatch[0].length).trimStart();
  if (rest.length === 0) {
    return [baseIndent + cleaned + ';'];
  }

  const usingIndex = findKeywordIndex(rest, 'USING');
  const whereIndex = findKeywordIndex(rest, 'WHERE');
  let tableEnd = rest.length;
  if (usingIndex >= 0) tableEnd = Math.min(tableEnd, usingIndex);
  if (whereIndex >= 0) tableEnd = Math.min(tableEnd, whereIndex);
  const tablePart = normalizeSqlIdentifierPath(rest.slice(0, tableEnd).trim());
  const usingText =
    usingIndex >= 0
      ? normalizeSqlIdentifierPath(
          rest.slice(usingIndex + 5, whereIndex > usingIndex ? whereIndex : undefined).trim()
        )
      : '';
  const whereText = whereIndex >= 0 ? rest.slice(whereIndex + 5).trimStart() : '';

  const lines: string[] = [];
  lines.push(baseIndent + `delete from ${tablePart}`);
  if (usingText.length > 0) {
    lines.push(baseIndent + `using ${normalizeSqlWhitespace(usingText)}`);
  }

  if (whereText.length > 0) {
    const upperWhere = whereText.toUpperCase();
    if (upperWhere.startsWith('CURRENT OF')) {
      const cursor = whereText.slice(10).trimStart();
      lines.push(baseIndent + `where current of ${normalizeSqlWhitespace(cursor)};`);
      return lines;
    }
    lines.push(baseIndent + `where ${normalizeSqlExpression(whereText)};`);
    return lines;
  }

  lines[lines.length - 1] = lines[lines.length - 1] + ';';
  return lines;
};
