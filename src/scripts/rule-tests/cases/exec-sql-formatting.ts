import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-formatting',
  input: [
    '**free',
    'exec sql insert into SALES/CUSTOMER (ID,NAME,STATUS,CREDIT,CREATED) values( :custId , :custName , :status , :credit , :created );',
    'end-exec;',
    'exec sql',
    'insert into SALES/CUSTOMER_HISTORY (ID,NAME,STATUS,CREDIT,CREATED)',
    'select ID , NAME , STATUS , CREDIT , CREATED',
    'from SALES/CUSTOMER',
    'where STATUS=\'A\';',
    'end-exec;',
    'exec sql',
    'get diagnostics :rows = row_count;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'exec sql',
    'insert into SALES/CUSTOMER (',
    'ID,',
    'NAME,',
    'STATUS,',
    'CREDIT,',
    'CREATED',
    'values (',
    ':custId,',
    ':custName,',
    ':status,',
    ':credit,',
    ':created',
    'select',
    'from SALES/CUSTOMER',
    'where STATUS = \'A\';',
    'get diagnostics :rows = row_count;'
  ]
};

export default testCase;
