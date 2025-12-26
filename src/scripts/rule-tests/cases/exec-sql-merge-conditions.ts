import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-merge-conditions',
  input: [
    '**free',
    'exec sql merge into SALES/CUSTOMER C using SALES/STAGING S on C.ID=S.ID when matched and C.STATUS=\'I\' then delete when matched and C.STATUS=\'A\' then update set C.CREDIT=S.CREDIT when not matched by target and S.ACTIVE=1 then insert (ID,STATUS) values (S.ID,\'A\');',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'when matched and C.STATUS = \'I\' then',
    'delete',
    'when matched and C.STATUS = \'A\' then',
    'update',
    'set',
    'C.CREDIT = S.CREDIT',
    'when not matched by target and S.ACTIVE = 1 then',
    'insert (',
    'ID,',
    'STATUS',
    'values (',
    'S.ID,',
    '\'A\'',
    ');'
  ]
};

export default testCase;
