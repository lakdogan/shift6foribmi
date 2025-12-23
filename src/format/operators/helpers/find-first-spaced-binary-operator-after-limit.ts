import { CONTINUATION_OPERATORS } from '../constants';
import { isWhitespace } from './is-whitespace';

// Find the first spaced binary operator after a column limit.
export const findFirstSpacedBinaryOperatorAfterLimit = (
  line: string,
  limit: number
): number | null => {
  const commentIndex = line.indexOf('//');
  const codePart = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
  let inString = false;
  let quoteChar = '';
  const start = Math.max(0, limit + 1);

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

    if (CONTINUATION_OPERATORS.includes(ch) && i > 0 && i + 1 < codePart.length) {
      if (isWhitespace(codePart[i - 1]) && isWhitespace(codePart[i + 1])) {
        return i;
      }
    }
  }

  return null;
};
