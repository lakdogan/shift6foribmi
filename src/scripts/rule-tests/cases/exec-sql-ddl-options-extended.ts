import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-ddl-options-extended',
  input: [
    '**free',
    'exec sql create table SALES/ORDERS (ID int, AMOUNT dec(9,2)) for system name ORDERSYS rcdfmt ORDRCD ccsid 37;',
    'end-exec;',
    'exec sql create alias SALES/ORD_ALIAS for SALES/ORDERS;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'create table SALES/ORDERS (ID int, AMOUNT dec(9,2)) for system name ORDERSYS rcdfmt ORDRCD ccsid 37;',
    'create alias SALES/ORD_ALIAS for SALES/ORDERS;'
  ]
};

export default testCase;
