import {
  normalizeSqlWhitespace,
  normalizeSqlExpression,
  stripTrailingSemicolon,
  splitTopLevel
} from '../utils';
import { formatSelect } from './select';
import { formatInsert, formatUpdate, formatDelete, formatMerge } from './dml';
import { formatCall, formatSet, formatCommitRollback, formatAllocateDescribe, formatSimpleSqlStatement } from './misc';
import { formatPrepareExecute } from './prepare';
import { formatDeclareCursor, formatOpenCloseFetch } from './cursor';
import { formatHostAndConnection } from './host';
import { formatValuesStatement } from './values';
import { formatDdlStatement } from './ddl';
import { formatWithStatement } from './with';

// Dispatch SQL statements to the correct formatter.
export const formatSqlStatement = (text: string, indentStep: number): string[] => {
  const baseIndent = ' '.repeat(indentStep);
  const nestedIndent = ' '.repeat(indentStep * 2);
  const normalized = normalizeSqlWhitespace(text);
  const upper = normalized.toUpperCase();

  if (upper.startsWith('INSERT ')) {
    return formatInsert(normalized, baseIndent, nestedIndent);
  }
  if (upper.startsWith('WITH ')) {
    return formatWithStatement(normalized, baseIndent, nestedIndent);
  }
  if (upper.startsWith('SELECT ')) {
    return formatSelect(normalized, baseIndent, nestedIndent);
  }
  if (upper.startsWith('UPDATE ')) {
    return formatUpdate(normalized, baseIndent, nestedIndent);
  }
  if (upper.startsWith('DELETE ')) {
    return formatDelete(normalized, baseIndent);
  }
  if (upper.startsWith('CALL ')) {
    return formatCall(normalized, baseIndent, nestedIndent);
  }
  if (upper.startsWith('SET ')) {
    return formatSet(normalized, baseIndent);
  }
  if (
    upper.startsWith('COMMIT') ||
    (upper.startsWith('ROLLBACK') && !upper.startsWith('ROLLBACK TO SAVEPOINT'))
  ) {
    return formatCommitRollback(normalized, baseIndent);
  }
  if (upper.startsWith('MERGE ')) {
    return formatMerge(normalized, baseIndent, nestedIndent);
  }
  if (
    upper.startsWith('PREPARE ') ||
    upper.startsWith('EXECUTE IMMEDIATE') ||
    upper.startsWith('EXECUTE ')
  ) {
    return formatPrepareExecute(normalized, baseIndent, nestedIndent);
  }
  if (
    upper.startsWith('DECLARE SECTION') ||
    upper.startsWith('END DECLARE SECTION') ||
    upper.startsWith('INCLUDE ') ||
    upper.startsWith('WHENEVER ') ||
    upper.startsWith('CONNECT ') ||
    upper.startsWith('SET CONNECTION') ||
    upper.startsWith('DISCONNECT ') ||
    upper.startsWith('RELEASE')
  ) {
    return formatHostAndConnection(normalized, baseIndent);
  }
  if (upper.startsWith('DECLARE ')) {
    return formatDeclareCursor(normalized, baseIndent, nestedIndent);
  }
  if (upper.startsWith('OPEN ') || upper.startsWith('CLOSE ') || upper.startsWith('FETCH ')) {
    return formatOpenCloseFetch(normalized, baseIndent, nestedIndent);
  }
  if (
    upper.startsWith('DESCRIBE ') ||
    upper.startsWith('ALLOCATE ') ||
    upper.startsWith('DEALLOCATE ')
  ) {
    return formatAllocateDescribe(normalized, baseIndent);
  }
  if (upper.startsWith('GET DIAGNOSTICS')) {
    const rest = normalized.slice('get diagnostics'.length).trimStart();
    const assignments = splitTopLevel(rest, ',').map(normalizeSqlExpression);
    if (assignments.length <= 1) {
      const single = assignments.length === 1 ? assignments[0] : normalizeSqlExpression(rest);
      return [baseIndent + `get diagnostics ${single};`.trim()];
    }
    const lines: string[] = [];
    lines.push(baseIndent + 'get diagnostics');
    for (let i = 0; i < assignments.length; i++) {
      const suffix = i < assignments.length - 1 ? ',' : ';';
      lines.push(nestedIndent + assignments[i] + suffix);
    }
    return lines;
  }
  if (upper.startsWith('VALUES')) {
    return formatValuesStatement(normalized, baseIndent, nestedIndent);
  }
  if (
    upper.startsWith('CREATE ') ||
    upper.startsWith('ALTER ') ||
    upper.startsWith('DROP ') ||
    upper.startsWith('DECLARE GLOBAL TEMPORARY TABLE')
  ) {
    return formatDdlStatement(normalized, baseIndent);
  }
  if (upper.startsWith('SAVEPOINT ')) {
    const rest = normalizeSqlWhitespace(normalized.slice(9).trimStart());
    return [baseIndent + `savepoint ${rest};`];
  }
  if (upper.startsWith('RELEASE SAVEPOINT')) {
    const rest = normalizeSqlWhitespace(normalized.slice('release savepoint'.length).trimStart());
    return [baseIndent + `release savepoint ${rest};`];
  }
  if (upper.startsWith('ROLLBACK TO SAVEPOINT')) {
    const rest = normalizeSqlWhitespace(normalized.slice('rollback to savepoint'.length).trimStart());
    return [baseIndent + `rollback to savepoint ${rest};`];
  }
  if (
    upper.startsWith('COMMIT') ||
    (upper.startsWith('ROLLBACK') && !upper.startsWith('ROLLBACK TO SAVEPOINT'))
  ) {
    return formatSimpleSqlStatement(normalized, baseIndent);
  }

  const fallback = stripTrailingSemicolon(normalized);
  return [baseIndent + fallback + ';'];
};
