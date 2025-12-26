import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-special-registers',
  input: [
    '**free',
    'exec sql set current client_applname = \'MYAPP\';',
    'end-exec;',
    'exec sql set current query optimization = 5;',
    'end-exec;',
    'exec sql values current client_user;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'set current client_applname = \'MYAPP\';',
    'set current query optimization = 5;',
    'current client_user'
  ]
};

export default testCase;
