import { Shift6Config } from '../../config';
import { SPECIAL_VALUE_CONTEXTS, SPECIAL_VALUES } from './constants';
import {
  isSpecialValueToken,
  normalizeBinaryOperatorSpacing,
  normalizePercentBuiltins,
  normalizeSpecialValueSpacing
} from './helpers';

import {
  collapseExtraSpacesOutsideStrings,
  trimSpacesInsideParenthesesOutsideStrings,
  trimStringOnlyParentheses
} from './steps';
import { findCommentIndexOutsideStrings } from '../utils/string-scan';
import { transformSegmentsOutsideStrings } from './helpers/string-transform';
import { applyOperatorReplacements } from './normalize-helpers/operator-replacements';
import { applySpecialValueContextSpacing } from './normalize-helpers/special-value-context';
import {
  joinAsteriskTokensInDecl,
  joinDeclReturnAsterisk
} from './normalize-helpers/decl-asterisk-join';
import {
  normalizeCtlOptAsteriskTokens,
  normalizeCtlOptParentheses
} from './normalize-helpers/ctl-opt';
import {
  normalizePercentBuiltinArgs,
  normalizePercentBuiltinNames
} from './normalize-helpers/percent';
import { normalizeAsteriskSpacing } from './normalize-helpers/asterisk-spacing';
import { trimSpaceBeforeSemicolon } from './normalize-helpers/semicolon-spacing';

const applyOutsideStrings = transformSegmentsOutsideStrings;

// Apply all operator-level normalizations for a single line.
export function normalizeOperatorSpacing(line: string, cfg: Shift6Config): string {
  const trimmedStart = line.trimStart();
  const isCtlOptLine = trimmedStart.toUpperCase().startsWith('CTL-OPT');
  const isDeclLine = (() => {
    const upper = trimmedStart.toUpperCase();
    return upper.startsWith('DCL-PI') || upper.startsWith('DCL-PR') || upper.startsWith('DCL-PROC');
  })();

  if (trimmedStart.startsWith('//')) {
    return line;
  }

  const commentIndex = findCommentIndexOutsideStrings(line);
  const codePart = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
  const commentPart = commentIndex >= 0 ? line.substring(commentIndex) : '';

  const match = codePart.match(/^(\s*)(.*)$/);
  const indent = match ? match[1] : '';
  let rest = match ? match[2] : codePart;

  if (cfg.trimStringParentheses) {
    rest = trimStringOnlyParentheses(rest);
  }

  if (isCtlOptLine) {
    rest = applyOutsideStrings(rest, normalizeCtlOptParentheses);
  }

  rest = normalizePercentBuiltins(rest);
  rest = normalizeBinaryOperatorSpacing(rest, cfg);

  if (cfg.joinAsteriskTokensInDecl) {
    rest = applyOutsideStrings(rest, joinAsteriskTokensInDecl);
  }

  if (cfg.joinAsteriskTokensInDecl && isDeclLine) {
    rest = applyOutsideStrings(rest, joinDeclReturnAsterisk);
  }

  rest = normalizeSpecialValueSpacing(rest);

  if (!isDeclLine) {
    rest = applyOutsideStrings(rest, normalizeAsteriskSpacing);
  }

  const contextPattern = new RegExp(
    `\\b(${SPECIAL_VALUE_CONTEXTS.join('|')})\\s+\\*\\s+(${SPECIAL_VALUES.join('|')})\\b`,
    'gi'
  );
  rest = applyOutsideStrings(rest, (segment) =>
    applySpecialValueContextSpacing(segment, contextPattern)
  );

  if (isCtlOptLine) {
    rest = applyOutsideStrings(rest, normalizeCtlOptAsteriskTokens);
  }

  rest = applyOutsideStrings(rest, applyOperatorReplacements);

  if (cfg.collapseTokenSpaces) {
    rest = collapseExtraSpacesOutsideStrings(rest);
  }

  rest = applyOutsideStrings(rest, trimSpaceBeforeSemicolon);

  rest = normalizePercentBuiltins(rest);
  rest = applyOutsideStrings(rest, normalizePercentBuiltinNames);
  rest = trimSpacesInsideParenthesesOutsideStrings(rest);

  rest = applyOutsideStrings(rest, normalizePercentBuiltinArgs);

  const trimmedRest = rest.replace(/[ \t]+$/g, '');
  const commentSpacer = commentPart && trimmedRest.length > 0 ? ' ' : '';
  return indent + trimmedRest + commentSpacer + commentPart;
}
