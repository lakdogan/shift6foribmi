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

// Split JOIN chains into discrete segments.
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
