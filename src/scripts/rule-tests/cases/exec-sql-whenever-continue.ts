import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-whenever-continue',
  input: [
    '**free',
    'exec sql whenever sqlerror continue;',
    'exec sql whenever sqlwarning continue;',
    'exec sql whenever not found continue;'
  ].join('\n'),
  mustInclude: [
    'whenever sqlerror continue;',
    'whenever sqlwarning continue;',
    'whenever not found continue;'
  ]
};

export default testCase;
