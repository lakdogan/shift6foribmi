// Check if a '/' is part of a directive token like /INCLUDE.
export const isSlashDirectiveToken = (text: string, index: number): boolean => {
  let start = index;
  let end = index;
  while (start > 0 && /[A-Za-z0-9*-/]/.test(text[start - 1])) start--;
  while (end + 1 < text.length && /[A-Za-z0-9*-/]/.test(text[end + 1])) end++;
  const token = text.slice(start, end + 1).toUpperCase();
  return /^\/[A-Z][A-Z0-9_]*$/.test(token);
};
