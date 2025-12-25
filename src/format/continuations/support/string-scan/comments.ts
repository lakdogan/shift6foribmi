import { scanOutsideStrings } from './scan';

// Find '//' comment start while ignoring string literals.
export const findCommentIndexOutsideStrings = (text: string): number => {
  let commentIndex = -1;
  scanOutsideStrings(text, (ch, index) => {
    if (ch === '/' && index + 1 < text.length && text[index + 1] === '/') {
      commentIndex = index;
      return true;
    }
    return false;
  });
  return commentIndex;
};

// Check if a line ends with ';' outside of inline comments.
export const lineEndsStatement = (text: string): boolean => {
  const commentIndex = findCommentIndexOutsideStrings(text);
  const codePart = commentIndex >= 0 ? text.substring(0, commentIndex) : text;
  return codePart.trimEnd().endsWith(';');
};
