import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-cte-multi',
  input: [
    '**free',
    'exec sql with A as (select ID from T1), B as (select ID from T2) select ID from A intersect select ID from B;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'with',
    'A as (',
    'select',
    'from T1',
    ')',
    'B as (',
    'from T2',
    'intersect',
    'from B;'
  ]
};

export default testCase;
