import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-merge',
  input: [
    '**free',
    'exec sql merge into SALES/CUSTOMER C using SALES/STAGING S on C.ID=S.ID when matched then update set C.STATUS=\'A\' when not matched then insert (ID,NAME,STATUS) values (S.ID,S.NAME,\'A\');',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'merge into SALES/CUSTOMER C',
    'using SALES/STAGING S',
    'on C.ID = S.ID',
    'when matched then',
    'update',
    'set',
    'C.STATUS = \'A\'',
    'when not matched then',
    'insert (',
    'ID,',
    'NAME,',
    'STATUS',
    'values (',
    'S.ID,',
    'S.NAME,',
    '\'A\'',
    ');'
  ]
};

export default testCase;
