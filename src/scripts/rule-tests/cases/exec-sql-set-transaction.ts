import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-set-transaction',
  input: [
    '**free',
    'exec sql set transaction isolation level *cs;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'set transaction isolation level *cs;'
  ]
};

export default testCase;
