import type { Case } from '../types';

const testCase: Case = {
  name: 'special-value-spacing-after-operators',
  input: [
    '**free',
    'return * on;',
    'return * off;',
    'if(*in99 = * on);',
    'if(*in05 = * off);',
    'if(*inKC = * on);'
  ].join('\n'),
  mustInclude: [
    'return *on;',
    'return *off;',
    'if(*IN99 = *on);',
    'if(*IN05 = *off);',
    'if(*INKC = *on);'
  ]
};

export default testCase;
