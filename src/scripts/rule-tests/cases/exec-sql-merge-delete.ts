import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-merge-delete',
  input: [
    '**free',
    'exec sql merge into SALES/CUSTOMER C using SALES/STAGING S on C.ID=S.ID when matched then delete when not matched then insert (ID,NAME) values (S.ID,S.NAME);',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'merge into SALES/CUSTOMER C',
    'using SALES/STAGING S',
    'on C.ID = S.ID',
    'when matched then',
    'delete',
    'when not matched then',
    'insert (',
    'ID,',
    'NAME',
    'values (',
    'S.ID,',
    'S.NAME',
    ');'
  ]
};

export default testCase;
