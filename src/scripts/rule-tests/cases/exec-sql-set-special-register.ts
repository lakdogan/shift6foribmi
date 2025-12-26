import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-set-special-register',
  input: [
    '**free',
    'exec sql set current date = CURRENT_DATE;',
    'end-exec;',
    'exec sql set current schema = MYLIB;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'set current date = CURRENT_DATE;',
    'set current schema = MYLIB;'
  ]
};

export default testCase;
