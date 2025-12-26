import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-cte-union',
  input: [
    '**free',
    'exec sql with Active as (select ID,NAME from SALES/CUSTOMER where STATUS=\'A\')',
    'select ID,NAME from Active union all select ID,NAME from SALES/ARCHIVE;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'with',
    'select',
    'ID,',
    'NAME',
    'from SALES/CUSTOMER',
    'where STATUS = \'A\'',
    'union all',
    'from SALES/ARCHIVE;'
  ]
};

export default testCase;
