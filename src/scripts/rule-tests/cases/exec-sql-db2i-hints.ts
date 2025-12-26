import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-db2i-hints',
  input: [
    '**free',
    'exec sql select ID from SALES/CUSTOMER with ur;',
    'end-exec;',
    'exec sql select ID from SALES/CUSTOMER with cs;',
    'end-exec;',
    'exec sql select ID from SALES/CUSTOMER with rs;',
    'end-exec;',
    'exec sql select ID from SALES/CUSTOMER with nc;',
    'end-exec;',
    'exec sql select ID from SALES/CUSTOMER for read only with rs;',
    'end-exec;',
    'exec sql set current degree = 2;',
    'end-exec;',
    'exec sql set current path = MYLIB, QSYS;',
    'end-exec;',
    'exec sql set current schema = MYLIB;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'select',
    'from SALES/CUSTOMER',
    'with ur;',
    'with cs;',
    'with rs;',
    'with nc;',
    'for read only',
    'with rs;',
    'set current degree = 2;',
    'set current path = MYLIB, QSYS;',
    'set current schema = MYLIB;'
  ]
};

export default testCase;
