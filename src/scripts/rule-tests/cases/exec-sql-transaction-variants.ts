import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-transaction-variants',
  input: [
    '**free',
    'exec sql commit work;',
    'end-exec;',
    'exec sql rollback work;',
    'end-exec;',
    'exec sql commit;',
    'end-exec;',
    'exec sql rollback;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'commit work;',
    'rollback work;',
    'commit;',
    'rollback;'
  ]
};

export default testCase;
