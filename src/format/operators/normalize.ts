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
import {
  applyCtlOptAsteriskSpacing,
  applyCtlOptParentheses,
  applyDeclAsteriskJoins,
  applyNonDeclAsteriskSpacing,
  applyOperatorSpacingReplacements,
  applyPercentBuiltinArgs,
  applyPercentBuiltinNames,
  applySemicolonSpacing,
  applySpecialValueContext
} from './normalize-helpers/pipeline';

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

  rest = applyCtlOptParentheses(rest, isCtlOptLine);

  rest = normalizePercentBuiltins(rest);
  rest = normalizeBinaryOperatorSpacing(rest, cfg);

  rest = applyDeclAsteriskJoins(rest, cfg, isDeclLine);

  rest = normalizeSpecialValueSpacing(rest);

  rest = applyNonDeclAsteriskSpacing(rest, isDeclLine);

  const contextPattern = new RegExp(
    `\\b(${SPECIAL_VALUE_CONTEXTS.join('|')})\\s+\\*\\s+(${SPECIAL_VALUES.join('|')})\\b`,
    'gi'
  );
  rest = applySpecialValueContext(rest, contextPattern);

  rest = applyCtlOptAsteriskSpacing(rest, isCtlOptLine);

  rest = applyOperatorSpacingReplacements(rest);

  if (cfg.collapseTokenSpaces) {
    rest = collapseExtraSpacesOutsideStrings(rest);
  }

  rest = applySemicolonSpacing(rest);

  rest = normalizePercentBuiltins(rest);
  rest = applyPercentBuiltinNames(rest);
  rest = trimSpacesInsideParenthesesOutsideStrings(rest);

  rest = applyPercentBuiltinArgs(rest);

  const trimmedRest = rest.replace(/[ \t]+$/g, '');
  const commentSpacer = commentPart && trimmedRest.length > 0 ? ' ' : '';
  return indent + trimmedRest + commentSpacer + commentPart;
}
