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
    rest = applyOutsideStrings(rest, (segment) =>
      segment.replace(/\(\s+([^)]+?)\)/g, '($1)').replace(/\(([^)]+?)\s+\)/g, '($1)')
    );
  }

  rest = normalizePercentBuiltins(rest);
  rest = normalizeBinaryOperatorSpacing(rest, cfg);

  if (cfg.joinAsteriskTokensInDecl) {
    rest = applyOutsideStrings(rest, (segment) =>
      segment.replace(/(^|[(\s])\*\s+([A-Za-z0-9_]+)/, '$1*$2')
    );
  }

  if (cfg.joinAsteriskTokensInDecl && isDeclLine) {
    rest = applyOutsideStrings(rest, (segment) =>
      segment.replace(/(\bDCL-(?:PI|PR|PROC)\b)\s+\*\s+([A-Za-z0-9_]+)/i, '$1 *$2')
    );
  }

  rest = normalizeSpecialValueSpacing(rest);

  if (!isDeclLine) {
    rest = applyOutsideStrings(rest, (segment) =>
      segment.replace(
        /([A-Za-z0-9_)\]])\s*\*\s*([A-Za-z0-9_\(])/g,
        (match: string, left: string, right: string, offset: number) => {
          const starIndex = offset + match.indexOf('*');
          if (isSpecialValueToken(segment, starIndex)) {
            return left + ' *' + right;
          }
          return left + ' * ' + right;
        }
      )
    );
  }

  const contextPattern = new RegExp(
    `\\b(${SPECIAL_VALUE_CONTEXTS.join('|')})\\s+\\*\\s+(${SPECIAL_VALUES.join('|')})\\b`,
    'gi'
  );
  rest = applyOutsideStrings(rest, (segment) =>
    segment
      .replace(contextPattern, '$1 *$2')
      .replace(
        /\b(IF|ELSEIF|WHEN|DOW|DOU|FOR|ON-ERROR|ON-EXIT)\s+\*\s+IN\s*([0-9]{2})\b/gi,
        '$1 *IN$2'
      )
  );

  if (isCtlOptLine) {
    rest = applyOutsideStrings(rest, (segment) =>
      segment.replace(/\(\s*([^)]+?)\s*\)/g, (_match, inner: string) => {
        const joined = inner.replace(/\*\s+([A-Za-z0-9_]+)/g, '*$1');
        return `(${joined})`;
      })
    );
  }

  rest = applyOutsideStrings(rest, (segment) => {
    let next = segment;
    next = next.replace(/\s*<=\s*/g, ' __LE__ ');
    next = next.replace(/\s*>=\s*/g, ' __GE__ ');
    next = next.replace(/\s*<>\s*/g, ' __NE__ ');
    next = next.replace(/\s*([+\-*/%])\s*=\s*/g, ' __CASSIGN_$1__ ');
    next = next.replace(/\s*<\s*/g, ' < ');
    next = next.replace(/\s*>\s*/g, ' > ');
    next = next.replace(/\s*=\s*/g, ' = ');
    next = next.replace(/__LE__/g, ' <= ');
    next = next.replace(/__GE__/g, ' >= ');
    next = next.replace(/__NE__/g, ' <> ');
    next = next.replace(/__CASSIGN_([+\-*/%])__/g, ' $1= ');
    next = next.replace(/\s+([+\-*/%]=)/g, ' $1');
    next = next.replace(/([+\-*/%]=)\s+/g, '$1 ');
    next = next.replace(
      /\s*\b(AND|OR|NOT|XOR)\b\s*/gi,
      (match: string, op: string, offset: number, source: string) => {
        const before = source.slice(0, offset);
        const atStart = before.trim().length === 0;
        return (atStart ? '' : ' ') + op + ' ';
      }
    );
    next = next.replace(
      /\s*(\*AND|\*OR|\*NOT|\*XOR)\s*/gi,
      (match: string, op: string, offset: number, source: string) => {
        const before = source.slice(0, offset);
        const atStart = before.trim().length === 0;
        return (atStart ? '' : ' ') + op + ' ';
      }
    );
    return next;
  });

  if (cfg.collapseTokenSpaces) {
    rest = collapseExtraSpacesOutsideStrings(rest);
  }

  rest = applyOutsideStrings(rest, (segment) => segment.replace(/\s+;/g, ';'));

  rest = normalizePercentBuiltins(rest);
  rest = applyOutsideStrings(rest, (segment) =>
    segment.replace(/%\s+([A-Za-z0-9_]+)/g, '%$1')
  );
  rest = trimSpacesInsideParenthesesOutsideStrings(rest);

  rest = applyOutsideStrings(rest, (segment) =>
    segment.replace(/(%[A-Za-z0-9_]+)\(\s*([^)]+?)\s*\)/g, '$1($2)')
  );

  const trimmedRest = rest.replace(/[ \t]+$/g, '');
  const commentSpacer = commentPart && trimmedRest.length > 0 ? ' ' : '';
  return indent + trimmedRest + commentSpacer + commentPart;
}
