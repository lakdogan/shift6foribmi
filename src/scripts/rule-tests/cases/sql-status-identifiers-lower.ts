import type { Case } from '../types';

const testCase: Case = {
  name: 'sql-status-identifiers-lower',
  input: [
    '**free',
    'if SQLCODE = 100;',
    '  return *off;',
    'endif;',
    'if SQLSTATE <> \'00000\';',
    '  return *off;',
    'endif;'
  ].join('\n'),
  config: {
    execSqlKeywordCase: 'lower'
  },
  mustInclude: [
    'if sqlcode = 100;',
    "if sqlstate <> '00000';"
  ],
  mustExclude: [
    'if SQLCODE = 100;',
    "if SQLSTATE <> '00000';"
  ]
};

export default testCase;
