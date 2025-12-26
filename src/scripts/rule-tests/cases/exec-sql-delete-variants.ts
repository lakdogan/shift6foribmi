import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-delete-variants',
  input: [
    '**free',
    'exec sql delete from SALES/CUSTOMER using SALES/ORDERS O where CUSTOMER.ID=O.CUST_ID;',
    'end-exec;',
    'exec sql delete from SALES/CUSTOMER where current of C1;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'delete from SALES/CUSTOMER',
    'using SALES/ORDERS O',
    'where CUSTOMER.ID = O.CUST_ID;',
    'where current of C1;'
  ]
};

export default testCase;
