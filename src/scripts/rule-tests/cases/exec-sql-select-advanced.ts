import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-select-advanced',
  input: [
    '**free',
    'exec sql select C.ID, case when C.STATUS = \'A\' then \'ACTIVE\' else \'INACTIVE\' end as STATUS_DESC, case C.TYPE when \'A\' then \'X\' else \'Y\' end as TYPE_DESC, coalesce(C.NAME, \'N/A\') as NAME1, nullif(C.CODE, \'\') as CODE1 from SALES/CUSTOMER C left join lateral (select O.CUST_ID, sum(O.AMOUNT) as TOTAL from SALES/ORDERS O where O.CUST_ID = C.ID group by O.CUST_ID) X on X.CUST_ID = C.ID cross apply (select 1 as FLAG from SYSIBM/SYSDUMMY1) Y outer apply (select 2 as FLAG2 from SYSIBM/SYSDUMMY1) Z where exists (select 1 from SALES/ORDERS O where O.CUST_ID = C.ID) and C.ID in (select CUST_ID from SALES/ORDERS) and C.AMOUNT > all (select AMOUNT from SALES/ORDERS) and C.AMOUNT >= any (select AMOUNT from SALES/ORDERS) window W as (partition by C.STATUS order by C.ID);',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'select',
    'case when C.STATUS = \'A\' then \'ACTIVE\' else \'INACTIVE\' end as STATUS_DESC',
    'case C.TYPE when \'A\' then \'X\' else \'Y\' end as TYPE_DESC',
    'coalesce(C.NAME, \'N/A\') as NAME1',
    'nullif(C.CODE, \'\') as CODE1',
    'from SALES/CUSTOMER C',
    'left join lateral (select O.CUST_ID, sum(O.AMOUNT) as TOTAL from SALES/ORDERS O where O.CUST_ID = C.ID group by O.CUST_ID) X on X.CUST_ID = C.ID',
    'cross apply (select 1 as FLAG from SYSIBM/SYSDUMMY1) Y',
    'outer apply (select 2 as FLAG2 from SYSIBM/SYSDUMMY1) Z',
    'where',
    'exists (select 1 from SALES/ORDERS O where O.CUST_ID = C.ID)',
    'and C.ID in (select CUST_ID from SALES/ORDERS)',
    'and C.AMOUNT > all (select AMOUNT from SALES/ORDERS)',
    'and C.AMOUNT >= any (select AMOUNT from SALES/ORDERS)',
    'window W as (partition by C.STATUS order by C.ID);'
  ]
};

export default testCase;
