import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-having-logic',
  input: [
    '**free',
    'exec sql select ID,sum(AMOUNT) from SALES/ORDERS group by ID having sum(AMOUNT)>100 and count(*)>1;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'having',
    'sum(AMOUNT) > 100',
    'and count(*) > 1;'
  ]
};

export default testCase;
