import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-joins',
  input: [
    '**free',
    'exec sql select C.ID,O.ID from SALES/CUSTOMER C left join SALES/ORDERS O on C.ID=O.CUST_ID inner join SALES/STATUS S on S.ID=C.STATUS_ID;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'from SALES/CUSTOMER C',
    'left join SALES/ORDERS O on C.ID = O.CUST_ID',
    'inner join SALES/STATUS S on S.ID = C.STATUS_ID'
  ]
};

export default testCase;
