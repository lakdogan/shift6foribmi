import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-declare-cursor-options',
  input: [
    '**free',
    'exec sql declare C1 scroll cursor with hold for select ID from SALES/CUSTOMER;',
    'end-exec;',
    'exec sql declare C2 insensitive cursor for select ID from SALES/CUSTOMER;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'declare C1 scroll cursor with hold for',
    'declare C2 insensitive cursor for',
    'select',
    'from SALES/CUSTOMER'
  ]
};

export default testCase;
