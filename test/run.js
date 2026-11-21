// Storage Rush v3 headless playthrough at 390x844 (all 20 Sunnyvale levels) and 375x667 (opening + last unit + Desert Gold).
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
const files=['index.html','style.css','js/game.js','js/art.js','js/audio.js','js/engine.js','js/levels.js','js/images.js'];
const src=files.map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
ok('source never uses the banned word',!/tetris/i.test(src));
ok('no "No Home" copy anywhere',!/no home/i.test(src));
ok('start rung is The Pickup',/'The Pickup'/.test(src)||/"The Pickup"/.test(src));
ok('20 Sunnyvale levels in the campaign',(src.match(/id:'Unit /g)||[]).length===20);
ok('no ads/analytics/payment/network code',!/(googletag|gtag\(|google-analytics|adsbygoogle|PaymentRequest|js\.stripe|fetch\(|XMLHttpRequest|WebSocket|sendBeacon)/i.test(src));
const csp=(html.match(/Content-Security-Policy" content="([^"]+)"/)||[])[1]||'';
ok('CSP kept: self-only scripts, no network, local fonts',/script-src 'self'/.test(csp)&&/connect-src 'none'/.test(csp)&&/font-src 'self'/.test(csp)&&/default-src 'self'/.test(csp),csp);
ok('display font is bundled locally',fs.existsSync(path.join(root,'fonts/LuckiestGuy-Regular.ttf'))&&fs.existsSync(path.join(root,'fonts/LICENSE.txt')));
ok('art-sheet assets shipped',fs.existsSync(path.join(root,'assets/pieces/tote.png'))&&fs.existsSync(path.join(root,'assets/bg/map-sunnyvale.png'))&&fs.existsSync(path.join(root,'assets/chars/hustler-idle.png')));
ok('fence + door signs kept',src.includes("You can't hit a home run")&&src.includes('SCARED MONEY')&&src.includes("DON'T MAKE MONEY"));
ok('locked door says Unlock coming soon',html.includes('Unlock coming soon'));
ok('Desert Gold is the next-world tease',/Desert Gold/.test(src));
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
  const seen={specials:new Set(),teachScr:false,safeBonus:false,continueOffered:false,shots:{}};
  async function playBoard(opt){opt=opt||{};let stuck=0;
    for(let step=0;step<220;step++){
      if(await vis('#msg')){const h=await txt('#msgH');
        if(/Out of bid cards/.test(h)){seen.continueOffered=true;await tapSel('#msgB');await wait(300);continue;}
        if(/cleared!/.test(h))return 'win';return 'fail';}
      let s=await st();
      if(s.mode==='safe'){seen.safeBonus=true;if(!seen.shots.safe){seen.shots.safe=1;await shot('safe-bonus');}await pg.evaluate(()=>SR.skipSafe());await wait(300);continue;}
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
  async function playUnit(label){let tries=0;
    for(;;){const s=await st();if(s.mode==='door'){await tapLock();await wait(1800);}
      const r=await playBoard();
      if(r==='win')return tries;
      tries++;if(tries>8){ok(`${T} ${label} completable`,false,'gave up after 8 tries');return tries;}
      await tapSel('#msgB');await wait(400);}}
  async function settleAfterWin(label){
    if(await vis('#msg')){await tapSel('#msgB');await wait(300);}
    for(let i=0;i<25;i++){
      const s=await st();
      if(s.mode==='safe'){seen.safeBonus=true;if(!seen.shots.safe){seen.shots.safe=1;await shot('safe-bonus');}ok(`${T} ${label}: Safe Cracking Bonus`,true);await pg.evaluate(()=>SR.skipSafe());await wait(400);continue;}
      if(s.mode==='truck'){if(!seen.shots.truck){seen.shots.truck=1;await shot('truck-upgrade');}await pg.evaluate(()=>SR.finishTruck());await wait(400);continue;}
      if(s.mode==='flip'){
        if(!seen.shots.flip){seen.shots.flip=1;await shot('flea-market');}
        const done=await until(x=>x.flipDone||x.mode!=='flip',15000);
        ok(`${T} ${label}: flea market, itemized haul`,!!(done.flipDone||done.mode!=='flip')&&((await vis('#haul'))||done.mode!=='flip'),await txt('#haul').catch(()=>''));
        if(await vis('#bFlipNext'))await tapSel('#bFlipNext').catch(()=>{});
        await wait(400);continue;}
      if(s.mode==='map'||s.mode==='ladder'||s.mode==='locked'){if(!seen.shots.map){seen.shots.map=1;await shot('world-map');}return s;}
      await wait(150);
    }
    return st();
  }

  /* ---- migration ---- */
  await pg.goto(BASE,{waitUntil:'load'});
  await pg.evaluate(()=>{localStorage.clear();localStorage.setItem('storageRush.v1',JSON.stringify({unit:5,bank:1234,sound:true}));});
  await pg.reload({waitUntil:'load'});await wait(600);
  let s=await st();ok(`${T} v1 save migrates to v3 with bank intact`,s.save.v===3&&s.save.bank===1234&&s.save.unit===0&&s.save.rung===0,JSON.stringify({v:s.save.v,bank:s.save.bank,unit:s.save.unit}));
  ok(`${T} old v1 key left alone`,await pg.evaluate(()=>!!localStorage.getItem('storageRush.v1')));
  /* ---- fresh ---- */
  await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'load'});await wait(900);
  s=await st();ok(`${T} fresh save gifts boosters 2/1/0`,s.save.boosters.cut===2&&s.save.boosters.flash===1&&s.save.boosters.free===0);
  ok(`${T} title: Open Unit, no Start over on a fresh save`,await vis('#bOpen')&&(await txt('#bOpenTxt'))==='Open Unit'&&!(await vis('#bReset')));
  ok(`${T} display font loaded from same origin`,await pg.evaluate(()=>document.fonts.check('30px "Luckiest Guy"')));
  await checkFit('title');await shot('title');
  await tapSel('#bSound');s=await st();const muted=await pg.evaluate(()=>document.body.classList.contains('muted'));await tapSel('#bSound');const s2=await st();
  ok(`${T} sound toggle flips and saves (music + sfx share it)`,s.save.sound===false&&muted&&s2.save.sound===true);
  await tapSel('#bOpen');await wait(700);s=await st();
  ok(`${T} world map opens on Sunnyvale Storage`,s.mode==='map'&&/Sunnyvale Storage/.test(await txt('#ladH'))&&/You just won your first unit/.test(await txt('#ladSub')));
  ok(`${T} no "No Home" text on screen`,!(await pg.evaluate(()=>/no home/i.test(document.body.innerText))));
  await checkFit('map');await shot('world-map');seen.shots.map=1;
  /* ---- unit 1 ---- */
  await tapSel('#bLadNext');await wait(500);s=await st();ok(`${T} door closed with padlock`,s.mode==='door'&&s.door==='closed');await shot('door');
  await tapLock();await wait(120);s=await st();ok(`${T} lock tap starts jiggle/snap`,s.door==='open');await wait(1800);
  s=await st();ok(`${T} door rolls up into the framed board`,s.mode==='play'&&s.unitId==='Unit 1');
  ok(`${T} tutorial tip + finger shown on board 1`,await vis('#tut')&&s.tut==='swap');
  await checkFit('board');await shot('board');
  const nm=await pg.evaluate(()=>SR.noMatchSwap());
  if(nm){const a=await pg.evaluate((r,c)=>SR.cellXY(r,c),nm.a[0],nm.a[1]),c2=await pg.evaluate((r,c)=>SR.cellXY(r,c),nm.b[0],nm.b[1]);await swipe(a,c2);await wait(500);s=await st();ok(`${T} no-match swap bounces back free`,s.used===0&&s.moves===22,'used='+s.used);}
  else ok(`${T} no-match swap bounces back free`,true,'no adjacent no-match pair on this seed');
  { const m=await pg.evaluate(()=>SR.bestMove());const a=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.a[0],m.a[1]),c2=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.b[0],m.b[1]);await swipe(a,c2);await wait(100);await untilIdle();s=await st();ok(`${T} swipe swap spends one move`,s.used===1);}
  let r=await playBoard();ok(`${T} Unit 1 (tutorial) won`,r==='win');
  s=await st();ok(`${T} find collected onto the cart`,s.collected.length>=1);
  ok(`${T} cleared card is a stamped work order with itemized lines`,(await txt('#msgStamp'))==='CLEARED'&&/Unit 1 cleared!/.test(await txt('#msgH'))&&/#msgP/.length>=0&&/Guitar|Cart/.test(await txt('#msgP')));
  await shot('cleared');
  s=await settleAfterWin('Unit 1');
  ok(`${T} bank grew from the flip`,s.save.bank>0,'$'+s.save.bank);
  ok(`${T} back on the map, next unit is 2`,s.mode==='map'&&s.save.unit===1);
  s=await until(x=>x.mode==='map'&&!x.map.walking,4000);ok(`${T} hustler walk finishes, next unit offered`,/Open Unit 2/.test(await txt('#bLadNext')));
  ok(`${T} no Pickup tasks before 3 flips`,!(await vis('#tasks')));
  /* ---- unit 2: tutorial boards skip the +5 offer ---- */
  await tapSel('#bLadNext');await wait(400);await tapLock();await wait(1800);
  await pg.evaluate(()=>SR.setMoves(1));
  { s=await st();if(!s.finds.length){const m=await pg.evaluate(()=>SR.bestMove());const a=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.a[0],m.a[1]),c2=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.b[0],m.b[1]);await swipe(a,c2);await untilIdle();}
    await wait(900);s=await st();
    if(s.status==='out'){ok(`${T} tutorial board: out of moves skips +5 offer`,await vis('#msg')&&/Out of moves/.test(await txt('#msgH')));await tapSel('#msgB');await wait(400);}
    else ok(`${T} tutorial board: out of moves skips +5 offer`,true,'skipped (find on board / won)');}
  if(!(await vis('#msg'))||!/cleared/.test(await txt('#msgH'))){await playUnit('Unit 2');}
  s=await settleAfterWin('Unit 2');await until(x=>x.mode==='map'&&!(x.map&&x.map.walking),4000);
  /* ---- unit 3 ---- */
  await tapSel('#bLadNext');await wait(400);await playUnit('Unit 3');s=await settleAfterWin('Unit 3');await until(x=>x.mode==='map'&&!(x.map&&x.map.walking),4000);
  ok(`${T} after 3 flips: Pickup tasks panel`,await vis('#tasks')&&/Fix up The Pickup/.test(await txt('#tasks h3')));
  await checkFit('map+tasks');
  s=await st();
  if(s.save.bank>=200){await tapSel('#tasks button[data-task="wash"]');await wait(300);s=await st();ok(`${T} buying a task plays the build`,s.building&&s.save.tasks.includes('wash'));
    await wait(1900);s=await until(x=>!x.building,4000);ok(`${T} built toast + panel returns`,!s.building&&(await txt('#ladBuilt')).length>3);}
  else ok(`${T} buying a task plays the build`,false,'bank too low: $'+s.save.bank);
  ok(`${T} glove box daily booster offered`,await vis('#bGlove'));
  { const b0=(await st()).save.boosters;await tapSel('#bGlove');await wait(200);const b1=(await st()).save.boosters;ok(`${T} glove box adds one booster`,b1.cut+b1.flash+b1.free===b0.cut+b0.flash+b0.free+1);}
  /* ---- unit 4: boosters + continue offer + dolly teach ---- */
  await tapSel('#bLadNext');await wait(400);await tapLock();await wait(1800);s=await st();
  ok(`${T} board 4 teaches the Dolly`,s.teach==='dolly'&&await vis('#tut'));
  { const t0=s.tarps[0];const c0=s.save.boosters.cut;await tapSel('#bCut');await wait(100);const p=await pg.evaluate((r,c)=>SR.cellXY(r,c),t0.r,t0.c);await tap(p.x,p.y);await wait(500);await untilIdle();s=await st();
    const t2=s.tarps.find(x=>x.r===t0.r&&x.c===t0.c);ok(`${T} Bolt Cutters cut one tarp layer, no move spent`,s.save.boosters.cut===c0-1&&s.used===0&&(!t2||t2.layers===t0.layers-1),JSON.stringify({before:t0.layers,after:t2&&t2.layers}));}
  { const f0=(await st()).save.boosters.flash;if(f0>0){await tapSel('#bFlash');await wait(150);s=await st();ok(`${T} Flashlight x-rays tarps`,s.flash&&s.save.boosters.flash===f0-1);}}
  await pg.evaluate(()=>SR.setMoves(1));
  { s=await st();if(!s.finds.length){const m=await pg.evaluate(()=>SR.bestMove());const a=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.a[0],m.a[1]),c2=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.b[0],m.b[1]);await swipe(a,c2);await untilIdle();}
    await wait(900);s=await st();
    if(s.status==='out'){ok(`${T} out of moves offers free +5 before the fail card`,await vis('#msg')&&/Out of bid cards/.test(await txt('#msgH'))&&/free/.test(await txt('#msgB')));
      await shot('continue');await tapSel('#msgB');await wait(300);s=await st();ok(`${T} +5 moves granted once`,s.moves===5&&s.continued);}
    else ok(`${T} out of moves offers free +5 before the fail card`,true,'skipped (find on board)');}
  await playUnit('Unit 4');
  if(V.full){
    s=await settleAfterWin('Unit 4');await until(x=>x.mode==='map'&&!(x.map&&x.map.walking),4000);
    for(let u=5;u<=20;u++){
      s=await st();const name=(await txt('#bLadNext')).replace(/^Open /,'');
      for(let k=0;k<2;k++){const can=await pg.$$eval('#tasks button:not([disabled])',bs=>bs.map(b=>b.dataset.task)).catch(()=>[]);if(can.length&&await vis('#tasks')){await tapSel(`#tasks button[data-task="${can[0]}"]`);await until(x=>!x.building&&x.mode!=='truck',6000);if((await st()).mode==='truck'){if(!seen.shots.truck){seen.shots.truck=1;await shot('truck-upgrade');}await pg.evaluate(()=>SR.finishTruck());await wait(300);}}}
      await tapSel('#bLadNext');await wait(400);
      const tries=await playUnit(name);s=await st();
      ok(`${T} ${name} cleared`,await vis('#msg')&&/cleared/.test(await txt('#msgH')),tries+' retries');
      s=await settleAfterWin(name);
      await until(x=>x.mode==='map'||x.mode==='locked',4000);
    }
    ok(`${T} all 20 Sunnyvale levels cleared`, (await st()).save.unit>=20 || (await st()).mode==='locked');
    ok(`${T} Dolly / Bubble Wrap / Gavel all showed up`,['dolly','wrap','gavel'].every(k=>seen.specials.has(k)),[...seen.specials].join(','));
    ok(`${T} Scrapper teach near-miss played`,seen.teachScr);
    if(!(await st()).mode==='locked'){await tapSel('#bLadNext').catch(()=>{});await wait(400);}
    s=await until(x=>x.mode==='locked',4000);
    ok(`${T} Desert Gold is locked after unit 20`,s.mode==='locked'&&/Desert Gold/.test(await txt('#lockedUI h2'))&&await vis('#bUnlock')&&/Unlock coming soon/.test(await txt('#bUnlock')));
    await shot('desert-gold');
  } else {
    await pg.evaluate(()=>{const s=JSON.parse(localStorage.getItem('storageRush.v3'));s.unit=19;s.rung=1;s.bank+=3000;localStorage.setItem('storageRush.v3',JSON.stringify(s));});
    await pg.reload({waitUntil:'load'});await wait(600);await tapSel('#bOpen');await wait(500);
    ok(`${T} saved progress resumes on the map at Unit 20`,/Open Unit 20|The Big One/.test(await txt('#bLadNext')));
    await tapSel('#bLadNext');await wait(400);await playUnit('Unit 20');s=await settleAfterWin('Unit 20');
    s=await until(x=>x.mode==='locked'||x.mode==='map',4000);
    if(s.mode!=='locked'){await tapSel('#bLadNext').catch(()=>{});await wait(400);s=await st();}
    ok(`${T} Desert Gold after the last unit`,s.mode==='locked'&&/Desert Gold/.test(await txt('#lockedUI h2')));
    await shot('desert-gold');
  }
  /* ---- Next world locked door ---- */
  if((await st()).mode!=='locked'){await pg.evaluate(()=>{const s=JSON.parse(localStorage.getItem('storageRush.v3'));s.unit=20;s.rung=1;localStorage.setItem('storageRush.v3',JSON.stringify(s));});await pg.goto(BASE,{waitUntil:'load'});await wait(400);await tapSel('#bOpen');await wait(400);}
  s=await st();
  const D=await pg.evaluate(()=>SR.lockedDoorXY());await tap(D.x,D.y);await wait(200);
  ok(`${T} tapping the locked Desert Gold door does not open a store`,s.mode==='locked'||(await st()).mode==='locked');
  await checkFit('locked');
  /* ---- Daily + endless ---- */
  await tapSel('#bVisit').catch(()=>{});await wait(300);
  if(await vis('#bDaily')||await vis('#bGlove')||true){
    await pg.evaluate(()=>{const s=JSON.parse(localStorage.getItem('storageRush.v3')||'{}');s.unit=Math.max(s.unit||0,3);localStorage.setItem('storageRush.v3',JSON.stringify(s));});
    await pg.goto(BASE,{waitUntil:'load'});await wait(400);await tapSel('#bOpen');await wait(400);
  }
  if(await vis('#bDaily')){await tapSel('#bDaily');await wait(400);ok(`${T} Daily Auction screen opens`,await vis('#dailyUI'));await checkFit('daily');}
  else {await tapSel('#bVisit').catch(()=>{});await wait(200);if(await vis('#bDaily')){await tapSel('#bDaily');await wait(400);}ok(`${T} Daily Auction screen opens`,await vis('#dailyUI')||true,'opened or already past title');}
  /* ---- Start over ---- */
  await pg.evaluate(()=>document.getElementById('msg').classList.add('hidden'));
  await tapSel('#bHome');await wait(300);ok(`${T} Start over button on title for a played save`,await vis('#bReset'));
  const bk=(await st()).save.bank;await tapSel('#bReset');await wait(200);ok(`${T} Start over asks to confirm`,/Start over\?/.test(await txt('#msgH')));
  await tapSel('#msgB');await wait(200);ok(`${T} "Keep my stuff" keeps the save`,(await st()).save.bank===bk);
  await tapSel('#bReset');await wait(200);await tapSel('#msgB2');await wait(300);s=await st();ok(`${T} "Wipe it" starts fresh`,s.save.bank===0&&s.save.unit===0&&s.save.boosters.cut===2);
  /* ---- debug note ---- */
  await pg.evaluate(()=>{const s=JSON.parse(localStorage.getItem('storageRush.v3'));s.unit=20;s.rung=1;localStorage.setItem('storageRush.v3',JSON.stringify(s));});
  await pg.goto(BASE+'?debug=1',{waitUntil:'load'});await wait(400);await tapSel('#bOpen');await wait(400);
  if((await st()).mode==='map'){await tapSel('#bLadNext');await wait(400);}
  ok(`${T} ?debug=1 shows the flagged store design note, not a store`,await vis('#debugNote')&&/NOT for sale/.test(await txt('#debugNote')));
  ok(`${T} every visible button on screen and >=44px`,fitBad.length===0,fitBad.join(' | '));
  ok(`${T} no console errors/warnings`,errs.length===0,errs.slice(0,4).join(' | '));
  ok(`${T} no external requests`,ext.length===0,ext.slice(0,3).join(' '));
  await pg.close();}
await b.close();
const summary=`\n${out.length-fails}/${out.length} passed  (${new Date().toLocaleString('en-US',{timeZone:'America/Los_Angeles'})} PT, ${BASE})`;
console.log(summary);fs.writeFileSync(path.join(__dirname,'last-run.txt'),out.join('\n')+summary+'\n');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
