import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-dml-edge-variants',
  input: [
    '**free',
    'exec sql update SALES/CUSTOMER set STATUS=\'A\',CREDIT=CREDIT+1 from SALES/ORDERS O where CUSTOMER.ID=O.CUST_ID;',
    'end-exec;',
    'exec sql delete from SALES/CUSTOMER using SALES/ORDERS O where CUSTOMER.ID=O.CUST_ID;',
    'end-exec;',
    'exec sql merge into SALES/CUSTOMER C using SALES/STAGING S on C.ID=S.ID when matched and C.STATUS=\'I\' then delete when matched and C.STATUS=\'A\' then update set C.CREDIT=S.CREDIT when not matched by target and S.ACTIVE=1 then insert (ID,STATUS) values (S.ID,\'A\');',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'update SALES/CUSTOMER',
    'set',
    'STATUS = \'A\',',
    'CREDIT = CREDIT + 1',
    'from SALES/ORDERS O',
    'where CUSTOMER.ID = O.CUST_ID;',
    'delete from SALES/CUSTOMER',
    'using SALES/ORDERS O',
    'when matched and C.STATUS = \'I\' then',
    'delete',
    'when not matched by target and S.ACTIVE = 1 then'
  ]
};

export default testCase;
