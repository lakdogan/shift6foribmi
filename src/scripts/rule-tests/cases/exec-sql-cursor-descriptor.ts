import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-cursor-descriptor',
  input: [
    '**free',
    'exec sql fetch C1 using descriptor :desc;',
    'end-exec;',
    'exec sql describe input S1 using descriptor :inDesc;',
    'end-exec;',
    'exec sql describe output S1 using descriptor :outDesc;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'fetch C1',
    'using descriptor :desc;',
    'describe input S1 using descriptor :inDesc;',
    'describe output S1 using descriptor :outDesc;'
  ]
};

export default testCase;
