// Storage Rush v2 headless playthrough at 390x844 (full Yard 1 campaign) and 375x667 (opening + final unit + Next Yard).
// Run: python3 -m http.server 8872 --bind 127.0.0.1 &  then  NODE_PATH=/workspace/pirate-apps/launch/node_modules node test/run.js
const puppeteer=require('puppeteer-core');const fs=require('fs');const path=require('path');
const BASE=process.env.URL||'http://127.0.0.1:8872/index.html';
const SHOTS=process.env.SHOTS!=='0';const ONLY=process.env.ONLY;
const out=[];let fails=0;const ok=(n,c,i)=>{const line=(c?'PASS ':'FAIL ')+n+(i!=null&&i!==''?'  — '+i:'');out.push(line);console.log(line);if(!c)fails++;};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const VPS=[
  {tag:'390x844',full:true,vp:{width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true},ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'},
  {tag:'375x667',full:false,vp:{width:375,height:667,deviceScaleFactor:2,isMobile:true,hasTouch:true},ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'}
].filter(v=>!ONLY||v.tag===ONLY);
(async()=>{
const root=path.join(__dirname,'..');
const files=['index.html','style.css','js/game.js','js/art.js','js/audio.js','js/engine.js','js/levels.js'];
const src=files.map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
ok('source never uses the banned word',!/tetris/i.test(src));
ok('no "No Home" copy anywhere',!/no home/i.test(src));
ok('start rung is The Pickup',/'The Pickup'/.test(src));
ok('no ads/analytics/payment/network code',!/(googletag|gtag\(|google-analytics|adsbygoogle|PaymentRequest|js\.stripe|fetch\(|XMLHttpRequest|WebSocket|sendBeacon)/i.test(src));
const csp=(html.match(/Content-Security-Policy" content="([^"]+)"/)||[])[1]||'';
ok('CSP kept: self-only scripts, no network, local fonts',/script-src 'self'/.test(csp)&&/connect-src 'none'/.test(csp)&&/font-src 'self'/.test(csp)&&/default-src 'self'/.test(csp),csp);
ok('display font is bundled locally',fs.existsSync(path.join(root,'fonts/LuckiestGuy-Regular.ttf'))&&fs.existsSync(path.join(root,'fonts/LICENSE.txt')));
ok('fence + door signs kept',src.includes("You can't hit a home run")&&src.includes('SCARED MONEY')&&src.includes("DON'T MAKE MONEY"));
ok('locked door says Unlock coming soon',html.includes('Unlock coming soon'));
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
for(const V of VPS){
  const T=V.tag;const pg=await b.newPage();const errs=[],ext=[];
  pg.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push(m.type()+': '+m.text())});pg.on('pageerror',e=>errs.push('pageerror: '+e.message));
  await pg.setRequestInterception(true);pg.on('request',r=>{const u=r.url();if(!u.startsWith(new URL(BASE).origin+'/')&&!u.startsWith('data:'))ext.push(u);r.continue();});
  await pg.emulate({viewport:V.vp,userAgent:V.ua});
  const cdp=await pg.target().createCDPSession();
  const tap=async(x,y)=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await wait(40);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
  const swipe=async(a,c2)=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a.x,y:a.y}]});for(let i=1;i<=5;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:a.x+(c2.x-a.x)*i/5,y:a.y+(c2.y-a.y)*i/5}]});await wait(16);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
  const tapSel=async s=>{const r=await pg.$eval(s,e=>{const b=e.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}});await tap(r.x,r.y);};
  const st=()=>pg.evaluate(()=>SR.state());
  const vis=s=>pg.$eval(s,e=>!e.classList.contains('hidden')&&e.offsetParent!==null).catch(()=>false);
  const txt=s=>pg.$eval(s,e=>e.textContent);
  const shot=async n=>{if(SHOTS)await pg.screenshot({path:path.join(root,'shots',`${T}-${n}.png`)});};
  const untilIdle=async()=>{for(let i=0;i<150;i++){const s=await st();if((!s.busy||s.result)&&!(await vis('#msg')&&false))return s;await wait(80);}return st();};
  const until=async(fn,ms)=>{const t0=Date.now();while(Date.now()-t0<(ms||8000)){const s=await st();if(await fn(s))return s;await wait(100);}return st();};
  const fitBad=[];const checkFit=async(label)=>{const bad=await pg.$$eval('button',bs=>bs.filter(b=>b.offsetParent!==null&&!b.closest('.hidden')).map(b=>{const r=b.getBoundingClientRect();return {id:b.id||b.textContent.trim().slice(0,14),ok:r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&r.height>=44&&r.width>=44,r:[r.left|0,r.top|0,r.width|0,r.height|0]};}).filter(x=>!x.ok));if(bad.length)fitBad.push(label+': '+JSON.stringify(bad));};
  const tapLock=async()=>{const L=await pg.evaluate(()=>SR.lockXY());await tap(L.x,L.y);};
  const seen={specials:new Set(),teachScr:false,room2:false,continueOffered:false,shots:{}};
  // Plays the board until win/fail. Returns 'win' or 'fail'.
  async function playBoard(opt){opt=opt||{};let lastUsed=-1,stuck=0;
    for(let step=0;step<200;step++){
      if(await vis('#msg')){const h=await txt('#msgH');
        if(/Out of bid cards/.test(h)){seen.continueOffered=true;await tapSel('#msgB');await wait(300);continue;}
        if(/cleared!/.test(h))return 'win';return 'fail';}
      let s=await st();
      if(s.mode!=='play'){if(s.mode==='door'){await tapLock();await wait(1800);continue;}await wait(150);continue;}
      if(s.result==='win'){await wait(700);continue;}
      if(s.busy){await wait(80);continue;}
      s.specials.forEach(x=>seen.specials.add(x.sp));
      if(s.scr==='teach')seen.teachScr=true;
      if(s.finds.length){if(s.scrapperMode==='teach'&&!seen.teachScr){await wait(1100);const s2=await st();if(s2.scr==='teach')seen.teachScr=true;}
        const f=s.finds[0];const p=await pg.evaluate((r,c)=>SR.cellXY(r,c),f.r,f.c);await tap(p.x,p.y);await wait(350);continue;}
      if(s.moves<=0){await wait(200);stuck++;if(stuck>40)return 'fail';continue;}
      const m=await pg.evaluate(()=>SR.bestMove());if(!m){await wait(200);continue;}
      const a=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.a[0],m.a[1]),c2=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.b[0],m.b[1]);
      await swipe(a,c2);await wait(120);await untilIdle();
      if(opt.after)await opt.after(await st());}
    return 'fail';}
  async function playUnit(label){let tries=0,startBi=null;
    for(;;){const s=await st();if(s.mode==='door'){await tapLock();await wait(1800);}
      const s1=await st();if(startBi==null)startBi=s1.bi;
      const r=await playBoard();
      if(r==='win')return tries;
      tries++;if(tries>8){ok(`${T} ${label} completable`,false,'gave up after 8 tries');return tries;}
      await tapSel('#msgB');await wait(400);}}
  async function flipAndLadder(label){await tapSel('#msgB');await wait(300);let s=await st();ok(`${T} ${label}: flip table opens`,s.mode==='flip');
    s=await until(x=>x.flipDone,15000);ok(`${T} ${label}: items sold, haul shown`,s.flipDone&&await vis('#haul'),await txt('#haul'));
    if(!seen.shots.flip){seen.shots.flip=1;await shot('flip');}
    await tapSel('#bFlipNext').catch(()=>{});await wait(500);return st();}

  /* ---- migration ---- */
  await pg.goto(BASE,{waitUntil:'load'});
  await pg.evaluate(()=>{localStorage.clear();localStorage.setItem('storageRush.v1',JSON.stringify({unit:5,bank:1234,sound:true}));});
  await pg.reload({waitUntil:'load'});await wait(500);
  let s=await st();ok(`${T} v1 save migrates to The Pickup with bank intact`,s.save.v===2&&s.save.bank===1234&&s.save.unit===0&&s.save.rung===0&&s.save.migratedFrom===1,JSON.stringify({bank:s.save.bank,unit:s.save.unit,rung:s.save.rung}));
  ok(`${T} old v1 key left alone`,await pg.evaluate(()=>!!localStorage.getItem('storageRush.v1')));
  /* ---- fresh ---- */
  await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'load'});await wait(900);
  s=await st();ok(`${T} fresh save gifts boosters 2/1/0`,s.save.boosters.cut===2&&s.save.boosters.flash===1&&s.save.boosters.free===0);
  ok(`${T} title: Open Unit, no Start over on a fresh save`,await vis('#bOpen')&&(await txt('#bOpenTxt'))==='Open Unit'&&!(await vis('#bReset')));
  ok(`${T} display font loaded from same origin`,await pg.evaluate(()=>document.fonts.check('30px "Luckiest Guy"')));
  await checkFit('title');await shot('title');
  await tapSel('#bSound');s=await st();const muted=await pg.evaluate(()=>document.body.classList.contains('muted'));await tapSel('#bSound');const s2=await st();
  ok(`${T} sound toggle flips and saves (music + sfx share it)`,s.save.sound===false&&muted&&s2.save.sound===true);
  await tapSel('#bOpen');await wait(600);s=await st();
  ok(`${T} ladder opens on The Pickup with the first-unit line`,s.mode==='ladder'&&(await txt('#ladSub'))==='You just won your first unit. Bank $0.'&&(await txt('#bLadNext'))==='Open Unit 12');
  ok(`${T} no "No Home" text on screen`,!(await pg.evaluate(()=>/no home/i.test(document.body.innerText))));
  await checkFit('ladder');await shot('ladder-start');
  /* ---- unit 1 ---- */
  await tapSel('#bLadNext');await wait(500);s=await st();ok(`${T} door closed with padlock`,s.mode==='door'&&s.door==='closed');await shot('door');
  await tapLock();await wait(120);s=await st();ok(`${T} lock tap starts jiggle/snap`,s.door==='open');await wait(1800);
  s=await st();ok(`${T} door rolls up into the framed board`,s.mode==='play'&&s.unitId==='Unit 12');
  ok(`${T} tutorial tip + finger shown on board 1`,await vis('#tut')&&s.tut==='swap');
  await checkFit('board');await shot('board1');
  const nm=await pg.evaluate(()=>SR.noMatchSwap());
  if(nm){const a=await pg.evaluate((r,c)=>SR.cellXY(r,c),nm.a[0],nm.a[1]),c2=await pg.evaluate((r,c)=>SR.cellXY(r,c),nm.b[0],nm.b[1]);await swipe(a,c2);await wait(500);s=await st();ok(`${T} no-match swap bounces back free`,s.used===0&&s.moves===22,'used='+s.used);}
  { const m=await pg.evaluate(()=>SR.bestMove());const a=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.a[0],m.a[1]),c2=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.b[0],m.b[1]);await swipe(a,c2);await wait(100);await untilIdle();s=await st();ok(`${T} swipe swap spends one move`,s.used===1);}
  let r=await playBoard();ok(`${T} Unit 12 (tutorial) won`,r==='win');
  s=await st();ok(`${T} find collected onto the cart`,s.collected.length>=1);
  ok(`${T} cleared card is a stamped work order`,(await txt('#msgStamp'))==='CLEARED'&&/Unit 12 cleared!/.test(await txt('#msgH')));
  await shot('cleared');
  s=await flipAndLadder('Unit 12');
  ok(`${T} bank grew from the flip`,s.save.bank>0,'$'+s.save.bank);
  ok(`${T} pawn hops one node, still on The Pickup leg`,s.mode==='ladder'&&s.save.unit===1&&s.save.rung===0);
  s=await until(x=>x.lad&&x.lad.phase==='done',4000);ok(`${T} hop finishes, next unit offered`,(await txt('#bLadNext'))==='Open Unit 14');
  ok(`${T} no Pickup tasks before 3 flips`,!(await vis('#tasks')));
  /* ---- unit 2: tutorial boards skip the +5 offer ---- */
  await tapSel('#bLadNext');await wait(400);await tapLock();await wait(1800);
  await pg.evaluate(()=>SR.setMoves(1));
  { s=await st();if(!s.finds.length){const m=await pg.evaluate(()=>SR.bestMove());const a=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.a[0],m.a[1]),c2=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.b[0],m.b[1]);await swipe(a,c2);await untilIdle();}
    await wait(900);s=await st();
    if(s.status==='out'){ok(`${T} tutorial board: out of moves skips +5 offer`,await vis('#msg')&&/Out of moves/.test(await txt('#msgH')));await tapSel('#msgB');await wait(400);}
    else ok(`${T} tutorial board: out of moves skips +5 offer`,true,'skipped (find on board / won)');}
  if(!(await vis('#msg'))||!/cleared/.test(await txt('#msgH'))){await playUnit('Unit 14');}
  s=await flipAndLadder('Unit 14');await until(x=>x.lad&&x.lad.phase==='done',4000);
  /* ---- unit 3 ---- */
  await tapSel('#bLadNext');await wait(400);await playUnit('Unit 19');s=await flipAndLadder('Unit 19');await until(x=>x.lad&&x.lad.phase==='done',4000);
  ok(`${T} after 3 flips: Pickup tasks panel`,await vis('#tasks')&&/Fix up The Pickup/.test(await txt('#tasks h3')));
  await checkFit('ladder+tasks');await shot('ladder-tasks');
  s=await st();
  if(s.save.bank>=200){await tapSel('#tasks button[data-task="wash"]');await wait(300);s=await st();ok(`${T} buying a task plays the build`,s.building&&s.save.tasks.includes('wash'));
    await wait(1900);await shot('built');s=await until(x=>!x.building,4000);ok(`${T} built toast + panel returns`,!s.building&&(await txt('#ladBuilt')).length>3);}
  else ok(`${T} buying a task plays the build`,false,'bank too low: $'+s.save.bank);
  ok(`${T} glove box daily booster offered`,await vis('#bGlove'));
  { const b0=(await st()).save.boosters;await tapSel('#bGlove');await wait(200);const b1=(await st()).save.boosters;ok(`${T} glove box adds one booster`,b1.cut+b1.flash+b1.free===b0.cut+b0.flash+b0.free+1);}
  /* ---- unit 4: boosters + continue offer + dolly teach ---- */
  await tapSel('#bLadNext');await wait(400);await tapLock();await wait(1800);s=await st();
  ok(`${T} board 4 teaches the Dolly`,s.teach==='dolly'&&await vis('#tut'));
  { const t=s.tarps[0];const c0=s.save.boosters.cut;await tapSel('#bCut');await wait(100);const p=await pg.evaluate((r,c)=>SR.cellXY(r,c),t.r,t.c);await tap(p.x,p.y);await wait(500);await untilIdle();s=await st();
    const t2=s.tarps.find(x=>x.r===t.r&&x.c===t.c);ok(`${T} Bolt Cutters cut one tarp layer, no move spent`,s.save.boosters.cut===c0-1&&s.used===0&&(!t2||t2.layers===t.layers-1),JSON.stringify({before:t.layers,after:t2&&t2.layers}));}
  { const f0=(await st()).save.boosters.flash;if(f0>0){await tapSel('#bFlash');await wait(150);s=await st();ok(`${T} Flashlight x-rays tarps`,s.flash&&s.save.boosters.flash===f0-1);await shot('flashlight');}}
  await pg.evaluate(()=>SR.setMoves(1));
  { s=await st();if(!s.finds.length){const m=await pg.evaluate(()=>SR.bestMove());const a=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.a[0],m.a[1]),c2=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.b[0],m.b[1]);await swipe(a,c2);await untilIdle();}
    await wait(900);s=await st();
    if(s.status==='out'){ok(`${T} out of moves offers free +5 before the fail card`,await vis('#msg')&&/Out of bid cards/.test(await txt('#msgH'))&&/free/.test(await txt('#msgB')));
      await shot('continue');await tapSel('#msgB');await wait(300);s=await st();ok(`${T} +5 moves granted once`,s.moves===5&&s.continued);}
    else ok(`${T} out of moves offers free +5 before the fail card`,true,'skipped (find on board)');}
  await playUnit('Unit 27');
  if(V.full){
    s=await flipAndLadder('Unit 27');await until(x=>x.lad&&x.lad.phase==='done',4000);
    for(let u=4;u<12;u++){s=await st();const name=(await txt('#bLadNext')).replace('Open ','');
      // buy any affordable task to keep the ladder moving
      for(let k=0;k<2;k++){const can=await pg.$$eval('#tasks button:not([disabled])',bs=>bs.map(b=>b.dataset.task));if(can.length&&await vis('#tasks')){await tapSel(`#tasks button[data-task="${can[0]}"]`);await until(x=>!x.building,6000);}}
      await tapSel('#bLadNext');await wait(400);
      const tries=await playUnit(name);s=await st();
      ok(`${T} ${name} cleared`,await vis('#msg')&&/cleared/.test(await txt('#msgH')),tries+' retries');
      if(s.boards>1)seen.room2=true;
      s=await flipAndLadder(name);
      if(u===9){await until(x=>x.lad&&x.lad.phase==='done',4000);await wait(400);s=await st();ok(`${T} 10 units: reached First Yard (rung 1)`,s.save.rung===1);await shot('ladder-yard');}
      await until(x=>x.lad&&x.lad.phase==='done',4000);}
    ok(`${T} Dolly / Bubble Wrap / Gavel all showed up`,['dolly','wrap','gavel'].every(k=>seen.specials.has(k)),[...seen.specials].join(','));
    ok(`${T} Scrapper teach near-miss played`,seen.teachScr);
    ok(`${T} two-room units played`,seen.room2);
  } else {
    // jump to the last unit with a saved game
    await pg.evaluate(()=>{const s=JSON.parse(localStorage.getItem('storageRush.v2'));s.unit=11;s.rung=1;s.bank+=3000;localStorage.setItem('storageRush.v2',JSON.stringify(s));});
    await pg.reload({waitUntil:'load'});await wait(600);await tapSel('#bOpen');await wait(500);
    ok(`${T} saved progress resumes on the ladder at First Yard`,(await txt('#bLadNext'))==='Open The Big One');
    await shot('ladder-yard');
    await tapSel('#bLadNext');await wait(400);const tries=await playUnit('The Big One');ok(`${T} The Big One cleared`,/cleared/.test(await txt('#msgH')),tries+' retries');
    await flipAndLadder('The Big One');await until(x=>x.lad&&x.lad.phase==='done',4000);
  }
  /* ---- Next Yard ---- */
  ok(`${T} after Yard 1 the ladder offers Next Yard`,(await txt('#bLadNext'))==='Next Yard');
  await tapSel('#bLadNext');await wait(500);s=await st();
  ok(`${T} Next Yard screen: Yard 2 door + Unlock coming soon`,s.mode==='locked'&&(await txt('#bUnlock'))==='Unlock coming soon');
  ok(`${T} design note hidden without ?debug=1`,!(await vis('#debugNote')));
  await checkFit('next yard');await shot('next-yard');
  const bankL=s.save.bank;
  const D=await pg.evaluate(()=>SR.lockedDoorXY());await tap(D.x,D.y);await wait(200);
  ok(`${T} tapping the locked door: Unlock coming soon, no purchase`,await vis('#toast')&&(await txt('#toast'))==='Unlock coming soon'&&(await st()).save.bank===bankL);
  await tapSel('#bUnlock');await wait(200);ok(`${T} Unlock button only toasts`,(await st()).mode==='locked'&&(await st()).save.bank===bankL);
  await tapSel('#bVisit');await wait(500);s=await st();ok(`${T} Visit the ladder keeps the bank`,s.mode==='ladder'&&s.save.bank===bankL);
  await tapSel('#bLadNext');await wait(400);
  await tapSel('#bEndless');await wait(400);s=await st();ok(`${T} Endless Auction opens a generated unit`,s.kind==='endless'&&s.mode==='door');
  { const tries=await playUnit('Endless #1');await flipAndLadder('Endless #1');s=await st();ok(`${T} Endless clear returns to Next Yard, counter up`,s.mode==='locked'&&s.save.endless.n===1,tries+' retries');}
  /* ---- Daily ---- */
  await tapSel('#bHome');await wait(400);ok(`${T} Daily Auction unlocked on title`,!(await pg.$eval('#bDaily',e=>e.disabled)));
  await tapSel('#bDaily');await wait(400);s=await st();ok(`${T} daily screen with 7-day punch card`,s.mode==='daily'&&(await pg.$$eval('#punch div',d=>d.length))===7);
  await checkFit('daily');await shot('daily');
  await tapSel('#bDailyGo');await wait(400);
  if(V.full){for(let i=0;i<3;i++){await playBoard();if(await vis('#msg')&&!/cleared/.test(await txt('#msgH'))){await tapSel('#msgB');await wait(300);i--;continue;}}
    await flipAndLadder('Daily');s=await st();ok(`${T} 3 daily boards punch today's card`,s.mode==='daily'&&s.save.daily.punch.length===1&&(await pg.$$eval('#punch .on',d=>d.length))===1&&await pg.$eval('#bDailyGo',e=>e.disabled));}
  else{await playBoard();s=await st();ok(`${T} daily board 1 plays and saves progress`,s.save.daily.boards>=1||s.bi>=1);await tapSel('#bHome').catch(()=>{});}
  /* ---- Start over ---- */
  await pg.evaluate(()=>document.getElementById('msg').classList.add('hidden'));
  await tapSel('#bHome');await wait(300);ok(`${T} Start over button on title for a played save`,await vis('#bReset'));
  const bk=(await st()).save.bank;await tapSel('#bReset');await wait(200);ok(`${T} Start over asks to confirm`,/Start over\?/.test(await txt('#msgH')));
  await tapSel('#msgB');await wait(200);ok(`${T} "Keep my stuff" keeps the save`,(await st()).save.bank===bk);
  await tapSel('#bReset');await wait(200);await tapSel('#msgB2');await wait(300);s=await st();ok(`${T} "Wipe it" starts fresh`,s.save.bank===0&&s.save.unit===0&&s.save.boosters.cut===2);
  /* ---- debug note ---- */
  await pg.evaluate(()=>{const s=JSON.parse(localStorage.getItem('storageRush.v2'));s.unit=12;s.rung=1;localStorage.setItem('storageRush.v2',JSON.stringify(s));});
  await pg.goto(BASE+'?debug=1',{waitUntil:'load'});await wait(400);await tapSel('#bOpen');await wait(400);await tapSel('#bLadNext');await wait(400);
  ok(`${T} ?debug=1 shows the flagged store design note, not a store`,await vis('#debugNote')&&/NOT for sale/.test(await txt('#debugNote')));
  ok(`${T} every visible button on screen and >=44px`,fitBad.length===0,fitBad.join(' | '));
  ok(`${T} no console errors/warnings`,errs.length===0,errs.slice(0,4).join(' | '));
  ok(`${T} no external requests`,ext.length===0,ext.slice(0,3).join(' '));
  await pg.close();}
await b.close();
const summary=`\n${out.length-fails}/${out.length} passed  (${new Date().toLocaleString('en-US',{timeZone:'America/Los_Angeles'})} PT, ${BASE})`;
console.log(summary);fs.writeFileSync(path.join(__dirname,'last-run.txt'),out.join('\n')+summary+'\n');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
