import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-set-session-current',
  input: [
    '**free',
    'exec sql set session current schema = MYLIB;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'set session current schema = MYLIB;'
  ]
};

export default testCase;
