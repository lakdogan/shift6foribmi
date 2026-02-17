import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-keyword-case-upper',
  input: [
    '**free',
    "exec sql select id, name from SALES/CUSTOMER where status='A' fetch first 1 rows only;",
    'end-exec;',
    'exec sql',
    'set current schema = MYLIB;',
    'end-exec;'
  ].join('\n'),
  config: {
    execSqlKeywordCase: 'upper'
  },
  mustInclude: [
    'EXEC SQL',
    'SELECT',
    'FROM SALES/CUSTOMER',
    "WHERE status = 'A'",
    'FETCH FIRST 1 ROWS ONLY;',
    'EXEC SQL SET CURRENT SCHEMA = MYLIB;'
  ],
  mustExclude: [
    'exec sql select',
    'set current schema = MYLIB;'
  ]
};

export default testCase;
