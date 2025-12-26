import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-ddl-schema',
  input: [
    '**free',
    'exec sql create table SALES/CUSTOMER (ID int, NAME varchar(50));',
    'end-exec;',
    'exec sql alter table SALES/CUSTOMER add column STATUS char(1);',
    'end-exec;',
    'exec sql drop table SALES/CUSTOMER;',
    'end-exec;',
    'exec sql create view SALES/CUST_VIEW as select ID, NAME from SALES/CUSTOMER;',
    'end-exec;',
    'exec sql create index SALES/IDX_CUST on SALES/CUSTOMER (ID);',
    'end-exec;',
    'exec sql create sequence SALES/SEQ_CUST;',
    'end-exec;',
    'exec sql create alias SALES/CUST_ALIAS for SALES/CUSTOMER;',
    'end-exec;',
    'exec sql create procedure SALES/PROC1 (in P1 int) language sql begin end;',
    'end-exec;',
    'exec sql create function SALES/FN1 (P1 int) returns int language sql begin end;',
    'end-exec;',
    'exec sql create trigger SALES/TR1 after insert on SALES/CUSTOMER begin end;',
    'end-exec;',
    'exec sql drop trigger SALES/TR1;',
    'end-exec;',
    'exec sql declare global temporary table SESSION/TEMP1 (ID int);',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'create table SALES/CUSTOMER (ID int, NAME varchar(50));',
    'alter table SALES/CUSTOMER add column STATUS char(1);',
    'drop table SALES/CUSTOMER;',
    'create view SALES/CUST_VIEW as select ID, NAME from SALES/CUSTOMER;',
    'create index SALES/IDX_CUST on SALES/CUSTOMER (ID);',
    'create sequence SALES/SEQ_CUST;',
    'create alias SALES/CUST_ALIAS for SALES/CUSTOMER;',
    'create procedure SALES/PROC1 (in P1 int) language sql',
    'begin',
    'end;',
    'create function SALES/FN1 (P1 int) returns int language sql',
    'create trigger SALES/TR1 after insert on SALES/CUSTOMER',
    'drop trigger SALES/TR1;',
    'declare global temporary table SESSION/TEMP1 (ID int);'
  ]
};

export default testCase;
