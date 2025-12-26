import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-select-edge-variants',
  input: [
    '**free',
    'exec sql select ID from SALES/CUSTOMER for read only;',
    'end-exec;',
    'exec sql select ID from SALES/CUSTOMER for fetch only;',
    'end-exec;',
    'exec sql select ID from SALES/CUSTOMER for update of NAME,STATUS;',
    'end-exec;',
    'exec sql select ID from SALES/CUSTOMER order by NAME desc nulls last, ID asc offset 10 rows fetch first 5 rows only;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'for read only;',
    'fetch only;',
    'for update of',
    'NAME,',
    'STATUS;',
    'order by',
    'NAME desc nulls last,',
    'ID asc',
    'offset 10 rows',
    'fetch first 5 rows only;'
  ]
};

export default testCase;
