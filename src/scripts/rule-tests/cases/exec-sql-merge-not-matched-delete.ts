import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-merge-not-matched-delete',
  input: [
    '**free',
    'exec sql merge into SALES/CUSTOMER C using SALES/STAGING S on C.ID=S.ID when not matched by source then delete;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'when not matched by source then',
    'delete'
  ]
};

export default testCase;
