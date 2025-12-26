import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-call-with-params',
  input: [
    '**free',
    'exec sql call SALES/PROC_A(:a,:b,:c);',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'call SALES/PROC_A(',
    ':a,',
    ':b,',
    ':c',
    ');'
  ]
};

export default testCase;
