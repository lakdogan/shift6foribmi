import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-set-connection-reset',
  input: [
    '**free',
    'exec sql set connection RESET;',
    'end-exec;',
    'exec sql connect reset;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'set connection RESET;',
    'connect reset;'
  ]
};

export default testCase;
