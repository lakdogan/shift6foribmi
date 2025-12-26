import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-connection',
  input: [
    '**free',
    'exec sql connect to LOCAL;',
    'end-exec;',
    'exec sql set connection CURRENT;',
    'end-exec;',
    'exec sql disconnect current;',
    'end-exec;',
    'exec sql release;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'connect to LOCAL;',
    'set connection CURRENT;',
    'disconnect current;',
    'release;'
  ]
};

export default testCase;
