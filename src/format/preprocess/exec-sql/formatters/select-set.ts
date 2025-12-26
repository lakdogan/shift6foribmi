import { splitSetOperations, trimTrailingSemicolon } from '../utils/index';

// Format UNION/INTERSECT/EXCEPT blocks within a SELECT statement.
export const formatSelectSetOperations = (
  remainder: string,
  baseIndent: string,
  nestedIndent: string,
  formatSelect: (text: string, baseIndent: string, nestedIndent: string) => string[]
): string[] | null => {
  const setParts = splitSetOperations(remainder);
  if (setParts.length <= 1) return null;

  const lines: string[] = [];
  for (let i = 0; i < setParts.length; i++) {
    const part = setParts[i];
    const upperPart = part.toUpperCase();
    if (upperPart === 'UNION' || upperPart === 'UNION ALL' || upperPart === 'INTERSECT' || upperPart === 'EXCEPT') {
      lines.push(baseIndent + part.toLowerCase());
      continue;
    }
    const sub = formatSelect(part, baseIndent, nestedIndent);
    if (i < setParts.length - 1) {
      trimTrailingSemicolon(sub);
    }
    lines.push(...sub);
  }

  return lines;
};
