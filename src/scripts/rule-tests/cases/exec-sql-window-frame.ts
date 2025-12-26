import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-window-frame',
  input: [
    '**free',
    'exec sql select sum(AMOUNT) over(partition by REGION order by CREATED rows between unbounded preceding and current row) as RUN_TOTAL from SALES/ORDERS;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'sum(AMOUNT) over(partition by REGION order by CREATED rows between unbounded preceding and current row) as RUN_TOTAL',
    'from SALES/ORDERS;'
  ]
};

export default testCase;
