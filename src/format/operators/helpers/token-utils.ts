// Determine if a character belongs to a token for operator spacing decisions.
export const isTokenChar = (ch: string): boolean => /[A-Za-z0-9_@#$\])}\(.'"]/.test(ch);

// Treat spaces and tabs as whitespace for parsing helpers.
export const isWhitespace = (ch: string): boolean => ch === ' ' || ch === '\t';

// Get the previous word-like token before the given index.
export const getPrevToken = (text: string, index: number): string | null => {
  let j = index - 1;
  while (j >= 0 && isWhitespace(text[j])) j--;
  if (j < 0) return null;
  let end = j;
  while (j >= 0 && /[A-Za-z0-9-]/.test(text[j])) j--;
  if (end < 0) return null;
  const token = text.slice(j + 1, end + 1).toUpperCase();
  return token.length > 0 ? token : null;
};
