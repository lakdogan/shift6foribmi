import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-cursor-block',
  input: [
    '**free',
    'exec sql declare C1 scroll cursor with hold for select ID from SALES/CUSTOMER;',
    'end-exec;',
    'exec sql open C1 using :a,:b;',
    'end-exec;',
    'exec sql fetch next rowset from C1 for 10 rows into :ids;',
    'end-exec;',
    'exec sql fetch prior from C1 into :id,:name;',
    'end-exec;',
    'exec sql close C1;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'declare C1 scroll cursor with hold for',
    'open C1',
    'using',
    ':a,',
    ':b;',
    'fetch next rowset from C1 for 10 rows',
    'fetch prior from C1',
    'into',
    ':ids;',
    'close C1;'
  ]
};

export default testCase;
