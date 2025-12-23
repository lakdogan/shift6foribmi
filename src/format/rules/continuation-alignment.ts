import {
  findAssignmentRhsStart,
  findSpacedBinaryOperatorColumn,
  getLeadingOperator
} from '../operators';
import { Rule, RuleResult } from './types';

// Align continuation operators to a stable column across wrapped lines.
export const continuationAlignmentRule: Rule = {
  id: 'continuation-alignment',
  apply(state, ctx, cfg, flags): RuleResult {
    if (!cfg.alignPlusContinuation) {
      return { state, ctx, changed: false };
    }

    let newText = state.current;
    const trimmedStart = newText.trimStart();
    const leadingOperator = getLeadingOperator(newText);
    let changed = false;

    if (leadingOperator && ctx.continuationOperatorColumn !== null) {
      const desiredIndent = Math.max(state.targetIndent, ctx.continuationOperatorColumn);
      const aligned = ' '.repeat(desiredIndent) + trimmedStart;
      if (aligned !== newText) {
        newText = aligned;
        changed = true;
      }
    }

    let continuationOperatorColumn = ctx.continuationOperatorColumn;

    if (flags.isCommentOnly) {
      continuationOperatorColumn = null;
    } else {
      const commentIndex = newText.indexOf('//');
      const codePart = commentIndex >= 0 ? newText.substring(0, commentIndex) : newText;
      const endsStatement = codePart.trimEnd().endsWith(';');

      if (leadingOperator) {
        if (continuationOperatorColumn === null) {
          const opIndex = newText.indexOf(leadingOperator);
          continuationOperatorColumn = opIndex >= 0 ? opIndex : null;
        }
      } else {
        const opColumn = findSpacedBinaryOperatorColumn(newText);
        if (opColumn !== null && !endsStatement) {
          const rhsStart = findAssignmentRhsStart(newText);
          const alignColumn = rhsStart !== null ? Math.max(0, rhsStart - 2) : opColumn;
          continuationOperatorColumn = alignColumn;
        } else {
          const rhsStart = findAssignmentRhsStart(newText);
          if (rhsStart !== null && !endsStatement) {
            continuationOperatorColumn = Math.max(0, rhsStart - 2);
          } else {
            continuationOperatorColumn = null;
          }
        }
      }

      if (endsStatement) {
        continuationOperatorColumn = null;
      }
    }

    return {
      state: {
        ...state,
        current: newText
      },
      ctx: {
        ...ctx,
        continuationOperatorColumn
      },
      changed
    };
  }
};
