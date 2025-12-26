import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-merge-advanced',
  input: [
    '**free',
    'exec sql merge into SALES/CUSTOMER C using SALES/STAGING S on C.ID = S.ID when not matched by source and C.ACTIVE = 1 then update set C.STATUS = \'I\';',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'merge into SALES/CUSTOMER C',
    'when not matched by source and C.ACTIVE = 1 then',
    'update',
    'set',
    'C.STATUS = \'I\''
  ]
};

export default testCase;
