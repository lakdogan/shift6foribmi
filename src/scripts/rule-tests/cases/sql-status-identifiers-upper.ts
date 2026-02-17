import type { Case } from '../types';

const testCase: Case = {
  name: 'sql-status-identifiers-upper',
  input: [
    '**free',
    'exec sql prepare sInsObj from :insObj;',
    'if sqlcode < 0;',
    '  return *off;',
    'endif;'
  ].join('\n'),
  config: {
    execSqlKeywordCase: 'upper'
  },
  mustInclude: [
    'EXEC SQL',
    'PREPARE sInsObj FROM',
    ':insObj;',
    'if SQLCODE < 0;'
  ],
  mustExclude: [
    'if sqlcode < 0;'
  ]
};

export default testCase;
