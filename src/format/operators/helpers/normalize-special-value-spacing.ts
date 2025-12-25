import { SPECIAL_VALUES, SPECIAL_VALUE_KEYWORDS } from '../constants';
import { isSpecialValueToken } from './keyword-tokens';
import { transformOutsideStrings } from './string-transform';
import { getPrevToken, isWhitespace } from './token-utils';

// Join *special values like *on, *off, *in99 in appropriate contexts.
export const normalizeSpecialValueSpacing = (text: string): string => {
  return transformOutsideStrings(text, (ch, index, fullText) => {
    if (ch !== '*') return null;
    const prevToken = getPrevToken(fullText, index);
    const prevTokenAllowed = prevToken !== null && SPECIAL_VALUE_KEYWORDS.has(prevToken);
    let prevNonSpace: string | null = null;
    for (let p = index - 1; p >= 0; p--) {
      if (!isWhitespace(fullText[p])) {
        prevNonSpace = fullText[p];
        break;
      }
    }
    const prevLooksLikeOperand =
      prevNonSpace !== null && /[A-Za-z0-9_)\]]/.test(prevNonSpace);
    const allowJoin = prevTokenAllowed || !prevLooksLikeOperand;
    let j = index + 1;
    while (j < fullText.length && isWhitespace(fullText[j])) j++;
    let k = j;
    while (k < fullText.length && /[A-Za-z0-9_]/.test(fullText[k])) k++;
    if (k > j) {
      const token = fullText.substring(j, k).toUpperCase();
      if (allowJoin) {
        if (/^IN[0-9]{2}$/i.test(token)) {
          return { append: '*IN' + token.slice(-2), advance: k - 1 - index };
        }
        if (token === 'IN') {
          let m = k;
          while (m < fullText.length && isWhitespace(fullText[m])) m++;
          const inDigits = fullText.substring(m, m + 2);
          if (/^[0-9]{2}$/.test(inDigits)) {
            return { append: '*IN' + inDigits, advance: m + 1 - index };
          }
        }
        if (token === 'N' || SPECIAL_VALUES.includes(token)) {
          return { append: '*' + fullText.substring(j, k), advance: k - 1 - index };
        }
      }
      const isSpecial = isSpecialValueToken(fullText, index);
      if (isSpecial && j > index + 1 && allowJoin) {
        return { append: '*' + fullText.substring(j, k), advance: k - 1 - index };
      }
    }
    return null;
  });
};
