import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-fetch-rowset',
  input: [
    '**free',
    'exec sql fetch next rowset from C1 for 10 rows into :ids;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'fetch next rowset from C1 for 10 rows',
    'into',
    ':ids;'
  ]
};

export default testCase;
