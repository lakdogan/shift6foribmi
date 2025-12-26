import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-exec-immediate-into',
  input: [
    '**free',
    'exec sql execute immediate :stmt into :id,:name using :status;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'execute immediate',
    ':stmt',
    'into',
    ':id,',
    ':name',
    'using',
    ':status;'
  ]
};

export default testCase;
