import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-diagnostics-session',
  input: [
    '**free',
    'exec sql get diagnostics :rows = row_count, :state = returned_sqlstate, :msg = message_text;',
    'end-exec;',
    'exec sql set current isolation = *cs;',
    'end-exec;',
    'exec sql set session authorization = :user;',
    'end-exec;',
    'exec sql set session current path = MYLIB, QSYS;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'get diagnostics',
    ':rows = row_count,',
    ':state = returned_sqlstate,',
    ':msg = message_text;',
    'set current isolation = *cs;',
    'set session authorization = :user;',
    'set session current path = MYLIB, QSYS;'
  ]
};

export default testCase;
