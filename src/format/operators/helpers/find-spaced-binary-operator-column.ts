import { CONTINUATION_OPERATORS } from '../constants';
import { isWhitespace } from './is-whitespace';

// Find a binary operator that already has spaces on both sides.
export const findSpacedBinaryOperatorColumn = (line: string): number | null => {
  const commentIndex = line.indexOf('//');
  const codePart = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
  let inString = false;
  let quoteChar = '';
  let depth = 0;

  for (let i = 0; i < codePart.length; i++) {
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
