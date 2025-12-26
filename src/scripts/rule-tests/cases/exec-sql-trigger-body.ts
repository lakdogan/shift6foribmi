import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-trigger-body',
  input: [
    '**free',
    'exec sql create trigger TR1 after insert on SALES/CUSTOMER referencing new as N for each row begin set N.STATUS = \'A\'; end;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'create trigger TR1',
    'referencing new as N',
    'for each row',
    'begin',
    'set N.STATUS = \'A\';',
    'end;'
  ]
};

export default testCase;
