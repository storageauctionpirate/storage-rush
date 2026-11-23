// Focused regression checks for round 3. Read-only against live game; board save only.
const pp=require('puppeteer-core'),assert=require('assert');
(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage();const err=[];p.on('pageerror',e=>err.push(e.message));
try{await p.setViewport({width:390,height:844,isMobile:true,hasTouch:true});const base=process.env.BASE||'http://127.0.0.1:8872/board/';
 await p.goto(base+'?fresh=1&debug=1',{waitUntil:'networkidle0'});await p.click('[data-act=start]');await p.waitForFunction(()=>BP.state().clean&&!BP.state().busy);
 const get=()=>p.evaluate(()=>({g:BP.state().G,active:JSON.parse(localStorage.getItem('storageRush.board.v1')).active}));
 const A=await get();assert.equal(A.active.eng.moves,14);assert.equal(A.g.cash,9);
 await p.goto(base+'?debug=1',{waitUntil:'networkidle0'});await p.waitForFunction(()=>BP.state().clean&&!BP.state().busy);const B=await get();assert.deepEqual(B.active,A.active);assert.equal(B.g.cash,9);console.log('PASS exact grid, moves, finds and RNG resume; no second bid');
 // emulate the saved state of an exhausted locker (terminal state must resume as a failure, not hang)
 await p.evaluate(()=>{const g=JSON.parse(localStorage.getItem('storageRush.board.v1'));g.active.eng.moves=0;g.active.collected=['tinrobot'];g.active.cleared=15;localStorage.setItem('storageRush.board.v1',JSON.stringify(g));});
 await p.goto(base+'?debug=1',{waitUntil:'networkidle0'});await p.waitForSelector('#modal:not(.hidden) [data-act=retry]');assert((await p.$eval('#modalBody',e=>e.innerText)).includes('Not fully cleared'));console.log('PASS exhausted paid locker resumes as a failure');
 await p.click('[data-act=retry][data-a=retry]');await p.waitForFunction(()=>!BP.state().busy&&!BP.state().modal);const R=await get();assert.equal(R.g.cash,9);assert.equal(R.active.eng.moves,14);assert.equal(R.active.attempt,1);console.log('PASS retry free resets moves; no second bid');
 await p.evaluate(()=>{const g=JSON.parse(localStorage.getItem('storageRush.board.v1'));g.active.eng.moves=0;g.active.collected=['tinrobot'];g.active.cleared=15;g.truck=[];localStorage.setItem('storageRush.board.v1',JSON.stringify(g));});
 await p.goto(base+'?debug=1',{waitUntil:'networkidle0'});await p.waitForSelector('#modal:not(.hidden) [data-act=retry]');await p.click('[data-act=retry][data-a=keep]');await p.waitForSelector('#modal:not(.hidden) [data-act=closeModal]');const K=await get();assert.equal(K.g.rolls,0);assert(K.g.truck.includes('tinrobot'));assert(K.g.cash>9);assert.equal(K.g.active,null);console.log('PASS keep partial finds + half salvage, no roll, paid locker closed');
 assert.deepEqual(err,[]);console.log('PASS no page errors');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
