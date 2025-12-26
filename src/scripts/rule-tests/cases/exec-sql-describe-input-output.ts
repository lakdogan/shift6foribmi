import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-describe-input-output',
  input: [
    '**free',
    'exec sql describe input S1 into :inDesc;',
    'end-exec;',
    'exec sql describe output S1 into :outDesc;',
    'end-exec;',
    'exec sql describe s1;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'describe input S1 into :inDesc;',
    'describe output S1 into :outDesc;',
    'describe s1;'
  ]
};

export default testCase;
