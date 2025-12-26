import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-set-current-options',
  input: [
    '**free',
    'exec sql set current isolation = *cs;',
    'end-exec;',
    'exec sql set current degree = 2;',
    'end-exec;',
    'exec sql set current path = MYLIB, QSYS;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'set current isolation = * cs;',
    'set current degree = 2;',
    'set current path = MYLIB, QSYS;'
  ]
};

export default testCase;
