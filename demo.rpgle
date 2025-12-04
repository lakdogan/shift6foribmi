    **free
// messy demo for Shift6 for IBM i — run Format Document to clean it up

ctl-opt dftactgrp(*no)  actgrp(*new);

   dcl-s counter int(10) inz(0);    dcl-s msg varchar(50);;;;    // extra semicolons

    dcl-proc   demoProc;    dcl-pi *n ;  end-pi;   // inline proc/PI/end

if counter=0;dow counter < 3;counter+=1; if counter=2; dsply ('midpoint reached');endif;enddo;else; dsply('counter preset');   endif; 

// weird punctuation on PI line
  dcl-proc anotherProc; dcl-pi *n ; .; ;;;;;;;;;                                                            ,,,,,,........;;;;;;;;;;;
    end-pi; dsply ('hello'); end-proc;

  // Inline monitor/for/select examples
monitor; // start monitor
  for idx = 1 to 2; dsply ('loop' + %char(idx)); endfor;
  select; when counter > 1; dsply('gt1'); other; dsply('other'); endsl;
on-error; dsply('error'); endmon;
    dsply ('done'); end-proc;
