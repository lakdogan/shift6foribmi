import { Shift6Config } from '../../config';
import { countLeadingSpaces } from '../utils';
import { Rule, RuleResult } from './types';

// Align line indentation based on block depth.
export const indentationRule: Rule = {
  id: 'indentation',
  apply(state, ctx, cfg): RuleResult {
    const currentIndent = countLeadingSpaces(state.current);
    const continuationOffset = ctx.pendingAssignmentContinuation ? cfg.blockIndent : 0;
    const target = cfg.targetBaseIndent + ctx.indentLevel * cfg.blockIndent + continuationOffset;

    let newText = state.current;
    if (currentIndent < target) {
      newText = ' '.repeat(target - currentIndent) + state.current;
    } else if (currentIndent > target) {
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
