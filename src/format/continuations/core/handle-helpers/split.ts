import {
  findFirstSpacedBinaryOperatorAfterLimit,
  findLastSpacedBinaryOperatorBeforeLimit
} from '../../../operators';
import type { ContinuationState } from '../../support/types';
import type { SplitAttempt } from './types';
import { clearPending } from './state';

// Try to split on a spaced binary operator when the line exceeds the column limit.
export const trySplitByOperator = (
  recombined: string,
  columnLimit: number,
  state: ContinuationState,
  producedLines: string[]
): SplitAttempt => {
  if (recombined.length <= columnLimit) return 'none';
  const lastOp = findLastSpacedBinaryOperatorBeforeLimit(recombined, columnLimit);
  const splitAt =
    lastOp !== null
      ? lastOp
      : findFirstSpacedBinaryOperatorAfterLimit(recombined, columnLimit);
  if (splitAt !== null && splitAt > 1) {
    const opChar = recombined[splitAt];
    const left = recombined.substring(0, splitAt - 1);
    if (left.trim().length === 0) return 'abort';
    const right = recombined.substring(splitAt + 2);
    producedLines.push(left);
    producedLines.push(state.continuationIndent + opChar + ' ' + right.trimStart());
    clearPending(state);
    return 'split';
  }
  return 'none';
};
