import { Shift6Config } from '../../config';
import { getLeadingOperator } from '../operators';
import { countLeadingSpaces } from '../utils';
import { Rule, RuleResult } from './types';

// Align line indentation based on block depth.
export const indentationRule: Rule = {
  id: 'indentation',
  apply(state, ctx, cfg, flags): RuleResult {
    const currentIndent = countLeadingSpaces(state.current);
    const trimmedStart = state.current.trimStart();
    const isCommentLine = trimmedStart.startsWith('//');
    const baseTarget = cfg.targetBaseIndent + ctx.indentLevel * cfg.blockIndent;
    const continuationOffset = ctx.pendingAssignmentContinuation ? cfg.blockIndent : 0;
    const hasLeadingOperator = getLeadingOperator(state.current) !== null;
    const statementContinuationOffset =
      !ctx.pendingAssignmentContinuation &&
      ctx.pendingStatementContinuationOffset !== null &&
      state.paramContinuationDepth === 0 &&
      !hasLeadingOperator &&
      !flags.isMultilineStringContinuation &&
      ctx.execSqlDepth === 0
        ? ctx.pendingStatementContinuationOffset
        : 0;
    const target = isCommentLine
      ? state.commentIndentOverride ?? cfg.targetBaseIndent
      : baseTarget + continuationOffset + statementContinuationOffset;
    const preserveIndent =
      !cfg.alignProcedureCallParameters &&
      state.paramContinuationDepth > 0 &&
      !isCommentLine;

    let newText = state.current;
    if (flags.isMultilineStringContinuation) {
      if (ctx.execSqlDepth === 0 || isCommentLine) {
        return { state, ctx, changed: false };
      }
      const execSqlBase = state.execSqlIndentBase ?? currentIndent;
      const sqlIndent = currentIndent >= execSqlBase ? currentIndent - execSqlBase : 0;
      const adjustedIndent = target + sqlIndent;
      if (adjustedIndent > currentIndent) {
        newText = ' '.repeat(adjustedIndent - currentIndent) + state.current;
      } else if (adjustedIndent < currentIndent) {
        newText = state.current.substring(currentIndent - adjustedIndent);
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

    const parenContinuationIndent =
      !cfg.alignProcedureCallParameters &&
      state.paramContinuationDepth > 0 &&
      !isCommentLine &&
      ctx.execSqlDepth === 0 &&
      !trimmedStart.startsWith(')');

    if (parenContinuationIndent) {
      const desiredIndent = Math.max(currentIndent, target + cfg.blockIndent);
      if (desiredIndent > currentIndent) {
        newText = ' '.repeat(desiredIndent - currentIndent) + state.current;
      } else if (desiredIndent < currentIndent) {
        newText = state.current.substring(currentIndent - desiredIndent);
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
    if (isCommentLine) {
      newText = ' '.repeat(target) + trimmedStart;
    } else if (ctx.execSqlDepth > 0) {
      const trimmed = state.current.trimStart();
      const execSqlBase = state.execSqlIndentBase ?? currentIndent;
      const sqlIndent = currentIndent >= execSqlBase ? currentIndent - execSqlBase : 0;
      const adjustedIndent = target + sqlIndent;
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
