import { scanStringAware } from '../../utils/string-scan';

export const EXEC_SQL_START = /^\s*EXEC\s+SQL\b/i;
export const END_EXEC = /\bEND-EXEC\b|\bEND\s+EXEC\b/i;

export const normalizeSqlWhitespace = (text: string): string => {
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

export const normalizeSqlIdentifierPath = (text: string): string =>
  text.replace(/\s*\/\s*/g, '/');

export const normalizeStarTokens = (text: string): string =>
  text.replace(/\*\s+([A-Za-z][A-Za-z0-9_]*)/g, '*$1');

export const normalizeSqlExpression = (text: string): string => {
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

    if (ch === '*' && /[A-Za-z]/.test(nextNonSpace(i + 1))) {
      const prev = lastNonSpace();
      if (prev === '' || prev === '=' || prev === ',' || prev === '(') {
        out += ch;
        while (i + 1 < compact.length && compact[i + 1] === ' ') {
          i++;
        }
        continue;
      }
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

export const stripTrailingSemicolon = (text: string): string => {
  const trimmed = text.trimEnd();
  return trimmed.endsWith(';') ? trimmed.slice(0, -1).trimEnd() : trimmed;
};

export const splitTopLevel = (text: string, delimiter: string): string[] => {
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

export const findMatchingParenIndex = (text: string, startIndex: number): number | null => {
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

export const findKeywordIndex = (text: string, keyword: string): number => {
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

export const splitSqlStatements = (text: string): string[] => {
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

export const trimTrailingSemicolon = (lines: string[]): string[] => {
  if (lines.length === 0) return lines;
  const last = lines[lines.length - 1];
  if (last.endsWith(';')) {
    lines[lines.length - 1] = last.slice(0, -1);
  }
  return lines;
};

export const parseWithClauses = (
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

export const splitSetOperations = (text: string): string[] => {
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

export const splitSelectClauses = (text: string): string[] => {
  const upper = text.toUpperCase();
  const keywords = [
    'FOR READ ONLY',
    'FOR FETCH ONLY',
    'FOR UPDATE',
    'GROUP BY',
    'ORDER BY',
    'HAVING',
    'WHERE',
    'WHERE CURRENT OF',
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

export const JOIN_KEYWORDS = [
  'LEFT OUTER JOIN',
  'RIGHT OUTER JOIN',
  'FULL OUTER JOIN',
  'LEFT JOIN',
  'RIGHT JOIN',
  'FULL JOIN',
  'INNER JOIN',
  'CROSS JOIN',
  'JOIN'
];

export const splitJoinSegments = (text: string): { keyword: string; segment: string }[] => {
  const upper = text.toUpperCase();
  const positions: { index: number; keyword: string }[] = [];
  let depth = 0;
  let inString = false;
  let quoteChar = '';
  let lastMatchEnd = -1;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === quoteChar) {
        if (i + 1 < text.length && text[i + 1] === quoteChar) {
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
      continue;
    }

    if (ch === '(') {
      depth++;
      continue;
    }
    if (ch === ')') {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth !== 0) continue;
    if (i < lastMatchEnd) continue;

    let matched = false;
    for (const keyword of JOIN_KEYWORDS) {
      if (!upper.startsWith(keyword, i)) continue;
      const before = i > 0 ? upper[i - 1] : ' ';
      const afterIndex = i + keyword.length;
      const after = afterIndex < upper.length ? upper[afterIndex] : ' ';
      if (/[A-Z0-9_]/.test(before) || /[A-Z0-9_]/.test(after)) continue;
      positions.push({ index: i, keyword });
      lastMatchEnd = i + keyword.length;
      i += keyword.length - 1;
      matched = true;
      break;
    }
    if (matched) continue;
  }

  positions.sort((a, b) => a.index - b.index);
  if (positions.length === 0) return [{ keyword: 'FROM', segment: text.trim() }];

  const segments: { keyword: string; segment: string }[] = [];
  const firstJoinIndex = positions[0].index;
  segments.push({ keyword: 'FROM', segment: text.slice(0, firstJoinIndex).trim() });
  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].index;
    const end = i + 1 < positions.length ? positions[i + 1].index : text.length;
    const keyword = positions[i].keyword;
    const segment = text.slice(start + keyword.length, end).trim();
    segments.push({ keyword, segment });
  }
  return segments;
};
