import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-whenever',
  input: [
    '**free',
    'exec sql whenever sqlerror goto ErrLabel;',
    'exec sql whenever not found continue;',
    'exec sql whenever sqlwarning go to WarnLabel;',
    'exec sql include sqlca;',
    'exec sql include sqlda;'
  ].join('\n'),
  mustInclude: [
    'whenever sqlerror goto ErrLabel;',
    'whenever not found continue;',
    'whenever sqlwarning go to WarnLabel;',
    'include sqlca;',
    'include sqlda;'
  ]
};

export default testCase;
