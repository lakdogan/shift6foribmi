import { DASH_KEYWORD_PREFIX } from '../../../constants';
import { SPECIAL_VALUES, SPECIAL_VALUE_KEYWORDS } from '../constants';
import { getPrevToken, isWhitespace } from './token-utils';

// Check if a '-' belongs to a dash keyword (e.g., DCL-PI).
export const isDashKeywordToken = (text: string, index: number): boolean => {
  let start = index;
  let end = index;
  while (start > 0 && /[A-Za-z0-9*-/]/.test(text[start - 1])) start--;
  while (end + 1 < text.length && /[A-Za-z0-9*-/]/.test(text[end + 1])) end++;
  const token = text.slice(start, end + 1).toUpperCase();
  return DASH_KEYWORD_PREFIX.test(token);
};

// Check if a '/' is part of a directive token like /INCLUDE.
export const isSlashDirectiveToken = (text: string, index: number): boolean => {
  let start = index;
  let end = index;
  while (start > 0 && /[A-Za-z0-9*-/]/.test(text[start - 1])) start--;
  while (end + 1 < text.length && /[A-Za-z0-9*-/]/.test(text[end + 1])) end++;
  const token = text.slice(start, end + 1).toUpperCase();
  return /^\/[A-Z][A-Z0-9_]*$/.test(token);
};

// Detect if '*' is followed by a valid special value token.
export const isSpecialValueToken = (text: string, index: number): boolean => {
  let j = index + 1;
  while (j < text.length && isWhitespace(text[j])) j++;
  let k = j;
  while (k < text.length && /[A-Za-z0-9_]/.test(text[k])) k++;
  if (k <= j) return false;
  const token = text.substring(j, k).toUpperCase();
  if (token === 'N') {
    const prevToken = getPrevToken(text, index);
    if (prevToken !== null && SPECIAL_VALUE_KEYWORDS.has(prevToken)) {
      return true;
    }
    for (let p = index - 1; p >= 0; p--) {
      if (!isWhitespace(text[p])) return false;
    }
    return true;
  }
  return SPECIAL_VALUES.includes(token) || /^IN[0-9A-Z]{2}$/.test(token);
};
