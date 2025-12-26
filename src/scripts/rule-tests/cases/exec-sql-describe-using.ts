import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-describe-using',
  input: [
    '**free',
    'exec sql describe S1 using descriptor :desc;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'describe S1 using descriptor :desc;'
  ]
};

export default testCase;
