import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-dml-specials',
  input: [
    '**free',
    'exec sql with Recent as (select ID from SALES/CUSTOMER where STATUS=\'A\') insert into SALES/ARCHIVE (ID) select ID from Recent;',
    'end-exec;',
    'exec sql delete from SALES/CUSTOMER using SALES/ORDERS O join SALES/ORDER_ITEMS I on I.ORDER_ID = O.ID where O.CUST_ID = SALES/CUSTOMER.ID and exists (select 1 from SALES/ORDERS O2 where O2.CUST_ID = SALES/CUSTOMER.ID);',
    'end-exec;',
    'exec sql with X as (select ID from SALES/CUSTOMER) update SALES/CUSTOMER C set STATUS=\'I\' from (select ID from X) X1 where C.ID = X1.ID;',
    'end-exec;',
    'exec sql merge into SALES/CUSTOMER C using SALES/STAGING S on C.ID = S.ID when not matched by source then delete;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'with Recent as (',
    'insert into SALES/ARCHIVE (',
    'select',
    'from Recent;',
    'delete from SALES/CUSTOMER',
    'using SALES/ORDERS O join SALES/ORDER_ITEMS I on I.ORDER_ID = O.ID',
    'where',
    'O.CUST_ID = SALES/CUSTOMER.ID',
    'and exists (select 1 from SALES/ORDERS O2 where O2.CUST_ID = SALES/CUSTOMER.ID);',
    'with X as (',
    'update SALES/CUSTOMER C',
    'set',
    'from (select ID from X) X1',
    'where C.ID = X1.ID;',
    'when not matched by source then',
    'delete;'
  ]
};

export default testCase;
