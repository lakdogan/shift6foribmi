import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-freeform-multiline',
  input: [
    '**free',
    'exec sql',
    'select ID',
    'from SALES/CUSTOMER',
    "where STATUS <> 'A';",
    "dsply 'AFTER';"
  ].join('\n'),
  mustInclude: [
    'exec sql',
    'select',
    'from SALES/CUSTOMER',
    "where STATUS <> 'A';",
    'end-exec;',
    "dsply 'AFTER';"
  ]
};

export default testCase;
