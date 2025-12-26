import type { Case } from '../types';

const testCase: Case = {
  name: 'exec-sql-xmltable-namespaces',
  input: [
    '**free',
    'exec sql select X.ID from xmltable(xmlnamespaces(\'http://acme\' as "a"), \'$d\' passing xmlparse(document :doc) columns ID int path \'/a:root/@id\') as X;',
    'end-exec;'
  ].join('\n'),
  mustInclude: [
    'xmltable(xmlnamespaces(\'http://acme\' as "a"),',
    'columns ID int path \'/a:root/@id\') as X',
    'from xmltable'
  ]
};

export default testCase;
