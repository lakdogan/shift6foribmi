import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-update-variants',
  input: [
    '**free',
    'exec sql update SALES/CUSTOMER set NAME=:custName from SALES/ORDERS O where CUSTOMER.ID=O.CUST_ID;',
    'end-exec;',
    'exec sql update SALES/CUSTOMER set STATUS=\'A\' where current of C1;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'update SALES/CUSTOMER',
    'set',
    'NAME = :custName',
    'from SALES/ORDERS O',
    'where CUSTOMER.ID = O.CUST_ID;',
    'where current of C1;'
  ]
};

export default testCase;
