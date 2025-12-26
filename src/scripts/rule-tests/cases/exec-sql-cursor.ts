import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-cursor',
  input: [
    '**free',
    'exec sql declare C1 cursor for select ID,NAME from SALES/CUSTOMER where STATUS=\'A\';',
    'end-exec;',
    'exec sql open C1;',
    'end-exec;',
    'exec sql fetch C1 into :custId,:custName;',
    'end-exec;',
    'exec sql close C1;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'declare C1 cursor for',
    'select',
    'ID,',
    'NAME',
    'from SALES/CUSTOMER',
    'where STATUS = \'A\';',
    'open C1;',
    'fetch C1',
    'into',
    ':custId,',
    ':custName;',
    'close C1;'
  ]
};

export default testCase;
