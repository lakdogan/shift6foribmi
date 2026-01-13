import { findCommentIndexOutsideStrings, scanOutsideStrings } from '../utils/string-scan';
import type { ParamAlignState } from '../context/types';
import type { Rule, RuleResult } from './types';

const normalizeLeadingColon = (trimmed: string): string => {
  if (!trimmed.startsWith(':')) return trimmed;
  const rest = trimmed.slice(1).trimStart();
  return rest.length > 0 ? `: ${rest}` : ':';
};

const updateParamAlignStack = (stack: ParamAlignState[], text: string): ParamAlignState[] => {
  const next = stack.map((entry) => ({ ...entry }));
  scanOutsideStrings(text, (ch, index) => {
    if (ch === '(') {
      next.push({ parenColumn: index, colonColumn: null });
      return;
    }
    if (ch === ')' && next.length > 0) {
      next.pop();
    }
  });
  return next;
};

// Align leading-':' procedure parameters under the opening paren and align closing parens.
export const procedureParameterAlignmentRule: Rule = {
  id: 'procedure-parameter-alignment',
  apply(state, ctx, cfg, flags): RuleResult {
    if (!cfg.alignProcedureCallParameters || ctx.execSqlDepth > 0) {
      return { state, ctx, changed: false };
    }

    let newText = state.current;
    let changed = false;
    let paramAlignStack = ctx.paramAlignStack.map((entry) => ({ ...entry }));

    const trimmedStart = newText.trimStart();
    if (trimmedStart.startsWith(':') && paramAlignStack.length > 0) {
      const normalized = normalizeLeadingColon(trimmedStart);
      const top = paramAlignStack[paramAlignStack.length - 1];
      const desiredColumn = top.colonColumn ?? top.parenColumn + 1;
      const desiredIndent = Math.max(state.targetIndent, desiredColumn);
      const aligned = ' '.repeat(desiredIndent) + normalized;
      if (aligned !== newText) {
        newText = aligned;
        changed = true;
      }
      if (top.colonColumn === null) {
        top.colonColumn = desiredIndent;
      }
    } else if (trimmedStart.startsWith(')') && paramAlignStack.length > 0) {
      const top = paramAlignStack[paramAlignStack.length - 1];
      if (top.colonColumn !== null) {
        const desiredIndent = Math.max(state.targetIndent, top.colonColumn);
        const aligned = ' '.repeat(desiredIndent) + trimmedStart;
        if (aligned !== newText) {
          newText = aligned;
          changed = true;
        }
      }
    }

    const commentIndex = findCommentIndexOutsideStrings(newText);
    const codePart = commentIndex >= 0 ? newText.slice(0, commentIndex) : newText;
    paramAlignStack = updateParamAlignStack(paramAlignStack, codePart);
    if (flags.endsStatement) {
      paramAlignStack = [];
    }

    return {
      state: {
        ...state,
        current: newText
      },
      ctx: {
        ...ctx,
        paramAlignStack
      },
      changed
    };
  }
};
