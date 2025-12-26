import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-exec-immediate-using',
  input: [
    '**free',
    'exec sql execute immediate :stmt using :a,:b;',
    'end-exec;',
    'exec sql set connection RESET;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'execute immediate',
    ':stmt',
    'using',
    ':a,',
    ':b;',
    'set connection RESET;'
  ]
};

export default testCase;
