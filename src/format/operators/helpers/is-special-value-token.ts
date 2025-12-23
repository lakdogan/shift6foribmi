import { SPECIAL_VALUES, SPECIAL_VALUE_KEYWORDS } from '../constants';
import { getPrevToken } from './get-prev-token';
import { isWhitespace } from './is-whitespace';

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
  return SPECIAL_VALUES.includes(token) || /^IN[0-9]{2}$/.test(token);
};
