import {
  normalizeSqlIdentifierPath,
  normalizeSqlExpression,
  splitJoinSegments,
  findKeywordIndex
} from '../utils';

export const formatFromClause = (rest: string, baseIndent: string): string[] => {
  const normalizedRest = normalizeSqlIdentifierPath(rest);
  const segments = splitJoinSegments(normalizedRest);
  if (segments.length === 1) {
    return [baseIndent + `from ${normalizeSqlExpression(normalizedRest)}`];
  }

  const lines: string[] = [];
  const first = segments[0];
  lines.push(baseIndent + `from ${normalizeSqlExpression(first.segment)}`);
  for (let i = 1; i < segments.length; i++) {
    const keyword = segments[i].keyword.toLowerCase();
    const segment = segments[i].segment;
    const onIndex = findKeywordIndex(segment, 'ON');
    if (onIndex >= 0) {
      const tablePart = normalizeSqlIdentifierPath(segment.slice(0, onIndex).trim());
      const condition = segment.slice(onIndex + 2).trimStart();
      lines.push(
        baseIndent +
          `${keyword} ${normalizeSqlExpression(tablePart)} on ${normalizeSqlExpression(condition)}`
      );
    } else {
      lines.push(baseIndent + `${keyword} ${normalizeSqlExpression(segment)}`);
    }
  }
  return lines;
};
