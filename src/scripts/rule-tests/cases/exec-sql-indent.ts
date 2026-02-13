import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-indent',
  input: [
    '**free',
    'dcl-proc pr_Test;',
    '  dcl-pi *n; end-pi;',
    '  dcl-s cnt int(10);',
    '  exec sql',
    '  select',
    '  count(*)',
    '  into',
    '  :cnt',
    '  from qsys2.sysschemas;',
    'end-proc;'
  ].join('\n'),
  mustInclude: [
    [
      '        exec sql',
      '          select',
      '            count(*)',
      '          into',
      '            :cnt',
      '          from qsys2.sysschemas;'
    ].join('\n')
  ]
};

export default testCase;
