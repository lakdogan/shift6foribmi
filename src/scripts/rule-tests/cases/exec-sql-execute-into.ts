import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-execute-into',
  input: [
    '**free',
    'exec sql execute S1 into :id,:name using :status;',
    'end-exec;',
    'exec sql execute S2 into :count;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'execute S1',
    'into',
    ':id,',
    ':name',
    'using',
    ':status;',
    'execute S2',
    'into',
    ':count;'
  ]
};

export default testCase;
