import type { Case } from '../types';

const testCase: Case = {
  name: 'avoid-split-inside-parens',
  input: [
    '**free',
    'total = % int( (a+b+c+d+e+f+g+h+i+j+k) * 2 ) + (a*b*c*d*e*f*g*h*i*j*k) / (a+1);'
  ].join('\n'),
  mustInclude: ['total = %int((a + b + c + d + e + f + g + h + i + j + k) * 2)'],
  config: {
    continuationColumn: 66
  }
};

export default testCase;
