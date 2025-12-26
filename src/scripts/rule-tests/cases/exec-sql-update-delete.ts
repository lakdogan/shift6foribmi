import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-update-delete',
  input: [
    '**free',
    'exec sql update SALES/CUSTOMER set NAME=:custName,STATUS=\'A\' where ID=:custId;',
    'end-exec;',
    'exec sql delete from SALES/CUSTOMER where STATUS=\'I\';',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'update SALES/CUSTOMER',
    'set',
    'NAME = :custName,',
    'STATUS = \'A\'',
    'where ID = :custId;',
    'delete from SALES/CUSTOMER',
    'where STATUS = \'I\';'
  ]
};

export default testCase;
