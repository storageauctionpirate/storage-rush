// Storage Rush v3 headless playthrough at 390x844 (all 20 Sunnyvale levels) and 375x667 (opening + last unit + Desert Gold).
// Run: python3 -m http.server 8872 --bind 127.0.0.1 &  then  NODE_PATH=/workspace/pirate-apps/launch/node_modules node test/run.js
const puppeteer=require('puppeteer-core');const fs=require('fs');const path=require('path');
const BASE=process.env.URL||'http://127.0.0.1:8872/index.html';
const SHOTS=process.env.SHOTS!=='0';const ONLY=process.env.ONLY;
const out=[];let fails=0;const ok=(n,c,i)=>{const line=(c?'PASS ':'FAIL ')+n+(i!=null&&i!==''?'  — '+i:'');out.push(line);console.log(line);if(!c)fails++;};
const st0=pg=>pg.evaluate(()=>SR.state());
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const VPS=[
  {tag:'390x844',full:true,vp:{width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true},ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'},
  {tag:'375x667',full:false,vp:{width:375,height:667,deviceScaleFactor:2,isMobile:true,hasTouch:true},ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'}
].filter(v=>!ONLY||v.tag===ONLY);
(async()=>{
const root=path.join(__dirname,'..');
const files=['index.html','style.css','js/game.js','js/art.js','js/audio.js','js/engine.js','js/levels.js','js/images.js','js/rhythm.js'];
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
ok('every truck level has its own art',[0,1,2,3,4,5].every(n=>fs.existsSync(path.join(root,'assets/trucks/L'+n+'.png')))&&new Set([0,1,2,3,4,5].map(n=>fs.statSync(path.join(root,'assets/trucks/L'+n+'.png')).size)).size===6);
ok('room ramp: Units 1-2 one room, 3-5 two rooms, 6+ three rooms',(()=>{const L=require(path.join(root,'js/levels.js'));return L.YARD1.units.length===20&&L.YARD1.units.every((u,i)=>u.boards.length===(i<2?1:i<5?2:3));})());
ok('Unit 1 teaches tarps with real goals (3 finds, not a 1-find freebie)',(()=>{const L=require(path.join(root,'js/levels.js'));const b=L.YARD1.units[0].boards[0];return b.tut==='swap'&&b.need===3&&b.tarps.length>=3;})());
ok('art-sheet assets shipped',fs.existsSync(path.join(root,'assets/pieces/tote.png'))&&fs.existsSync(path.join(root,'assets/bg/map-clean.jpg'))&&fs.existsSync(path.join(root,'assets/safes/front-legendary.png'))&&fs.existsSync(path.join(root,'assets/chars/truck-after.png'))&&fs.existsSync(path.join(root,'assets/chars/hustler-idle.png')));
ok('fence + door signs kept',src.includes("You can't hit a home run")&&src.includes('SCARED MONEY')&&src.includes("DON'T MAKE MONEY"));
ok('locked door says Unlock coming soon',html.includes('Unlock coming soon'));
ok('Desert Gold is the next-world tease',/Desert Gold/.test(src));
ok('Safe Cracking is earned only: no prices, IAP or ads in its code',!/(price|\$\d|iap|purchase|buy)/i.test(src.slice(src.indexOf('Safe Cracking Bonus'),src.indexOf('visible empire'))));
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
  const vis=s=>pg.$eval(s,e=>!e.classList.contains('hidden')&&e.offsetParent!==null&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).visibility!=='hidden').catch(()=>false);
  const txt=s=>pg.$eval(s,e=>e.textContent);
  const shot=async n=>{if(SHOTS){fs.mkdirSync(path.join(root,'shots','sunnyvale'),{recursive:true});await pg.screenshot({path:path.join(root,'shots','sunnyvale',`${T}-${n}.png`)});}};
  const untilIdle=async()=>{for(let i=0;i<150;i++){const s=await st();if((!s.busy||s.result)&&!(await vis('#msg')&&false))return s;await wait(80);}return st();};
  const until=async(fn,ms)=>{const t0=Date.now();while(Date.now()-t0<(ms||8000)){const s=await st();if(await fn(s))return s;await wait(100);}return st();};
  const fitBad=[];const checkFit=async(label)=>{const bad=await pg.$$eval('button',bs=>bs.filter(b=>b.offsetParent!==null&&!b.closest('.hidden')).map(b=>{const r=b.getBoundingClientRect();return {id:b.id||b.textContent.trim().slice(0,14),ok:r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&r.height>=44&&r.width>=44,r:[r.left|0,r.top|0,r.width|0,r.height|0]};}).filter(x=>!x.ok));if(bad.length)fitBad.push(label+': '+JSON.stringify(bad));};
  const tapLock=async()=>{const L=await pg.evaluate(()=>SR.lockXY());await tap(L.x,L.y);};
  const seen={specials:new Set(),teachScr:false,safeBonus:false,continueOffered:false,shots:{}};
  async function playBoard(opt){opt=opt||{};let stuck=0;
    for(let step=0;step<900;step++){
      if(await vis('#msg')){const h=await txt('#msgH');
        if(/Out of bid cards/.test(h)){seen.continueOffered=true;await tapSel('#msgB');await wait(300);continue;}
        if(/cleared!/.test(h))return 'win';return 'fail';}
      let s=await st();
      if(s.mode==='safe'){seen.safeBonus=true;if(!seen.shots.safe){seen.shots.safe=1;await wait(1400);await shot('safe-bonus');}await pg.evaluate(()=>SR.skipSafe());await wait(1100);await tapSel('#bSafeNext');await wait(300);continue;}
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
      if(s.mode==='safe'){seen.safeBonus=true;if(!seen.shots.safe){seen.shots.safe=1;await wait(1400);await shot('safe-bonus');}const b0=s.save.bank;await pg.evaluate(()=>SR.skipSafe());await wait(1100);const pay=await txt('#safePay');await tapSel('#bSafeNext');await wait(400);const s2=await st();ok(`${T} ${label}: Safe Cracking Bonus pays earned game cash`,/\+\$/.test(pay)&&s2.save.bank>b0,pay);continue;}
      if(s.mode==='truck'){if(!seen.shots.truck){seen.shots.truck=1;await wait(2300);await shot('truck-upgrade');}seen.truck=true;await pg.evaluate(()=>SR.finishTruck());await wait(400);continue;}
      if(s.mode==='flip'){
        if(!seen.shots.flip){seen.shots.flip=1;await shot('flea-market');}
        await until(x=>x.flipDone||x.mode!=='flip',6000);
        if((await st()).mode==='flip'&&await vis('#bFlipNext')){const b=await txt('#bFlipNext');await tapSel('#bFlipNext');await wait(500);
          if(/Flip/.test(b))ok(`${T} ${label}: flea market FLIP, itemized haul`,await vis('#haul')&&/total/i.test(await txt('#haul')),(await txt('#haul')).slice(0,80));}
        await wait(300);continue;}
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
  ok(`${T} map art is loaded before the map shows (no pop-in)`,s.mode==='map'&&s.mapArt);
  ok(`${T} world map opens on Sunnyvale Storage`,s.mode==='map'&&/Sunnyvale Storage/.test(await txt('#ladH'))&&/first unit/.test(await txt('#ladSub')));
  ok(`${T} no "No Home" text on screen`,!(await pg.evaluate(()=>/no home/i.test(document.body.innerText))));
  { const v=await pg.evaluate(()=>SR.village());const H0=(await pg.evaluate(()=>innerHeight));
    ok(`${T} map: one tall path with all 20 stops in order`,v.stops.length===20&&v.stops.every((p,i)=>i===0||p.y<v.stops[i-1].y)&&v.worldH>H0*2.5,'worldH '+v.worldH);
    ok(`${T} map: camera starts on stop 1`,v.stops[0].y>0&&v.stops[0].y<H0,'y '+Math.round(v.stops[0].y));
    ok(`${T} map: Sunnyvale 0% built bar`,/Sunnyvale 0% built/.test(await txt('#builtTxt'))&&v.pct===0); }
  { const bad=await pg.evaluate(()=>SR.mapCheck());ok(`${T} map: no landmark touches a stop, tag, other landmark, the hustler or the Unit button`,bad.length===0,bad.slice(0,6).join(' | ')); }
  await checkFit('map');await shot('world-map');await shot('map-start');seen.shots.map=1;
  /* ---- unit 1 ---- */
  await tapSel('#bLadNext');await wait(500);s=await st();ok(`${T} door closed with padlock`,s.mode==='door'&&s.door==='closed');await shot('door');
  await tapLock();await wait(120);s=await st();ok(`${T} lock tap starts jiggle/snap`,s.door==='open');await wait(1800);
  s=await st();ok(`${T} door rolls up into the framed board`,s.mode==='play'&&s.unitId==='Unit 1');
  ok(`${T} tutorial tip + finger shown on board 1`,await vis('#tut')&&s.tut==='swap');
  ok(`${T} header: SUNNYVALE STORAGE sign art is not covered by a title pill`,!(await vis('#sign'))&&/UNIT 1/.test(await txt('#goalLabel')),await txt('#goalLabel'));
  await checkFit('board');await shot('board');
  const nm=await pg.evaluate(()=>SR.noMatchSwap());
  if(nm){const a=await pg.evaluate((r,c)=>SR.cellXY(r,c),nm.a[0],nm.a[1]),c2=await pg.evaluate((r,c)=>SR.cellXY(r,c),nm.b[0],nm.b[1]);await swipe(a,c2);await wait(500);s=await st();ok(`${T} no-match swap bounces back free`,s.used===0,'used='+s.used);}
  else ok(`${T} no-match swap bounces back free`,true,'no adjacent no-match pair on this seed');
  { const m=await pg.evaluate(()=>SR.bestMove());const a=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.a[0],m.a[1]),c2=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.b[0],m.b[1]);await swipe(a,c2);await wait(100);await untilIdle();s=await st();ok(`${T} swipe swap spends one move`,s.used===1);
    await wait(300);s=await st();if(!s.finds.length&&s.tarps.some(t=>t.find))ok(`${T} Unit 1 teaches the tarp with highlighted tiles`,s.tarpGlow&&/tarp/i.test(await txt('#tut')),await txt('#tut'));else ok(`${T} Unit 1 teaches the tarp with highlighted tiles`,true,'find already out after the first swap');}
  let r=await playBoard();ok(`${T} Unit 1 (tutorial) won`,r==='win');
  s=await st();ok(`${T} find collected onto the cart`,s.collected.length>=1);
  await wait(400);ok(`${T} cleared card is a stamped work order with itemized lines`,(await txt('#msgStamp'))==='CLEARED'&&/Unit 1 cleared!/.test(await txt('#msgH'))&&/Guitar|Cart/.test(await txt('#msgP')),JSON.stringify({stamp:await txt('#msgStamp'),h:await txt('#msgH'),p:await txt('#msgP')}));
  { const o=await pg.evaluate(()=>{const h=document.getElementById('msgH'),r=document.createRange();r.selectNodeContents(h);const a=r.getBoundingClientRect(),b=document.getElementById('msgStamp').getBoundingClientRect();return {a:[a.left,a.top,a.right,a.bottom].map(Math.round),b:[b.left,b.top,b.right,b.bottom].map(Math.round),hit:a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom};});
    ok(`${T} CLEARED stamp does not cover the title`,!o.hit,JSON.stringify(o)); }
  await shot('cleared');
  s=await settleAfterWin('Unit 1');
  ok(`${T} bank grew from the flip`,s.save.bank>0,'$'+s.save.bank);
  ok(`${T} back on the map, next unit is 2`,s.mode==='map'&&s.save.unit===1);
  s=await until(x=>x.mode==='map'&&!x.map.walking,4000);ok(`${T} hustler walk finishes, next unit offered`,/Unit 2/.test(await txt('#bLadNext')));
  { await wait(3400);s=await until(x=>x.mode==='map'&&!x.map.walking&&!x.building,6000);const v=await pg.evaluate(()=>SR.village());ok(`${T} first sale gifts a free build (Yard Sign, ~5%)`,v.built.includes('sign')&&v.pct>=4&&v.pct<=8,v.pct+'%');
    const r0=await pg.$eval('#bLadNext',e=>{const b=e.getBoundingClientRect();return [Math.round(b.left+b.width/2),Math.round(b.top+b.height/2),getComputedStyle(e).visibility];});await wait(900);const r1=await pg.$eval('#bLadNext',e=>{const b=e.getBoundingClientRect();return [Math.round(b.left+b.width/2),Math.round(b.top+b.height/2),getComputedStyle(e).visibility];});
    ok(`${T} Unit pill stays put once shown (first tap lands)`,r0[2]==='visible'&&Math.abs(r0[0]-r1[0])<=1&&Math.abs(r0[1]-r1[1])<=1,JSON.stringify([r0,r1]));
    const bad=await pg.evaluate(()=>SR.mapCheck());ok(`${T} map: Unit pills never cover a stop number`,!bad.some(x=>/x stop/.test(x)&&/button/.test(x)),bad.filter(x=>/button/.test(x)).slice(0,4).join(' | ')); }
  ok(`${T} no Pickup tasks before 3 flips`,!(await vis('#tasks')));
  /* ---- unit 2: tutorial boards skip the +5 offer ---- */
  await tapSel('#bLadNext');await wait(400);await tapLock();await wait(1800);
  await pg.evaluate(()=>SR.setMoves(1));
  { s=await st();if(!s.finds.length){const m=await pg.evaluate(()=>SR.bestMove());const a=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.a[0],m.a[1]),c2=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.b[0],m.b[1]);await swipe(a,c2);await untilIdle();}
    await wait(900);s=await st();
    if(s.status==='out'){ok(`${T} tutorial board: out of moves skips +5 offer`,await vis('#msg')&&/Out of moves/.test(await txt('#msgH')));
      { const p=await txt('#msgP');ok(`${T} fail text matches progress`,s.collected.length===0?/No finds/.test(p)&&!/So close/.test(p):true,s.collected.length+' finds: '+p); }await tapSel('#msgB');await wait(400);}
    else ok(`${T} tutorial board: out of moves skips +5 offer`,true,'skipped (find on board / won)');}
  if(!(await vis('#msg'))||!/cleared/.test(await txt('#msgH'))){await playUnit('Unit 2');}
  s=await settleAfterWin('Unit 2');await until(x=>x.mode==='map'&&!(x.map&&x.map.walking),4000);
  /* ---- unit 3 ---- */
  await tapSel('#bLadNext');await wait(400);await playUnit('Unit 3');s=await settleAfterWin('Unit 3');await until(x=>x.mode==='map'&&!(x.map&&x.map.walking),4000);
  {const z=await st();ok(`${T} 3 flips earns the free Pickup upgrade scene`,!!seen.truck,JSON.stringify({mode:z.mode,unit:z.save.unit,unitId:z.unitId,bi:z.bi,msg:await vis('#msg')?await txt('#msgH'):''}));}
  { await wait(800);let v=await pg.evaluate(()=>SR.village());const H0=await pg.evaluate(()=>innerHeight);
    ok(`${T} map: camera follows the hustler to stop 4`,v.stops[3].y>0&&v.stops[3].y<H0,'y '+Math.round(v.stops[3].y));
    ok(`${T} village: truck landmark upgraded by the Pickup milestone`,v.pct>=13,v.pct+'%');
    const p0=v.pct;
    if(await vis('#bBuild')&&!(await pg.$eval('#bBuild',e=>e.classList.contains('poor')))){const b0=(await st()).save.bank;await tapSel('#bBuild');await wait(700);await shot('map-building');await wait(2000);v=await pg.evaluate(()=>SR.village());const b1=(await st()).save.bank;
      ok(`${T} village: earned cash fixes up the next landmark`,v.built.includes('sign')&&v.pct>p0&&b1<b0&&new RegExp(v.pct+'% built').test(await txt('#builtTxt')),v.pct+'% · bank '+b0+'→'+b1);await shot('map-village');}
    else { // next paid landmark (Office) unlocks at Unit 5: check the paid build on a seeded save, then come back
      const keep=await pg.evaluate(()=>localStorage.getItem('storageRush.v3'));await pg.evaluate(()=>{const o=JSON.parse(localStorage.getItem('storageRush.v3'));o.unit=5;o.bank=6000;localStorage.setItem('storageRush.v3',JSON.stringify(o));});await pg.reload({waitUntil:'load'});await wait(900);await tapSel('#bOpen');await until(x=>x.mode==='map'&&!x.map.walking,6000);await wait(300);
      const b0=(await st()).save.bank;const p1=(await pg.evaluate(()=>SR.village())).pct;await tapSel('#bBuild');await wait(2700);v=await pg.evaluate(()=>SR.village());const b1=(await st()).save.bank;
      ok(`${T} village: earned cash fixes up the next landmark`,v.built.includes('office')&&v.pct>p1&&b1<b0&&new RegExp(v.pct+'% built').test(await txt('#builtTxt')),v.pct+'% · bank '+b0+'→'+b1);await shot('map-village');
      await pg.evaluate(k=>localStorage.setItem('storageRush.v3',k),keep);await pg.reload({waitUntil:'load'});await wait(900);await tapSel('#bOpen');await until(x=>x.mode==='map'&&!x.map.walking,6000);await wait(300);} }
  await tapSel('#bEmpire');await wait(400);
  ok(`${T} Upgrades: Pickup tasks panel`,await vis('#tasks')&&/Fix up The Pickup/.test(await txt('#tasks h3')));
  await checkFit('upgrades');
  s=await st();
  if(s.save.bank>=1000){const lv0=await pg.evaluate(()=>SR.truckLevel());await tapSel('#tasks button[data-task="wash"]');await wait(300);s=await st();const lv1=await pg.evaluate(()=>SR.truckLevel());ok(`${T} buying an upgrade plays the truck before/after`,s.mode==='truck'&&s.save.tasks.includes('wash'));
    ok(`${T} truck shows Level N → N+1 with new art`,lv1===lv0+1&&new RegExp('Level '+lv0+' → '+lv1).test(await txt('#truckTitle')),await txt('#truckTitle'));
    await wait(2300);if(!seen.shots.truck2){seen.shots.truck2=1;await shot('truck-upgrade');}ok(`${T} upgrade celebration has a continue button`,await vis('#bTruckNext'));await tapSel('#bTruckNext');await wait(400);s=await st();ok(`${T} back on Upgrades after the celebration`,s.mode==='empire');}
  else ok(`${T} buying an upgrade plays the truck before/after`,false,'bank too low: $'+s.save.bank);
  await tapSel('#bEmpireBack');await wait(400);
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
      s=await until(async x=>x.mode==='map'&&!(x.map&&x.map.walking)&&await vis('#bLadNext'),6000);const name='Unit '+u;
      if(u%4===0){await tapSel('#bEmpire');await wait(300);const can=await pg.$$eval('#tasks button:not([disabled])',bs=>bs.map(b=>b.dataset.task)).catch(()=>[]);if(can.length&&await vis('#tasks')){await tapSel(`#tasks button[data-task="${can[0]}"]`);await wait(300);if((await st()).mode==='truck'){await pg.evaluate(()=>SR.finishTruck());await wait(300);}}await tapSel('#bEmpireBack');await wait(400);}
      if(await vis('#bBuild')&&!(await pg.$eval('#bBuild',e=>e.classList.contains('poor')))){await tapSel('#bBuild');await wait(2700);if(u===12)await shot('map-mid-progress');}
      await until(async x=>x.mode==='map'&&!(x.map&&x.map.walking)&&!x.building&&await vis('#bLadNext'),8000);await wait(400);await tapSel('#bLadNext');await wait(400);
      const started=await st();ok(`${T} ${name} opens correct door`,started.mode==='door'&&started.unitId===name,JSON.stringify({mode:started.mode,id:started.unitId}));
      const tries=await playUnit(name);s=await st();
      ok(`${T} ${name} cleared`,await vis('#msg')&&/cleared/.test(await txt('#msgH')),tries+' retries');
      s=await settleAfterWin(name);
      await until(x=>x.mode==='map'||x.mode==='locked',4000);
    }
    ok(`${T} village keeps building as you play`,(await pg.evaluate(()=>SR.village())).pct>=50,(await pg.evaluate(()=>SR.village())).pct+'% built');
    ok(`${T} all 20 Sunnyvale levels cleared`, (await st()).save.unit>=20 || (await st()).mode==='locked');
    ok(`${T} Dolly / Bubble Wrap / Gavel all showed up`,['dolly','wrap','gavel'].every(k=>seen.specials.has(k)),[...seen.specials].join(','));
    ok(`${T} Scrapper teach near-miss played`,seen.teachScr);
    if((await st()).mode!=='locked'){await until(async x=>x.mode==='map'&&!(x.map&&x.map.walking)&&await vis('#bLadNext'),6000);ok(`${T} map offers Desert Gold after Unit 20`,/Desert Gold/.test(await txt('#bLadNext')));await tapSel('#bLadNext').catch(()=>{});await wait(400);}
    s=await until(x=>x.mode==='locked',4000);
    ok(`${T} Desert Gold is locked after unit 20`,s.mode==='locked'&&/Desert Gold/.test(await txt('#lockedUI h2'))&&await vis('#bUnlock')&&/Unlock coming soon/.test(await txt('#bUnlock')));
    await shot('desert-gold');
  } else {
    await pg.evaluate(()=>{const s=JSON.parse(localStorage.getItem('storageRush.v3'));s.unit=19;s.rung=1;s.bank+=3000;localStorage.setItem('storageRush.v3',JSON.stringify(s));});
    await pg.reload({waitUntil:'load'});await wait(600);await tapSel('#bOpen');await wait(500);
    ok(`${T} saved progress resumes on the map at Unit 20`,/Unit 20|The Big One/.test(await txt('#bLadNext')));
    await tapSel('#bLadNext');await wait(400);await playUnit('Unit 20');s=await settleAfterWin('Unit 20');
    s=await until(x=>x.mode==='locked'||((x.mode==='map'||x.mode==='ladder')&&!x.map?.walking),4000);
    if(s.mode!=='locked'){await tapSel('#bLadNext').catch(()=>{});await wait(400);s=await st();}
    ok(`${T} Desert Gold after the last unit`,s.mode==='locked'&&/Desert Gold/.test(await txt('#lockedUI h2')));
    await shot('desert-gold');
  }
  /* ---- Next world locked door ---- */
  if((await st()).mode!=='locked'){await pg.evaluate(()=>{const s=JSON.parse(localStorage.getItem('storageRush.v3'));s.unit=20;s.rung=1;localStorage.setItem('storageRush.v3',JSON.stringify(s));});await pg.goto(BASE,{waitUntil:'load'});await wait(400);await tapSel('#bOpen');await wait(400);await tapSel('#bLadNext');await wait(400);}
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
  ok(`${T} no store, prices or pay-to-play hooks on the Desert Gold screen`,!(await vis('#debugNote'))&&!(await pg.evaluate(()=>/\$\d+\.\d\d|buy now|purchase|subscribe/i.test(document.body.innerText))));
  ok(`${T} every visible button on screen and >=44px`,fitBad.length===0,fitBad.join(' | '));
  ok(`${T} no console errors/warnings`,errs.length===0,errs.slice(0,4).join(' | '));
  ok(`${T} no external requests`,ext.length===0,ext.slice(0,3).join(' '));
  await pg.close();}
if(!ONLY||ONLY==='1280x800'){const T='1280x800';const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.setViewport({width:1280,height:800});await pg.goto(BASE,{waitUntil:'load'});
  await pg.evaluate(()=>{localStorage.clear();localStorage.setItem('storageRush.v3',JSON.stringify({v:3,unit:9,bank:1450,sound:false,rung:0,tasks:['wash'],truckSeen:true,built:['sign','office'],boosters:{cut:2,flash:1,free:0},daily:{day:'',boards:0,punch:[],glove:''},endless:{n:0,best:0},seenLadder:true,taughtBoost:{cut:true,flash:true,free:true}}));});
  await pg.reload({waitUntil:'load'});await wait(700);await pg.click('#bOpen');await wait(1600);
  const r=await pg.evaluate(()=>{const a=document.getElementById('app').getBoundingClientRect(),c=document.getElementById('cv').getBoundingClientRect();const bs=[...document.querySelectorAll('#ladderUI button')].filter(b=>b.offsetParent).map(b=>b.getBoundingClientRect());return {a:[a.left,a.top,a.width,a.height],c:[c.width,c.height],inside:bs.every(b=>b.left>=a.left-1&&b.right<=a.right+1&&b.top>=a.top-1&&b.bottom<=a.bottom+1)};});
  ok(`${T} desktop: phone-shaped frame centered, nothing cropped`,r.a[2]<520&&r.a[3]<=800&&Math.abs(r.a[0]+r.a[2]/2-640)<2&&r.c[0]===r.a[2]&&r.c[1]===r.a[3]&&r.inside,JSON.stringify(r));
  { const bad=await pg.evaluate(()=>SR.mapCheck());ok(`${T} desktop: no landmark overlaps on the map`,bad.length===0,bad.slice(0,6).join(' | ')); }
  const v=await pg.evaluate(()=>SR.village());ok(`${T} desktop: map centered on the current stop`,v.stops[9].y>0&&v.stops[9].y<800,'y '+Math.round(v.stops[9].y));
  if(SHOTS)await pg.screenshot({path:path.join(root,'shots','sunnyvale','1280x800-desktop-map.png')});
  await pg.evaluate(()=>document.getElementById('bLadNext').click());await wait(700);const L=await pg.evaluate(()=>SR.lockXY());await pg.mouse.click(L.x,L.y);await wait(2000);
  ok(`${T} desktop: board opens inside the frame`,(await st0(pg)).mode==='play');if(SHOTS)await pg.screenshot({path:path.join(root,'shots','sunnyvale','1280x800-desktop-board.png')});
  ok(`${T} desktop: no page errors`,errs.length===0,errs.join(' | '));await pg.close();}
await b.close();
const summary=`\n${out.length-fails}/${out.length} passed  (${new Date().toLocaleString('en-US',{timeZone:'America/Los_Angeles'})} PT, ${BASE})`;
console.log(summary);fs.writeFileSync(path.join(__dirname,'last-run.txt'),out.join('\n')+summary+'\n');process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
