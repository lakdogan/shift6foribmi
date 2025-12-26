import { scanStringAware } from '../../../utils/string-scan';

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
