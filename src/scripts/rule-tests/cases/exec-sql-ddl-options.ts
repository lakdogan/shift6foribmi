import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-ddl-options',
  input: [
    '**free',
    'exec sql create table SALES/CUSTOMER (ID int, NAME varchar(50)) rcdfmt CUSTREC ccsid 37 for system name CUSTSYS;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'create table SALES/CUSTOMER (',
    'ID    int,',
    'NAME  varchar(50)',
    ') rcdfmt CUSTREC ccsid 37 for system name CUSTSYS;'
  ]
};

export default testCase;
