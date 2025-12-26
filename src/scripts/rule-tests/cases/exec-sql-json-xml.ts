import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-json-xml',
  input: [
    '**free',
    'exec sql select json_object(\'id\':C.ID,\'name\':C.NAME) as J1, json_array(C.ID,C.NAME) as J2, xmltable(\'$d\' passing xmlparse(document :doc) columns ID int path \'@id\') as XT from SALES/CUSTOMER;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'json_object(\'id\':C.ID,\'name\':C.NAME) as J1',
    'json_array(C.ID,C.NAME) as J2',
    'xmltable(\'$d\' passing xmlparse(document :doc) columns ID int path \'@id\') as XT',
    'from SALES/CUSTOMER;'
  ]
};

export default testCase;
