// Before/after stills for the playtest bugs. Usage: node test/probe.js outdir 390x844,1280x800
const puppeteer=require('puppeteer-core');const path=require('path');const fs=require('fs');
const BASE=process.env.URL||'http://127.0.0.1:8872/index.html?debug=1';
const out=process.argv[2]||'/tmp/sr/probe';const sizes=(process.argv[3]||'390x844').split(',');
const SC=(process.env.SC||'load,header,win,flip,walk,top,fail').split(',');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox']});
for(const sz of sizes){const [w,h]=sz.split('x').map(Number);const mob=w<600;
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await pg.setViewport({width:w,height:h,deviceScaleFactor:mob?2:1});
const shot=async n=>{await pg.screenshot({path:path.join(out,sz+'-'+n+'.png')});};
const st=()=>pg.evaluate(()=>SR.state());
const vis=s=>pg.$eval(s,e=>!e.classList.contains('hidden')&&e.offsetParent!==null).catch(()=>false);
const tap=async(x,y)=>{await pg.mouse.move(x,y);await pg.mouse.down();await wait(40);await pg.mouse.up();};
const tapSel=async s=>{const r=await pg.$eval(s,e=>{const b=e.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}});await tap(r.x,r.y);};
const rect=s=>pg.$eval(s,e=>{const b=e.getBoundingClientRect();return [b.x|0,b.y|0,b.width|0,b.height|0,e.classList.contains('hidden')?'H':getComputedStyle(e).visibility==='hidden'?'v':'']}).catch(()=>null);
const swipe=async(a,c)=>{await pg.mouse.move(a.x,a.y);await pg.mouse.down();for(let i=1;i<=5;i++){await pg.mouse.move(a.x+(c.x-a.x)*i/5,a.y+(c.y-a.y)*i/5);await wait(16);}await pg.mouse.up();};
const setSave=async o=>{await pg.goto(BASE,{waitUntil:'load'});await pg.evaluate(o=>{localStorage.clear();if(o)localStorage.setItem('storageRush.v3',JSON.stringify(Object.assign({v:3,unit:0,bank:0,sound:false,rung:0,tasks:[],boosters:{cut:2,flash:1,free:1},daily:{day:'',boards:0,punch:[],glove:''},endless:{n:0,best:0},seenLadder:true,taughtBoost:{},truckSeen:false,safeBank:0},o)));},o);await pg.reload({waitUntil:'load'});await wait(900);};
const info={};
if(SC.includes('load')){const cdp=await pg.target().createCDPSession();await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:400*1024,uploadThroughput:100*1024});
  await pg.goto(BASE,{waitUntil:'domcontentloaded'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'domcontentloaded'});
  for(let i=0;i<80;i++){if(await vis('#bOpen'))break;await wait(100);}await wait(300);await shot('load-title');await tapSel('#bOpen').catch(()=>{});await wait(400);await shot('load-map-0.4s');await wait(1600);await shot('load-map-2s');
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});await cdp.send('Network.setCacheDisabled',{cacheDisabled:false});}
if(SC.includes('header')||SC.includes('win')||SC.includes('flip')||SC.includes('walk')){await setSave(null);await tapSel('#bOpen');await wait(1500);
  if(SC.includes('top'))await shot('map-fresh');
  await tapSel('#bLadNext');await wait(700);const L=await pg.evaluate(()=>SR.lockXY());await tap(L.x,L.y);await wait(2600);await shot('header-board');
  for(let i=0;i<6&&!(await vis('#msg'));i++){await pg.evaluate(()=>SR.debugWin());await wait(2200);}
  await wait(500);await shot('win-popup');
  await tapSel('#msgB');await wait(400);let s=await st();if(s.mode==='safe'){await pg.evaluate(()=>SR.skipSafe());await wait(1200);await tapSel('#bSafeNext');await wait(500);}
  await wait(2600);await shot('flip-table');await tapSel('#bFlipNext');await wait(1800);await shot('flip-sold');
  await tapSel('#bFlipNext');const tr=[];const t0=Date.now();for(let i=0;i<60;i++){tr.push([Date.now()-t0,JSON.stringify(await rect('#bLadNext'))]);if(i===6)await shot('walk-mid');await wait(100);}
  info.walkBtn=tr.filter((x,i)=>i===0||x[1]!==tr[i-1][1]);await shot('walk-end');s=await st();info.afterU1={pct:(await pg.evaluate(()=>SR.village())).pct,bank:s.save.bank,build:await vis('#bBuild'),buildTxt:await pg.$eval('#bBuild',e=>e.textContent)};}
if(SC.includes('flea')){for(const hl of [['guitar'],['guitar','camera','jewelry']]){await setSave({unit:2,bank:400});await pg.evaluate(hl=>SR.debugFlip(hl),hl);await wait(2400);await shot('flea-'+hl.length+'-table');await tapSel('#bFlipNext');await wait(700);await shot('flea-'+hl.length+'-sold');}}
if(SC.includes('top')){for(const u of [2,3,4]){await setSave({unit:u,bank:500,truckSeen:u>=3,built:['sign']});await tapSel('#bOpen');await wait(1800);await shot('map-u'+(u+1));}}
if(SC.includes('fail')){await setSave({unit:1,bank:300,built:['sign']});await tapSel('#bOpen');await wait(1500);await tapSel('#bLadNext');await wait(700);const L=await pg.evaluate(()=>SR.lockXY());await tap(L.x,L.y);await wait(2600);
  await pg.evaluate(()=>SR.setMoves(1));const m=await pg.evaluate(()=>SR.bestMove());const a=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.a[0],m.a[1]),c=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.b[0],m.b[1]);await swipe(a,c);
  for(let i=0;i<40&&!(await vis('#msg'));i++)await wait(150);await wait(300);info.fail=await pg.$eval('#card',e=>e.innerText);await shot('fail-0finds');}
console.log(sz,JSON.stringify(info),'errors:',errs.length?errs.join(' | '):'none');await pg.close();}
await b.close();})().catch(e=>{console.error(e);process.exit(1);});
