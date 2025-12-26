import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-for-read-only',
  input: [
    '**free',
    'exec sql select ID from SALES/CUSTOMER for read only;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'select',
    'ID',
    'from SALES/CUSTOMER',
    'for read only;'
  ]
};

export default testCase;
