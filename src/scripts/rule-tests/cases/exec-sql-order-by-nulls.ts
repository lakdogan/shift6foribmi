import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-order-by-nulls',
  input: [
    '**free',
    'exec sql select ID from SALES/CUSTOMER order by NAME desc nulls last, ID asc;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'order by',
    'NAME desc nulls last,',
    'ID asc;'
  ]
};

export default testCase;
