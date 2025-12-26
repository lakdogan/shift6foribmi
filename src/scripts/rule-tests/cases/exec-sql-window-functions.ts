import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-window-functions',
  input: [
    '**free',
    'exec sql select row_number() over(partition by C.ID order by O.AMOUNT desc) as RN, rank() over(order by O.AMOUNT) as RK, sum(O.AMOUNT) over(partition by C.ID) as TOTAL from SALES/ORDERS O join SALES/CUSTOMER C on C.ID = O.CUST_ID;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'row_number() over(partition by C.ID order by O.AMOUNT desc) as RN',
    'rank() over(order by O.AMOUNT) as RK',
    'sum(O.AMOUNT) over(partition by C.ID) as TOTAL',
    'join SALES/CUSTOMER C on C.ID = O.CUST_ID'
  ]
};

export default testCase;
