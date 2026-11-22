// Regression checks for Mike's Nov 22 playtest. No economy/unit-count/opening changes.
const p=require('puppeteer-core'),fs=require('fs'),path=require('path');const wait=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'http://127.0.0.1:8872/index.html',OUT=path.join(__dirname,'..','shots','playtest-nov22');fs.mkdirSync(OUT,{recursive:true});
let pass=0,fail=0;const ok=(t,x,d)=>{console.log((x?'PASS ':'FAIL ')+t+(d?' — '+d:''));x?pass++:fail++;};
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const [width,height] of [[390,844],[375,667],[1280,800]]){const T=width+'x'+height,pg=await b.newPage(),errs=[];pg.on('pageerror',e=>errs.push(e.message));await pg.setViewport({width,height});
const st=()=>pg.evaluate(()=>SR.state());const until=async(fn,ms)=>{const t0=Date.now();while(Date.now()-t0<(ms||6000)){const s=await st();if(fn(s))return s;await wait(60);}return st();};
const txt=s=>pg.$eval(s,e=>e.textContent),vis=s=>pg.$eval(s,e=>!e.classList.contains('hidden')&&e.offsetParent!==null).catch(()=>false);
const click=async s=>{const r=await pg.$eval(s,e=>{const b=e.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}});await pg.mouse.click(r.x,r.y);};
const shot=n=>pg.screenshot({path:path.join(OUT,T+'-'+n+'.png')});
const move=async()=>{const m=await pg.evaluate(()=>SR.bestMove());if(!m)return;const a=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.a[0],m.a[1]),c=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.b[0],m.b[1]);await pg.mouse.move(a.x,a.y);await pg.mouse.down();for(let i=1;i<=5;i++){await pg.mouse.move(a.x+(c.x-a.x)*i/5,a.y+(c.y-a.y)*i/5);await wait(16);}await pg.mouse.up();await wait(120);await until(x=>!x.busy||x.result,6000);};
const seed=u=>pg.evaluate(u=>{localStorage.clear();localStorage.setItem('storageRush.v3',JSON.stringify({v:3,lmv:2,unit:u,bank:1500,sound:false,rung:0,tasks:['wash'],boosters:{cut:2,flash:1,free:1},daily:{day:'',boards:0,punch:[],glove:''},endless:{n:0,best:0},seenLadder:true,taughtBoost:{cut:true,flash:true,free:true},truckSeen:true,built:['flea'],safeBank:0}));},u);
const map=async()=>{await click('#bOpen');await until(x=>x.mode==='map'&&!x.map.walking,6000);await wait(600);};
const enter=async()=>{await map();await click('#bLadNext');await wait(600);const L=await pg.evaluate(()=>SR.lockXY());await pg.mouse.click(L.x,L.y);await until(x=>x.mode==='play'&&!x.busy,6000);await wait(300);};
await pg.goto(BASE+'?debug=1&v='+Date.now(),{waitUntil:'load'});
await seed(2);await pg.reload({waitUntil:'load'});await wait(700);await enter();
let s=await st();ok(T+' Unit 3 still has 2 rooms; Unit 5 still has 2 rooms; 20 units',s.boards===2&&await pg.evaluate(()=>SR.units===20&&LEVELS.YARD1.units[4].boards.length===2));
// real play, not debugWin: prove the first bonus is earned by completing a room, regardless of chain luck
for(let i=0;i<150;i++){s=await st();if(s.result==='win'||s.mode==='box')break;if(s.busy){await wait(80);continue;}
  if(s.finds.length){const f=s.finds[0],q=await pg.evaluate((r,c)=>SR.cellXY(r,c),f.r,f.c);await pg.mouse.click(q.x,q.y);await wait(180);await until(x=>!x.busy||x.result,6000);continue;}
  if(await vis('#msg')){await click('#msgB');await wait(300);continue;}await move();}
await until(x=>x.mode==='box',5000);s=await st();ok(T+' first bonus game guaranteed at Unit 3 room 1 (real swaps and find collection)',s.mode==='box'&&s.bi===1&&s.save.run&&!!s.save.run.box&&!s.save.boxSeen,JSON.stringify({mode:s.mode,room:s.bi+1}));await wait(500);await shot('first-bonus-opening');
// reload while unopened: it must open the saved box, not lose it or reroll it
const tier=s.save.run.box.tier,bank=s.save.bank;await pg.reload({waitUntil:'load'});await wait(700);await map();await click('#bLadNext');s=await until(x=>x.mode==='box',5000);ok(T+' reload before opening first box restores the same box before the next room',s.mode==='box'&&s.save.run.box.tier===tier&&s.save.bank===bank,tier);
await pg.evaluate(()=>SR.skipBox());await wait(500);const cash=s.save.run.box.cash;await click('#bBoxNext');s=await until(x=>x.mode==='door',5000);ok(T+' first box banks once and is saved as seen/opened',s.save.bank===bank+cash&&s.save.boxSeen&&s.save.run.box.opened,'$'+bank+'→$'+s.save.bank);await pg.reload({waitUntil:'load'});await wait(500);s=await st();ok(T+' reload never pays the first box again',s.save.bank===bank+cash&&s.save.run.box.opened);
// Unit 5 boundary: one card, same haul, fresh board; no room 3/4 exists
await seed(4);await pg.evaluate(()=>{const x=JSON.parse(localStorage.getItem('storageRush.v3'));x.boxSeen=true;x.rushSeen=true;localStorage.setItem('storageRush.v3',JSON.stringify(x));});await pg.reload({waitUntil:'load'});await wait(700);await enter();
await pg.evaluate(()=>SR.rushAdd(80));await pg.evaluate(()=>SR.debugWin());await wait(300);
ok(T+' Unit 5 boundary is one room-cleared card, not competing banners',await vis('#roomCard')&&/Room 1 cleared!/.test(await txt('#rcH'))&&/Next: Room 2 of 2/.test(await txt('#rcNext'))&&!(await vis('#hype'))&&!(await vis('#banner')));await shot('unit5-room1-cleared');
await until(x=>x.mode==='play'&&!x.busy&&x.bi===1,5000);s=await st();ok(T+' Unit 5 next board is room 2 of 2, with meter kept and fresh moves (not a new unit)',s.unitId==='Unit 5'&&s.bi===1&&s.boards===2&&s.rush.meter===80&&s.moves===26,JSON.stringify({id:s.unitId,bi:s.bi,meter:s.rush.meter,moves:s.moves}));await shot('unit5-room2-ready');
// Guarantee a box at the unit end, then cleared card, then safe: only one stage visible at each point
await pg.evaluate(()=>SR.debugBox('rare'));await pg.evaluate(()=>SR.debugHaul('safe'));await wait(250);await pg.evaluate(()=>SR.rushAdd(100));await wait(150);await shot('unit5-rush-and-box-queued');await pg.evaluate(()=>SR.debugWin());
s=await until(x=>x.mode==='box',5000);ok(T+' Unit-end box opens on its own, not over the cleared card',s.mode==='box'&&!(await vis('#msg'))&&!(await vis('#roomCard')));
await pg.evaluate(()=>SR.skipBox());await wait(500);await click('#bBoxNext');await wait(300);s=await st();ok(T+' after unit-end box: normal board scene + one cleared card, no stale Box UI',s.mode==='play'&&await vis('#msg')&&!(await vis('#boxUI'))&&!(await vis('#hype'))&&/already banked/.test(await txt('#msgP')));await shot('unit5-box-then-cleared');
ok(T+' Unit 5 cleared card offers the earned safe, never room 3/4',/Crack the safe/.test(await txt('#msgB'))&&s.bi===1&&s.boards===2);
await click('#msgB');s=await until(x=>x.mode==='safe',4000);ok(T+' safe opens by itself, cleared card is gone',s.mode==='safe'&&!(await vis('#msg'))&&!(await vis('#boxUI')));await wait(600);await shot('unit5-safe');
ok(T+' no page errors',errs.length===0,errs.join(' | '));await pg.close();}
await b.close();console.log('\n'+pass+'/'+(pass+fail)+' passed');process.exitCode=fail?1:0;})();
