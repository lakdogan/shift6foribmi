import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-join-dedup',
  input: [
    '**free',
    'exec sql select C.ID,O.ID from SALES/CUSTOMER C left join SALES/ORDERS O',
    'on C.ID=O.CUST_ID inner join SALES/STATUS S on S.ID=C.STATUS_ID',
    'group by C.ID,C.NAME having sum(O.AMOUNT)>0 order by C.NAME',
    'offset 10 rows fetch first 5 rows only for update of NAME,STATUS;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'left join SALES/ORDERS O on C.ID = O.CUST_ID',
    'inner join SALES/STATUS S on S.ID = C.STATUS_ID',
    'group by',
    'having sum(O.AMOUNT) > 0',
    'order by'
  ],
  mustExclude: [
    'left join SALES/ORDERS O on C.ID = O.CUST_ID inner join SALES/STATUS S on S.ID = C.STATUS_ID'
  ]
};

export default testCase;
