import type { Shift6Config } from '../../config';
import { scanStringAware } from '../utils/string-scan';

interface ExecSqlNormalizeResult {
  lines: string[];
  changed: boolean;
}

const EXEC_SQL_START = /^\s*EXEC\s+SQL\b/i;
const END_EXEC = /\bEND-EXEC\b|\bEND\s+EXEC\b/i;

const normalizeSqlWhitespace = (text: string): string => {
  let out = '';
  let inString = false;
  let quoteChar = '';
  let pendingSpace = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      out += ch;
      if (ch === quoteChar) {
        if (i + 1 < text.length && text[i + 1] === quoteChar) {
          out += text[i + 1];
          i++;
          continue;
        }
        inString = false;
        quoteChar = '';
      }
      continue;
    }

    if (ch === '\'' || ch === '"') {
      if (pendingSpace && out.length > 0 && !out.endsWith(' ')) {
        out += ' ';
      }
      pendingSpace = false;
      inString = true;
      quoteChar = ch;
      out += ch;
      continue;
    }

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      pendingSpace = true;
      continue;
    }

    if (pendingSpace && out.length > 0 && !out.endsWith(' ')) {
      out += ' ';
    }
    pendingSpace = false;
    out += ch;
  }

  return out.trim();
};

const normalizeSqlExpression = (text: string): string => {
  const compact = normalizeSqlWhitespace(text);
  let out = '';
  let inString = false;
  let quoteChar = '';

  const nextNonSpace = (start: number): string => {
    for (let i = start; i < compact.length; i++) {
      const ch = compact[i];
      if (ch !== ' ') return ch;
    }
    return '';
  };

  const lastNonSpace = () => {
    for (let i = out.length - 1; i >= 0; i--) {
      const ch = out[i];
      if (ch !== ' ') return ch;
    }
    return '';
  };

  for (let i = 0; i < compact.length; i++) {
    const ch = compact[i];
    if (inString) {
      out += ch;
      if (ch === quoteChar) {
        if (i + 1 < compact.length && compact[i + 1] === quoteChar) {
          out += compact[i + 1];
          i++;
          continue;
        }
        inString = false;
        quoteChar = '';
      }
      continue;
    }

    if (ch === '\'' || ch === '"') {
      inString = true;
      quoteChar = ch;
      out += ch;
      continue;
    }

    if (ch === '=' || ch === '+' || ch === '-' || ch === '*' || ch === '>' || ch === '<') {
      const prev = lastNonSpace();
      const next = nextNonSpace(i + 1);
      const nextIsSpace = compact[i + 1] === ' ';
      if (
        ch === '=' &&
        (prev === '<' || prev === '>' || prev === '!' || prev === '=' || next === '=')
      ) {
        out += ch;
        continue;
      }
      if (
        (ch === '>' || ch === '<') &&
        (next === '=')
      ) {
        out += ch;
        continue;
      }
      if ((ch === '+' || ch === '-' || ch === '*') && (prev === '' || prev === '(' || prev === ',')) {
        out += ch;
        continue;
      }
      if (out.length > 0 && !out.endsWith(' ')) {
        out += ' ';
      }
      out += ch;
      if (!nextIsSpace && next !== '' && next !== ' ') {
        out += ' ';
      }
      continue;
    }

    out += ch;
  }

  return out.trim();
};

const stripTrailingSemicolon = (text: string): string => {
  const trimmed = text.trimEnd();
  return trimmed.endsWith(';') ? trimmed.slice(0, -1).trimEnd() : trimmed;
};

const splitTopLevel = (text: string, delimiter: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;

  scanStringAware(text, (ch, index) => {
    if (ch === '(') {
      depth++;
      return;
    }
    if (ch === ')') {
      depth = Math.max(0, depth - 1);
      return;
    }
    if (ch === delimiter && depth === 0) {
      parts.push(text.slice(start, index));
      start = index + 1;
    }
  });

  parts.push(text.slice(start));
  return parts.map((part) => part.trim()).filter((part) => part.length > 0);
};

const findMatchingParenIndex = (text: string, startIndex: number): number | null => {
  let depth = 0;
  let matchIndex: number | null = null;
  scanStringAware(text, (ch, index) => {
    if (index < startIndex) return;
    if (ch === '(') {
      depth++;
      return;
    }
    if (ch === ')') {
      depth--;
      if (depth === 0) {
        matchIndex = index;
        return true;
      }
    }
  });
  return matchIndex;
};

const findKeywordIndex = (text: string, keyword: string): number => {
  const upper = text.toUpperCase();
  const token = keyword.toUpperCase();
  let depth = 0;
  let match = -1;

  scanStringAware(text, (ch, index) => {
    if (ch === '(') {
      depth++;
      return;
    }
    if (ch === ')') {
      depth = Math.max(0, depth - 1);
      return;
    }
    if (depth !== 0) return;
    if (!upper.startsWith(token, index)) return;
    const before = index > 0 ? upper[index - 1] : ' ';
    const afterIndex = index + token.length;
    const after = afterIndex < upper.length ? upper[afterIndex] : ' ';
    if (/[A-Z0-9_]/.test(before) || /[A-Z0-9_]/.test(after)) return;
    match = index;
    return true;
  });

  return match;
};

const splitSqlStatements = (text: string): string[] => {
  const statements: string[] = [];
  let start = 0;
  scanStringAware(text, (ch, index) => {
    if (ch === ';') {
      const piece = text.slice(start, index).trim();
      if (piece.length > 0) statements.push(piece);
      start = index + 1;
    }
  });
  const tail = text.slice(start).trim();
  if (tail.length > 0) statements.push(tail);
  return statements;
};

const formatValuesRows = (
  valuesText: string,
  baseIndent: string,
  nestedIndent: string
): string[] => {
  const cleaned = stripTrailingSemicolon(valuesText);
  const rows = splitTopLevel(cleaned, ',');
  if (rows.length <= 1) {
    const row = rows.length === 1 ? rows[0] : cleaned;
    const inner = row.startsWith('(') && row.endsWith(')')
      ? row.slice(1, -1)
      : row;
    const items = splitTopLevel(inner, ',').map(normalizeSqlExpression);
    const lines = [baseIndent + 'values ('];
    for (let i = 0; i < items.length; i++) {
      const suffix = i < items.length - 1 ? ',' : '';
      lines.push(nestedIndent + items[i] + suffix);
    }
    lines.push(baseIndent + ');');
    return lines;
  }

  const formattedRows = rows.map((row) => {
    const inner = row.startsWith('(') && row.endsWith(')')
      ? row.slice(1, -1)
      : row;
    const items = splitTopLevel(inner, ',').map(normalizeSqlExpression);
    return '(' + items.join(', ') + ')';
  });

  const lines = [baseIndent + 'values'];
  for (let i = 0; i < formattedRows.length; i++) {
    const suffix = i < formattedRows.length - 1 ? ',' : ';';
    lines.push(nestedIndent + formattedRows[i] + suffix);
  }
  return lines;
};

const trimTrailingSemicolon = (lines: string[]): string[] => {
  if (lines.length === 0) return lines;
  const last = lines[lines.length - 1];
  if (last.endsWith(';')) {
    lines[lines.length - 1] = last.slice(0, -1);
  }
  return lines;
};

const parseWithClauses = (
  text: string
): { ctes: { name: string; body: string }[]; remainder: string } => {
  let remaining = text.trimStart();
  const ctes: { name: string; body: string }[] = [];

  while (remaining.length > 0) {
    const match = remaining.match(/^([A-Z0-9_]+)\s+AS\s*\(/i);
    if (!match) {
      return { ctes, remainder: remaining };
    }
    const name = match[1];
    const openIndex = remaining.indexOf('(', match[0].length - 1);
    if (openIndex < 0) {
      return { ctes, remainder: remaining };
    }
    const closeIndex = findMatchingParenIndex(remaining, openIndex);
    if (closeIndex === null) {
      return { ctes, remainder: remaining };
    }
    const body = remaining.slice(openIndex + 1, closeIndex).trim();
    ctes.push({ name, body });
    remaining = remaining.slice(closeIndex + 1).trimStart();
    if (remaining.startsWith(',')) {
      remaining = remaining.slice(1).trimStart();
      continue;
    }
    return { ctes, remainder: remaining };
  }

  return { ctes, remainder: '' };
};

const splitSetOperations = (text: string): string[] => {
  const upper = text.toUpperCase();
  const parts: string[] = [];
  let depth = 0;
  let start = 0;

  scanStringAware(text, (ch, index) => {
    if (ch === '(') {
      depth++;
      return;
    }
    if (ch === ')') {
      depth = Math.max(0, depth - 1);
      return;
    }
    if (depth !== 0) return;

    if (upper.startsWith('UNION ALL', index)) {
      parts.push(text.slice(start, index).trim());
      parts.push('UNION ALL');
      start = index + 9;
      return;
    }
    if (upper.startsWith('UNION', index)) {
      parts.push(text.slice(start, index).trim());
      parts.push('UNION');
      start = index + 5;
      return;
    }
    if (upper.startsWith('INTERSECT', index)) {
      parts.push(text.slice(start, index).trim());
      parts.push('INTERSECT');
      start = index + 9;
      return;
    }
    if (upper.startsWith('EXCEPT', index)) {
      parts.push(text.slice(start, index).trim());
      parts.push('EXCEPT');
      start = index + 6;
      return;
    }
  });

  const tail = text.slice(start).trim();
  if (tail.length > 0) parts.push(tail);
  return parts.filter((part) => part.length > 0);
};

const splitSelectClauses = (text: string): string[] => {
  const upper = text.toUpperCase();
  const keywords = [
    'FOR UPDATE',
    'GROUP BY',
    'ORDER BY',
    'HAVING',
    'WHERE',
    'FROM',
    'OFFSET',
    'FETCH'
  ];
  const positions: { index: number; keyword: string }[] = [];
  let depth = 0;

  scanStringAware(text, (ch, index) => {
    if (ch === '(') {
      depth++;
      return;
    }
    if (ch === ')') {
      depth = Math.max(0, depth - 1);
      return;
    }
    if (depth !== 0) return;

    for (const keyword of keywords) {
      if (!upper.startsWith(keyword, index)) continue;
      const before = index > 0 ? upper[index - 1] : ' ';
      const afterIndex = index + keyword.length;
      const after = afterIndex < upper.length ? upper[afterIndex] : ' ';
      if (/[A-Z0-9_]/.test(before) || /[A-Z0-9_]/.test(after)) continue;
      positions.push({ index, keyword });
      return;
    }
  });

  positions.sort((a, b) => a.index - b.index);
  if (positions.length === 0) return [text.trim()];

  const clauses: string[] = [];
  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].index;
    const end = i + 1 < positions.length ? positions[i + 1].index : text.length;
    clauses.push(text.slice(start, end).trim());
  }
  return clauses.filter((clause) => clause.length > 0);
};

const formatSelect = (text: string, baseIndent: string, nestedIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();

  if (upper.startsWith('WITH ')) {
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
      const bodyLines = trimTrailingSemicolon(
        formatSelect(ctes[i].body, nestedIndent, innerNested)
      );
      lines.push(...bodyLines);
      lines.push(baseIndent + ')');
    }

    if (remainder.length > 0) {
      const selectLines = formatSelect(remainder, baseIndent, nestedIndent);
      lines.push(...selectLines);
      return lines;
    }

    lines[lines.length - 1] = lines[lines.length - 1] + ';';
    return lines;
  }

  const selectMatch = upper.match(/^SELECT\s+(DISTINCT\s+)?/);
  if (!selectMatch) {
    return [baseIndent + cleaned + ';'];
  }

  const distinct = Boolean(selectMatch[1]);
  const afterSelect = cleaned.slice(selectMatch[0].length);

  const fromIndex = (() => {
    let depth = 0;
    let index = -1;
    scanStringAware(afterSelect, (ch, i) => {
      if (ch === '(') {
        depth++;
        return;
      }
      if (ch === ')') {
        depth = Math.max(0, depth - 1);
        return;
      }
      if (depth !== 0) return;
      if (afterSelect.slice(i).toUpperCase().startsWith('FROM ')) {
        index = i;
        return true;
      }
    });
    return index;
  })();

  const columnsText = fromIndex >= 0 ? afterSelect.slice(0, fromIndex).trim() : afterSelect.trim();
  const remainder = fromIndex >= 0 ? afterSelect.slice(fromIndex).trim() : '';

  const columns = splitTopLevel(columnsText, ',').map(normalizeSqlExpression);
  const lines = [baseIndent + (distinct ? 'select distinct' : 'select')];
  for (let i = 0; i < columns.length; i++) {
    const suffix = i < columns.length - 1 ? ',' : '';
    lines.push(nestedIndent + columns[i] + suffix);
  }

  if (remainder.length === 0) {
    lines[lines.length - 1] = lines[lines.length - 1] + ';';
    return lines;
  }

  const setParts = splitSetOperations(remainder);
  if (setParts.length > 1) {
    for (let i = 0; i < setParts.length; i++) {
      const part = setParts[i];
      const upperPart = part.toUpperCase();
      if (upperPart === 'UNION' || upperPart === 'UNION ALL' || upperPart === 'INTERSECT' || upperPart === 'EXCEPT') {
        lines.push(baseIndent + part.toLowerCase());
        continue;
      }
      const sub = formatSelect(part, baseIndent, nestedIndent);
      if (i < setParts.length - 1) {
        trimTrailingSemicolon(sub);
      }
      lines.push(...sub);
    }
    return lines;
  }

  const clauses = splitSelectClauses(remainder);
  for (let i = 0; i < clauses.length; i++) {
    const clause = normalizeSqlWhitespace(clauses[i]);
    const match = clause.match(/^(FROM|WHERE|GROUP BY|HAVING|ORDER BY|OFFSET|FETCH|FOR UPDATE)\b/i);
    if (!match) continue;
    const keyword = match[1].toLowerCase();
    const rest = clause.slice(match[0].length).trimStart();
    const isLast = i === clauses.length - 1;
    const suffix = isLast ? ';' : '';

    if (keyword === 'group by' || keyword === 'order by') {
      const items = splitTopLevel(rest, ',').map(normalizeSqlExpression);
      lines.push(baseIndent + keyword);
      for (let j = 0; j < items.length; j++) {
        const itemSuffix = j < items.length - 1 ? ',' : '';
        lines.push(nestedIndent + items[j] + itemSuffix);
      }
      if (isLast) {
        lines[lines.length - 1] = lines[lines.length - 1] + ';';
      }
      continue;
    }

    if (keyword === 'where' || keyword === 'having') {
      lines.push(baseIndent + ` ${keyword} ${normalizeSqlExpression(rest)}`.trim() + suffix);
      continue;
    }

    if (keyword === 'fetch') {
      lines.push(baseIndent + `fetch ${normalizeSqlWhitespace(rest).toLowerCase()}` + suffix);
      continue;
    }

    if (keyword === 'offset') {
      lines.push(baseIndent + `offset ${normalizeSqlWhitespace(rest).toLowerCase()}` + suffix);
      continue;
    }

    if (keyword === 'for update') {
      const restUpper = rest.toUpperCase();
      if (restUpper.startsWith('OF ')) {
        const columnsText = rest.slice(3).trimStart();
        const columns = splitTopLevel(columnsText, ',').map(normalizeSqlExpression);
        lines.push(baseIndent + 'for update of');
        for (let j = 0; j < columns.length; j++) {
          const colSuffix = j < columns.length - 1 ? ',' : '';
          lines.push(nestedIndent + columns[j] + colSuffix);
        }
        if (isLast) {
          lines[lines.length - 1] = lines[lines.length - 1] + ';';
        }
        continue;
      }
      lines.push(baseIndent + 'for update' + (rest ? ` ${normalizeSqlWhitespace(rest)}` : '') + suffix);
      continue;
    }

    lines.push(baseIndent + [keyword, normalizeSqlExpression(rest)].filter(Boolean).join(' ') + suffix);
  }

  return lines;
};

const formatUpdate = (text: string, baseIndent: string, nestedIndent: string): string[] => {
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

  const tablePart = rest.slice(0, setIndex).trim();
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
  const fromText =
    fromIndex >= 0
      ? afterSet.slice(fromIndex + 4, whereIndex > fromIndex ? whereIndex : undefined).trim()
      : '';
  const whereText = whereIndex >= 0 ? afterSet.slice(whereIndex + 5).trimStart() : '';

  const assignments = splitTopLevel(setText, ',').map(normalizeSqlExpression);
  const lines: string[] = [];
  lines.push(baseIndent + `update ${tablePart}`);
  lines.push(baseIndent + 'set');
  for (let i = 0; i < assignments.length; i++) {
    const suffix = i < assignments.length - 1 ? ',' : '';
    lines.push(nestedIndent + assignments[i] + suffix);
  }

  if (fromText.length > 0) {
    lines.push(baseIndent + `from ${normalizeSqlWhitespace(fromText)}`);
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

const formatDelete = (text: string, baseIndent: string): string[] => {
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
  const tablePart = rest.slice(0, tableEnd).trim();
  const usingText =
    usingIndex >= 0
      ? rest.slice(usingIndex + 5, whereIndex > usingIndex ? whereIndex : undefined).trim()
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

const formatCall = (text: string, baseIndent: string, nestedIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();
  const callMatch = upper.match(/^CALL\s+/);
  if (!callMatch) {
    return [baseIndent + cleaned + ';'];
  }

  const rest = cleaned.slice(callMatch[0].length).trimStart();
  const parenIndex = rest.indexOf('(');
  if (parenIndex < 0) {
    return [baseIndent + `call ${rest};`];
  }

  const procName = rest.slice(0, parenIndex).trim();
  const closingIndex = findMatchingParenIndex(rest, parenIndex);
  if (!procName || closingIndex === null) {
    return [baseIndent + `call ${rest};`];
  }

  const argsText = rest.slice(parenIndex + 1, closingIndex);
  const args = splitTopLevel(argsText, ',').map(normalizeSqlExpression);
  const lines: string[] = [];
  lines.push(baseIndent + `call ${procName}(`);
  for (let i = 0; i < args.length; i++) {
    const suffix = i < args.length - 1 ? ',' : '';
    lines.push(nestedIndent + args[i] + suffix);
  }
  lines.push(baseIndent + ');');
  return lines;
};

const formatSet = (text: string, baseIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();
  if (!upper.startsWith('SET ')) {
    return [baseIndent + cleaned + ';'];
  }
  const rest = cleaned.slice(3).trimStart();
  const normalized = normalizeSqlExpression(rest);
  return [baseIndent + `set ${normalized};`];
};

const formatCommitRollback = (text: string, baseIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();
  if (!(upper.startsWith('COMMIT') || upper.startsWith('ROLLBACK'))) {
    return [baseIndent + cleaned + ';'];
  }
  const normalized = normalizeSqlWhitespace(cleaned).toLowerCase();
  return [baseIndent + `${normalized};`];
};

const formatMerge = (text: string, baseIndent: string, nestedIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();
  const mergeMatch = upper.match(/^MERGE\s+INTO\s+/);
  if (!mergeMatch) {
    return [baseIndent + cleaned + ';'];
  }

  const rest = cleaned.slice(mergeMatch[0].length).trimStart();
  let remaining = rest;
  const usingIndex = findKeywordIndex(remaining, 'USING');
  if (usingIndex < 0) {
    return [baseIndent + cleaned + ';'];
  }
  const targetPart = remaining.slice(0, usingIndex).trim();
  remaining = remaining.slice(usingIndex + 5).trimStart();

  const onIndex = findKeywordIndex(remaining, 'ON');
  if (onIndex < 0) {
    return [baseIndent + cleaned + ';'];
  }
  const usingPart = remaining.slice(0, onIndex).trim();
  remaining = remaining.slice(onIndex + 2).trimStart();

  const lines: string[] = [];
  lines.push(baseIndent + `merge into ${targetPart}`);
  lines.push(baseIndent + `using ${usingPart}`);

  const whenIndex = findKeywordIndex(remaining, 'WHEN');
  if (whenIndex < 0) {
    lines.push(baseIndent + `on ${normalizeSqlExpression(remaining)};`);
    return lines;
  }

  const onPart = remaining.slice(0, whenIndex).trim();
  lines.push(baseIndent + `on ${normalizeSqlExpression(onPart)}`);
  remaining = remaining.slice(whenIndex).trimStart();

  const whenBlocks = remaining
    .split(/\b(?=WHEN\s+(MATCHED|NOT)\b)/i)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  for (let i = 0; i < whenBlocks.length; i++) {
    const block = whenBlocks[i];
    const upperBlock = block.toUpperCase();
    if (upperBlock.startsWith('WHEN MATCHED')) {
      const thenIndex = findKeywordIndex(block, 'THEN');
      const action = thenIndex >= 0 ? block.slice(thenIndex + 4).trimStart() : '';
      lines.push(baseIndent + 'when matched then');
      if (action.toUpperCase().startsWith('UPDATE')) {
        const updateText = action.slice(6).trimStart();
        const setIndex = findKeywordIndex(updateText, 'SET');
        if (setIndex >= 0) {
          const setText = updateText.slice(setIndex + 3).trimStart();
          const assignments = splitTopLevel(setText, ',').map(normalizeSqlExpression);
          lines.push(nestedIndent + 'update');
          lines.push(nestedIndent + 'set');
          for (let j = 0; j < assignments.length; j++) {
            const suffix = j < assignments.length - 1 ? ',' : '';
            lines.push(' '.repeat(nestedIndent.length * 2) + assignments[j] + suffix);
          }
          continue;
        }
      } else if (action.toUpperCase().startsWith('DELETE')) {
        lines.push(nestedIndent + 'delete');
        continue;
      }
      lines.push(nestedIndent + normalizeSqlWhitespace(action).toLowerCase());
      continue;
    }

    if (upperBlock.startsWith('WHEN NOT MATCHED')) {
      const thenIndex = findKeywordIndex(block, 'THEN');
      const action = thenIndex >= 0 ? block.slice(thenIndex + 4).trimStart() : '';
      lines.push(baseIndent + 'when not matched then');
      if (action.toUpperCase().startsWith('INSERT')) {
        const insertText = action.slice(6).trimStart();
        const formatted = formatInsert(`insert ${insertText}`, nestedIndent, ' '.repeat(nestedIndent.length * 2));
        for (const line of formatted) {
          lines.push(line);
        }
        continue;
      }
      lines.push(nestedIndent + normalizeSqlWhitespace(action).toLowerCase());
    }
  }

  if (lines.length > 0) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/;?$/, ';');
  }

  return lines;
};

const formatPrepareExecute = (
  text: string,
  baseIndent: string,
  nestedIndent: string
): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();

  if (upper.startsWith('PREPARE ')) {
    const rest = cleaned.slice(7).trimStart();
    const fromIndex = findKeywordIndex(rest, 'FROM');
    if (fromIndex < 0) {
      return [baseIndent + `prepare ${normalizeSqlWhitespace(rest)};`];
    }
    const stmtName = rest.slice(0, fromIndex).trim();
    const sqlText = rest.slice(fromIndex + 4).trimStart();
    return [
      baseIndent + `prepare ${stmtName} from`,
      nestedIndent + sqlText + ';'
    ];
  }

  if (upper.startsWith('EXECUTE IMMEDIATE')) {
    const rest = cleaned.slice('execute immediate'.length).trimStart();
    const usingIndex = findKeywordIndex(rest, 'USING');
    if (usingIndex < 0) {
      return [
        baseIndent + 'execute immediate',
        nestedIndent + rest + ';'
      ];
    }
    const stmtText = rest.slice(0, usingIndex).trim();
    const argsText = rest.slice(usingIndex + 5).trimStart();
    const args = splitTopLevel(argsText, ',').map(normalizeSqlExpression);
    const lines: string[] = [];
    lines.push(baseIndent + 'execute immediate');
    lines.push(nestedIndent + stmtText);
    lines.push(baseIndent + 'using');
    for (let i = 0; i < args.length; i++) {
      const suffix = i < args.length - 1 ? ',' : ';';
      lines.push(nestedIndent + args[i] + suffix);
    }
    return lines;
  }

  if (upper.startsWith('EXECUTE ')) {
    const rest = cleaned.slice(7).trimStart();
    const usingIndex = findKeywordIndex(rest, 'USING');
    if (usingIndex < 0) {
      return [baseIndent + `execute ${normalizeSqlWhitespace(rest)};`];
    }
    const stmtName = rest.slice(0, usingIndex).trim();
    const argsText = rest.slice(usingIndex + 5).trimStart();
    const args = splitTopLevel(argsText, ',').map(normalizeSqlExpression);
    const lines: string[] = [];
    lines.push(baseIndent + `execute ${stmtName}`);
    lines.push(baseIndent + 'using');
    for (let i = 0; i < args.length; i++) {
      const suffix = i < args.length - 1 ? ',' : ';';
      lines.push(nestedIndent + args[i] + suffix);
    }
    return lines;
  }

  return [baseIndent + cleaned + ';'];
};

const formatDeclareCursor = (
  text: string,
  baseIndent: string,
  nestedIndent: string
): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();
  if (!upper.startsWith('DECLARE ')) {
    return [baseIndent + cleaned + ';'];
  }

  const rest = cleaned.slice(8).trimStart();
  const cursorIndex = findKeywordIndex(rest, 'CURSOR');
  const forIndex = findKeywordIndex(rest, 'FOR');
  if (cursorIndex < 0 || forIndex < 0 || forIndex <= cursorIndex) {
    return [baseIndent + cleaned + ';'];
  }

  const cursorName = rest.slice(0, cursorIndex).trim();
  const cursorOptions = rest.slice(cursorIndex + 6, forIndex).trim();
  const afterFor = rest.slice(forIndex + 3).trimStart();
  if (!cursorName) {
    return [baseIndent + cleaned + ';'];
  }

  const lines: string[] = [];
  const optionsText = cursorOptions ? ` ${normalizeSqlWhitespace(cursorOptions)}` : '';
  lines.push(baseIndent + `declare ${cursorName} cursor${optionsText} for`);
  if (afterFor.length === 0) {
    lines[lines.length - 1] = lines[lines.length - 1] + ';';
    return lines;
  }

  if (afterFor.toUpperCase().startsWith('SELECT ')) {
    lines.push(...formatSelect(afterFor, baseIndent, nestedIndent));
    return lines;
  }

  lines.push(baseIndent + normalizeSqlWhitespace(afterFor) + ';');
  return lines;
};

const formatHostAndConnection = (text: string, baseIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();

  if (upper.startsWith('DECLARE SECTION')) {
    return [baseIndent + 'declare section;'];
  }
  if (upper.startsWith('END DECLARE SECTION')) {
    return [baseIndent + 'end declare section;'];
  }
  if (upper.startsWith('INCLUDE ')) {
    const rest = normalizeSqlWhitespace(cleaned.slice(7).trimStart());
    return [baseIndent + `include ${rest.toLowerCase()};`];
  }
  if (upper.startsWith('WHENEVER ')) {
    const rest = normalizeSqlWhitespace(cleaned.slice(9).trimStart());
    return [baseIndent + `whenever ${rest};`];
  }
  if (upper.startsWith('CONNECT ')) {
    const rest = normalizeSqlWhitespace(cleaned.slice(7).trimStart());
    return [baseIndent + `connect ${rest};`];
  }
  if (upper.startsWith('SET CURRENT')) {
    const rest = normalizeSqlWhitespace(cleaned.slice('set current'.length).trimStart());
    return [baseIndent + `set current ${rest};`];
  }
  if (upper.startsWith('SET OPTION')) {
    const rest = normalizeSqlWhitespace(cleaned.slice('set option'.length).trimStart())
      .replace(/\*\s+([A-Z0-9_]+)/gi, '*$1');
    return [baseIndent + `set option ${rest};`];
  }
  if (upper.startsWith('SET CONNECTION')) {
    const rest = normalizeSqlWhitespace(cleaned.slice('set connection'.length).trimStart());
    return [baseIndent + `set connection ${rest};`];
  }
  if (upper.startsWith('DISCONNECT ')) {
    const rest = normalizeSqlWhitespace(cleaned.slice(10).trimStart());
    return [baseIndent + `disconnect ${rest};`];
  }
  if (upper.startsWith('RELEASE')) {
    const rest = normalizeSqlWhitespace(cleaned.slice(7).trimStart());
    return [baseIndent + `release${rest ? ` ${rest}` : ''};`];
  }

  return [baseIndent + cleaned + ';'];
};

const formatAllocateDescribe = (text: string, baseIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();

  if (upper.startsWith('DESCRIBE ')) {
    const rest = normalizeSqlWhitespace(cleaned.slice(9).trimStart());
    return [baseIndent + `describe ${rest.toLowerCase()};`];
  }
  if (upper.startsWith('ALLOCATE ')) {
    const rest = normalizeSqlWhitespace(cleaned.slice(9).trimStart());
    return [baseIndent + `allocate ${rest.toLowerCase()};`];
  }
  if (upper.startsWith('DEALLOCATE ')) {
    const rest = normalizeSqlWhitespace(cleaned.slice(11).trimStart());
    return [baseIndent + `deallocate ${rest.toLowerCase()};`];
  }
  if (upper.startsWith('PREPARE ') || upper.startsWith('EXECUTE ') || upper.startsWith('EXECUTE IMMEDIATE')) {
    return formatPrepareExecute(cleaned, baseIndent, ' '.repeat(baseIndent.length * 2));
  }

  return [baseIndent + cleaned + ';'];
};

const formatSimpleSqlStatement = (text: string, baseIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const normalized = normalizeSqlWhitespace(cleaned).toLowerCase();
  return [baseIndent + `${normalized};`];
};

const formatValuesStatement = (
  text: string,
  baseIndent: string,
  nestedIndent: string
): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();
  if (!upper.startsWith('VALUES')) {
    return [baseIndent + cleaned + ';'];
  }
  const valuesText = cleaned.slice(6).trimStart();
  const intoIndex = findKeywordIndex(valuesText, 'INTO');
  const valuesPart = intoIndex >= 0 ? valuesText.slice(0, intoIndex).trim() : valuesText;
  const intoPart = intoIndex >= 0 ? valuesText.slice(intoIndex + 4).trimStart() : '';
  const rows = splitTopLevel(valuesPart, ',');
  if (rows.length <= 1) {
    const row = rows.length === 1 ? rows[0] : valuesPart;
    const inner = row.startsWith('(') && row.endsWith(')')
      ? row.slice(1, -1)
      : row;
    const items = splitTopLevel(inner, ',').map(normalizeSqlExpression);
    const lines = [baseIndent + 'values ('];
    for (let i = 0; i < items.length; i++) {
      const suffix = i < items.length - 1 ? ',' : '';
      lines.push(nestedIndent + items[i] + suffix);
    }
    if (intoPart.length > 0) {
      lines.push(baseIndent + ')');
      lines.push(baseIndent + 'into');
      const targets = splitTopLevel(intoPart, ',').map(normalizeSqlExpression);
      for (let i = 0; i < targets.length; i++) {
        const suffix = i < targets.length - 1 ? ',' : ';';
        lines.push(nestedIndent + targets[i] + suffix);
      }
      return lines;
    }
    lines.push(baseIndent + ');');
    return lines;
  }

  const formattedRows = rows.map((row) => {
    const inner = row.startsWith('(') && row.endsWith(')')
      ? row.slice(1, -1)
      : row;
    const items = splitTopLevel(inner, ',').map(normalizeSqlExpression);
    return '(' + items.join(', ') + ')';
  });

  const lines = [baseIndent + 'values'];
  for (let i = 0; i < formattedRows.length; i++) {
    const suffix = i < formattedRows.length - 1 ? ',' : ';';
    lines.push(nestedIndent + formattedRows[i] + suffix);
  }
  return lines;
};

const formatOpenCloseFetch = (
  text: string,
  baseIndent: string,
  nestedIndent: string
): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();

  if (upper.startsWith('OPEN ')) {
    const rest = cleaned.slice(5).trimStart();
    return [baseIndent + `open ${normalizeSqlWhitespace(rest)};`];
  }
  if (upper.startsWith('CLOSE ')) {
    const rest = cleaned.slice(6).trimStart();
    return [baseIndent + `close ${normalizeSqlWhitespace(rest)};`];
  }
  if (upper.startsWith('FETCH ')) {
    const rest = cleaned.slice(6).trimStart();
    const intoIndex = findKeywordIndex(rest, 'INTO');
    if (intoIndex < 0) {
      return [baseIndent + `fetch ${normalizeSqlWhitespace(rest)};`];
    }
    const fetchSpec = rest.slice(0, intoIndex).trim();
    const intoText = rest.slice(intoIndex + 4).trimStart();
    const targets = splitTopLevel(intoText, ',').map(normalizeSqlExpression);
    const lines: string[] = [];
    lines.push(baseIndent + `fetch ${normalizeSqlWhitespace(fetchSpec)}`);
    lines.push(baseIndent + 'into');
    for (let i = 0; i < targets.length; i++) {
      const suffix = i < targets.length - 1 ? ',' : ';';
      lines.push(nestedIndent + targets[i] + suffix);
    }
    return lines;
  }

  return [baseIndent + cleaned + ';'];
};

const formatInsert = (text: string, baseIndent: string, nestedIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();
  const insertMatch = upper.match(/^INSERT\s+INTO\s+/);
  if (!insertMatch) {
    return [baseIndent + cleaned + ';'];
  }

  const afterInsert = cleaned.slice(insertMatch[0].length).trimStart();
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

const formatSqlStatement = (text: string, indentStep: number): string[] => {
  const baseIndent = ' '.repeat(indentStep);
  const nestedIndent = ' '.repeat(indentStep * 2);
  const normalized = normalizeSqlWhitespace(text);
  const upper = normalized.toUpperCase();

  if (upper.startsWith('INSERT ')) {
    return formatInsert(normalized, baseIndent, nestedIndent);
  }
  if (upper.startsWith('SELECT ') || upper.startsWith('WITH ')) {
    return formatSelect(normalized, baseIndent, nestedIndent);
  }
  if (upper.startsWith('UPDATE ')) {
    return formatUpdate(normalized, baseIndent, nestedIndent);
  }
  if (upper.startsWith('DELETE ')) {
    return formatDelete(normalized, baseIndent);
  }
  if (upper.startsWith('CALL ')) {
    return formatCall(normalized, baseIndent, nestedIndent);
  }
  if (upper.startsWith('SET ')) {
    return formatSet(normalized, baseIndent);
  }
  if (upper.startsWith('COMMIT') || upper.startsWith('ROLLBACK')) {
    return formatCommitRollback(normalized, baseIndent);
  }
  if (upper.startsWith('MERGE ')) {
    return formatMerge(normalized, baseIndent, nestedIndent);
  }
  if (
    upper.startsWith('PREPARE ') ||
    upper.startsWith('EXECUTE IMMEDIATE') ||
    upper.startsWith('EXECUTE ')
  ) {
    return formatPrepareExecute(normalized, baseIndent, nestedIndent);
  }
  if (
    upper.startsWith('DECLARE SECTION') ||
    upper.startsWith('END DECLARE SECTION') ||
    upper.startsWith('INCLUDE ') ||
    upper.startsWith('WHENEVER ') ||
    upper.startsWith('CONNECT ') ||
    upper.startsWith('SET CONNECTION') ||
    upper.startsWith('DISCONNECT ') ||
    upper.startsWith('RELEASE')
  ) {
    return formatHostAndConnection(normalized, baseIndent);
  }
  if (upper.startsWith('DECLARE ')) {
    return formatDeclareCursor(normalized, baseIndent, nestedIndent);
  }
  if (upper.startsWith('OPEN ') || upper.startsWith('CLOSE ') || upper.startsWith('FETCH ')) {
    return formatOpenCloseFetch(normalized, baseIndent, nestedIndent);
  }
  if (
    upper.startsWith('DESCRIBE ') ||
    upper.startsWith('ALLOCATE ') ||
    upper.startsWith('DEALLOCATE ')
  ) {
    return formatAllocateDescribe(normalized, baseIndent);
  }
  if (upper.startsWith('GET DIAGNOSTICS')) {
    const rest = normalizeSqlExpression(normalized.slice('get diagnostics'.length).trimStart());
    return [baseIndent + `get diagnostics ${rest};`.trim()];
  }
  if (upper.startsWith('VALUES')) {
    return formatValuesStatement(normalized, baseIndent, nestedIndent);
  }
  if (upper.startsWith('DESCRIBE ') || upper.startsWith('ALLOCATE ') || upper.startsWith('DEALLOCATE ')) {
    return formatAllocateDescribe(normalized, baseIndent);
  }
  if (upper.startsWith('EXECUTE IMMEDIATE')) {
    return formatPrepareExecute(normalized, baseIndent, nestedIndent);
  }
  if (upper.startsWith('EXECUTE ')) {
    return formatPrepareExecute(normalized, baseIndent, nestedIndent);
  }
  if (upper.startsWith('PREPARE ')) {
    return formatPrepareExecute(normalized, baseIndent, nestedIndent);
  }
  if (upper.startsWith('CONNECT ') || upper.startsWith('DISCONNECT ') || upper.startsWith('SET CONNECTION') || upper.startsWith('RELEASE')) {
    return formatHostAndConnection(normalized, baseIndent);
  }
  if (upper.startsWith('DECLARE SECTION') || upper.startsWith('END DECLARE SECTION') || upper.startsWith('INCLUDE ') || upper.startsWith('WHENEVER ')) {
    return formatHostAndConnection(normalized, baseIndent);
  }
  if (upper.startsWith('COMMIT') || upper.startsWith('ROLLBACK')) {
    return formatSimpleSqlStatement(normalized, baseIndent);
  }
  if (upper.startsWith('SAVEPOINT ')) {
    const rest = normalizeSqlWhitespace(normalized.slice(9).trimStart());
    return [baseIndent + `savepoint ${rest};`];
  }
  if (upper.startsWith('RELEASE SAVEPOINT')) {
    const rest = normalizeSqlWhitespace(normalized.slice('release savepoint'.length).trimStart());
    return [baseIndent + `release savepoint ${rest};`];
  }
  if (upper.startsWith('ROLLBACK TO SAVEPOINT')) {
    const rest = normalizeSqlWhitespace(normalized.slice('rollback to savepoint'.length).trimStart());
    return [baseIndent + `rollback to savepoint ${rest};`];
  }

  const fallback = stripTrailingSemicolon(normalized);
  return [baseIndent + fallback + ';'];
};

export const normalizeExecSqlBlocks = (
  lines: string[],
  cfg: Shift6Config
): ExecSqlNormalizeResult => {
  const out: string[] = [];
  let changed = false;
  let inExecSql = false;
  let sqlBuffer: string[] = [];

  const flushBuffer = () => {
    if (sqlBuffer.length === 0) return;
    const combined = sqlBuffer.join(' ').trim();
    const statements = splitSqlStatements(combined);
    for (const statement of statements) {
      out.push(...formatSqlStatement(statement, cfg.blockIndent));
    }
    sqlBuffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('//')) {
      if (inExecSql) {
        flushBuffer();
      }
      out.push(line);
      continue;
    }

    if (!inExecSql) {
      if (EXEC_SQL_START.test(line)) {
        changed = true;
        inExecSql = true;
        out.push('exec sql');
        const after = line.replace(EXEC_SQL_START, '').trim();
        if (after.length > 0) {
          const endIndex = after.search(END_EXEC);
          if (endIndex >= 0) {
            const sqlPart = after.slice(0, endIndex).trim();
            if (sqlPart.length > 0) sqlBuffer.push(sqlPart);
            flushBuffer();
            out.push('end-exec;');
            inExecSql = false;
            continue;
          }
          sqlBuffer.push(after);
        }
        continue;
      }
      out.push(line);
      continue;
    }

    if (END_EXEC.test(line)) {
      const beforeEnd = line.split(END_EXEC)[0].trim();
      if (beforeEnd.length > 0) {
        sqlBuffer.push(beforeEnd);
      }
      flushBuffer();
      out.push('end-exec;');
      inExecSql = false;
      continue;
    }

    sqlBuffer.push(line.trim());
  }

  if (inExecSql) {
    flushBuffer();
  }

  return { lines: out, changed };
};
