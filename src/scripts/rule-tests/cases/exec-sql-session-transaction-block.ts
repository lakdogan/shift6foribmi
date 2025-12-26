import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-session-transaction-block',
  input: [
    '**free',
    'exec sql set option commit = *cs, closqlcsr = *endmod;',
    'end-exec;',
    'exec sql set current schema = MYLIB;',
    'end-exec;',
    'exec sql set current isolation = *cs;',
    'end-exec;',
    'exec sql set session authorization = :user;',
    'end-exec;',
    'exec sql set transaction isolation level *cs;',
    'end-exec;',
    'exec sql savepoint S1;',
    'end-exec;',
    'exec sql rollback to savepoint S1;',
    'end-exec;',
    'exec sql release savepoint S1;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'set option commit = * cs, closqlcsr = * endmod;',
    'set current schema = MYLIB;',
    'set current isolation = * cs;',
    'set session authorization = :user;',
    'set transaction isolation level * cs;',
    'savepoint S1;',
    'rollback to savepoint S1;',
    'release savepoint S1;'
  ]
};

export default testCase;
