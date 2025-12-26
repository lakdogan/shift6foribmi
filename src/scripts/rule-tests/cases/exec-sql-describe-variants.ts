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
    'describe input s1 into :indesc;',
    'describe output s1 into :outdesc;',
    'allocate c1 cursor for :stmt;'
  ]
};

export default testCase;
