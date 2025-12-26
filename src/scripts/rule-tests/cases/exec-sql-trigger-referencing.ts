import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-trigger-referencing',
  input: [
    '**free',
    'exec sql create trigger TR2 before update on SALES/CUSTOMER referencing old as O new as N for each row begin set N.STATUS = \'A\'; set O.STATUS = \'B\'; end;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'create trigger TR2',
    'referencing old as O new as N',
    'for each row',
    'begin',
    'set N.STATUS = \'A\';',
    'set O.STATUS = \'B\';',
    'end;'
  ]
};

export default testCase;
