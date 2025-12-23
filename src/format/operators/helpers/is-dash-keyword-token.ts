import { DASH_KEYWORD_PREFIX } from '../../../constants';

// Check if a '-' belongs to a dash keyword (e.g., DCL-PI).
export const isDashKeywordToken = (text: string, index: number): boolean => {
  let start = index;
  let end = index;
  while (start > 0 && /[A-Za-z0-9*-/]/.test(text[start - 1])) start--;
  while (end + 1 < text.length && /[A-Za-z0-9*-/]/.test(text[end + 1])) end++;
  const token = text.slice(start, end + 1).toUpperCase();
  return DASH_KEYWORD_PREFIX.test(token);
};
