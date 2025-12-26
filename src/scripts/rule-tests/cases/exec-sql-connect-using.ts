import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-connect-using',
  input: [
    '**free',
    'exec sql connect to LOCAL user :u using :p;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'connect to LOCAL user :u using :p;'
  ]
};

export default testCase;
