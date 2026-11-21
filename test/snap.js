// Quick phone-size stills of each scene. Usage: node test/snap.js [outdir] [WxH]
const puppeteer=require('puppeteer-core');const path=require('path');const fs=require('fs');
const BASE=process.env.URL||'http://127.0.0.1:8872/index.html?debug=1';
const out=process.argv[2]||'/tmp/sr/snap';const sizes=(process.argv[3]||'390x844').split(',');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{fs.mkdirSync(out,{recursive:true});
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox']});
for(const sz of sizes){const [w,h]=sz.split('x').map(Number);
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await pg.emulate({viewport:{width:w,height:h,deviceScaleFactor:2,isMobile:true,hasTouch:true},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'});
const setSave=async o=>{await pg.goto(BASE,{waitUntil:'load'});await pg.evaluate(o=>{localStorage.clear();const s=Object.assign({v:3,unit:0,bank:0,sound:false,rung:0,tasks:[],boosters:{cut:2,flash:1,free:1},daily:{day:'',boards:0,punch:[],glove:''},endless:{n:0,best:0},seenLadder:true,taughtBoost:{cut:true,flash:true,free:true},truckSeen:false,safeBank:0},o);localStorage.setItem('storageRush.v3',JSON.stringify(s));},o);await pg.reload({waitUntil:'load'});await wait(900);};
const shot=async n=>{await pg.screenshot({path:path.join(out,sz+'-'+n+'.png')});};
await setSave({});const sc=(process.env.SC||'title,map,board,safe,flea,truck,locked').split(',');
if(sc.includes('title')){await setSave({});await wait(500);await shot('title');}
if(sc.includes('map')){await setSave({unit:6,bank:850});await pg.evaluate(()=>document.getElementById('bOpen').click());await wait(1800);await shot('map');}
if(sc.includes('board')){await setSave({unit:11,bank:2450});await pg.evaluate(()=>document.getElementById('bOpen').click());await wait(800);await pg.evaluate(()=>document.getElementById('bLadNext').click());await wait(600);const L=await pg.evaluate(()=>SR.lockXY());await pg.touchscreen.tap(L.x,L.y);await wait(2600);await shot('board');}
if(sc.includes('safe')){for(const r of (process.env.RAR||'rare').split('|')){await pg.evaluate(r=>SR.debugSafe&&SR.debugSafe(r),r);await wait(+process.env.SAFE_T||1200);await shot('safe-spin-'+r);await wait(2600);await shot('safe-open-'+r);}}
if(sc.includes('flea')){await pg.evaluate(()=>SR.debugFlip&&SR.debugFlip());await wait(1500);await shot('flea');await pg.evaluate(()=>{const b=document.getElementById('bFlipNext');b&&b.click();});await wait(1400);await shot('flea-sold');}
if(sc.includes('truck')){await pg.evaluate(()=>SR.debugTruck&&SR.debugTruck());await wait(700);await shot('truck-before');await wait(2600);await shot('truck-after');}
if(sc.includes('locked')){await setSave({unit:20,bank:9000,rung:1});await pg.evaluate(()=>document.getElementById('bOpen').click());await wait(1500);await shot('locked');}
console.log(sz,'errors:',errs.length?errs.join(' | '):'none');await pg.close();}
await b.close();})().catch(e=>{console.error(e);process.exit(1);});
