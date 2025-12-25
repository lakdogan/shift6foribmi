// Find '//' comment start while ignoring string literals.
export const findCommentIndexOutsideStrings = (text: string): number => {
  let inString = false;
  let quoteChar = '';
  for (let i = 0; i < text.length; i++) {
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
    if (ch === '/' && i + 1 < text.length && text[i + 1] === '/') {
      return i;
    }
  }
  return -1;
};

// Check if a line ends with ';' outside of inline comments.
export const lineEndsStatement = (text: string): boolean => {
  const commentIndex = findCommentIndexOutsideStrings(text);
  const codePart = commentIndex >= 0 ? text.substring(0, commentIndex) : text;
  return codePart.trimEnd().endsWith(';');
};
