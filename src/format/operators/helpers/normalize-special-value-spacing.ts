import { SPECIAL_VALUES, SPECIAL_VALUE_KEYWORDS } from '../constants';
import { getPrevToken } from './get-prev-token';
import { isSpecialValueToken } from './is-special-value-token';
import { isWhitespace } from './is-whitespace';

// Join *special values like *on, *off, *in99 in appropriate contexts.
export const normalizeSpecialValueSpacing = (text: string): string => {
  let result = '';
  let inString = false;
  let quoteChar = '';

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      result += ch;
      if (ch === quoteChar) {
        if (i + 1 < text.length && text[i + 1] === quoteChar) {
          result += text[i + 1];
          i++;
          continue;
        }
        inString = false;
        quoteChar = '';
      }
      continue;
    }

    if (ch === '\'' || ch === '"') {
      result += ch;
      inString = true;
      quoteChar = ch;
      continue;
    }

    if (ch === '*') {
      const prevToken = getPrevToken(text, i);
      const prevTokenAllowed = prevToken !== null && SPECIAL_VALUE_KEYWORDS.has(prevToken);
      let j = i + 1;
      while (j < text.length && isWhitespace(text[j])) j++;
      let k = j;
      while (k < text.length && /[A-Za-z0-9_]/.test(text[k])) k++;
      if (k > j) {
        const token = text.substring(j, k).toUpperCase();
        if (prevTokenAllowed) {
          if (token === 'IN') {
            let m = k;
            while (m < text.length && isWhitespace(text[m])) m++;
            const inDigits = text.substring(m, m + 2);
            if (/^[0-9]{2}$/.test(inDigits)) {
              result += '*IN' + inDigits;
              i = m + 1;
              continue;
            }
          }
          if (token === 'N' || SPECIAL_VALUES.includes(token)) {
            result += '*' + text.substring(j, k);
            i = k - 1;
            continue;
          }
        }
        const isSpecial = isSpecialValueToken(text, i);
        if (isSpecial && j > i + 1 && prevTokenAllowed) {
          result += '*' + text.substring(j, k);
          i = k - 1;
          continue;
        }
      }
    }

    result += ch;
  }

  return result;
};
