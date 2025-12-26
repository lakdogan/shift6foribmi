import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-set-current',
  input: [
    '**free',
    'exec sql set current schema = MYLIB;',
    'end-exec;',
    'exec sql set current path = MYLIB, QSYS;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'set current schema = MYLIB;',
    'set current path = MYLIB, QSYS;'
  ]
};

export default testCase;
