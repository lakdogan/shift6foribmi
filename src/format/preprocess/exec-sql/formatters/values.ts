import {
  normalizeSqlExpression,
  stripTrailingSemicolon,
  splitTopLevel,
  findKeywordIndex
} from '../utils';

export const formatValuesRows = (
  valuesText: string,
  baseIndent: string,
  nestedIndent: string
): string[] => {
  const cleaned = stripTrailingSemicolon(valuesText);
  const rows = splitTopLevel(cleaned, ',');
  const normalizeRowItems = (row: string): string[] => {
    const inner = row.startsWith('(') && row.endsWith(')')
      ? row.slice(1, -1)
      : row;
    return splitTopLevel(inner, ',').map(normalizeSqlExpression);
  };
  if (rows.length <= 1) {
    const row = rows.length === 1 ? rows[0] : cleaned;
    const items = normalizeRowItems(row);
    const lines = [baseIndent + 'values ('];
    for (let i = 0; i < items.length; i++) {
      const suffix = i < items.length - 1 ? ',' : '';
      lines.push(nestedIndent + items[i] + suffix);
    }
    lines.push(baseIndent + ');');
    return lines;
  }

  const formattedRows = rows.map((row) => '(' + normalizeRowItems(row).join(', ') + ')');

  const lines = [baseIndent + 'values'];
  for (let i = 0; i < formattedRows.length; i++) {
    const suffix = i < formattedRows.length - 1 ? ',' : ';';
    lines.push(nestedIndent + formattedRows[i] + suffix);
  }
  return lines;
};

export const formatValuesStatement = (
  text: string,
  baseIndent: string,
  nestedIndent: string
): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();
  if (!upper.startsWith('VALUES')) {
    return [baseIndent + cleaned + ';'];
  }
  const normalizeRowItems = (row: string): string[] => {
    const inner = row.startsWith('(') && row.endsWith(')')
      ? row.slice(1, -1)
      : row;
    return splitTopLevel(inner, ',').map(normalizeSqlExpression);
  };
  const valuesText = cleaned.slice(6).trimStart();
  const intoIndex = findKeywordIndex(valuesText, 'INTO');
  const valuesPart = intoIndex >= 0 ? valuesText.slice(0, intoIndex).trim() : valuesText;
  const intoPart = intoIndex >= 0 ? valuesText.slice(intoIndex + 4).trimStart() : '';
  const rows = splitTopLevel(valuesPart, ',');
  if (rows.length <= 1) {
    const row = rows.length === 1 ? rows[0] : valuesPart;
    const items = normalizeRowItems(row);
    const lines = [baseIndent + 'values ('];
    for (let i = 0; i < items.length; i++) {
      const suffix = i < items.length - 1 ? ',' : '';
      lines.push(nestedIndent + items[i] + suffix);
    }
    lines.push(baseIndent + ')');
    if (intoPart) {
      const targets = splitTopLevel(intoPart, ',').map(normalizeSqlExpression);
      lines.push(baseIndent + 'into');
      for (let i = 0; i < targets.length; i++) {
        const suffix = i < targets.length - 1 ? ',' : '';
        lines.push(nestedIndent + targets[i] + suffix);
      }
      lines[lines.length - 1] = lines[lines.length - 1] + ';';
      return lines;
    }
    lines[lines.length - 1] = lines[lines.length - 1] + ';';
    return lines;
  }

  const formattedRows = rows.map((row) => '(' + normalizeRowItems(row).join(', ') + ')');

  const lines = [baseIndent + 'values'];
  for (let i = 0; i < formattedRows.length; i++) {
    const suffix = i < formattedRows.length - 1 ? ',' : '';
    lines.push(nestedIndent + formattedRows[i] + suffix);
  }
  if (intoPart) {
    const targets = splitTopLevel(intoPart, ',').map(normalizeSqlExpression);
    lines.push(baseIndent + 'into');
    for (let i = 0; i < targets.length; i++) {
      const suffix = i < targets.length - 1 ? ',' : '';
      lines.push(nestedIndent + targets[i] + suffix);
    }
  }
  lines[lines.length - 1] = lines[lines.length - 1] + ';';
  return lines;
};
