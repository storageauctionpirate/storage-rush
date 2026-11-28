// QA for /play-look/ checkpoint 1 (same checks as play-milestone-a). Usage: ONLY=390x844 node test/play-milestone-a.js
const puppeteer=require('puppeteer-core'),fs=require('fs'),path=require('path');
const BASE=process.env.BASE||'http://127.0.0.1:8872/play-look/';
const SIZES=[{n:'390x844',w:390,h:844,m:true},{n:'375x667',w:375,h:667,m:true},{n:'1280x800',w:1280,h:800,m:false}].filter(s=>!process.env.ONLY||s.n===process.env.ONLY);
const SHOTS=path.join(__dirname,'..','docs','shots','play-look-checkpoint1','qa');fs.mkdirSync(SHOTS,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function win(pf,start){const k=Math.min(600,pf.total-start);return {f:pf.frames.slice(-k),c:pf.cpu.slice(-k)};}
function fpsStats(w){const ft0=w.f||w;const cpu=(w.c||[]).filter(x=>x>0);let ft=ft0;ft=ft.filter(x=>x>0&&x<1000);if(!ft.length)return null;const avg=ft.reduce((a,b)=>a+b,0)/ft.length;const s=[...ft].sort((a,b)=>b-a);const worst=s.slice(0,Math.max(1,Math.ceil(s.length*.01)));const wv=worst.reduce((a,b)=>a+b,0)/worst.length;const cs=[...cpu].sort((a,b)=>a-b);return {frames:ft.length,avgFps:+(1000/avg).toFixed(1),low1Fps:+(1000/wv).toFixed(1),avgMs:+avg.toFixed(1),cpuMedMs:cs.length?+cs[cs.length>>1].toFixed(1):null,cpuP99Ms:cs.length?+cs[Math.floor(cs.length*.99)].toFixed(1):null};}
(async()=>{const all={};
for(const S of SIZES){const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-precise-memory-info','--autoplay-policy=no-user-gesture-required']});
 const p=await b.newPage();const errs=[],bad=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});p.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url());});
 await p.setViewport({width:S.w,height:S.h,deviceScaleFactor:S.m?3:1,isMobile:S.m,hasTouch:S.m});
 const cdp=await p.target().createCDPSession();if(S.m){await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await p.setUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36');}
 const R={size:S.n,throttle:S.m?'4x CPU, mobile emulation, DPR 3':'none, DPR 1'};let shot=0;
 const snap=async n=>{const f=path.join(SHOTS,`${S.n}-${String(++shot).padStart(2,'0')}-${n}.jpg`);await p.screenshot({path:f,type:'jpeg',quality:80});};
 const st=()=>p.evaluate(()=>BP.state());const idle=async(ms=20000)=>{const t=Date.now();while(Date.now()-t<ms){const s=await st();if(!s.busy)return s;await sleep(150);}};
 const click=async sel=>{const h=await p.$(sel);if(!h)return false;const ok=await p.evaluate(e=>!e.disabled&&e.offsetParent!==null,h);if(!ok)return false;try{await h.click();}catch(e){return false;}return true;};
 const t0=Date.now();await p.goto(BASE+'?fresh=1&debug=1',{waitUntil:'load'});await p.waitForFunction(()=>window.BP&&BP.perf().readyMs!=null,{timeout:60000});
 R.firstFrameWallMs=Date.now()-t0;R.firstFrameMs=Math.round(await p.evaluate(()=>BP.perf().readyMs));
 R.nav=await p.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];return {dcl:Math.round(n.domContentLoadedEventEnd),load:Math.round(n.loadEventEnd)};});
 await sleep(4000);await snap('intro-overview');R.models=await p.evaluate(()=>BP.models());
 const f0=(await p.evaluate(()=>BP.perf().total));await sleep(5000);const pf=await p.evaluate(()=>BP.perf());R.idleBoard=fpsStats(win(pf,f0));R.quality=pf.info.quality;R.renderer=pf.info;
 await click('[data-act=start]');await p.waitForFunction(()=>BP.state().clean&&!BP.state().busy,{timeout:30000});await sleep(600);await snap('cleanout-start');
 // fix 2: a paid locker survives a reload
 {const before=await st();const A=await p.evaluate(()=>{const m=BP.bestMove();return m;});const P1=await p.evaluate((r,c)=>BP.cellXY(r,c),...A.a),P2=await p.evaluate((r,c)=>BP.cellXY(r,c),...A.b);
  if(S.m){await p.touchscreen.tap(P1.x,P1.y);await sleep(60);await p.touchscreen.tap(P2.x,P2.y);}else{await p.mouse.click(P1.x,P1.y);await sleep(60);await p.mouse.click(P2.x,P2.y);}await sleep(400);await idle();
  const mid=await st();await p.goto(BASE+'?debug=1',{waitUntil:'load'});await p.waitForFunction(()=>window.BP&&BP.state().clean&&!BP.state().busy,{timeout:60000});await sleep(800);const after=await st();
  R.reloadResume={before:{moves:before.moves,left:before.left},beforeReload:{moves:mid.moves,left:mid.left,cash:mid.G.cash},afterReload:{moves:after.moves,left:after.left,cash:after.G.cash},ok:after.clean&&after.moves===mid.moves&&after.left===mid.left&&after.G.cash===mid.G.cash};}
 // fix 3: make the truck full so the find must be sold at the curb
 await p.evaluate(()=>BP.debug.set({truck:['tinrobot','tinrobot','tinrobot','tinrobot','tinrobot','tinrobot'].map((x,i)=>i%2?ITEMS.pick('c',1,Math.random,{}):x)}));
 // play real moves by touch / mouse, measuring tap->next frame latency
 const fm=(await p.evaluate(()=>BP.perf().total));
 let nearShot=false,celeb=false,lowShot=false;R.cleanout={startLeft:(await st()).left,startMoves:(await st()).moves};
 for(let i=0;i<40;i++){const s0=await st();if(!s0.clean||s0.status!=='play')break;const m=await p.evaluate(()=>BP.bestMove());if(!m){await sleep(400);continue;}const A=await p.evaluate((r,c)=>BP.cellXY(r,c),...m.a),B=await p.evaluate((r,c)=>BP.cellXY(r,c),...m.b);
  if(S.m){await p.touchscreen.tap(A.x,A.y);await sleep(60);await p.touchscreen.tap(B.x,B.y);}else{await p.mouse.click(A.x,A.y);await sleep(60);await p.mouse.click(B.x,B.y);}
  await sleep(300);if(i===2)await snap('cleanout-cascade');
  const t=Date.now();while(Date.now()-t<20000){const q=await st();if(q.status==='win'&&!celeb){celeb=true;await sleep(700);await snap('locker-empty-celebration');}if(!q.busy||q.modal)break;await sleep(120);}
  const s1=await st();if(!lowShot&&s1.clean&&s1.moves<=5&&s1.status==='play'){lowShot=true;await sleep(150);await snap('low-moves-warning');}if(!nearShot&&s1.clean&&s1.left<=12&&s1.left>0&&s1.status==='play'){nearShot=true;await snap('cleanout-near-empty');}if(s1.modal||!s1.clean)break;}
 const se=await st();R.cleanout.endMovesLeft=se.moves;R.cleanout.shoves=se.shoves;R.cleanout.wonByPlay=celeb||se.modal;
 const pm=await p.evaluate(()=>BP.perf());R.cleanoutPlay=fpsStats(win(pm,fm));const L=pm.lat.slice().sort((a,b)=>a-b);R.tapLatencyMs={n:L.length,median:Math.round(L[Math.floor(L.length/2)]),p95:Math.round(L[Math.floor(L.length*.95)]),max:Math.round(L[L.length-1])};
 R.cleanout.tier=se.tier;let s=await st();if(s.modal&&s.status==='out'){R.cleanout.result='out of moves';await snap('out-of-moves');await click('[data-act=retry][data-a=keep]');await sleep(900);}else if(s.clean&&s.status==='play'&&!s.modal){await p.evaluate(()=>BP.debug.win());}else R.cleanout.result='cleared';
 await p.waitForFunction(()=>BP.state().modal,{timeout:20000});await sleep(500);await snap('locker-summary-curb-sale');R.summaryText=await p.evaluate(()=>document.querySelector('#modalBody').innerText.replace(/\s+/g,' ').slice(0,400));await click('[data-act=closeModal]');await idle();await sleep(1200);
 // roll and travel
 s=await st();R.rollsAfterFirstCleanout=s.G.rolls;const pos0=s.G.pos;await click('[data-act=roll]');await sleep(S.m?900:600);await snap('dice-in-flight');await sleep(S.m?900:700);await snap('dice-landing');await sleep(4000);await idle(30000);s=await st();
 R.afterRoll={pos:s.G.pos,modal:s.modal,rolled:s.G.lastRoll,movedBy:(s.G.pos-pos0+16)%16,dice:await p.evaluate(()=>BP.dice())};R.rollMatchesMove=R.afterRoll.rolled===R.afterRoll.movedBy;
 // close whatever the landing opened, generically
 for(let k=0;k<8;k++){s=await st();if(!s.modal&&!s.clean)break;R.landedOn=R.landedOn||await p.evaluate(()=>document.getElementById('place').innerText);
  if(await p.$('#modalBody .case:not([disabled])')){const d=await p.evaluate(()=>BP.debug.deck());const free=d.map((c,i)=>c.won||c.open?-1:i).filter(i=>i>=0);let n=await p.$$('#modalBody .case');await n[free[0]].click();await sleep(250);n=await p.$$('#modalBody .case');await n[free[1]].click();await sleep(1100);continue;}
  if(await click('#modal:not(.hidden) [data-act=pickL]:not([disabled])')){await sleep(2500);continue;}if(s.clean){await p.evaluate(()=>BP.debug.win());await sleep(1200);}if(await click('#modal:not(.hidden) [data-act=closeModal]')||await click('#modal:not(.hidden) [data-act=pawnA][data-a=take]'))await sleep(800);else{await click('#close');await sleep(800);}}
 await idle();
 const items=await p.evaluate(()=>['tinrobot',ITEMS.pick('c',2,Math.random,{}),ITEMS.pick('c',2,Math.random,{}),ITEMS.pick('u',2,Math.random,{}),ITEMS.pick('c',2,Math.random,{})]);
 const goto=async pos=>{await p.evaluate(pos=>{BP.debug.set({pos});BP.debug.land();},pos);await sleep(1200);};
 // pawn negotiation
 const mix=['tinrobot','mug','hammer','teddy','books','radio'];await p.evaluate(t=>BP.debug.set({truck:t,cash:20,cap:10}),mix);await goto(3);
 R.shops={pawnLists:await p.evaluate(()=>[...document.querySelectorAll('#modalBody [data-act=pawnPick]')].map(b=>BP.state().G.truck[+b.dataset.i])),shopOf:await p.evaluate(m=>m.map(id=>id+':'+BP.shopFor(id)),mix)};
 R.shops.pawnOnlyPawnItems=R.shops.pawnLists.every(id=>['tinrobot','hammer','radio'].includes(id))&&R.shops.pawnLists.length===3;await snap('pawn-only-buys-pawn-items');await click('[data-act=pawnPick]');await sleep(500);await snap('pawn-offer');
 await click('[data-act=pawnA][data-a=push]');await sleep(500);await snap('pawn-after-push');R.pawn=await p.evaluate(()=>document.querySelector('#modalBody h2').innerText+' | '+(document.querySelector('.big-value')||{innerText:''}).innerText);
 for(let k=0;k<4&&(await st()).modal;k++){if(!(await click('[data-act=pawnA][data-a=take]')))await click('[data-act=closeModal]');await sleep(600);}await idle();
 // flea market
 await goto(6);await sleep(800);await snap('flea-market');R.shops.fleaLists=await p.evaluate(()=>[...document.querySelectorAll('#modalBody [data-act=fleaSell]')].filter(b=>b.dataset.i!=='best').map(b=>BP.state().G.truck[+b.dataset.i]));
 R.shops.fleaOnlyFleaItems=R.shops.fleaLists.every(id=>['mug','teddy','books'].includes(id));await click('[data-act=fleaSell][data-i=best]');await sleep(1200);await idle();
 {const g=(await st()).G;R.shops.leftAfterFlea=g.truck;}
 // pawn refuses an all-flea truck
 await p.evaluate(()=>BP.debug.set({truck:['mug','teddy']}));await goto(11);await sleep(600);R.shops.pawnRefuses=await p.evaluate(()=>document.querySelector('#modalBody h2')?.innerText||'');await snap('pawn-refuses-flea-items');await click('[data-act=closeModal]');await sleep(600);await idle();
 // upgrade: building transforms twice
 await p.evaluate(()=>BP.debug.set({cash:150}));await goto(7);await snap('upgrade-menu');await click('[data-act=upPick][data-k=flea]');await sleep(900);await snap('upgrade-transform');await sleep(1300);await snap('flea-stage1');await idle();
 await goto(7);await click('[data-act=upPick][data-k=flea]');await sleep(2300);await snap('flea-stage2-pirate-flea');await idle();R.flea=(await st()).G.flea;
 await p.evaluate(()=>{BP.debug.set({cash:300});BP.debug.focusTruck();});await sleep(1600);await snap('truck-L0-pickup');await goto(7);await click('[data-act=upPick][data-k=truck]');await sleep(1300);await snap('truck-upgrade-swap');await sleep(1800);await snap('truck-L1-flatbed');await idle();
 await goto(7);await click('[data-act=upPick][data-k=truck]');await sleep(3200);await snap('truck-L2-box-truck');await idle();R.truck={lv:(await st()).G.truckLv,cap:(await st()).G.cap};
 // Lucky slot: earned spins only
 await p.evaluate(()=>BP.debug.set({tickets:2}));await goto(12);await sleep(700);R.slot={ticketsOnOpen:(await st()).G.tickets};await snap('slot-open');
 await click('[data-act=spin]');await sleep(900);await snap('slot-spinning');await sleep(1800);await snap('slot-result');await click('[data-act=spin]');await sleep(2800);
 R.slot.after=(await st()).G.slotStats;R.slot.ticketsLeft=(await st()).G.tickets;R.slot.headline=await p.evaluate(()=>document.querySelector('#modalBody h2')?.innerText);await click('#modalBody [data-act=closeModal]');await sleep(600);await idle();
 // regen + pacing panel
 await p.evaluate(()=>{BP.debug.set({rolls:1});});await click('#pace');await sleep(500);await snap('pacing-panel');const r0=(await st()).G.rolls;await click('[data-act=paceSet][data-k=ff]');await sleep(400);
 R.regen={before:r0,afterSkip:(await st()).G.rolls,cfg:(await st()).G.regen,label:await p.evaluate(()=>document.getElementById('regen').innerText)};await click('[data-act=paceSet][data-k=every][data-v="60000"]');await sleep(300);R.regen.every=(await st()).G.regen.every;await click('#close');await sleep(400);
 // bonus: 12-case match
 await goto(4);await sleep(400);
 {const deck=await p.evaluate(()=>BP.debug.deck());const keys={};deck.forEach((c,i)=>{const k=c.e+'|'+c.l;(keys[k]=keys[k]||[]).push(i);});R.caseVisualsOk=Object.values(keys).every(v=>v.length===2)&&Object.keys(keys).length===6;
  // flip one true pair, then a mismatched pair
  const pair=Object.values(keys)[0];let n=await p.$$('#modalBody .case');await n[pair[0]].click();await sleep(250);n=await p.$$('#modalBody .case');await n[pair[1]].click();await sleep(1100);
  R.casePairWon=(await p.evaluate(()=>BP.debug.deck())).filter(c=>c.won).length===2;await snap('case-match');
  for(let t=0;t<5;t++){const d=await p.evaluate(()=>BP.debug.deck());const free=d.map((c,i)=>c.won?-1:i).filter(i=>i>=0);if(free.length<2)break;n=await p.$$('#modalBody .case');await n[free[0]].click();await sleep(250);n=await p.$$('#modalBody .case');await n[free[free.length-1]].click();await sleep(1100);if(await p.$('#modalBody [data-act=closeModal]'))break;}}
 R.caseTicketPrize=(await p.evaluate(()=>BP.debug.deck())).some(c=>c.e==='🎟️');await snap('case-match-end');await click('[data-act=closeModal]');await idle();
 // perk: Day Off gives +2 moves to the next locker
 {const b0=(await st()).G;await goto(2);await sleep(1800);await idle();const b1=(await st()).G;const keys=['cash','rolls','tickets','truck','cap','flea','truckLv','L','perk','clean'];
  R.dayOff={unchanged:keys.every(k=>JSON.stringify(b0[k])===JSON.stringify(b1[k])),diff:keys.filter(k=>JSON.stringify(b0[k])!==JSON.stringify(b1[k]))};}
 // rival: Big Earl
 await p.evaluate(()=>BP.debug.set({cash:200}));await goto(8);await sleep(400);await snap('big-earl');for(let k=0;k<12;k++){if(await click('[data-act=earl][data-a=raise]')){await sleep(400);continue;}break;}
 await sleep(400);R.earl=await p.evaluate(()=>document.querySelector('#modalBody h2')?.innerText);await click('[data-act=closeModal]');await sleep(2500);s=await st();if(s.clean){await snap('earl-locker');{const e=await st();R.earlLocker={tier:e.tier,moves:e.moves,label:await p.evaluate(()=>document.getElementById('subtitle').innerText)};}await p.evaluate(()=>BP.debug.win());await p.waitForFunction(()=>BP.state().modal,{timeout:20000});await click('[data-act=closeModal]');}await idle();
 // curb pile: zero rolls
 await p.evaluate(()=>{BP.debug.set({rolls:0,pos:2});BP.debug.panel();});await sleep(600);await snap('curb-pile-never-stuck');R.curb=await p.evaluate(()=>!!document.querySelector('[data-act=curb]'));
 const fin=await p.evaluate(()=>BP.perf());R.heapMB=fin.heap?+(fin.heap/1048576).toFixed(1):null;R.rendererEnd=fin.info;R.session=fpsStats({f:fin.frames,c:fin.cpu});
 R.saveKeys=await p.evaluate(()=>Object.keys(localStorage));R.errors=errs;R.http4xx=bad;all[S.n]=R;console.log(JSON.stringify(R));await b.close();}
fs.writeFileSync(path.join(SHOTS,'qa-'+(process.env.ONLY||'all')+'.json'),JSON.stringify(all,null,1));})().catch(e=>{console.error(e);process.exit(1);});
