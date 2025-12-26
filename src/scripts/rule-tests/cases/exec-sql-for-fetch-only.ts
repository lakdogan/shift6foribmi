import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-for-fetch-only',
  input: [
    '**free',
    'exec sql select ID from SALES/CUSTOMER for fetch only;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'select',
    'ID',
    'from SALES/CUSTOMER',
    'fetch only;'
  ]
};

export default testCase;
