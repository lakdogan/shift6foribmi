import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-functions',
  input: [
    '**free',
    'exec sql select abs(-1) as ABS1, mod(10,3) as M1, round(12.345,2) as R1, timestamp_format(\'2025-01-01\',\'YYYY-MM-DD\') as T1, varchar_format(current_timestamp,\'YYYY-MM-DD\') as V1, listagg(NAME,\',\') within group(order by NAME) as NAMES, xmlagg(xmlelement(name X, NAME) order by NAME) as XMLS, json_object(\'id\':ID,\'name\':NAME) as J1, json_array(ID,NAME) as J2 from SALES/CUSTOMER;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'select',
    'abs(-1) as ABS1',
    'mod(10,3) as M1',
    'round(12.345,2) as R1',
    'timestamp_format(\'2025-01-01\',\'YYYY-MM-DD\') as T1',
    'varchar_format(current_timestamp,\'YYYY-MM-DD\') as V1',
    'listagg(NAME,\',\') within group(order by NAME) as NAMES',
    'xmlagg(xmlelement(name X, NAME) order by NAME) as XMLS',
    'json_object(\'id\':ID,\'name\':NAME) as J1',
    'json_array(ID,NAME) as J2',
    'from SALES/CUSTOMER;'
  ]
};

export default testCase;
