import { CONTINUATION_OPERATORS } from '../constants';
import { isWhitespace } from './is-whitespace';

// Find the first spaced binary operator after a column limit.
export const findFirstSpacedBinaryOperatorAfterLimit = (
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
  const start = Math.max(0, limit + 1);
  let depth = 0;

  for (let i = 0; i < Math.min(start, codePart.length); i++) {
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
  }

  for (let i = start; i < codePart.length; i++) {
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
        return i;
      }
    }
  }

  return null;
};
