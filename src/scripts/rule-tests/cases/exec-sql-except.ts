import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-except',
  input: [
    '**free',
    'exec sql select ID from T1 except select ID from T2;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'select',
    'from T1',
    'except',
    'from T2;'
  ]
};

export default testCase;
