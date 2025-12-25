import type { Shift6Config } from '../../../config';
import { transformSegmentsOutsideStrings } from '../helpers/string-transform';
import { normalizeAsteriskSpacing } from './asterisk-spacing';
import { normalizeCtlOptAsteriskTokens, normalizeCtlOptParentheses } from './ctl-opt';
import { joinAsteriskTokensInDecl, joinDeclReturnAsterisk } from './decl-asterisk-join';
import { applyOperatorReplacements } from './operator-replacements';
import { normalizePercentBuiltinArgs, normalizePercentBuiltinNames } from './percent';
import { trimSpaceBeforeSemicolon } from './semicolon-spacing';
import { applySpecialValueContextSpacing } from './special-value-context';

const applyOutside = (text: string, transform: (segment: string) => string): string => {
  return transformSegmentsOutsideStrings(text, transform);
};

export const applyCtlOptParentheses = (text: string, enabled: boolean): string => {
  return enabled ? applyOutside(text, normalizeCtlOptParentheses) : text;
};

export const applyDeclAsteriskJoins = (
  text: string,
  cfg: Shift6Config,
  isDeclLine: boolean
): string => {
  if (!cfg.joinAsteriskTokensInDecl) return text;
  let next = applyOutside(text, joinAsteriskTokensInDecl);
  if (isDeclLine) {
    next = applyOutside(next, joinDeclReturnAsterisk);
  }
  return next;
};

export const applyNonDeclAsteriskSpacing = (text: string, isDeclLine: boolean): string => {
  return isDeclLine ? text : applyOutside(text, normalizeAsteriskSpacing);
};

export const applySpecialValueContext = (text: string, contextPattern: RegExp): string => {
  return applyOutside(text, (segment) => applySpecialValueContextSpacing(segment, contextPattern));
};

export const applyCtlOptAsteriskSpacing = (text: string, enabled: boolean): string => {
  return enabled ? applyOutside(text, normalizeCtlOptAsteriskTokens) : text;
};

export const applyOperatorSpacingReplacements = (text: string): string => {
  return applyOutside(text, applyOperatorReplacements);
};

export const applySemicolonSpacing = (text: string): string => {
  return applyOutside(text, trimSpaceBeforeSemicolon);
};

export const applyPercentBuiltinNames = (text: string): string => {
  return applyOutside(text, normalizePercentBuiltinNames);
};

export const applyPercentBuiltinArgs = (text: string): string => {
  return applyOutside(text, normalizePercentBuiltinArgs);
};
