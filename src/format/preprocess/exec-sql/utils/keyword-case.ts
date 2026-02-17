export type SqlKeywordCase = 'lower' | 'upper';

// SQL keywords and clause words supported by Shift6 exec-sql formatting.
export const SQL_KEYWORDS = [
  'ABS',
  'ADD',
  'AFTER',
  'ALIAS',
  'ALL',
  'ALLOCATE',
  'ALWAYS',
  'ALTER',
  'AND',
  'ANY',
  'AS',
  'ASC',
  'AUTHORIZATION',
  'BEFORE',
  'BEGIN',
  'BETWEEN',
  'BIGINT',
  'BINARY',
  'BLOB',
  'BY',
  'CACHE',
  'CALL',
  'CAST',
  'CASE',
  'CCSID',
  'CHAR',
  'CHARACTER',
  'CHECK',
  'CLOSE',
  'CLOB',
  'COALESCE',
  'COLUMN',
  'COLUMNS',
  'COMMIT',
  'CONDITION',
  'CONNECT',
  'CONNECTION',
  'CONTINUE',
  'COUNT',
  'CREATE',
  'CROSS',
  'CYCLE',
  'CUBE',
  'CURRENT',
  'CURRENT_CLIENT_ACCTNG',
  'CURRENT_CLIENT_APPLNAME',
  'CURRENT_CLIENT_CORR_TOKEN',
  'CURRENT_CLIENT_USER',
  'CURRENT_CLIENT_USERID',
  'CURRENT_CLIENT_WRKSTNNAME',
  'CURRENT_DATE',
  'CURRENT_DEGREE',
  'CURRENT_ISOLATION',
  'CURRENT_PATH',
  'CURRENT_QUERY_OPTIMIZATION',
  'CURRENT_SCHEMA',
  'CURRENT_TIME',
  'CURRENT_TIMESTAMP',
  'CURRENT_USER',
  'CURSOR',
  'DATA',
  'DATE',
  'DEC',
  'DECIMAL',
  'DECFLOAT',
  'DEALLOCATE',
  'DECLARE',
  'DEFAULT',
  'DELETE',
  'DESC',
  'DESCRIBE',
  'DIAGNOSTICS',
  'DISCONNECT',
  'DISTINCT',
  'DOUBLE',
  'DROP',
  'EACH',
  'ELSE',
  'END',
  'EXCEPT',
  'EXCLUSIVE',
  'EXECUTE',
  'EXISTS',
  'FETCH',
  'FIRST',
  'FLOAT',
  'FOREIGN',
  'FOR',
  'FROM',
  'FULL',
  'FUNCTION',
  'GENERATED',
  'GET',
  'GLOBAL',
  'GO',
  'GOTO',
  'GRAPHIC',
  'GROUP',
  'GRANT',
  'HANDLER',
  'HAVING',
  'HOLD',
  'IDENTITY',
  'IF',
  'IMMEDIATE',
  'IN',
  'INCREMENT',
  'INCLUDE',
  'INDEX',
  'INNER',
  'INSENSITIVE',
  'INSERT',
  'INT',
  'INTEGER',
  'INTERSECT',
  'INTO',
  'IS',
  'ISOLATION',
  'JOIN',
  'JSON_ARRAY',
  'JSON_OBJECT',
  'JSON_TABLE',
  'KEY',
  'KEEP',
  'LANGUAGE',
  'LATERAL',
  'LEFT',
  'LIKE',
  'LISTAGG',
  'LOCK',
  'LOOP',
  'MATCHED',
  'MAX',
  'MERGE',
  'MIN',
  'MODE',
  'MOD',
  'NAMESPACES',
  'NEW',
  'NEXT',
  'NO',
  'NOT',
  'NULL',
  'NULLIF',
  'NULLS',
  'NUMERIC',
  'OF',
  'OLD',
  'ON',
  'ONLY',
  'OPEN',
  'OPTIMIZATION',
  'OPTION',
  'OR',
  'ORDER',
  'OUT',
  'OUTER',
  'OVER',
  'PARTITION',
  'PASSING',
  'PATH',
  'PRECEDING',
  'PREPARE',
  'PRIMARY',
  'PRIOR',
  'PROCEDURE',
  'RANK',
  'READ',
  'REAL',
  'RECURSIVE',
  'REFRESH',
  'REFERENCES',
  'REFERENCING',
  'RELEASE',
  'REPEAT',
  'REPLACE',
  'REVOKE',
  'RETURN',
  'RETURNED_SQLSTATE',
  'RETURNS',
  'RIGHT',
  'ROLLBACK',
  'ROLLUP',
  'ROUND',
  'ROW',
  'ROW_COUNT',
  'ROW_NUMBER',
  'ROWS',
  'ROWSET',
  'SAVEPOINT',
  'SCHEMA',
  'SCROLL',
  'SECTION',
  'SELECT',
  'SESSION',
  'SET',
  'SHARE',
  'SIGNAL',
  'SMALLINT',
  'SQL',
  'SQLCA',
  'SQLCODE',
  'SQLEXCEPTION',
  'SQLERROR',
  'SQLSTATE',
  'SQLWARNING',
  'SUM',
  'TABLE',
  'TEMPORARY',
  'THEN',
  'TIME',
  'TIMESTAMP',
  'TIMESTAMP_FORMAT',
  'START',
  'TO',
  'TRANSACTION',
  'TRIGGER',
  'UNBOUNDED',
  'UNION',
  'UNIQUE',
  'UPDATE',
  'USE',
  'USING',
  'VALUE',
  'VALUES',
  'VARCHAR',
  'VARCHAR_FORMAT',
  'VARGRAPHIC',
  'VIEW',
  'WHEN',
  'WHENEVER',
  'WHERE',
  'WHILE',
  'WINDOW',
  'WITH',
  'WITHIN',
  'WORK',
  'WRITE',
  'XMLAGG',
  'XMLELEMENT',
  'XMLNAMESPACES',
  'XMLPARSE',
  'XMLTABLE'
] as const;

const SQL_KEYWORD_SET = new Set<string>(SQL_KEYWORDS);

const isWordStart = (ch: string): boolean => /[A-Za-z_]/.test(ch);
const isWordChar = (ch: string): boolean => /[A-Za-z0-9_]/.test(ch);

const isHostOrQualifiedContext = (line: string, tokenStart: number, tokenEnd: number): boolean => {
  const prev = tokenStart > 0 ? line[tokenStart - 1] : '';
  if (prev === ':' || prev === '.' || prev === '/') {
    return true;
  }
  const next = tokenEnd < line.length ? line[tokenEnd] : '';
  return next === '.' || next === '/';
};

const applyCase = (text: string, keywordCase: SqlKeywordCase): string =>
  keywordCase === 'upper' ? text.toUpperCase() : text.toLowerCase();

interface LineCaseResult {
  line: string;
  inBlockComment: boolean;
}

const applySqlKeywordCasingToLine = (
  line: string,
  keywordCase: SqlKeywordCase,
  initialBlockComment: boolean
): LineCaseResult => {
  let out = '';
  let i = 0;
  let inString = false;
  let quoteChar = '';
  let inBlockComment = initialBlockComment;

  while (i < line.length) {
    if (inBlockComment) {
      const closeIndex = line.indexOf('*/', i);
      if (closeIndex < 0) {
        out += line.slice(i);
        return { line: out, inBlockComment: true };
      }
      out += line.slice(i, closeIndex + 2);
      i = closeIndex + 2;
      inBlockComment = false;
      continue;
    }

    const ch = line[i];
    const next = i + 1 < line.length ? line[i + 1] : '';

    if (inString) {
      out += ch;
      if (ch === quoteChar) {
        if (next === quoteChar) {
          out += next;
          i += 2;
          continue;
        }
        inString = false;
        quoteChar = '';
      }
      i++;
      continue;
    }

    if (ch === '\'' || ch === '"') {
      inString = true;
      quoteChar = ch;
      out += ch;
      i++;
      continue;
    }

    if (ch === '-' && next === '-') {
      out += line.slice(i);
      return { line: out, inBlockComment };
    }

    if (ch === '/' && next === '*') {
      inBlockComment = true;
      out += '/*';
      i += 2;
      continue;
    }

    if (!isWordStart(ch)) {
      out += ch;
      i++;
      continue;
    }

    let end = i + 1;
    while (end < line.length && isWordChar(line[end])) {
      end++;
    }

    const token = line.slice(i, end);
    const tokenUpper = token.toUpperCase();
    if (!isHostOrQualifiedContext(line, i, end) && SQL_KEYWORD_SET.has(tokenUpper)) {
      out += applyCase(token, keywordCase);
    } else {
      out += token;
    }
    i = end;
  }

  return { line: out, inBlockComment };
};

// Apply keyword case conversion to SQL text lines while preserving strings/comments.
export const applySqlKeywordCasing = (
  lines: string[],
  keywordCase: SqlKeywordCase
): string[] => {
  const out: string[] = [];
  let inBlockComment = false;
  for (const line of lines) {
    const result = applySqlKeywordCasingToLine(line, keywordCase, inBlockComment);
    out.push(result.line);
    inBlockComment = result.inBlockComment;
  }
  return out;
};

export const getExecSqlPrefix = (keywordCase: SqlKeywordCase): string =>
  keywordCase === 'upper' ? 'EXEC SQL' : 'exec sql';
