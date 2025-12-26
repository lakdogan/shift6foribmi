import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-set-session',
  input: [
    '**free',
    'exec sql set session authorization = :user;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'set session authorization = :user;'
  ]
};

export default testCase;
