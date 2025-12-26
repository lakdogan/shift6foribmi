import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-lock-table',
  input: [
    '**free',
    'exec sql lock table SALES/CUSTOMER in exclusive mode;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'lock table SALES/CUSTOMER in exclusive mode;'
  ]
};

export default testCase;
