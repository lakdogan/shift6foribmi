import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-whenever-goto',
  input: [
    '**free',
    'exec sql whenever sqlerror goto ErrLabel;',
    'exec sql whenever sqlwarning go to WarnLabel;',
    'exec sql whenever not found goto EndLabel;'
  ].join('\n'),
  mustInclude: [
    'whenever sqlerror goto ErrLabel;',
    'whenever sqlwarning go to WarnLabel;',
    'whenever not found goto EndLabel;'
  ]
};

export default testCase;
