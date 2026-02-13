import type { Shift6Config } from '../../../../config';
import { getLeadingOperator, normalizeOperatorSpacing } from '../../../operators';
import { getEffectiveColumnLimit } from '../../support/column-limit';
import { wrapConcatenatedLine } from '../../support/concat-wrap';
import {
  hasTrailingPlusOutsideStrings,
  lineEndsWithStringLiteral,
  lineEndsStatement,
  lineHasStringConcat
} from '../../../utils/string-scan';
import type { ContinuationState } from '../../support/types';
import { clearPending, setPendingFromSegment } from './state';

// Flush any pending continuation with optional wrapping.
export const flushPending = (
  pending: string,
  state: ContinuationState,
  cfg: Shift6Config,
  targetIndent: number,
  producedLines: string[]
): void => {
  const pendingTargetIndent = state.pendingTargetIndent ?? targetIndent;
  const pendingNormalized = normalizeOperatorSpacing(pending, cfg);
  const pendingLimit = getEffectiveColumnLimit(pendingNormalized, pendingTargetIndent, cfg);
  const wrappedPending = wrapConcatenatedLine(
    pendingNormalized,
    pendingLimit,
    cfg.wrapLongStrings,
    cfg.concatStyle
  );
  if (wrappedPending) {
    producedLines.push(...wrappedPending);
  } else {
    producedLines.push(pending);
  }
  clearPending(state);
};

// Check and store a new pending segment when appropriate.
export const tryStartPending = (
  seg: string,
  state: ContinuationState,
  targetIndent: number,
  cfg: Shift6Config
): boolean => {
  if (seg.trimStart().startsWith('//')) {
    return false;
  }
  if (
    cfg.concatStyle === 'fill' &&
    !lineEndsStatement(seg) &&
    !getLeadingOperator(seg.trim()) &&
    lineEndsWithStringLiteral(seg)
  ) {
    setPendingFromSegment(state, seg, targetIndent);
    return true;
  }
  if (
    !lineEndsStatement(seg) &&
    !getLeadingOperator(seg.trim()) &&
    lineHasStringConcat(seg)
  ) {
    setPendingFromSegment(state, seg, targetIndent);
    return true;
  }
  if (hasTrailingPlusOutsideStrings(seg)) {
    setPendingFromSegment(state, seg, targetIndent);
    return true;
  }
  return false;
};
