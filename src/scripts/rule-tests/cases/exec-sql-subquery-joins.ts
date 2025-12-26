import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-subquery-joins',
  input: [
    '**free',
    'exec sql select X.ID, O.ID from (select C.ID from SALES/CUSTOMER C where C.STATUS = \'A\') X left join SALES/ORDERS O on X.ID = O.CUST_ID where exists (select 1 from SALES/ORDERS OO where OO.CUST_ID = X.ID);',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'from (select C.ID from SALES/CUSTOMER C where C.STATUS = \'A\') X',
    'left join SALES/ORDERS O on X.ID = O.CUST_ID',
    'where exists (select 1 from SALES/ORDERS OO where OO.CUST_ID = X.ID)'
  ]
};

export default testCase;
