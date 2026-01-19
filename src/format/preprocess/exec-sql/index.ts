import type { Shift6Config } from '../../../config';
import { formatSqlStatement } from './formatters/index';
import { END_EXEC, EXEC_SQL_START, endsWithTopLevelSemicolon, splitSqlStatements } from './utils/index';

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
  let changed = false;
  let inExecSql = false;
  let sqlBuffer: string[] = [];
  let pendingExecSqlLineIndex: number | null = null;

  const emitStatement = (statement: string, usePending: boolean) => {
    const formatted = formatSqlStatement(statement, cfg.blockIndent);
    const sqlLine = formatted.length === 1 ? formatted[0].trimStart() : '';

    if (usePending && pendingExecSqlLineIndex !== null) {
      if (formatted.length === 1) {
        out[pendingExecSqlLineIndex] = `exec sql ${sqlLine}`.trimEnd();
      } else {
        out.push(...formatted);
      }
      pendingExecSqlLineIndex = null;
      return;
    }

    if (formatted.length === 1) {
      out.push(`exec sql ${sqlLine}`.trimEnd());
      return;
    }

    out.push('exec sql');
    out.push(...formatted);
  };

  const flushBuffer = () => {
    if (sqlBuffer.length === 0) return;
    const combined = sqlBuffer.join(' ').trim();
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
          out.push('exec sql');
          if (sqlPart.length > 0) {
            sqlBuffer.push(sqlPart);
          }
          continue;
        }

        inExecSql = true;
        pendingExecSqlLineIndex = out.length;
        out.push('exec sql');
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

    sqlBuffer.push(line.trim());
    const combined = sqlBuffer.join(' ').trim();
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
