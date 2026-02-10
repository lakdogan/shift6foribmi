import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-derived-table-union',
  input: [
    '**free',
    "exec sql select coalesce(max(ts), timestamp('1900-01-01-00.00.00.000000')) into :maxChangeTs from (select max(x.change_timestamp) as ts from table(qsys2.object_statistics(rtrim(:libName), '*ALL')) x where x.objtype not in ('*JRN', '*JRNRCV') union all select max(coalesce(p.last_change_timestamp, p.create_timestamp)) as ts from qsys2.syspartitionstat p where p.table_schema = rtrim(:libName)) t;",
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'from (',
    'max(x.change_timestamp) as ts',
    "from table(qsys2.object_statistics(rtrim(:libName), '*ALL')) x",
    "where x.objtype not in ('*JRN', '*JRNRCV')",
    'union all',
    'max(coalesce(p.last_change_timestamp, p.create_timestamp)) as ts',
    'from qsys2.syspartitionstat p',
    'where p.table_schema = rtrim(:libName)',
    ') t;'
  ],
  mustExclude: [
    'from (select max(x.change_timestamp)',
    "from table(qsys2.object_statistics(rtrim(:libName), '*ALL')) x where x.objtype not in ('*JRN', '*JRNRCV')"
  ]
};

export default testCase;
