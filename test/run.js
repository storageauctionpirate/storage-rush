// Headless playthrough of Storage Rush at 390x844 and 375x667 (touch, iPhone UA).
// Run: python3 -m http.server 8872 --bind 127.0.0.1 &  then  NODE_PATH=/workspace/pirate-apps/launch/node_modules node test/run.js
const puppeteer=require('puppeteer-core');const fs=require('fs');const path=require('path');
const BASE=process.env.URL||'http://127.0.0.1:8872/index.html';
const SHOTS=process.env.SHOTS!=='0';
const out=[];let fails=0;const ok=(n,c,i)=>{out.push((c?'PASS ':'FAIL ')+n+(i?'  — '+i:''));if(!c)fails++;};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const VPS=[
  {tag:'390x844',vp:{width:390,height:844,deviceScaleFactor:3,isMobile:true,hasTouch:true},ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'},
  {tag:'375x667',vp:{width:375,height:667,deviceScaleFactor:2,isMobile:true,hasTouch:true},ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'}
];
(async()=>{
// source hygiene
const src=['index.html','style.css','js/game.js','js/art.js','js/audio.js'].map(f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8')).join('\n');
ok('source never says the banned word',!/tetris/i.test(src));
ok('no ads/analytics/payment code',!/(googletag|gtag\(|google-analytics|adsbygoogle|PaymentRequest|js\.stripe|fetch\(|XMLHttpRequest)/i.test(src));
ok('fence sign text present',src.includes("You can't hit a home run")&&src.includes('unless you swing the bat.'));
ok('door sign text present',src.includes('SCARED MONEY')&&src.includes("DON'T MAKE MONEY"));
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
  const vis=s=>pg.$eval(s,e=>!e.classList.contains('hidden')&&e.offsetParent!==null);
  const shot=async n=>{if(SHOTS)await pg.screenshot({path:path.join(__dirname,'..','shots',`${T}-${n}.png`)});};
  const untilIdle=async()=>{for(let i=0;i<120;i++){const s=await st();if(!s.busy||s.result)return s;await wait(80);}return st();};
  const checkFit=async(label)=>{const bad=await pg.$$eval('button',bs=>bs.filter(b=>b.offsetParent!==null).map(b=>{const r=b.getBoundingClientRect();return {id:b.id,ok:r.left>=0&&r.top>=0&&r.right<=innerWidth+.5&&r.bottom<=innerHeight+.5&&r.height>=44&&r.width>=44}}).filter(x=>!x.ok).map(x=>x.id));ok(`${T} ${label}: visible buttons on screen and >=44px`,bad.length===0,bad.join(','));};

  await pg.goto(BASE,{waitUntil:'load'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'load'});await wait(600);
  ok(`${T} title shows big Open Unit button`,await vis('#title')&&await pg.$eval('#bOpen',e=>e.getBoundingClientRect().height>=64)&&(await pg.$eval('#bOpenTxt',e=>e.textContent))==='Open Unit');
  await checkFit('title');await shot('0-title');
  await tapSel('#bSound');let s=await st();const muted=await pg.evaluate(()=>document.body.classList.contains('muted'));
  await tapSel('#bSound');const s2=await st();ok(`${T} sound toggle flips and saves`,s.save.sound===false&&muted&&s2.save.sound===true);
  await tapSel('#bOpen');await wait(500);s=await st();
  ok(`${T} life ladder board shows first, piece on No Home`,s.mode==='ladder'&&s.lad.phase==='done'&&s.save.unit===0&&(await pg.$eval('#bLadNext',e=>e.textContent))==='Open Unit 12');
  await checkFit('ladder');await shot('1-ladder-start');
  let replayTested=false,tapSwapTested=false,attempts=[0,0,0];
  for(let u=0;u<3;u++){
    await tapSel('#bLadNext');await wait(500);s=await st();
    ok(`${T} unit ${u+1}: door closed with lock`,s.mode==='door'&&s.door==='closed'&&s.unit===u);
    if(u===0)await shot('2-door-closed');
    let won=false;
    for(let attempt=0;attempt<4&&!won;attempt++){
      attempts[u]++;
      s=await st();if(s.mode==='door'){const L=await pg.evaluate(()=>SR.lockXY());await tap(L.x,L.y);await wait(260);if(u===0&&attempt===0)await shot('3-lock-snap');await wait(1500);}
      s=await st();ok(`${T} unit ${u+1} try ${attempt+1}: lock snaps, door rolls up to the board`,s.mode==='play',s.mode);
      if(attempt===0){await shot(`4-unit${u+1}-board`);await checkFit(`unit ${u+1} board`);}
      if(!replayTested){ // one move then Replay
        const m=await pg.evaluate(()=>SR.bestMove());const a=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.a[0],m.a[1]),c2=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.b[0],m.b[1]);
        await swipe(a,c2);await untilIdle();const sm=await st();ok(`${T} swipe swap spends a move`,sm.moves===sm.used?false:sm.used===1,'used='+sm.used);
        await tapSel('#bReplay');await wait(400);const sr=await st();ok(`${T} Replay restarts the unit`,sr.mode==='door'&&sr.used===0);replayTested=true;
        const L=await pg.evaluate(()=>SR.lockXY());await tap(L.x,L.y);await wait(1800);
      }
      if(u===0&&attempt===0){ // a swap that makes no match bounces back and costs nothing
        const nb=await pg.evaluate(()=>SR.noMatchSwap());
        if(nb){const before=(await st()).moves;const a=await pg.evaluate((r,c)=>SR.cellXY(r,c),nb.a[0],nb.a[1]),c2=await pg.evaluate((r,c)=>SR.cellXY(r,c),nb.b[0],nb.b[1]);await swipe(a,c2);await wait(100);await untilIdle();ok(`${T} no-match swap bounces back, no move spent`,(await st()).moves===before);}
      }
      let guard=0,collectedShot=false;
      while(guard++<220){
        s=await st();
        if(s.result||s.mode!=='play')break;
        if(s.busy){await wait(80);continue;}
        if(s.finds.length){const f=s.finds[0];if(!collectedShot&&u===0){await shot('5-find-uncovered');collectedShot=true;}const p=await pg.evaluate((r,c)=>SR.cellXY(r,c),f.r,f.c);await tap(p.x,p.y);await wait(120);await untilIdle();continue;}
        if(s.moves<=0){await wait(200);continue;}
        const m=await pg.evaluate(()=>SR.bestMove());if(!m){await wait(200);continue;}
        const a=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.a[0],m.a[1]),c2=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.b[0],m.b[1]);
        if(!tapSwapTested){await tap(a.x,a.y);await wait(80);await tap(c2.x,c2.y);await wait(120);const before=s.used;await untilIdle();tapSwapTested=(await st()).used===before+1;ok(`${T} tap-tap swap works`,tapSwapTested);}
        else{await swipe(a,c2);await wait(60);await untilIdle();}
      }
      await wait(900);s=await st();
      if(s.result==='win'){won=true;
        ok(`${T} unit ${u+1} cleared (try ${attempt+1}, ${s.used} moves used, ${s.collected.length} finds, cart ${s.cart})`,s.collected.length>=3);
        ok(`${T} unit ${u+1} win card shows`,await vis('#msg')&&(await pg.$eval('#msgB',e=>e.textContent))==='Flip it!');
        if(u===0)await shot('6-unit-cleared');
        const bank0=s.save.bank;await tapSel('#msgB');await wait(1300);
        s=await st();ok(`${T} unit ${u+1} flip table scene`,s.mode==='flip');if(u===0)await shot('7-flip-table');
        for(let i=0;i<40&&!(await st()).flipDone;i++)await wait(150);
        s=await st();ok(`${T} unit ${u+1} finds sold, cash in bank`,s.flipDone&&s.save.bank>bank0&&await vis('#bFlipNext'),'bank '+bank0+' -> '+s.save.bank);
        await tapSel('#bFlipNext');await wait(400);s=await st();
        ok(`${T} unit ${u+1} ladder board, piece moving ${s.lad.from}->${s.lad.to}`,s.mode==='ladder'&&s.lad.from===u&&s.lad.to===u+1&&s.lad.phase==='hop'&&!(await vis('#bLadNext')));
        await wait(1500);if(u===0)await shot('8-ladder-building');
        for(let i=0;i<40&&(await st()).lad.phase!=='done';i++)await wait(150);
        const built=await pg.$eval('#ladBuilt',e=>e.classList.contains('hidden')?'':e.textContent);
        ok(`${T} unit ${u+1} build finishes: "${built}"`,built===['Built: Storage Rental!','Built: Apartment!','Built: Home!'][u]&&await vis('#bLadNext'));
        if(u===2)await shot('9-ladder-home');
      } else {
        ok(`${T} unit ${u+1} try ${attempt+1} ended without a win (${s.result}, moves left ${s.moves}, finds ${s.collected.length})`,true);
        if(await vis('#msg')){await tapSel('#msgB');await wait(400);}
      }
    }
    ok(`${T} unit ${u+1} completed`,won,'attempts '+attempts[u]);
    if(!won)break;
  }
  ok(`${T} ladder says Next Door after 3 units`,(await pg.$eval('#bLadNext',e=>e.textContent))==='Next Door');
  await tapSel('#bLadNext');await wait(500);s=await st();
  ok(`${T} locked orange door shows after unit 3`,s.mode==='locked'&&await vis('#lockedUI'));
  await shot('10-locked-door');
  const d=await pg.evaluate(()=>SR.lockedDoorXY());await tap(d.x,d.y);await wait(250);
  ok(`${T} tapping the door says Unlock coming soon`,await vis('#toast')&&(await pg.$eval('#toast',e=>e.textContent))==='Unlock coming soon');
  await shot('11-unlock-soon');await checkFit('locked door');
  await tapSel('#bHome');await wait(300);s=await st();ok(`${T} Home goes to title, says Keep Going`,s.mode==='title'&&(await pg.$eval('#bOpenTxt',e=>e.textContent))==='Keep Going');
  const bank=s.save.bank;await pg.reload({waitUntil:'load'});await wait(400);s=await st();ok(`${T} progress + bank persist after reload`,s.save.unit===3&&s.save.bank===bank,'bank '+bank);
  // Scrapper: leave a find alone and watch it get snatched
  await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'load'});await wait(400);
  await tapSel('#bOpen');await wait(300);await tapSel('#bLadNext');await wait(300);const L=await pg.evaluate(()=>SR.lockXY());await tap(L.x,L.y);await wait(1800);
  let sawPeek=false,peekShot=false,g2=0;
  while(g2++<120){s=await st();if(s.snatched.length||s.result||s.moves<=0)break;if(s.busy){await wait(80);continue;}
    if(s.scr==='peek'){sawPeek=true;if(!peekShot){await wait(300);await shot('12-scrapper-warning');peekShot=true;}}
    const m=await pg.evaluate(()=>SR.bestMove());const a=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.a[0],m.a[1]),c2=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.b[0],m.b[1]);await swipe(a,c2);await wait(60);await untilIdle();}
  await wait(600);s=await st();
  ok(`${T} Scrapper warns first (countdown + hand), then snatches an untouched find`,sawPeek&&s.snatched.length>=1,'snatched '+s.snatched.join(','));
  ok(`${T} snatched find shows as crossed out in goals`,(await pg.$$eval('.goal.gone',e=>e.length))>=1);
  ok(`${T} no external requests`,ext.length===0,ext.join(' '));
  ok(`${T} no console errors/warnings`,errs.length===0,errs.join(' | '));
  await pg.close();
}
await b.close();
out.push(`\n${out.length-fails}/${out.length} passed`);
console.log(out.join('\n'));fs.writeFileSync(path.join(__dirname,'last-run.txt'),out.join('\n'));
process.exit(fails?1:0);
})();
