import { Shift6Config } from '../../../config';
import { CONTINUATION_OPERATORS } from '../constants';
import { isDashKeywordToken } from './is-dash-keyword-token';
import { isSlashDirectiveToken } from './is-slash-directive-token';
import { isSpecialValueToken } from './is-special-value-token';
import { isTokenChar } from './is-token-char';
import { isWhitespace } from './is-whitespace';

// Enforce spacing around binary operators while respecting RPGLE token exceptions.
export const normalizeBinaryOperatorSpacing = (text: string, cfg: Shift6Config): string => {
  const trimmedStart = text.trimStart();
  if (/^\/[A-Za-z]/.test(trimmedStart)) {
    return text;
  }
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
      const prevIndex = (() => {
        let j = i - 1;
        while (j >= 0 && isWhitespace(text[j])) j--;
        return j;
      })();
      const nextIndex = (() => {
        let j = i + 1;
        while (j < text.length && isWhitespace(text[j])) j++;
        return j;
      })();
      const prevChar = prevIndex >= 0 ? text[prevIndex] : '';
      const nextChar = nextIndex < text.length ? text[nextIndex] : '';

      if (ch === '%' && /[A-Za-z]/.test(nextChar)) {
        result += ch;
        continue;
      }
      if (ch === '*' && isSpecialValueToken(text, i)) {
        result += ch;
        continue;
      }
      if (ch === '-' && isDashKeywordToken(text, i)) {
        result += ch;
        continue;
      }
      if (ch === '/' && isSlashDirectiveToken(text, i)) {
        result += ch;
        continue;
      }
      if (ch === '*' && (prevChar === '*' || nextChar === '*')) {
        result += ch;
        continue;
      }
      if (nextChar === '=') {
        result += ch;
        continue;
      }

      const isBuiltinStart = nextChar === '%' && /[A-Za-z]/.test(text[nextIndex + 1] || '');
      const isBinary =
        isTokenChar(prevChar) && (isTokenChar(nextChar) || isBuiltinStart);
      const isLeading = prevIndex < 0;

      if (isBinary || isLeading) {
        while (result.endsWith(' ')) {
          result = result.slice(0, -1);
        }
        if (ch === '*' && cfg.joinAsteriskTokensInDecl) {
          const trimmed = text.trimStart().toUpperCase();
          if (
            trimmed.startsWith('DCL-PI') ||
            trimmed.startsWith('DCL-PR') ||
            trimmed.startsWith('DCL-PROC') ||
            trimmed.startsWith('CTL-OPT')
          ) {
            result += (isLeading ? '' : ' ') + ch;
            continue;
          }
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
