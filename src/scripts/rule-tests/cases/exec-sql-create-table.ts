import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-create-table',
  input: [
    '**free',
    'exec sql',
    'create table DEMOCUST ( company char(3), cust_id dec(9,0), name varchar(60), email varchar(120), status char(1), primary key(company, cust_id) );'
  ].join('\n'),
  mustInclude: [
    'exec sql',
    'create table DEMOCUST (',
    'company  char(3),',
    'cust_id  dec(9,0),',
    'name     varchar(60),',
    'email    varchar(120),',
    'status   char(1),',
    'primary key(company, cust_id)'
  ]
};

export default testCase;
