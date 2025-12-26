import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-group-by-rollup',
  input: [
    '**free',
    'exec sql select ID,sum(AMOUNT) from SALES/ORDERS group by rollup(ID), cube(REGION,TYPE);',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'group by',
    'rollup(ID),',
    'cube(REGION,TYPE);'
  ]
};

export default testCase;
