import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-select-into',
  input: [
    '**free',
    'exec sql select ID,NAME into :id,:name from SALES/CUSTOMER where STATUS=\'A\';',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'select',
    'ID,',
    'NAME',
    'into',
    ':id,',
    ':name',
    'from SALES/CUSTOMER',
    'where STATUS = \'A\';'
  ]
};

export default testCase;
