import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-values',
  input: [
    '**free',
    'exec sql values (1,\'A\'),(2,\'B\');',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'values',
    "(1, 'A'),",
    "(2, 'B');"
  ]
};

export default testCase;
