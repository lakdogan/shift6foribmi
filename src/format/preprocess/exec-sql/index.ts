import type { Shift6Config } from '../../../config';
import { formatSqlStatement } from './formatters';
import { END_EXEC, EXEC_SQL_START, splitSqlStatements } from './utils';

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

  const flushBuffer = () => {
    if (sqlBuffer.length === 0) return;
    const combined = sqlBuffer.join(' ').trim();
    const statements = splitSqlStatements(combined);
    for (const statement of statements) {
      out.push(...formatSqlStatement(statement, cfg.blockIndent));
    }
    sqlBuffer = [];
  };

  const nextNonEmptyLine = (start: number): string | null => {
    for (let i = start; i < lines.length; i++) {
      const trimmed = lines[i].trimStart();
      if (trimmed.length === 0) continue;
      if (trimmed.startsWith('//')) continue;
      return trimmed;
    }
    return null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();
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
          if (endIndex >= 0) {
            out.push('exec sql');
            const sqlPart = after.slice(0, endIndex).trim();
            if (sqlPart.length > 0) sqlBuffer.push(sqlPart);
            flushBuffer();
            out.push('end-exec;');
            continue;
          }

          const nextLine = nextNonEmptyLine(i + 1);
          const hasSemicolon = after.includes(';');
          const expectsEndExec = nextLine ? END_EXEC.test(nextLine) : false;
          if (hasSemicolon && !expectsEndExec) {
            out.push('exec sql');
            sqlBuffer.push(after);
            flushBuffer();
            out.push('end-exec;');
            continue;
          }
        }

        inExecSql = true;
        out.push('exec sql');
        if (after.length > 0) {
          sqlBuffer.push(after);
        }
        continue;
      }
      out.push(line);
      continue;
    }

    if (END_EXEC.test(line)) {
      const beforeEnd = line.split(END_EXEC)[0].trim();
      if (beforeEnd.length > 0) {
        sqlBuffer.push(beforeEnd);
      }
      flushBuffer();
      out.push('end-exec;');
      inExecSql = false;
      continue;
    }

    sqlBuffer.push(line.trim());
  }

  if (inExecSql) {
    flushBuffer();
  }

  return { lines: out, changed };
};
