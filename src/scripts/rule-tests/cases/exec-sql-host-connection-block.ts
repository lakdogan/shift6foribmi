import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-host-connection-block',
  input: [
    '**free',
    'exec sql declare section;',
    'dcl-s custId int(10);',
    'exec sql end declare section;',
    'exec sql include sqlca;',
    'exec sql whenever sqlerror goto ErrLabel;',
    'exec sql connect to LOCAL user :u using :p;',
    'end-exec;',
    'exec sql set connection CURRENT;',
    'end-exec;',
    'exec sql disconnect ALL;',
    'end-exec;',
    'exec sql release CURRENT;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'declare section;',
    'end declare section;',
    'include sqlca;',
    'whenever sqlerror goto ErrLabel;',
    'connect to LOCAL user :u using :p;',
    'set connection CURRENT;',
    'disconnect ALL;',
    'release CURRENT;'
  ]
};

export default testCase;
