import { transformOutsideStrings } from './string-transform';
import { isWhitespace } from './token-utils';

// Extract raw builtin argument text while respecting nested parens and strings.
const extractBuiltinArgs = (
  text: string,
  startIndex: number
): { content: string; end: number; closed: boolean } => {
  let inString = false;
  let quoteChar = '';
  let depth = 0;

  for (let i = startIndex + 1; i < text.length; i++) {
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
      if (depth === 0) {
        const raw = text.slice(startIndex + 1, i);
        return { content: raw.trim(), end: i, closed: true };
      }
      depth--;
      continue;
    }
  }

  const raw = text.slice(startIndex + 1);
  return { content: raw.trim(), end: text.length - 1, closed: false };
};

// Join %builtin names and trim surrounding argument whitespace.
export const normalizePercentBuiltins = (text: string): string => {
  return transformOutsideStrings(text, (ch, index, fullText) => {
    if (ch !== '%') return null;
    let j = index + 1;
    while (j < fullText.length && isWhitespace(fullText[j])) j++;
    let k = j;
    while (k < fullText.length && /[A-Za-z0-9_]/.test(fullText[k])) k++;
    if (k > j) {
      const name = '%' + fullText.substring(j, k);
      let m = k;
      while (m < fullText.length && isWhitespace(fullText[m])) m++;
      if (m < fullText.length && fullText[m] === '(') {
        const parsed = extractBuiltinArgs(fullText, m);
        if (parsed.closed) {
          return {
            append: name + '(' + parsed.content + ')',
            advance: parsed.end - index
          };
        }
        return {
          append: name + '(',
          advance: m - index
        };
      }
      return { append: name, advance: k - 1 - index };
    }
    return null;
  });
};
