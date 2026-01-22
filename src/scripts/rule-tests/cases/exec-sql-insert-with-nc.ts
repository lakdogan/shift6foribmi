import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-insert-with-nc',
  input: [
    '**free',
    'exec sql insert into MYLIB/MYFILE (A,B,C) values ( :a, :b, :c ) with nc;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'insert into MYLIB/MYFILE (',
    'A,',
    'B,',
    'C',
    'values (',
    ':a,',
    ':b,',
    ':c',
    ') with nc;'
  ],
  mustExclude: [
    'values ( :a'
  ]
};

export default testCase;
