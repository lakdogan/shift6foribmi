import { findCommentIndexOutsideStrings, scanOutsideStrings } from '../../utils/string-scan';

// Locate the column where assignment RHS begins, ignoring ==, <=, >=.
export const findAssignmentRhsStart = (line: string): number | null => {
  const commentIndex = findCommentIndexOutsideStrings(line);
  const codePart = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
  let rhsStart: number | null = null;

  scanOutsideStrings(codePart, (ch, index) => {
    if (ch === '=') {
      const prev = index > 0 ? codePart[index - 1] : '';
      const next = index + 1 < codePart.length ? codePart[index + 1] : '';
      if (prev === '<' || prev === '>' || next === '=') {
        return false;
      }
      rhsStart = index + 2;
      return true;
    }
    return false;
  });

  return rhsStart;
};
