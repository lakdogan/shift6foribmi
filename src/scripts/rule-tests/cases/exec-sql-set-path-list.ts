import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-set-path-list',
  input: [
    '**free',
    'exec sql set current path = MYLIB, QSYS2, QSYS;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'set current path = MYLIB, QSYS2, QSYS;'
  ]
};

export default testCase;
