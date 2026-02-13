import { normalizeSqlWhitespace, parseWithClauses, trimTrailingSemicolon } from '../utils/index';
import { formatSelect } from './select';
import { formatInsert, formatUpdate, formatDelete, formatMerge } from './dml';

// Format WITH clauses that precede SELECT or DML statements.
export const formatWithStatement = (
  text: string,
  baseIndent: string,
  nestedIndent: string
): string[] => {
  const cleaned = text.trimEnd();
  const upper = cleaned.toUpperCase();
  if (!/^WITH\b/.test(upper)) {
    return [baseIndent + normalizeSqlWhitespace(text) + ';'];
  }

  const withPart = cleaned.slice(4).trimStart();
  const { ctes, remainder } = parseWithClauses(withPart);
  if (ctes.length === 0) {
    const normalizedPart = normalizeSqlWhitespace(withPart);
    return [baseIndent + `with ${normalizedPart};`];
  }

  const lines: string[] = [];
  const innerNested = ' '.repeat(nestedIndent.length + (nestedIndent.length - baseIndent.length));

  for (let i = 0; i < ctes.length; i++) {
    const prefix = i === 0 ? 'with ' : ', ';
    lines.push(baseIndent + `${prefix}${ctes[i].name} as (`);
    const bodyLines = trimTrailingSemicolon(formatSelect(ctes[i].body, nestedIndent, innerNested));
    lines.push(...bodyLines);
    lines.push(baseIndent + ')');
  }

  if (remainder.length === 0) {
    lines[lines.length - 1] = lines[lines.length - 1] + ';';
    return lines;
  }

  const remainderTrimmed = remainder.trimStart();
  const upperRemainder = remainderTrimmed.toUpperCase();
  let formatted: string[];
  if (upperRemainder.startsWith('SELECT')) {
    formatted = formatSelect(remainderTrimmed, baseIndent, nestedIndent);
  } else if (upperRemainder.startsWith('INSERT ')) {
    formatted = formatInsert(normalizeSqlWhitespace(remainderTrimmed), baseIndent, nestedIndent);
  } else if (upperRemainder.startsWith('UPDATE ')) {
    formatted = formatUpdate(normalizeSqlWhitespace(remainderTrimmed), baseIndent, nestedIndent);
  } else if (upperRemainder.startsWith('DELETE ')) {
    formatted = formatDelete(normalizeSqlWhitespace(remainderTrimmed), baseIndent, nestedIndent);
  } else if (upperRemainder.startsWith('MERGE ')) {
    formatted = formatMerge(normalizeSqlWhitespace(remainderTrimmed), baseIndent, nestedIndent);
  } else {
    formatted = [baseIndent + `${normalizeSqlWhitespace(remainderTrimmed)};`];
  }

  lines.push(...formatted);
  return lines;
};
