import { Shift6Config } from '../../../config';
import { isDashKeywordToken, isSlashDirectiveToken, isSpecialValueToken } from './keyword-tokens';
import { isTokenChar, isWhitespace } from './token-utils';

export const getPrevNonWhitespaceIndex = (text: string, index: number): number => {
  let j = index - 1;
  while (j >= 0 && isWhitespace(text[j])) j--;
  return j;
};

export const getNextNonWhitespaceIndex = (text: string, index: number): number => {
  let j = index + 1;
  while (j < text.length && isWhitespace(text[j])) j++;
  return j;
};

export const shouldSkipOperator = (
  ch: string,
  text: string,
  index: number,
  prevChar: string,
  nextChar: string,
  nextIndex: number
): boolean => {
  if (ch === '%' && /[A-Za-z]/.test(nextChar)) return true;
  if (ch === '*' && isSpecialValueToken(text, index)) return true;
  if (ch === '-' && isDashKeywordToken(text, index)) return true;
  if (ch === '/' && isSlashDirectiveToken(text, index)) return true;
  if (ch === '*' && (prevChar === '*' || nextChar === '*')) return true;
  if (nextChar === '=') return true;
  return false;
};

export const isBinaryOperatorContext = (
  prevChar: string,
  nextChar: string,
  nextIndex: number,
  text: string
): boolean => {
  const isBuiltinStart = nextChar === '%' && /[A-Za-z]/.test(text[nextIndex + 1] || '');
  return isTokenChar(prevChar) && (isTokenChar(nextChar) || isBuiltinStart);
};

export const shouldJoinAsteriskInDecl = (
  ch: string,
  cfg: Shift6Config,
  trimmedUpper: string
): boolean => {
  if (ch !== '*' || !cfg.joinAsteriskTokensInDecl) return false;
  return (
    trimmedUpper.startsWith('DCL-PI') ||
    trimmedUpper.startsWith('DCL-PR') ||
    trimmedUpper.startsWith('DCL-PROC') ||
    trimmedUpper.startsWith('CTL-OPT')
  );
};

export const trimTrailingSpaces = (text: string): string => {
  while (text.endsWith(' ')) {
    text = text.slice(0, -1);
  }
  return text;
};
