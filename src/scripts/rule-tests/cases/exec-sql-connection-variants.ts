import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-connection-variants',
  input: [
    '**free',
    'exec sql connect to LOCAL user :u using :p;',
    'end-exec;',
    'exec sql disconnect ALL;',
    'end-exec;',
    'exec sql release CURRENT;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'connect to LOCAL user :u using :p;',
    'disconnect all;',
    'release current;'
  ]
};

export default testCase;
