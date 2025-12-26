import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-values-into',
  input: [
    '**free',
    'exec sql values (1,\'A\') into :id,:status;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'values (',
    '1,',
    '\'A\'',
    ')',
    'into',
    ':id,',
    ':status;'
  ]
};

export default testCase;
