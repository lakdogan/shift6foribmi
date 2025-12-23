import { Rule } from './types';
import { continuationAlignmentRule } from './continuation-alignment';
import { indentationRule } from './indentation';
import { operatorSpacingRule } from './operator-spacing';
import { runRules } from './runner';

export const DEFAULT_RULES: Rule[] = [
  indentationRule,
  operatorSpacingRule,
  continuationAlignmentRule
];

export { runRules };
export type { Rule, RuleResult, LineState } from './types';
