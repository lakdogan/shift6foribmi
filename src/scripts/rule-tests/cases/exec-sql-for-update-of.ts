import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-for-update-of',
  input: [
    '**free',
    'exec sql select ID,NAME from SALES/CUSTOMER for update of NAME,STATUS;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'select',
    'ID,',
    'NAME',
    'from SALES/CUSTOMER',
    'for update of',
    'NAME,',
    'STATUS;'
  ]
};

export default testCase;
