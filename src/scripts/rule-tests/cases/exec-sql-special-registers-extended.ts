import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-special-registers-extended',
  input: [
    '**free',
    'exec sql values current date, current time, current timestamp;',
    'end-exec;',
    'exec sql set current client_user = \'API\';',
    'end-exec;',
    'exec sql set current timezone = \'UTC\';',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'current date',
    'current time',
    'current timestamp',
    'set current client_user = \'API\';',
    'set current timezone = \'UTC\';'
  ]
};

export default testCase;
