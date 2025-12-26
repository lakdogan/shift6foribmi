import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-set-transaction-mode',
  input: [
    '**free',
    'exec sql set transaction read only;',
    'end-exec;',
    'exec sql set transaction read write;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'set transaction read only;',
    'set transaction read write;'
  ]
};

export default testCase;
