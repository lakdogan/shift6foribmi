import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-select-clauses',
  input: [
    '**free',
    'exec sql select C.ID,C.NAME,sum(O.AMOUNT) from SALES/CUSTOMER C join SALES/ORDERS O on C.ID=O.CUST_ID where C.STATUS=\'A\' group by C.ID,C.NAME having sum(O.AMOUNT)>0 order by C.NAME fetch first 5 rows only for update;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'select',
    'C.ID,',
    'C.NAME,',
    'sum(O.AMOUNT)',
    'from SALES/CUSTOMER C',
    'join SALES/ORDERS O on C.ID = O.CUST_ID',
    'where C.STATUS = \'A\'',
    'group by',
    'C.ID,',
    'C.NAME',
    'having sum(O.AMOUNT) > 0',
    'order by',
    'C.NAME',
    'fetch first 5 rows only',
    'for update;'
  ]
};

export default testCase;
