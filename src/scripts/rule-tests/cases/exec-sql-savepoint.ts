import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-savepoint',
  input: [
    '**free',
    'exec sql savepoint S1;',
    'end-exec;',
    'exec sql rollback to savepoint S1;',
    'end-exec;',
    'exec sql release savepoint S1;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'savepoint S1;',
    'rollback to savepoint S1;',
    'release savepoint S1;'
  ]
};

export default testCase;
