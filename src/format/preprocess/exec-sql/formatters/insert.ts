import {
  normalizeSqlWhitespace,
  normalizeSqlIdentifierPath,
  stripTrailingSemicolon,
  splitTopLevel,
  findMatchingParenIndex
} from '../utils/index';
import { formatValuesRows } from './values';
import { formatSelect } from './select';

// Format INSERT statements with columns and values/selects.
export const formatInsert = (text: string, baseIndent: string, nestedIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();
  const insertMatch = upper.match(/^INSERT\s+INTO\s+/);
  if (!insertMatch) {
    return [baseIndent + cleaned + ';'];
  }

  let afterInsert = cleaned.slice(insertMatch[0].length).trimStart();
  afterInsert = normalizeSqlIdentifierPath(afterInsert);
  const tableMatch = afterInsert.match(/^([^\s(]+)\s*(.*)$/);
  if (!tableMatch) {
    return [baseIndent + cleaned + ';'];
  }

  const tableName = tableMatch[1];
  let remainder = tableMatch[2]?.trimStart() ?? '';

  const lines: string[] = [];
  let columns: string[] | null = null;

  if (remainder.startsWith('(')) {
    const closingIndex = findMatchingParenIndex(remainder, 0);
    if (closingIndex !== null) {
      const inner = remainder.slice(1, closingIndex);
      columns = splitTopLevel(inner, ',').map(normalizeSqlWhitespace);
      remainder = remainder.slice(closingIndex + 1).trimStart();
    }
  }

  if (columns && columns.length > 0) {
    lines.push(baseIndent + `insert into ${tableName} (`);
    for (let i = 0; i < columns.length; i++) {
      const suffix = i < columns.length - 1 ? ',' : '';
      lines.push(nestedIndent + columns[i] + suffix);
    }
    lines.push(baseIndent + ')');
  } else {
    lines.push(baseIndent + `insert into ${tableName}`);
  }

  if (remainder.length === 0) {
    lines[lines.length - 1] = lines[lines.length - 1] + ';';
    return lines;
  }

  const upperRemainder = remainder.toUpperCase();
  if (upperRemainder.startsWith('VALUES')) {
    const valuesText = remainder.slice(6).trimStart();
    lines.push(...formatValuesRows(valuesText, baseIndent, nestedIndent));
    return lines;
  }

  if (upperRemainder.startsWith('DEFAULT VALUES')) {
    lines.push(baseIndent + 'default values;');
    return lines;
  }

  if (upperRemainder.startsWith('SELECT')) {
    lines.push(...formatSelect(remainder, baseIndent, nestedIndent));
    return lines;
  }

  lines[lines.length - 1] = lines[lines.length - 1] + ';';
  return lines;
};
