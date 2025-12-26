import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-intersect',
  input: [
    '**free',
    'exec sql select ID from T1 intersect select ID from T2;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'select',
    'from T1',
    'intersect',
    'from T2;'
  ]
};

export default testCase;
