import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-delete-using-subselect',
  input: [
    '**free',
    'exec sql delete from SALES/CUSTOMER C using (select CUST_ID from SALES/ORDERS where AMOUNT > 100) X where C.ID = X.CUST_ID;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'delete from SALES/CUSTOMER C',
    'using (select CUST_ID from SALES/ORDERS where AMOUNT > 100) X',
    'where C.ID = X.CUST_ID;'
  ]
};

export default testCase;
