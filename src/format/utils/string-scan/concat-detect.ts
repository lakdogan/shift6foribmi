import { findCommentIndexOutsideStrings } from './comments';
import { scanStringAware } from './scan';

// Check if a line contains both a string literal and a '+' outside strings.
export const lineHasStringConcat = (text: string): boolean => {
  const commentIndex = findCommentIndexOutsideStrings(text);
  const codePart = commentIndex >= 0 ? text.substring(0, commentIndex) : text;
  let hasLiteral = false;
  let hasPlus = false;
  scanStringAware(
    codePart,
    (ch) => {
      if (ch === '+') {
        hasPlus = true;
      }
      return false;
    },
    () => {
      hasLiteral = true;
    }
  );

  return hasLiteral && hasPlus;
};
