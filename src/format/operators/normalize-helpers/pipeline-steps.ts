import type { Shift6Config } from '../../../config';
import { applyOperatorSpacingReplacements, applySemicolonSpacing } from './pipeline';
import { normalizePercentBuiltins } from '../helpers/normalize-percent-builtins';
import { normalizeBinaryOperatorSpacing } from '../helpers/normalize-binary-operator-spacing';
import { normalizeSpecialValueSpacing } from '../helpers/normalize-special-value-spacing';
import {
  applyCtlOptAsteriskSpacing,
  applyCtlOptParentheses,
  applyDeclAsteriskJoins,
  applyNonDeclAsteriskSpacing,
  applyPercentBuiltinArgs,
  applyPercentBuiltinNames,
  applySpecialValueContext
} from './pipeline';
import {
  trimStringOnlyParentheses,
  trimSpacesInsideParenthesesOutsideStrings,
  collapseExtraSpacesOutsideStrings
} from '../steps';
import { SPECIAL_VALUE_CONTEXTS, SPECIAL_VALUES } from '../constants';

export type NormalizeStepContext = {
  cfg: Shift6Config;
  isCtlOptLine: boolean;
  isDeclLine: boolean;
  contextPattern: RegExp;
};

export type NormalizeStep = (text: string, ctx: NormalizeStepContext) => string;

const applyIf = (enabled: boolean, step: NormalizeStep): NormalizeStep => {
  return (text, ctx) => (enabled ? step(text, ctx) : text);
};

export const buildNormalizeSteps = (ctx: NormalizeStepContext): NormalizeStep[] => {
  const steps: NormalizeStep[] = [];

  steps.push(applyIf(ctx.cfg.trimStringParentheses, (text) => trimStringOnlyParentheses(text)));
  steps.push((text, stepCtx) => applyCtlOptParentheses(text, stepCtx.isCtlOptLine));
  steps.push((text) => normalizePercentBuiltins(text));
  steps.push((text, stepCtx) => normalizeBinaryOperatorSpacing(text, stepCtx.cfg));
  steps.push((text, stepCtx) => applyDeclAsteriskJoins(text, stepCtx.cfg, stepCtx.isDeclLine));
  steps.push((text) => normalizeSpecialValueSpacing(text));
  steps.push((text, stepCtx) => applyNonDeclAsteriskSpacing(text, stepCtx.isDeclLine));
  steps.push((text, stepCtx) => applySpecialValueContext(text, stepCtx.contextPattern));
  steps.push((text, stepCtx) => applyCtlOptAsteriskSpacing(text, stepCtx.isCtlOptLine));
  steps.push((text) => applyOperatorSpacingReplacements(text));
  steps.push(applyIf(ctx.cfg.collapseTokenSpaces, (text) => collapseExtraSpacesOutsideStrings(text)));
  steps.push((text) => applySemicolonSpacing(text));
  // Second pass to catch %builtins introduced by earlier replacements.
  steps.push((text) => normalizePercentBuiltins(text));
  steps.push((text) => applyPercentBuiltinNames(text));
  steps.push((text) => trimSpacesInsideParenthesesOutsideStrings(text));
  steps.push((text) => applyPercentBuiltinArgs(text));

  return steps;
};

export const buildContextPattern = (): RegExp => {
  return new RegExp(
    `\\b(${SPECIAL_VALUE_CONTEXTS.join('|')})\\s+\\*\\s+(${SPECIAL_VALUES.join('|')})\\b`,
    'gi'
  );
};
