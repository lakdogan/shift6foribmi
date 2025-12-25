import type { Case } from '../types';

const testCase: Case = {
  name: 'boolean-assignment-wrap',
  input: [
    '**free',
    'ok = a=1 and b=2 and c=3 and d=4 and e=5 and f=6 and (a+b+c+d+e+f)>10 and (a*b*c*d)>0 and (a<>b) and (c<>d) and (e<>f);'
  ].join('\n'),
  mustInclude: [
    ['ok =', '  a = 1', '  and b = 2', '  and c = 3'].join('\n')
  ],
  config: {
    spaces: 0,
    blockIndent: 2
  }
};

export default testCase;
