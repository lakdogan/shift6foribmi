import { Shift6Config } from '../../config';
import { SPECIAL_VALUE_CONTEXTS, SPECIAL_VALUES } from './constants';
import {
  normalizeBinaryOperatorSpacing,
  normalizePercentBuiltins,
  normalizeSpecialValueSpacing
} from './helpers';

import {
  collapseExtraSpacesOutsideStrings,
  trimSpacesInsideParenthesesOutsideStrings,
  trimStringOnlyParentheses
} from './steps';

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

  const commentIndex = line.indexOf('//');
  const codePart = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
  const commentPart = commentIndex >= 0 ? line.substring(commentIndex) : '';

  const match = codePart.match(/^(\s*)(.*)$/);
  const indent = match ? match[1] : '';
  let rest = match ? match[2] : codePart;

  if (cfg.trimStringParentheses) {
    rest = trimStringOnlyParentheses(rest);
  }

  if (isCtlOptLine) {
    rest = rest.replace(/\(\s+([^)]+?)\)/g, '($1)');
    rest = rest.replace(/\(([^)]+?)\s+\)/g, '($1)');
  }

  rest = normalizePercentBuiltins(rest);
  rest = normalizeBinaryOperatorSpacing(rest, cfg);

  if (cfg.joinAsteriskTokensInDecl) {
    rest = rest.replace(/(^|[(\s])\*\s+([A-Za-z0-9_]+)/, '$1*$2');
  }

  if (cfg.joinAsteriskTokensInDecl && isDeclLine) {
    rest = rest.replace(/(\bDCL-(?:PI|PR|PROC)\b)\s+\*\s+([A-Za-z0-9_]+)/i, '$1 *$2');
  }

  rest = normalizeSpecialValueSpacing(rest);

  if (!isDeclLine) {
    rest = rest.replace(/([A-Za-z0-9_)\]])\s*\*\s*([A-Za-z0-9_\(])/g, '$1 * $2');
  }

  const contextPattern = new RegExp(
    `\\b(${SPECIAL_VALUE_CONTEXTS.join('|')})\\s+\\*\\s+(${SPECIAL_VALUES.join('|')})\\b`,
    'gi'
  );
  rest = rest.replace(contextPattern, '$1 *$2');
  rest = rest.replace(
    /\b(IF|ELSEIF|WHEN|DOW|DOU|FOR|ON-ERROR|ON-EXIT)\s+\*\s+IN\s*([0-9]{2})\b/gi,
    '$1 *IN$2'
  );

  if (isCtlOptLine) {
    rest = rest.replace(/\(\s*([^)]+?)\s*\)/g, (_match, inner: string) => {
      const joined = inner.replace(/\*\s+([A-Za-z0-9_]+)/g, '*$1');
      return `(${joined})`;
    });
  }

  rest = rest.replace(/\s*<=\s*/g, ' __LE__ ');
  rest = rest.replace(/\s*>=\s*/g, ' __GE__ ');
  rest = rest.replace(/\s*<>\s*/g, ' __NE__ ');
  rest = rest.replace(/\s*([+\-*/%])\s*=\s*/g, ' __CASSIGN_$1__ ');
  rest = rest.replace(/\s*<\s*/g, ' < ');
  rest = rest.replace(/\s*>\s*/g, ' > ');
  rest = rest.replace(/\s*=\s*/g, ' = ');
  rest = rest.replace(/__LE__/g, ' <= ');
  rest = rest.replace(/__GE__/g, ' >= ');
  rest = rest.replace(/__NE__/g, ' <> ');
  rest = rest.replace(/__CASSIGN_([+\-*/%])__/g, ' $1= ');
  rest = rest.replace(/\s+([+\-*/%]=)/g, ' $1');
  rest = rest.replace(/([+\-*/%]=)\s+/g, '$1 ');
  rest = rest.replace(/\s*\b(AND|OR|NOT|XOR)\b\s*/gi, ' $1 ');
  rest = rest.replace(/\s*(\*AND|\*OR|\*NOT|\*XOR)\s*/gi, ' $1 ');

  if (cfg.collapseTokenSpaces) {
    rest = collapseExtraSpacesOutsideStrings(rest);
  }

  rest = normalizePercentBuiltins(rest);
  rest = trimSpacesInsideParenthesesOutsideStrings(rest);

  rest = rest.replace(/(%[A-Za-z0-9_]+)\(\s*([^)]+?)\s*\)/g, '$1($2)');

  return indent + rest + commentPart;
}
