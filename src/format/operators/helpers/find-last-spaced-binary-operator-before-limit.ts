import { CONTINUATION_OPERATORS } from '../constants';
import { isWhitespace } from './is-whitespace';

// Locate the last spaced binary operator before a column limit.
export const findLastSpacedBinaryOperatorBeforeLimit = (
  line: string,
  limit: number
): number | null => {
  let commentIndex = -1;
  let inString = false;
  let quoteChar = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inString) {
      if (ch === quoteChar) {
        if (i + 1 < line.length && line[i + 1] === quoteChar) {
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
    if (ch === '/' && i + 1 < line.length && line[i + 1] === '/') {
      commentIndex = i;
      break;
    }
  }
  const codePart = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
  inString = false;
  quoteChar = '';
  let last: number | null = null;
  let depth = 0;
  const max = Math.min(codePart.length - 1, limit);

  for (let i = 0; i <= max; i++) {
    const ch = codePart[i];

    if (inString) {
      if (ch === quoteChar) {
        if (i + 1 < codePart.length && codePart[i + 1] === quoteChar) {
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
    if (ch === ')' && depth > 0) {
      depth--;
      continue;
    }

    if (CONTINUATION_OPERATORS.includes(ch) && i > 0 && i + 1 < codePart.length) {
      if (depth === 0 && isWhitespace(codePart[i - 1]) && isWhitespace(codePart[i + 1])) {
        last = i;
      }
    }
  }

  return last;
};
