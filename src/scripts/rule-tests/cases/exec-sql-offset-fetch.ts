import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-offset-fetch',
  input: [
    '**free',
    'exec sql select ID from SALES/CUSTOMER order by ID offset 10 rows fetch first 5 rows only;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'select',
    'ID',
    'from SALES/CUSTOMER',
    'order by',
    'ID',
    'offset 10 rows',
    'fetch first 5 rows only;'
  ]
};

export default testCase;
