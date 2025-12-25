import { Shift6Config } from '../../../config';
import { CONTINUATION_OPERATORS } from '../constants';
import {
  getNextNonWhitespaceIndex,
  getPrevNonWhitespaceIndex,
  isBinaryOperatorContext,
  shouldJoinAsteriskInDecl,
  shouldSkipOperator,
  trimTrailingSpaces
} from './binary-operator-spacing-helpers';

// Enforce spacing around binary operators while respecting RPGLE token exceptions.
export const normalizeBinaryOperatorSpacing = (text: string, cfg: Shift6Config): string => {
  const trimmedStart = text.trimStart();
  if (/^\/[A-Za-z]/.test(trimmedStart)) {
    return text;
  }
  const trimmedUpper = trimmedStart.toUpperCase();
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

    if (CONTINUATION_OPERATORS.includes(ch)) {
      const prevIndex = getPrevNonWhitespaceIndex(text, i);
      const nextIndex = getNextNonWhitespaceIndex(text, i);
      const prevChar = prevIndex >= 0 ? text[prevIndex] : '';
      const nextChar = nextIndex < text.length ? text[nextIndex] : '';

      if (shouldSkipOperator(ch, text, i, prevChar, nextChar, nextIndex)) {
        result += ch;
        continue;
      }

      const isBinary = isBinaryOperatorContext(prevChar, nextChar, nextIndex, text);
      const isLeading = prevIndex < 0;

      if (isBinary || isLeading) {
        result = trimTrailingSpaces(result);
        if (shouldJoinAsteriskInDecl(ch, cfg, trimmedUpper)) {
          result += (isLeading ? '' : ' ') + ch;
          continue;
        }
        result += (isLeading ? '' : ' ') + ch + ' ';
        i = nextIndex - 1;
        continue;
      }
    }

    result += ch;
  }

  return result;
};
