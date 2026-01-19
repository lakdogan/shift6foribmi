import { normalizeSqlExpression, splitBooleanConditions } from '../utils/index';

// Format WHERE/HAVING clauses with one condition per line when using AND/OR.
export const formatBooleanClause = (
  keyword: 'where' | 'having',
  text: string,
  baseIndent: string,
  nestedIndent: string
): string[] => {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return [baseIndent + keyword];
  }

  const conditions = splitBooleanConditions(trimmed);
  if (conditions.length <= 1) {
    return [baseIndent + `${keyword} ${normalizeSqlExpression(trimmed)}`.trim()];
  }

  const lines: string[] = [baseIndent + keyword];
  for (const condition of conditions) {
    const prefix = condition.op ? `${condition.op} ` : '';
    lines.push(nestedIndent + prefix + normalizeSqlExpression(condition.text));
  }
  return lines;
};
