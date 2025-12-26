import { scanStringAware } from '../../../utils/string-scan';

// Find the matching closing parenthesis for a given open index.
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

// Find a keyword index outside parentheses and identifiers.
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
