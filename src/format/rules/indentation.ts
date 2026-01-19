import { Shift6Config } from '../../config';
import { countLeadingSpaces } from '../utils';
import { Rule, RuleResult } from './types';

// Align line indentation based on block depth.
export const indentationRule: Rule = {
  id: 'indentation',
  apply(state, ctx, cfg, flags): RuleResult {
    const currentIndent = countLeadingSpaces(state.current);
    const trimmedStart = state.current.trimStart();
    const isCommentLine = trimmedStart.startsWith('//');
    const continuationOffset = ctx.pendingAssignmentContinuation ? cfg.blockIndent : 0;
    const target = isCommentLine
      ? state.commentIndentOverride ?? cfg.targetBaseIndent
      : cfg.targetBaseIndent + ctx.indentLevel * cfg.blockIndent + continuationOffset;
    const preserveIndent =
      !cfg.alignProcedureCallParameters &&
      state.paramContinuationDepth > 0 &&
      !isCommentLine;

    let newText = state.current;
    if (isCommentLine) {
      newText = ' '.repeat(target) + trimmedStart;
    } else if (ctx.execSqlDepth > 0) {
      const trimmed = state.current.trimStart();
      const adjustedIndent = target + currentIndent;
      newText = ' '.repeat(adjustedIndent) + trimmed;
    } else if (currentIndent < target) {
      newText = ' '.repeat(target - currentIndent) + state.current;
    } else if (currentIndent > target && !preserveIndent) {
      newText = state.current.substring(currentIndent - target);
    }

    return {
      state: {
        ...state,
        current: newText,
        targetIndent: target
      },
      ctx,
      changed: newText !== state.current
    };
  }
};
