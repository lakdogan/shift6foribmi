import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-open-using',
  input: [
    '**free',
    'exec sql open C1 using :a,:b;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'open C1',
    'using',
    ':a,',
    ':b;'
  ]
};

export default testCase;
