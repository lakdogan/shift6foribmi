    **free
// Mega-messy demo for Shift6 for IBM i — all blocks closed, but ugly layout

ctl-opt dftactgrp(*no) actgrp(*new);  ctl-opt option(*srcstmt);   // inline ctl-opt

// Globals
   dcl-s gCounter int(10) inz(0); dcl-s gMsg varchar(100);;;;; dcl-s gFlag ind inz(*off);

// --- Proc #1: nested IF/DOW/SELECT, inline statements, extra semicolons ---
 dcl-proc procOne; dcl-pi *n; end-pi;  gCounter=1; if gCounter>0; dow gCounter<4; gCounter+=1; if gCounter=2; gMsg='two'; endif; select; when gCounter=3; gMsg='three'; other; gMsg='other'; endsl; enddo; endif; dsply ('procOne done');
 end-proc;

// --- Proc #2: monitor/for ---
  dcl-proc procTwo;  dcl-pi *n; end-pi;
 monitor; for idx = 1 to 3; gMsg=%char(idx)+' loop'; dsply(gMsg); endfor; on-error; dsply('error hit'); endmon; dsply('procTwo done'); end-proc;

// --- Proc #3: multiple inline branches ---
    dcl-proc procThree; dcl-pi *n; end-pi;
    if *on; if gFlag; dsply('flag set'); else; dsply('flag off'); endif; endif; dow gCounter>0; gCounter-=1; if gCounter=0; leave; endif; enddo; dsply('procThree done'); end-proc;

// --- Proc #4: nested procs not allowed in RPG, but multiple procs back-to-back messy ---
dcl-proc procFour; dcl-pi *n; end-pi;
  select;
    when gCounter>5; gMsg='big'; dsply(gMsg);
    other; gMsg='small'; dsply(gMsg);
  endsl;
  dou gCounter>7; gCounter+=2; if gCounter>10; leave; endif; enddo;
  dsply('procFour done');
end-proc;

// --- Proc #5: long inline with punctuation noise but valid structure ---
   dcl-proc procFive;   dcl-pi *n; end-pi;
   dcl-s local int(5); local = 0;;;; ; ,,, ... ;;;; if local=0; local=1; endif; if local>0; dsply('local set'); endif; end-proc;

// --- Proc #6: select/when/other plus monitor ---
   dcl-proc procSix; dcl-pi *n; end-pi;
   select; when gFlag; dsply('flag true'); other; dsply('flag false'); endsl;
   monitor; dsply('monitor run'); on-error; dsply('monitor error'); endmon;
   dsply('procSix done'); end-proc;

// --- Proc #7: for/if inline ---
  dcl-proc procSeven; dcl-pi *n; end-pi;
  for j = 1 to 5; if j=3; iter; endif; dsply('j=' + %char(j)); endfor; dsply('procSeven done'); end-proc;

// --- Proc #8: do loop + select inline ---
 dcl-proc procEight; dcl-pi *n; end-pi;
 do k = 1 to 3; select; when k=1; dsply('one'); when k=2; dsply('two'); other; dsply('other'); endsl; enddo; dsply('procEight done'); end-proc;

// --- Proc #9: nested monitor with select ---
 dcl-proc procNine; dcl-pi *n; end-pi;
 monitor; select; when gCounter>2; dsply('gt2'); other; dsply('lte2'); endsl; on-error; dsply('err'); endmon; dsply('procNine done'); end-proc;

// --- Proc #10: giant inline chain with semicolons everywhere ---
 dcl-proc procTen; dcl-pi *n; end-pi; if gCounter<5; gCounter+=1; if gCounter>3; gFlag=*on; else; gFlag=*off; endif; select; when gFlag; gMsg='flag on'; dsply(gMsg); other; gMsg='flag off'; dsply(gMsg); endsl; endif; dsply('procTen done'); end-proc;

// --- Proc #11: while style dow/dou messy ---
 dcl-proc procEleven; dcl-pi *n; end-pi;
 dow gCounter<12; gCounter+=1; if gCounter=11; leave; endif; enddo;
 dou gCounter<15; gCounter+=1; if gCounter=14; leave; endif; enddo;
 dsply('procEleven done'); end-proc;

// --- Proc #12: with comments inline ---
 dcl-proc procTwelve; dcl-pi *n; end-pi; // start
 if gCounter>0; // check
   dsply('ok');
 else; dsply('zero'); endif;
 dsply('procTwelve done'); end-proc; // end

// --- Proc #13: mixed spacing, tabs, and noise but closed properly ---
	dcl-proc			procThirteen;	dcl-pi *n;	end-pi;
	if gCounter > 5;	dsply('>5');	else; dsply('<=5');	endif;
	select;	when gCounter=6; dsply('six');	when gCounter=7; dsply('seven');	other; dsply('other'); endsl;
	dsply('procThirteen done');	end-proc;

// --- Proc #14: minimalistic with inline monitor ---
dcl-proc procFourteen; dcl-pi *n; end-pi; monitor; dsply('work'); on-error; dsply('err'); endmon; end-proc;

// --- Proc #15: combo loops ---
dcl-proc procFifteen; dcl-pi *n; end-pi;
 dow gCounter>0; gCounter-=1; if gCounter=2; iter; endif; enddo;
 for x=1 to 2; for y=1 to 2; dsply('x'+%char(x)+' y'+%char(y)); endfor; endfor;
 dsply('procFifteen done'); end-proc;

// End of mega messy demo
