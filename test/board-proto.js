// QA for the isolated board prototype (/board/). Usage: ONLY=390x844 node test/board-proto.js
const puppeteer=require('puppeteer-core'),fs=require('fs'),path=require('path');
const BASE=process.env.BASE||'http://127.0.0.1:8872/board/';
const SIZES=[{n:'390x844',w:390,h:844,m:true},{n:'375x667',w:375,h:667,m:true},{n:'1280x800',w:1280,h:800,m:false}].filter(s=>!process.env.ONLY||s.n===process.env.ONLY);
const SHOTS=path.join(__dirname,'..','docs','shots','board-proto-nov22');fs.mkdirSync(SHOTS,{recursive:true});
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
 const click=async sel=>{const h=await p.$(sel);if(!h)return false;const ok=await p.evaluate(e=>!e.disabled,h);if(!ok)return false;await h.click();return true;};
 const t0=Date.now();await p.goto(BASE+'?fresh=1&debug=1',{waitUntil:'load'});await p.waitForFunction(()=>window.BP&&BP.perf().readyMs!=null,{timeout:60000});
 R.firstFrameWallMs=Date.now()-t0;R.firstFrameMs=Math.round(await p.evaluate(()=>BP.perf().readyMs));
 R.nav=await p.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];return {dcl:Math.round(n.domContentLoadedEventEnd),load:Math.round(n.loadEventEnd)};});
 await sleep(1500);await snap('intro-overview');
 const f0=(await p.evaluate(()=>BP.perf().total));await sleep(5000);const pf=await p.evaluate(()=>BP.perf());R.idleBoard=fpsStats(win(pf,f0));R.quality=pf.info.quality;R.renderer=pf.info;
 await click('[data-act=start]');await p.waitForFunction(()=>BP.state().clean&&!BP.state().busy,{timeout:30000});await sleep(600);await snap('cleanout-start');
 // play real moves by touch / mouse, measuring tap->next frame latency
 const fm=(await p.evaluate(()=>BP.perf().total));
 let nearShot=false,celeb=false;R.cleanout={startLeft:(await st()).left,startMoves:(await st()).moves};
 for(let i=0;i<40;i++){const s0=await st();if(!s0.clean||s0.status!=='play')break;const m=await p.evaluate(()=>BP.bestMove());if(!m){await sleep(400);continue;}const A=await p.evaluate((r,c)=>BP.cellXY(r,c),...m.a),B=await p.evaluate((r,c)=>BP.cellXY(r,c),...m.b);
  if(S.m){await p.touchscreen.tap(A.x,A.y);await sleep(60);await p.touchscreen.tap(B.x,B.y);}else{await p.mouse.click(A.x,A.y);await sleep(60);await p.mouse.click(B.x,B.y);}
  await sleep(300);if(i===2)await snap('cleanout-cascade');
  const t=Date.now();while(Date.now()-t<20000){const q=await st();if(q.status==='win'&&!celeb){celeb=true;await sleep(700);await snap('locker-empty-celebration');}if(!q.busy||q.modal)break;await sleep(120);}
  const s1=await st();if(!nearShot&&s1.clean&&s1.left<=12&&s1.left>0&&s1.status==='play'){nearShot=true;await snap('cleanout-near-empty');}if(s1.modal||!s1.clean)break;}
 const se=await st();R.cleanout.endMovesLeft=se.moves;R.cleanout.shoves=se.shoves;R.cleanout.wonByPlay=celeb||se.modal;
 const pm=await p.evaluate(()=>BP.perf());R.cleanoutPlay=fpsStats(win(pm,fm));const L=pm.lat.slice().sort((a,b)=>a-b);R.tapLatencyMs={n:L.length,median:Math.round(L[Math.floor(L.length/2)]),p95:Math.round(L[Math.floor(L.length*.95)]),max:Math.round(L[L.length-1])};
 let s=await st();if(s.clean&&s.status==='play'&&!s.modal){await p.evaluate(()=>BP.debug.win());}
 await p.waitForFunction(()=>BP.state().modal,{timeout:20000});await sleep(500);await snap('locker-unloaded-summary');await click('[data-act=closeModal]');await idle();await sleep(1200);
 // roll and travel
 s=await st();R.rollsAfterFirstCleanout=s.G.rolls;await click('[data-act=roll]');await sleep(S.m?1800:1200);await snap('dice-and-hop');await sleep(4000);await idle(30000);s=await st();R.afterRoll={pos:s.G.pos,modal:s.modal};
 // close whatever the landing opened, generically
 for(let k=0;k<6;k++){s=await st();if(!s.modal&&!s.clean)break;if(s.clean){await p.evaluate(()=>BP.debug.win());await sleep(1200);}if(await click('#modal:not(.hidden) [data-act=closeModal]')||await click('#modal:not(.hidden) [data-act=pawnA][data-a=take]'))await sleep(800);else{await click('#close');await sleep(800);}}
 await idle();
 const items=await p.evaluate(()=>['tinrobot',ITEMS.pick('c',2,Math.random,{}),ITEMS.pick('c',2,Math.random,{}),ITEMS.pick('u',2,Math.random,{}),ITEMS.pick('c',2,Math.random,{})]);
 const goto=async pos=>{await p.evaluate(pos=>{BP.debug.set({pos});BP.debug.land();},pos);await sleep(1200);};
 // pawn negotiation
 await p.evaluate(t=>BP.debug.set({truck:t,cash:20}),items);await goto(3);await click('[data-act=pawnPick]');await sleep(500);await snap('pawn-offer');
 await click('[data-act=pawnA][data-a=push]');await sleep(500);await snap('pawn-after-push');R.pawn=await p.evaluate(()=>document.querySelector('#modalBody h2').innerText+' | '+(document.querySelector('.big-value')||{innerText:''}).innerText);
 for(let k=0;k<4&&(await st()).modal;k++){if(!(await click('[data-act=pawnA][data-a=take]')))await click('[data-act=closeModal]');await sleep(600);}await idle();
 // flea market
 await goto(6);await sleep(800);await snap('flea-market');await click('[data-act=fleaSell][data-i=best]');await sleep(1200);await idle();
 // upgrade: building transforms twice
 await p.evaluate(()=>BP.debug.set({cash:150}));await goto(7);await snap('upgrade-menu');await click('[data-act=upPick][data-k=flea]');await sleep(900);await snap('upgrade-transform');await sleep(1300);await snap('flea-stage1');await idle();
 await goto(7);await click('[data-act=upPick][data-k=flea]');await sleep(2300);await snap('flea-stage2-pirate-flea');await idle();R.flea=(await st()).G.flea;
 // bonus: 12-case match
 await goto(4);await sleep(300);for(let i=0;i<12&&(await st()).modal;i++){const n=await p.$$('#modalBody .case:not([disabled])');if(!n.length)break;await n[0].click();await sleep(200);const n2=await p.$$('#modalBody .case:not([disabled])');if(n2.length)await n2[Math.min(n2.length-1,i%3)].click();await sleep(900);if(i===2)await snap('case-match');if(await p.$('#modalBody [data-act=closeModal]'))break;}
 await snap('case-match-end');await click('[data-act=closeModal]');await idle();
 // rival: Big Earl
 await p.evaluate(()=>BP.debug.set({cash:200}));await goto(8);await sleep(400);await snap('big-earl');for(let k=0;k<12;k++){if(await click('[data-act=earl][data-a=raise]')){await sleep(400);continue;}break;}
 await sleep(400);R.earl=await p.evaluate(()=>document.querySelector('#modalBody h2')?.innerText);await click('[data-act=closeModal]');await sleep(2500);s=await st();if(s.clean){await snap('earl-locker');await p.evaluate(()=>BP.debug.win());await p.waitForFunction(()=>BP.state().modal,{timeout:20000});await click('[data-act=closeModal]');}await idle();
 // curb pile: zero rolls
 await p.evaluate(()=>{BP.debug.set({rolls:0,pos:2});BP.debug.panel();});await sleep(600);await snap('curb-pile-never-stuck');R.curb=await p.evaluate(()=>!!document.querySelector('[data-act=curb]'));
 const fin=await p.evaluate(()=>BP.perf());R.heapMB=fin.heap?+(fin.heap/1048576).toFixed(1):null;R.rendererEnd=fin.info;R.session=fpsStats({f:fin.frames,c:fin.cpu});
 R.saveKeys=await p.evaluate(()=>Object.keys(localStorage));R.errors=errs;R.http4xx=bad;all[S.n]=R;console.log(JSON.stringify(R));await b.close();}
fs.writeFileSync('/tmp/board-qa-'+(process.env.ONLY||'all')+'.json',JSON.stringify(all,null,1));})().catch(e=>{console.error(e);process.exit(1);});
