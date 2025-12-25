import type { Shift6Config } from '../../../../config';
import { findCommentIndexOutsideStrings } from './comments';

// Check if a line contains both a string literal and a '+' outside strings.
export const lineHasStringConcat = (text: string, _cfg: Shift6Config): boolean => {
  const commentIndex = findCommentIndexOutsideStrings(text);
  const codePart = commentIndex >= 0 ? text.substring(0, commentIndex) : text;
  let inString = false;
  let quoteChar = '';
  let hasLiteral = false;
  let hasPlus = false;

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
      hasLiteral = true;
      continue;
    }
    if (ch === '+') {
      hasPlus = true;
    }
  }

  return hasLiteral && hasPlus;
};
