import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-call-set-commit',
  input: [
    '**free',
    'exec sql call SALES/PROC_A(:custId,:status);',
    'end-exec;',
    'exec sql set :rows = 0;',
    'end-exec;',
    'exec sql commit;',
    'end-exec;',
    'exec sql rollback;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'call SALES/PROC_A(',
    ':custId,',
    ':status',
    ');',
    'set :rows = 0;',
    'commit;',
    'rollback;'
  ]
};

export default testCase;
