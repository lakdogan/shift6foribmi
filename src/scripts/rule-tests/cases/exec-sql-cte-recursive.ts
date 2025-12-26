import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-cte-recursive',
  input: [
    '**free',
    'exec sql with recursive H(ID) as (select ID from SALES/CUSTOMER where STATUS = \'A\' union all select PARENT_ID from SALES/CUSTOMER C join H on C.ID = H.ID) select ID from H;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'with recursive H(ID) as',
    'union all',
    'select ID from H;'
  ]
};

export default testCase;
