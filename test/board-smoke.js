const puppeteer=require('puppeteer-core');
(async()=>{const b=await puppeteer.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage();await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text());});
await p.goto('http://127.0.0.1:8872/board/?fresh=1&debug=1',{waitUntil:'networkidle0'});await new Promise(r=>setTimeout(r,2500));
await p.screenshot({path:'/tmp/bp1.png'});console.log(await p.evaluate(()=>JSON.stringify(BP.state())));
await p.click('[data-act=start]');await new Promise(r=>setTimeout(r,3500));await p.screenshot({path:'/tmp/bp2.png'});
console.log(await p.evaluate(()=>JSON.stringify(BP.state())));
for(let i=0;i<6;i++){const m=await p.evaluate(()=>BP.bestMove());if(!m)break;const a=await p.evaluate((r,c)=>BP.cellXY(r,c),...m.a),bb=await p.evaluate((r,c)=>BP.cellXY(r,c),...m.b);
 await p.touchscreen.tap(a.x,a.y);await new Promise(r=>setTimeout(r,80));await p.touchscreen.tap(bb.x,bb.y);await new Promise(r=>setTimeout(r,1400));}
await p.screenshot({path:'/tmp/bp3.png'});console.log(await p.evaluate(()=>JSON.stringify(BP.state())));
console.log(errs.join('\n')||'no errors');await b.close();})();
