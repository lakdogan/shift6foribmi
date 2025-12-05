    **free
// Ultra-nested messy demo for Shift6 for IBM i — all blocks closed, but wild layout

ctl-opt dftactgrp(*no) actgrp(*new);

dcl-s depth int(5) inz(0); dcl-s txt varchar(200);

// One big proc with extreme nesting and inline statements
dcl-proc megaNest; dcl-pi *n; end-pi;

// inline counter init
depth = 0; txt = 'start';

// Deeply nested IF/DOW/DOU/SELECT/MONITOR/FOR combo in one ugly chain
if depth = 0; dow depth < 2; depth += 1;
  if depth = 1; for a = 1 to 2; if a=1; txt='a1'; else; txt='a2'; endif;
    select; when a=1; dsply('a=1'); other; dsply('a!=1'); endsl;
    monitor; if a=2; dsply('monitor-hit'); endif; on-error; dsply('monitor-err'); endmon;
  endfor; endif;
  dou depth > 3; depth += 2; if depth > 4; leave; endif; enddo;
enddo; endif;

// Crazy mixed loops and conditions inline
for i = 1 to 3; for j = 1 to 2; if i=2; if j=2; dsply('i2j2'); else; dsply('i2'); endif; endif;
  select; when i=3; dsply('i=3'); when j=1; dsply('j=1'); other; dsply('other'); endsl;
endfor; endfor;

// Nested monitor/select/if chain with inline semicolons
monitor; select; when depth>1; if depth=2; dsply('depth2'); endif; other; dsply('depthOther'); endsl; on-error; dsply('err'); endmon;

// Final deep if ladder
if depth>0; if depth>1; if depth>2; dsply('>2'); else; dsply('>1'); endif; else; dsply('>0'); endif; endif;

dsply('megaNest done'); end-proc;

// Another proc with very deep nesting (10 levels)
dcl-proc deepTen; dcl-pi *n; end-pi;
if *on; if *on; if *on; if *on; if *on; if *on; if *on; if *on; if *on; if *on;
  dsply('level10');
endif; endif; endif; endif; endif; endif; endif; endif; endif; endif;
dsply('deepTen done'); end-proc;
