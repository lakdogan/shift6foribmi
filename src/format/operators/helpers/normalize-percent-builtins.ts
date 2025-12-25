import { isWhitespace } from './token-utils';

// Extract raw builtin argument text while respecting nested parens and strings.
const extractBuiltinArgs = (text: string, startIndex: number): { content: string; end: number } => {
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
        return { content: raw.trim(), end: i };
      }
      depth--;
      continue;
    }
  }

  const raw = text.slice(startIndex + 1);
  return { content: raw.trim(), end: text.length - 1 };
};

// Join %builtin names and trim surrounding argument whitespace.
export const normalizePercentBuiltins = (text: string): string => {
  let result = '';
  let inString = false;
  let quoteChar = '';

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      result += ch;
      if (ch === quoteChar) {
        if (i + 1 < text.length && text[i + 1] === quoteChar) {
          result += text[i + 1];
          i++;
          continue;
        }
        inString = false;
        quoteChar = '';
      }
      continue;
    }

    if (ch === '\'' || ch === '"') {
      result += ch;
      inString = true;
      quoteChar = ch;
      continue;
    }

    if (ch === '%') {
      let j = i + 1;
      while (j < text.length && isWhitespace(text[j])) j++;
      let k = j;
      while (k < text.length && /[A-Za-z0-9_]/.test(text[k])) k++;
      if (k > j) {
        result += '%' + text.substring(j, k);
        let m = k;
        while (m < text.length && isWhitespace(text[m])) m++;
        if (m < text.length && text[m] === '(') {
          const parsed = extractBuiltinArgs(text, m);
          result += '(' + parsed.content + ')';
          i = parsed.end;
          continue;
        }
        i = k - 1;
        continue;
      }
    }

    result += ch;
  }

  return result;
};
