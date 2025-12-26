import {
  normalizeSqlWhitespace,
  normalizeStarTokens,
  normalizeSqlExpression,
  stripTrailingSemicolon,
  splitTopLevel,
  findMatchingParenIndex
} from '../utils';
import { formatPrepareExecute } from './prepare';

// Format CALL statements with argument lists.
export const formatCall = (text: string, baseIndent: string, nestedIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();
  if (!upper.startsWith('CALL ')) {
    return [baseIndent + cleaned + ';'];
  }

  const rest = cleaned.slice(4).trimStart();
  const parenIndex = rest.indexOf('(');
  const procName = parenIndex >= 0 ? rest.slice(0, parenIndex).trim() : rest;
  const closingIndex = findMatchingParenIndex(rest, parenIndex);
  if (!procName || closingIndex === null) {
    return [baseIndent + `call ${rest};`];
  }

  const argsText = rest.slice(parenIndex + 1, closingIndex);
  const args = splitTopLevel(argsText, ',').map(normalizeSqlExpression);
  const lines: string[] = [];
  lines.push(baseIndent + `call ${procName}(`);
  for (let i = 0; i < args.length; i++) {
    const suffix = i < args.length - 1 ? ',' : '';
    lines.push(nestedIndent + args[i] + suffix);
  }
  lines.push(baseIndent + ');');
  return lines;
};

// Format SET statements with token normalization.
export const formatSet = (text: string, baseIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();
  if (!upper.startsWith('SET ')) {
    return [baseIndent + cleaned + ';'];
  }
  const rest = cleaned.slice(3).trimStart();
  const normalized = normalizeSqlExpression(rest);
  const restUpper = rest.toUpperCase();
  const withStarTokens = restUpper.startsWith('OPTION ')
    || restUpper.startsWith('CURRENT ')
    || restUpper.startsWith('TRANSACTION ')
    ? normalizeStarTokens(normalized)
    : normalized;
  return [baseIndent + `set ${withStarTokens};`];
};

// Format COMMIT/ROLLBACK statements as lowercase.
export const formatCommitRollback = (text: string, baseIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();
  if (!(upper.startsWith('COMMIT') || upper.startsWith('ROLLBACK'))) {
    return [baseIndent + cleaned + ';'];
  }
  return formatLowercasedStatement(cleaned, baseIndent);
};

// Format DESCRIBE/ALLOCATE/DEALLOCATE and related statements.
export const formatAllocateDescribe = (text: string, baseIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const upper = cleaned.toUpperCase();
  if (upper.startsWith('DESCRIBE ')) {
    const rest = normalizeSqlWhitespace(cleaned.slice(9).trimStart());
    return [baseIndent + `describe ${rest};`];
  }
  if (upper.startsWith('ALLOCATE ')) {
    const rest = normalizeSqlWhitespace(cleaned.slice(9).trimStart());
    return [baseIndent + `allocate ${rest};`];
  }
  if (upper.startsWith('DEALLOCATE ')) {
    const rest = normalizeSqlWhitespace(cleaned.slice(11).trimStart());
    return [baseIndent + `deallocate ${rest};`];
  }
  if (upper.startsWith('LOCK TABLE')) {
    const rest = normalizeSqlWhitespace(cleaned.slice('lock table'.length).trimStart());
    return [baseIndent + `lock table ${rest};`];
  }
  if (upper.startsWith('SET SESSION')) {
    const rest = normalizeSqlWhitespace(cleaned.slice('set session'.length).trimStart());
    return [baseIndent + `set session ${rest};`];
  }
  if (upper.startsWith('SET TRANSACTION')) {
    const rest = normalizeSqlWhitespace(cleaned.slice('set transaction'.length).trimStart());
    return [baseIndent + `set transaction ${rest};`];
  }
  if (upper.startsWith('PREPARE ') || upper.startsWith('EXECUTE ') || upper.startsWith('EXECUTE IMMEDIATE')) {
    return formatPrepareExecute(cleaned, baseIndent, ' '.repeat(baseIndent.length * 2));
  }

  return [baseIndent + cleaned + ';'];
};

// Format simple SQL statements as lowercase.
export const formatSimpleSqlStatement = (text: string, baseIndent: string): string[] => {
  return formatLowercasedStatement(text, baseIndent);
};

// Normalize and lowercase a single SQL statement.
const formatLowercasedStatement = (text: string, baseIndent: string): string[] => {
  const cleaned = stripTrailingSemicolon(text);
  const normalized = normalizeSqlWhitespace(cleaned).toLowerCase();
  return [baseIndent + `${normalized};`];
};
