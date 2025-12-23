import { normalizeOperatorSpacing } from '../operators/normalize';
import { Rule, RuleResult } from './types';

// Normalize operator spacing and special token joins within a line.
export const operatorSpacingRule: Rule = {
  id: 'operator-spacing',
  apply(state, ctx, cfg): RuleResult {
    const normalized = normalizeOperatorSpacing(state.current, cfg);
    return {
      state: {
        ...state,
        current: normalized
      },
      ctx,
      changed: normalized !== state.current
    };
  }
};
