import {
  normalizeSqlIdentifierPath,
  normalizeSqlExpression,
  normalizeSqlWhitespace,
  splitJoinSegments,
  findKeywordIndex,
  findMatchingParenIndex,
  splitSetOperations,
  trimTrailingSemicolon
} from '../utils/index';

const DERIVED_TABLE_INLINE_LIMIT = 120;

type DerivedTableParts = {
  inner: string;
  tail: string;
};

const parseDerivedTable = (segment: string): DerivedTableParts | null => {
  const trimmed = segment.trim();
  if (!trimmed.startsWith('(')) return null;
  const closeIndex = findMatchingParenIndex(trimmed, 0);
  if (closeIndex === null) return null;
  const inner = trimmed.slice(1, closeIndex).trim();
  if (!inner) return null;
  const tail = trimmed.slice(closeIndex + 1).trim();
  return { inner, tail };
};

const shouldExpandDerivedTable = (inner: string): boolean => {
  const normalized = normalizeSqlWhitespace(inner);
  const upper = normalized.toUpperCase();
  if (!upper.startsWith('SELECT ') && !upper.startsWith('WITH ')) return false;
  if (splitSetOperations(normalized).length > 1) return true;
  return normalized.length > DERIVED_TABLE_INLINE_LIMIT;
};

// Format FROM and JOIN chains into multiple lines.
export const formatFromClause = (
  rest: string,
  baseIndent: string,
  nestedIndent: string,
  formatSubquery: (text: string, baseIndent: string, nestedIndent: string) => string[]
): string[] => {
  const normalizedRest = normalizeSqlIdentifierPath(rest);
  const segments = splitJoinSegments(normalizedRest);
  const indentStep = Math.max(0, nestedIndent.length - baseIndent.length);
  const innerNestedIndent = nestedIndent + ' '.repeat(indentStep);

  const formatDerivedTable = (
    keyword: string,
    tablePart: string
  ): string[] | null => {
    const derived = parseDerivedTable(tablePart);
    if (!derived) return null;
    if (!shouldExpandDerivedTable(derived.inner)) return null;
    const innerLines = formatSubquery(derived.inner, nestedIndent, innerNestedIndent);
    trimTrailingSemicolon(innerLines);
    const tail = normalizeSqlWhitespace(derived.tail);
    const suffix = tail.length > 0 ? ` ${tail}` : '';
    return [
      baseIndent + `${keyword} (`,
      ...innerLines,
      baseIndent + `)${suffix}`
    ];
  };

  const formatSegment = (
    keyword: string,
    segment: string,
    onCondition?: string
  ): string[] => {
    const derivedLines = formatDerivedTable(keyword, segment);
    if (derivedLines) {
      if (onCondition) {
        derivedLines[derivedLines.length - 1] =
          derivedLines[derivedLines.length - 1] +
          ` on ${normalizeSqlExpression(onCondition)}`;
      }
      return derivedLines;
    }
    if (onCondition) {
      return [
        baseIndent +
          `${keyword} ${normalizeSqlExpression(segment)} on ${normalizeSqlExpression(onCondition)}`
      ];
    }
    return [baseIndent + `${keyword} ${normalizeSqlExpression(segment)}`];
  };

  if (segments.length === 1) {
    return formatSegment('from', normalizedRest);
  }

  const lines: string[] = [];
  const first = segments[0];
  lines.push(...formatSegment('from', first.segment));
  for (let i = 1; i < segments.length; i++) {
    const keyword = segments[i].keyword.toLowerCase();
    const segment = segments[i].segment;
    const onIndex = findKeywordIndex(segment, 'ON');
    if (onIndex >= 0) {
      const tablePart = normalizeSqlIdentifierPath(segment.slice(0, onIndex).trim());
      const condition = segment.slice(onIndex + 2).trimStart();
      lines.push(...formatSegment(keyword, tablePart, condition));
      continue;
    }
    lines.push(...formatSegment(keyword, segment));
  }
  return lines;
};
