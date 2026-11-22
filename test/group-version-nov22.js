// Group version (Mike YES 1:07 PM PT Nov 22): $1 hook, World 1 = 10 units, item ladder, log money curve.
// Real taps for the hook and Unit 1 (no debugWin there). Run: NODE_PATH=... node test/group-version-nov22.js  (ONLY=390x844 etc.)
const p=require('puppeteer-core'),fs=require('fs'),path=require('path');const wait=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'http://127.0.0.1:8872/index.html',OUT=path.join(__dirname,'..','shots','group-version-nov22');fs.mkdirSync(OUT,{recursive:true});
const EC=require('../js/economy.js'),IT=require('../js/items.js'),LV=require('../js/levels.js'),BL=require('../js/build-costs.js');
let pass=0,fail=0;const ok=(t,x,d)=>{console.log((x?'PASS ':'FAIL ')+t+(d?' — '+d:''));x?pass++:fail++;};
// ---- static: curve, ladder, world shape ----
ok('locker curve: $1 at L1, about 10x every 20 levels to L100, then a soft cap (L500 under $100M)',EC.locker(1)===1&&EC.locker(10)<=3&&Math.abs(EC.raw(21)/EC.raw(1)-10)<1e-9&&Math.abs(EC.raw(100)/EC.raw(80)-10)<1e-9&&EC.raw(200)/EC.raw(100)<25&&EC.locker(500)<1e8,[1,10,20,50,100,200,500].map(L=>'L'+L+' '+EC.fmt(EC.locker(L))).join(' '));
ok('World 1 lockers are $1-$3, the finale is a 3x Big One',LV.YARD1.units.map((u,i)=>EC.locker(i+1,u.finale)).join()==='1,1,1,1,2,2,2,2,3,8');
ok('World 1 = 10 units with a mini arc (lockbox hook, Scrapper obstacle, last 3 harder, finale)',LV.YARD1.units.length===10&&LV.YARD1.units[0].boards[0].tarps.some(t=>t[3]==='hook')&&LV.YARD1.units[5].boards[0].scrapper==='teach'&&LV.YARD1.units.slice(7).every(u=>u.hard)&&LV.YARD1.units[9].finale&&LV.YARD1.units[9].name==='The Big One');
ok('item catalog: every item has value, rarity and collection fields; 7 tiers plus a 500+ plan',IT.CAT.length>=100&&IT.CAT.every(i=>typeof i.x==='number'&&IT.RAR.includes(i.rarity)&&'set' in i&&i.tier>=1&&i.tier<=7)&&IT.TIERS.length===7&&IT.TIER_PLAN_500.length>=3,IT.CAT.length+' items');
ok('L1-25 has many distinct cheap items (books, mugs, lamps, tools, toys, kitchen, radios, fishing, vintage toys)',IT.CAT.filter(i=>i.tier<=2&&!i.lockbox).length>=50&&['books','mug','lamp','hammer','teddy','pan','radio','rod','train'].every(k=>IT.get(k)&&IT.get(k).tier<=2));
{const R=(s=>()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648;})(7),seen=new Set();let bad=[];
  for(let n=0;n<400;n++)LV.YARD1.units.forEach((u,ui)=>u.boards.forEach(b=>b.tarps.forEach(t=>{if(!t[3])return;const id=IT.pick(t[3],ui+1,R,{noRare:ui<2});seen.add(id);const i=IT.get(id);if(i.tier>1||['guitar','camera','jewelry','safe','floorsafe','neon','treasure'].includes(id))bad.push(id);})));
  ok('World 1 finds never include guitars, cameras, jewelry or big safes (400 rolls per room)',bad.length===0,bad.slice(0,5).join(','));
  ok('World 1 rolls show variety (30+ distinct items)',seen.size>=30,seen.size+' distinct');}
ok('a $1 locker can surprise: Unit 1 safe holds the $40 Tin Robot',EC.U1.robot===40&&IT.get('tinrobot').rarity==='rare'&&EC.locker(1)===1);
ok('first sale $47 ($40 robot + $8 lot - $1 bid), stall $40 leaves $7',EC.FIRST_SALE===47&&EC.STALL_COST===40);
ok('collections: a cheap toy can finish a set later (sets span tiers)',IT.SETS.toys.items.some(k=>IT.get(k).tier===1)&&IT.SETS.toys.items.some(k=>IT.get(k).tier===2)&&IT.value('yoyo',400,EC)<=3&&IT.setBonus('toys',400,EC)>1e6);
{const w1=BL.SUNNYVALE.reduce((a,l)=>a+l.cost,0)+BL.PICKUP.reduce((a,t)=>a+t.price,0)+BL.YARD.reduce((a,t)=>a+t.price,0);
  ok('Sunnyvale build list costs less than a no-bonus player earns in 10 units (test/econ.js: ~$312)',w1<=312*0.9,'$'+w1);}
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const VPS=[[390,844],[375,667],[1280,800]].filter(v=>!process.env.ONLY||process.env.ONLY===v.join('x'));
for(const [width,height] of VPS){const T=width+'x'+height,pg=await b.newPage(),errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});await pg.setViewport({width,height});
const st=()=>pg.evaluate(()=>SR.state());const until=async(fn,ms)=>{const t0=Date.now();while(Date.now()-t0<(ms||6000)){const s=await st();if(await fn(s))return s;await wait(70);}return st();};
const txt=s=>pg.$eval(s,e=>e.textContent),vis=s=>pg.$eval(s,e=>!e.classList.contains('hidden')&&e.offsetParent!==null&&getComputedStyle(e).visibility!=='hidden').catch(()=>false);
const click=async s=>{const r=await pg.$eval(s,e=>{const b=e.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}});await pg.mouse.click(r.x,r.y);};
const shot=n=>pg.screenshot({path:path.join(OUT,T+'-'+n+'.png')});
const move=async()=>{const m=await pg.evaluate(()=>SR.bestMove());if(!m)return;const a=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.a[0],m.a[1]),c=await pg.evaluate((r,c)=>SR.cellXY(r,c),m.b[0],m.b[1]);await pg.mouse.move(a.x,a.y);await pg.mouse.down();for(let i=1;i<=5;i++){await pg.mouse.move(a.x+(c.x-a.x)*i/5,a.y+(c.y-a.y)*i/5);await wait(16);}await pg.mouse.up();await wait(150);await until(x=>!x.busy||x.result,6000);};
const playToWin=async()=>{for(let i=0;i<300;i++){const s=await st();if(s.result==='win'||s.mode!=='play')return s;if(await vis('#msg')){return s;}if(s.busy){await wait(80);continue;}
  if(s.finds.length){const f=s.finds[0],q=await pg.evaluate((r,c)=>SR.cellXY(r,c),f.r,f.c);await pg.mouse.click(q.x,q.y);await wait(200);await until(x=>!x.busy||x.result,6000);continue;}await move();}return st();};
const seed=o=>pg.evaluate(o=>{localStorage.clear();localStorage.setItem('storageRush.v3',JSON.stringify(Object.assign({v:3,ev:2,hookSeen:true,lmv:2,unit:0,bank:0,sound:false,rung:0,tasks:[],boosters:{cut:2,flash:1,free:0},daily:{day:'',boards:0,punch:[],glove:''},endless:{n:0,best:0},seenLadder:true,taughtBoost:{cut:true,flash:true,free:true},truckSeen:false,built:[],safeBank:0,col:{}},o)));},o);
await pg.goto(BASE+'?debug=1&v='+Date.now(),{waitUntil:'load'});await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'load'});await wait(900);
// ---- HOOK ----
await click('#bOpen');let s=await until(x=>x.mode==='hook',5000);
ok(T+' fresh player: Open Unit plays the $1 auction hook first (no purchase, no map)',s.mode==='hook'&&s.save.hookSeen&&await vis('#bHookSkip'));
const HT=await pg.evaluate(()=>SR.hookT);const frames=[['1-auctioneer',2600],['2-opening-bid-one-dollar',5200],['3-going-once',7300],['4-sold-for-1',8700],['5-door-rolls-up',10400],['6-safe-tease-flash',HT.tease+260],['7-whats-inside-freeze',HT.freeze+1200]];
for(const [n,t] of frames){await pg.evaluate(t=>SR.hookAt(t),t);await wait(260);await shot('hook-'+n);}
ok(T+' hook timeline is 15-25 s and skippable the whole way',HT.end>=15000&&HT.end<=25000&&await vis('#bHookSkip'),(HT.end/1000)+' s');
// let the end play out naturally from just before the freeze: it must cut to the Unit 1 board by itself
await pg.evaluate(t=>{SR.hookAt(t);SR.hookPlay();},HT.freeze+800);s=await until(x=>x.mode==='play'&&!x.busy,9000);
ok(T+' hook ends on its own and cuts to the Unit 1 board',s.mode==='play'&&s.unitId==='Unit 1'&&s.tarps.some(t=>t.find==='oldsafe'),JSON.stringify({mode:s.mode,unit:s.unitId}));
await shot('unit1-board-after-hook');
await pg.reload({waitUntil:'load'});await wait(800);await click('#bOpen');s=await until(x=>x.mode==='map'||x.mode==='hook',5000);
ok(T+' hook shows only once (second launch goes to the map)',s.mode==='map',s.mode);
// skip works from the very first frame on a fresh save
await pg.evaluate(()=>localStorage.clear());await pg.reload({waitUntil:'load'});await wait(800);await click('#bOpen');await until(x=>x.mode==='hook',4000);await wait(300);await click('#bHookSkip');s=await until(x=>x.mode==='play'&&!x.busy,6000);
ok(T+' Skip goes straight to Unit 1',s.mode==='play'&&s.unitId==='Unit 1'&&s.save.hookSeen);
// a returning player (old save, played before) never sees it
await seed({unit:3,bank:20,hookSeen:false});await pg.reload({waitUntil:'load'});await wait(700);await click('#bOpen');s=await until(x=>x.mode==='map'||x.mode==='hook',4000);ok(T+' a player past Unit 1 never gets the hook',s.mode==='map');
// ---- UNIT 1: dig out the safe, crack it: $40 Tin Robot, $47 banked, $40 stall leaves $7 ----
await seed({});await pg.reload({waitUntil:'load'});await wait(700);await click('#bOpen');await until(x=>x.mode==='map'&&!x.map.walking,6000);await wait(500);
ok(T+' map shows early locker prices (next unit pill: locker $1)',/locker \$1/.test(await txt('#bLadNext'))&&/locker \$1/.test(await txt('#ladSub')),await txt('#bLadNext'));
await shot('map-early-locker-prices');
await click('#bLadNext');await until(x=>x.mode==='door',4000);await wait(400);
ok(T+' Unit 1 door: won at auction for $1, paid once from the haul',/Won at auction for \$1/.test(await txt('#doorGoal'))&&/Dig out the safe/.test(await txt('#doorGoal')),await txt('#doorGoal'));await shot('unit1-door-locker-1');
{const L=await pg.evaluate(()=>SR.lockXY());await pg.mouse.click(L.x,L.y);}await until(x=>x.mode==='play'&&!x.busy,6000);
for(let tryN=0;tryN<4;tryN++){s=await playToWin();await wait(500);if(!(await vis('#msg'))){await until(()=>false,1500);}
  // a real player who runs out of moves just retries for free (no charge); the bot does the same
  if(/Out of moves/.test(await txt('#msgH'))){await click('#msgB');await until(x=>x.mode==='door',4000);await wait(300);const L=await pg.evaluate(()=>SR.lockXY());await pg.mouse.click(L.x,L.y);await until(x=>x.mode==='play'&&!x.busy,6000);continue;}break;}
ok(T+' Unit 1 cleared by real play: the old safe came out from under a tarp',/cleared!/.test(await txt('#msgH'))&&/Crack the safe/.test(await txt('#msgB'))&&(await st()).rush.safe&&(await st()).rush.safe.hook,await txt('#msgH'));await shot('unit1-cleared-safe-earned');
await click('#msgB');s=await until(x=>x.mode==='safe',4000);await wait(900);await shot('unit1-safe-cracking');await pg.evaluate(()=>SR.skipSafe());await wait(1300);
ok(T+' Unit 1 safe pays off in Unit 1: Tin Robot $40',/\+\$40\b/.test(await txt('#safePay'))&&/Tin Robot/.test(await txt('#safeFind')),(await txt('#safePay'))+' · '+(await txt('#safeFind')));await shot('unit1-safe-payoff-tin-robot');
await click('#bSafeNext');s=await until(x=>x.mode==='flip'&&x.flipDone,6000);await wait(400);const rc=await pg.evaluate(()=>SR.receipt());
ok(T+' Unit 1 flip receipt: robot banked, $8 cart lot, $1 locker bid charged once',rc.filter(i=>i.key==='bid').length===1&&rc.find(i=>i.key==='bid').price===-1&&rc.find(i=>i.key==='cart').price===8&&/Tin Robot/.test(await txt('#haul')),JSON.stringify(rc));
await shot('unit1-flip-receipt');await click('#bFlipNext');await wait(700);await click('#bFlipNext');s=await until(x=>x.mode==='map'&&!x.map.walking&&!x.building,8000);await wait(2500);s=await st();
ok(T+' after Unit 1: $47 banked, Flea Market Stall offered at $40',s.save.bank===47&&/Flea Market Stall/.test(await txt('#bBuild'))&&/\$40/.test(await txt('#bBuild')),s.save.bank+' · '+(await txt('#bBuild')));
await click('#bBuild');await wait(3000);s=await st();ok(T+' stall built: $7 left, Unit 2 open at a $1 locker',s.save.bank===7&&s.save.built.includes('flea')&&/Unit 2/.test(await txt('#bLadNext'))&&/locker \$1/.test(await txt('#bLadNext')));await shot('map-after-stall-locker-prices');
// ---- locker bid: a failed try never charges; clearing charges it once ----
await seed({unit:4,bank:30,built:['flea'],truckSeen:true,boxSeen:true,rushSeen:true,safeSeen:true});await pg.reload({waitUntil:'load'});await wait(700);await click('#bOpen');await until(x=>x.mode==='map'&&!x.map.walking,6000);await wait(400);await click('#bLadNext');await until(x=>x.mode==='door',4000);
ok(T+' Unit 5 door shows its $2 locker bid',/Locker bid \$2/.test(await txt('#doorGoal')),await txt('#doorGoal'));
{const L=await pg.evaluate(()=>SR.lockXY());await pg.mouse.click(L.x,L.y);}await until(x=>x.mode==='play'&&!x.busy,6000);
await pg.evaluate(()=>SR.setMoves(1));s=await st();if(!s.finds.length)await move();await wait(800);
if(await vis('#msg')&&/Out of bid cards/.test(await txt('#msgH'))){await click('#msgB2');await wait(800);}
s=await st();ok(T+' failing a room costs nothing and says retries are free',s.save.bank===30&&/Retry is free/.test(await txt('#msgP')),s.save.bank+' · '+(await txt('#msgP')).slice(0,90));
await click('#msgB');await until(x=>x.mode==='door',4000);{const L=await pg.evaluate(()=>SR.lockXY());await pg.mouse.click(L.x,L.y);}await until(x=>x.mode==='play'&&!x.busy,6000);
for(let k=0;k<4;k++){s=await st();if(s.mode!=='play'||await vis('#msg'))break;await pg.evaluate(()=>SR.debugWin());await wait(1900);}
await until(async()=>await vis('#msg'),5000);if(/Crack the safe/.test(await txt('#msgB'))){await click('#msgB');await until(x=>x.mode==='safe',4000);await pg.evaluate(()=>SR.skipSafe());await wait(1300);await click('#bSafeNext');}else await click('#msgB');
s=await until(x=>x.mode==='flip'&&x.flipDone,6000);const rc5=await pg.evaluate(()=>SR.receipt()),bk=s.save.bank,sum=rc5.reduce((a,i)=>a+i.price,0);
ok(T+' after a fail + retry, the $2 bid is charged exactly once',rc5.filter(i=>i.key==='bid').length===1&&rc5.find(i=>i.key==='bid').price>=-2&&rc5.find(i=>i.key==='bid').price<0,JSON.stringify(rc5.map(i=>i.key+':'+i.price)));
await shot('unit5-flip-bid-once');
// ---- item ladder in play: Unit 1-10 picks stay in tier 1 ----
{const tiers=await pg.evaluate(()=>{const out=[];for(const k of Object.values(SR.picks()||{}).flat())if(k)out.push(SR.itemInfo(k));return out;});ok(T+' Unit 5 finds come from the household tier with real names and values',tiers.length>0&&tiers.every(i=>i.tier===1&&i.value>=0&&i.name),JSON.stringify(tiers.map(i=>i.name+' $'+i.value)));}
// ---- WORLD 1 FINALE ----
await seed({unit:9,bank:200,built:['flea','office','units','sign','thrift','garage','pawn'],truckSeen:true,boxSeen:true,rushSeen:true,safeSeen:true,tasks:['wash','fender','visor'],rung:1});await pg.reload({waitUntil:'load'});await wait(700);await click('#bOpen');await until(x=>x.mode==='map'&&!x.map.walking,6000);await wait(900);
ok(T+' finale on the map: Unit 10, THE BIG ONE, an $8 locker',/Unit 10/.test(await txt('#bLadNext'))&&/locker \$8/.test(await txt('#bLadNext'))&&/of 10/.test(await txt('#ladSub')),await txt('#bLadNext'));await shot('finale-map-the-big-one');
{const bad=await pg.evaluate(()=>SR.mapCheck());ok(T+' map with 10 stops: no landmark touches a stop, tag, hustler or button',bad.length===0,bad.slice(0,5).join(' | '));}
await click('#bLadNext');await until(x=>x.mode==='door',4000);await wait(400);ok(T+' finale door says THE BIG ONE · locker bid $8',/THE BIG ONE · locker bid \$8/.test(await txt('#doorGoal')),await txt('#doorGoal'));await shot('finale-door');
{const L=await pg.evaluate(()=>SR.lockXY());await pg.mouse.click(L.x,L.y);}s=await until(x=>x.mode==='play'&&!x.busy,6000);
ok(T+' finale: 3 rooms, collectible finds (rare or better) and a lockbox',s.boards===3&&await pg.evaluate(()=>{const p=SR.picks();return Object.values(p).flat().filter(Boolean).every(k=>{const i=SR.itemInfo(k);return i.tier===1&&(['rare','epic','legendary'].includes(i.rarity)||/lock|safe/.test(k));});}));
await shot('finale-board');
for(let k=0;k<6;k++){s=await st();if(s.mode!=='play'||await vis('#msg'))break;await pg.evaluate(()=>SR.debugWin());await wait(2100);}
await until(async()=>await vis('#msg')||(await st()).mode==='box',5000);
for(let k=0;k<6;k++){s=await st();if(s.mode==='box'){await pg.evaluate(()=>SR.skipBox());await wait(600);await click('#bBoxNext');await wait(500);continue;}if(s.mode==='safe'){await wait(600);await pg.evaluate(()=>SR.skipSafe());await wait(1300);await shot('finale-safe');await click('#bSafeNext');await wait(500);continue;}if(s.mode==='flip')break;if(await vis('#msg')){await click('#msgB');await wait(500);continue;}await wait(300);}
s=await until(x=>x.mode==='flip'&&x.flipDone,6000);await wait(400);await shot('finale-flip');const rcf=await pg.evaluate(()=>SR.receipt());
ok(T+' finale flip charges the $8 Big One bid once',rcf.filter(i=>i.key==='bid').length===1&&/Big One/.test(rcf.find(i=>i.key==='bid').name),JSON.stringify(rcf.map(i=>i.key+':'+i.price)));
await click('#bFlipNext');await wait(700);await click('#bFlipNext');s=await until(x=>(x.mode==='map'&&!x.map.walking)||x.mode==='locked',8000);await wait(1500);s=await st();
ok(T+' World 1 complete after 10 units: Desert Gold next',s.save.unit===10&&(/Desert Gold/.test(await txt('#bLadNext'))||s.mode==='locked')&&/10 \/ 10/.test(await txt('#ladSub')),await txt('#ladSub'));await shot('finale-world1-complete');
// buy the remaining builds with game cash only: everything in Sunnyvale can be finished
{let guard=0;while(guard++<10&&await vis('#bBuild')&&!(await pg.$eval('#bBuild',e=>e.classList.contains('poor')))){await click('#bBuild');await wait(2800);}const v=await pg.evaluate(()=>SR.village());ok(T+' Sunnyvale build list finishes in 10 units with earned cash',v.pct===100||v.built.length>=8,v.pct+'% built, bank $'+(await st()).save.bank);await shot('finale-sunnyvale-built');}
ok(T+' no page errors',errs.length===0,errs.slice(0,3).join(' | '));await pg.close();}
await b.close();console.log('\n'+pass+'/'+(pass+fail)+' passed');process.exitCode=fail?1:0;})();
