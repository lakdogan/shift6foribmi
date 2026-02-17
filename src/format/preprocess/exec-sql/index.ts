import type { Shift6Config } from '../../../config';
import { formatSqlStatement } from './formatters/index';
import {
  END_EXEC,
  EXEC_SQL_START,
  applySqlKeywordCasing,
  endsWithTopLevelSemicolon,
  getExecSqlPrefix,
  splitSqlStatements
} from './utils/index';

interface ExecSqlNormalizeResult {
  lines: string[];
  changed: boolean;
}

// Normalize exec sql blocks into formatted statements.
export const normalizeExecSqlBlocks = (
  lines: string[],
  cfg: Shift6Config
): ExecSqlNormalizeResult => {
  const out: string[] = [];
  const execSqlPrefix = getExecSqlPrefix(cfg.execSqlKeywordCase);
  let changed = false;
  let inExecSql = false;
  let sqlBuffer: string[] = [];
  let pendingExecSqlLineIndex: number | null = null;

  const emitStatement = (statement: string, usePending: boolean) => {
    const formatted = formatSqlStatement(statement, cfg.blockIndent);
    const cased = applySqlKeywordCasing(formatted, cfg.execSqlKeywordCase);
    const sqlLine = cased.length === 1 ? cased[0].trimStart() : '';

    if (usePending && pendingExecSqlLineIndex !== null) {
      if (cased.length === 1) {
        out[pendingExecSqlLineIndex] = `${execSqlPrefix} ${sqlLine}`.trimEnd();
      } else {
        out.push(...cased);
      }
      pendingExecSqlLineIndex = null;
      return;
    }

    if (cased.length === 1) {
      out.push(`${execSqlPrefix} ${sqlLine}`.trimEnd());
      return;
    }

    out.push(execSqlPrefix);
    out.push(...cased);
  };

  const flushBuffer = () => {
    if (sqlBuffer.length === 0) return;
    const combined = sqlBuffer.join('\n').trimEnd();
    const statements = splitSqlStatements(combined);
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const usePending = pendingExecSqlLineIndex !== null && i === 0;
      emitStatement(statement, usePending);
    }
    sqlBuffer = [];
    pendingExecSqlLineIndex = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();
    const trimmedUpper = trimmed.toUpperCase();
    const isEndExecLine = /^END-EXEC\b/.test(trimmedUpper) || /^END\s+EXEC\b/.test(trimmedUpper);
    if (trimmed.startsWith('//')) {
      if (inExecSql) {
        flushBuffer();
      }
      out.push(line);
      continue;
    }

    if (!inExecSql) {
      if (EXEC_SQL_START.test(line)) {
        changed = true;
        const after = line.replace(EXEC_SQL_START, '').trim();
        if (after.length > 0) {
          const endIndex = after.search(END_EXEC);
          const sqlPart = endIndex >= 0 ? after.slice(0, endIndex).trim() : after;
          const isComplete = endIndex >= 0 || endsWithTopLevelSemicolon(sqlPart);
          if (sqlPart.length > 0 && isComplete) {
            const statements = splitSqlStatements(sqlPart);
            for (const statement of statements) {
              emitStatement(statement, false);
            }
            continue;
          }

          inExecSql = true;
          pendingExecSqlLineIndex = out.length;
          out.push(execSqlPrefix);
          if (sqlPart.length > 0) {
            sqlBuffer.push(sqlPart);
          }
          continue;
        }

        inExecSql = true;
        pendingExecSqlLineIndex = out.length;
        out.push(execSqlPrefix);
        continue;
      }
      if (isEndExecLine) {
        changed = true;
        continue;
      }
      out.push(line);
      continue;
    }

    if (isEndExecLine) {
      const beforeEnd = line.split(END_EXEC)[0].trim();
      if (beforeEnd.length > 0) {
        sqlBuffer.push(beforeEnd);
      }
      flushBuffer();
      pendingExecSqlLineIndex = null;
      inExecSql = false;
      continue;
    }

    sqlBuffer.push(line.trimEnd());
    const combined = sqlBuffer.join('\n').trimEnd();
    if (combined.length > 0 && endsWithTopLevelSemicolon(combined)) {
      flushBuffer();
      inExecSql = false;
    }
  }

  if (inExecSql) {
    flushBuffer();
    pendingExecSqlLineIndex = null;
  }

  return { lines: out, changed };
};
