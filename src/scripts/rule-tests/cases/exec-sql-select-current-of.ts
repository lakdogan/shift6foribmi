import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-select-current-of',
  input: [
    '**free',
    'exec sql select ID from SALES/CUSTOMER where current of C1;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'select',
    'ID',
    'from SALES/CUSTOMER',
    'where current of C1;'
  ]
};

export default testCase;
