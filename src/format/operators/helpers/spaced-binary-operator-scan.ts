import { findCommentIndexOutsideStrings, scanOutsideStrings } from '../../utils/string-scan';
import { CONTINUATION_OPERATORS } from '../constants';
import { isWhitespace } from './token-utils';

type ScanMode = 'first' | 'last';

const getCodePart = (line: string): string => {
  const commentIndex = findCommentIndexOutsideStrings(line);
  return commentIndex >= 0 ? line.substring(0, commentIndex) : line;
};

const scanSpacedBinaryOperator = (
  line: string,
  start: number,
  end: number,
  mode: ScanMode
): number | null => {
  const codePart = getCodePart(line);
  const maxIndex = Math.min(codePart.length - 1, end);
  let found: number | null = null;
  let depth = 0;

  scanOutsideStrings(codePart, (ch, index) => {
    if (index > maxIndex) {
      return true;
    }

    if (ch === '(') {
      depth++;
      return false;
    }
    if (ch === ')' && depth > 0) {
      depth--;
      return false;
    }

    if (index < start) return false;

    if (CONTINUATION_OPERATORS.includes(ch) && index > 0 && index + 1 < codePart.length) {
      if (depth === 0 && isWhitespace(codePart[index - 1]) && isWhitespace(codePart[index + 1])) {
        found = index;
        if (mode === 'first') return true;
      }
    }
    return false;
  });

  return found;
};

// Find a binary operator that already has spaces on both sides.
export const findSpacedBinaryOperatorColumn = (line: string): number | null => {
  return scanSpacedBinaryOperator(line, 0, line.length - 1, 'first');
};

// Locate the last spaced binary operator before a column limit.
export const findLastSpacedBinaryOperatorBeforeLimit = (
  line: string,
  limit: number
): number | null => {
  return scanSpacedBinaryOperator(line, 0, limit, 'last');
};

// Find the first spaced binary operator after a column limit.
export const findFirstSpacedBinaryOperatorAfterLimit = (
  line: string,
  limit: number
): number | null => {
  return scanSpacedBinaryOperator(line, Math.max(0, limit + 1), line.length - 1, 'first');
};
