import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-describe-variants',
  input: [
    '**free',
    'exec sql describe input S1 into :inDesc;',
    'end-exec;',
    'exec sql describe output S1 into :outDesc;',
    'end-exec;',
    'exec sql allocate C1 cursor for :stmt;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'describe input S1 into :inDesc;',
    'describe output S1 into :outDesc;',
    'allocate C1 cursor for :stmt;'
  ]
};

export default testCase;
