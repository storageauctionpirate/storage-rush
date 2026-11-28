// Matched screenshot capture for play (/play/) vs play-look. Usage: node test/play-look-shots.cjs <play|play-look> <w> <h> <outdir> <prefix>
const puppeteer=require('puppeteer-core'),path=require('path'),fs=require('fs');
const [,,APP,W,H,OUT,PRE]=process.argv;const BASE='http://127.0.0.1:8872/';const sleep=ms=>new Promise(r=>setTimeout(r,ms));
fs.mkdirSync(OUT,{recursive:true});
(async()=>{const m=+W<600;
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',x=>{if(x.type()==='error')errs.push(x.text());});p.on('response',r=>{if(r.status()>=400)errs.push(r.status()+' '+r.url());});
 await p.setViewport({width:+W,height:+H,deviceScaleFactor:m?2:1,isMobile:m,hasTouch:m});
 const snap=async n=>{await p.screenshot({path:path.join(OUT,`${PRE}-${n}.jpg`),type:'jpeg',quality:82});console.log('shot',PRE,n);};
 const load=async()=>{await p.goto(BASE+APP+'/?fresh=1&debug=1',{waitUntil:'load'});await p.waitForFunction(()=>window.BP&&BP.perf().readyMs!=null,{timeout:60000});await p.waitForFunction(()=>{const x=BP.models();return x&&x.pirate&&x.trucks>=3;},{timeout:25000}).catch(()=>{});await sleep(2500);};
 const closeM=async()=>{await p.evaluate(()=>{const c=document.getElementById('close');if(c)c.click();});await sleep(400);};
 await load();await snap('01-title');
 const TR=['guitar','mug','teddy','hammer','jewelry','books'];
 await p.evaluate(t=>{BP.debug.set({started:true,rolls:3,cash:80,truck:t});BP.debug.panel();},TR);await sleep(900);
 await snap('02-board');
 await p.evaluate(()=>document.getElementById('truck').click());await sleep(700);await snap('03-merch-truck');await closeM();
 await p.evaluate(t=>{BP.debug.set({pos:3,truck:t,cash:80,cap:10});BP.debug.land();},TR);await sleep(1500);await snap('04-shop-pawn');await closeM();
 await p.evaluate(t=>{BP.debug.set({pos:6,truck:t,cash:80,cap:10});BP.debug.land();},TR);await sleep(1500);await snap('05-shop-flea');await closeM();
 await p.evaluate(()=>{BP.debug.set({pos:1,cash:80,started:true});BP.debug.land();});await sleep(1000);
 const pick=await p.$('[data-act=pickL]');if(pick){await pick.click();await sleep(4500);}
 await p.waitForFunction(()=>BP.state().clean,{timeout:20000}).catch(()=>{});await sleep(800);await snap('06-locker-match3');
 await p.evaluate(()=>BP.debug&&BP.debug.win&&BP.debug.win());await p.waitForFunction(()=>BP.state().modal,{timeout:20000}).catch(()=>{});await sleep(900);await snap('07-results');
 console.log('errs',JSON.stringify(errs));await b.close();})().catch(e=>{console.error(e);process.exit(1);});
