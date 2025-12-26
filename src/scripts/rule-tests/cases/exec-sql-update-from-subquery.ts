import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-update-from-subquery',
  input: [
    '**free',
    'exec sql update SALES/CUSTOMER C set CREDIT = (select max(AMOUNT) from SALES/ORDERS O where O.CUST_ID = C.ID) where C.STATUS = \'A\';',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'update SALES/CUSTOMER C',
    'set',
    'CREDIT = (select max(AMOUNT) from SALES/ORDERS O where O.CUST_ID = C.ID)',
    'where C.STATUS = \'A\';'
  ]
};

export default testCase;
