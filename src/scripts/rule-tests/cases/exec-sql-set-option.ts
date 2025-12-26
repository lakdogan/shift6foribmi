import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-set-option',
  input: [
    '**free',
    'exec sql set option commit = *cs, closqlcsr = *endmod;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'set option commit = * cs, closqlcsr = * endmod;'
  ]
};

export default testCase;
