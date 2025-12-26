import { normalizeSqlWhitespace, parseWithClauses, trimTrailingSemicolon } from '../utils/index';
import { formatSelect } from './select';
import { formatInsert, formatUpdate, formatDelete, formatMerge } from './dml';

// Format WITH clauses that precede SELECT or DML statements.
export const formatWithStatement = (
  text: string,
  baseIndent: string,
  nestedIndent: string
): string[] => {
  const cleaned = normalizeSqlWhitespace(text);
  const upper = cleaned.toUpperCase();
  if (!upper.startsWith('WITH ')) {
    return [baseIndent + cleaned + ';'];
  }

  const withPart = cleaned.slice(4).trimStart();
  const { ctes, remainder } = parseWithClauses(withPart);
  if (ctes.length === 0) {
    return [baseIndent + `with ${withPart};`];
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

  const upperRemainder = remainder.toUpperCase();
  let formatted: string[];
  if (upperRemainder.startsWith('SELECT ')) {
    formatted = formatSelect(remainder, baseIndent, nestedIndent);
  } else if (upperRemainder.startsWith('INSERT ')) {
    formatted = formatInsert(remainder, baseIndent, nestedIndent);
  } else if (upperRemainder.startsWith('UPDATE ')) {
    formatted = formatUpdate(remainder, baseIndent, nestedIndent);
  } else if (upperRemainder.startsWith('DELETE ')) {
    formatted = formatDelete(remainder, baseIndent);
  } else if (upperRemainder.startsWith('MERGE ')) {
    formatted = formatMerge(remainder, baseIndent, nestedIndent);
  } else {
    formatted = [baseIndent + `${remainder.trimEnd()};`];
  }

  lines.push(...formatted);
  return lines;
};
