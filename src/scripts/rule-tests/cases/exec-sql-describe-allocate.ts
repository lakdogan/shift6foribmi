import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-describe-allocate',
  input: [
    '**free',
    'exec sql describe S1 into :desc;',
    'end-exec;',
    'exec sql allocate desc cursor for :stmt;',
    'end-exec;',
    'exec sql deallocate desc;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'describe S1 into :desc;',
    'allocate desc cursor for :stmt;',
    'deallocate desc;'
  ]
};

export default testCase;
