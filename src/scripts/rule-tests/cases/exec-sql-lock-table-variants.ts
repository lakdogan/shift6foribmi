import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-lock-table-variants',
  input: [
    '**free',
    'exec sql lock table SALES/CUSTOMER in share mode;',
    'end-exec;',
    'exec sql lock table SALES/ORDERS in exclusive mode;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'lock table SALES/CUSTOMER in share mode;',
    'lock table SALES/ORDERS in exclusive mode;'
  ]
};

export default testCase;
