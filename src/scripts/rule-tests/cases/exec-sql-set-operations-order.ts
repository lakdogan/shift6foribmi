import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-set-operations-order',
  input: [
    '**free',
    'exec sql select ID from SALES/CUSTOMER union select ID from SALES/ARCHIVE order by ID fetch first 5 rows only;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'union',
    'order by',
    'fetch first 5 rows only;'
  ]
};

export default testCase;
