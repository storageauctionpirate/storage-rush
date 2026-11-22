// Reward-rhythm sim for Sunnyvale: hint-only bot, step-by-step cascades, Rush Meter, Mystery Box, Safe Cracker.
// Prints per unit: win rate, rushes, top multiplier, box / safe chance, bonus cash, and the bonus factor f
// (total cash / plain finds+cart cash) that test/econ-world.js uses for Worlds 2-50.
// Run: node test/rhythm-sim.js   (RUNS=40)
const E=require('../js/engine.js');const {YARD1}=require('../js/levels.js');const R=require('../js/rhythm.js');
const PRICE={guitar:350,jewelry:240,safe:900,camera:180,neon:600};
const RUNS=+process.env.RUNS||40;
function lcg(seed){let s=seed>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
// CASUAL=1: a weaker, human-like player (best move only 35% of the time, otherwise any legal swap)
const CASUAL=process.env.CASUAL==='1';
function anyMove(e,rnd){for(let k=0;k<60;k++){const r=Math.floor(rnd()*7),c=Math.floor(rnd()*7),d=rnd()<.5?[0,1]:[1,0],r2=r+d[0],c2=c+d[1];if(r2>6||c2>6)continue;if(e.scoreSwap([r,c],[r2,c2])>=0)return {a:[r,c],b:[r2,c2]};}return e.bestMove();}
function playRoom(def,seed,st,ui,rnd){const e=new E(def,seed);let g=0;const rushOn=ui>=R.RUSH_FROM;st.rushX=0;st.left=0;let plainCart=0,extra=0;
  const add=n=>{if(!rushOn||st.rushX)return;st.meter+=n*(st.seen?1:R.METER/R.FIRST_RUSH);if(st.meter>=R.METER){st.rushes++;st.seen=true;st.rushX=R.mult(st.rushes);st.left=R.RUSH_MOVES;st.fresh=true;st.best=Math.max(st.best,st.rushX);st.meter=0;}};
  const onSteps=()=>{let chain=0,kinds=[];for(;;){const ev=e.step();if(!ev)break;chain++;e.gravity();
      const items=ev.cleared.filter(c=>c.tile.k==='item').length;plainCart+=items;
      if(rushOn){extra+=items*(R.itemPay(st.meter,st.rushX)-2);ev.fired.forEach(f=>kinds.push(f.sp));
        add(R.gain(chain,ev.cleared.length,ev.fired.length,ev.hits.filter(h=>h.revealed).length));}}
    if(rushOn&&ui>=R.BOX_FROM&&!st.box&&R.boxEarned(chain,kinds)){st.box=true;st.boxWhy='play';}
    if(!e.bestMove())e.shuffle();};
  const tick=()=>{if(!st.rushX)return;if(st.fresh){st.fresh=false;return;}if(--st.left<=0)st.rushX=0;};
  while(e.status()==='play'&&g++<400){const f=e.findsOnBoard();if(f.length){f.forEach(x=>{e.collect(x.r,x.c);if(st.rushX)extra+=(PRICE[x.key]||0)*(st.rushX-1);else add(R.FIND_GAIN);});e.gravity();onSteps();continue;}
    if(e.moves<=0)break;const m=CASUAL&&rnd()>.35?anyMove(e,rnd):e.bestMove();if(!m){e.shuffle();continue;}const r=e.swap(m.a,m.b);if(!r.ok){e.shuffle();continue;}onSteps();tick();}
  st.rushX=0;return {e,plainCart,extra};}
const LM=[['flea',1,R.STALL_COST,1],['truck',3,0,1.5],['office',5,5500,2],['units',7,8000,2],['sign',9,8500,2],['thrift',11,9500,2],['garage',13,10500,2],['pawn',15,12000,2],['warehouse',17,15500,2]];
const TRUCK=[[3,1000],[8,1500],[12,2000],[16,3000]],WSUM=LM.reduce((a,l)=>a+l[3],0);
const agg=[];let fTot=0,pTot=0;const town=[];
let firstBonusAt=[],firstRushAt=[];
for(let run=0;run<RUNS;run++){const rnd=lcg(run*7919+5);let commons=0,firstSafe=true,returnBoost=0,bank=0,built=new Set(),tl=0,carry=0,seen=false,boxSeen=false,dry=0,fb=0,fr=0;
  YARD1.units.forEach((u,ui)=>{const st={meter:Math.max(carry,returnBoost),rushes:0,best:0,box:false,rushX:0,seen};returnBoost=0;let haul=[],cart=0,extra=0,wins=0,tries=0;
    u.boards.forEach((b,bi)=>{for(let t=0;t<6;t++){tries++;const snap=st.meter;const r=playRoom(Object.assign({},b),b.seed*1000+run*10+t,st,ui,rnd);
      if(r.e.status()==='win'){wins++;haul.push(...r.e.collected);cart+=r.plainCart;extra+=r.extra;
        if(R.clearBox({eligible:ui>=R.BOX_FROM,hasBox:st.box,boxSeen,lastRoom:bi===u.boards.length-1,bonusThisUnit:ui>=2&&R.safeEarned(haul,st.best),dry})){st.box=true;st.boxWhy='clear';}
        break;}st.meter=Math.max(snap,st.meter);}});
    carry=Math.min(R.METER-1,st.meter);seen=st.seen;if(st.rushes&&!fr)fr=ui+1;
    let plain=haul.reduce((s,k)=>s+(PRICE[k]||0),0)+cart*2;if(ui===0)plain=R.FIRST_SALE;
    let boxCash=0,safeCash=0,safe=null;
    if(st.box){const bx=R.rollBox(rnd,1);boxCash=bx.cash;}
    if(ui>=2&&R.safeEarned(haul,st.best)){safe=R.rollSafe(rnd,{first:firstSafe,bestRush:st.best,commons});firstSafe=false;commons=safe==='common'?commons+1:0;safeCash=R.SAFE_PAY[safe];}
    if(safe==='rare'||safe==='legendary'||st.best>=5)returnBoost=R.RETURN_BOOST;
    if(st.box)boxSeen=true;dry=(st.box||safe)?0:dry+1;if((st.box||safe)&&!fb)fb=ui+1;if(ui===19){firstBonusAt.push(fb);firstRushAt.push(fr);}
    const a=agg[ui]=agg[ui]||{n:0,win:0,rush:0,r2:0,r3:0,r5:0,box:0,safe:0,rare:0,plain:0,bonus:0};
    a.gap=Math.max(a.gap||0,dry);a.n++;a.win+=wins===u.boards.length?1:0;a.rush+=st.rushes;a.r2+=st.best>=2;a.r3+=st.best>=3;a.r5+=st.best>=5;a.box+=st.box;a.safe+=!!safe;a.rare+=safe&&safe!=='common';
    a.plain+=plain;a.bonus+=extra+boxCash+safeCash;fTot+=plain+extra+boxCash+safeCash;pTot+=plain;
    bank+=plain+extra+boxCash+safeCash;const n=ui+1;if(n>=3)built.add('truck');
    for(;;){const L=LM.find(l=>!built.has(l[0])&&l[0]!=='truck'&&n>=l[1]);const T=tl<TRUCK.length&&n>=TRUCK[tl][0]?TRUCK[tl][1]:null;const o=[];if(L&&bank>=L[2])o.push(['l',L[2]]);if(T!=null&&bank>=T)o.push(['t',T]);if(!o.length)break;o.sort((x,y)=>x[1]-y[1]);if(o[0][0]==='l'){bank-=L[2];built.add(L[0]);}else{bank-=T;tl++;}}
    if(ui===0)a.u1left=(a.u1left||0)+bank;
    a.bank=(a.bank||0)+bank;a.pct=(a.pct||0)+[...built].reduce((q,id)=>q+LM.find(l=>l[0]===id)[3],0)/WSUM*100;});}
const pc=x=>String(Math.round(x*100)).padStart(3)+'%';
console.log('unit rooms  rush/unit  any  3X+  5X   box  safe rare+  plain$   bonus$');
agg.forEach((a,i)=>console.log(('U'+(i+1)).padEnd(5),String(YARD1.units[i].boards.length).padStart(4),(a.rush/a.n).toFixed(2).padStart(9),pc(a.r2/a.n),pc(a.r3/a.n),pc(a.r5/a.n),pc(a.box/a.n),pc(a.safe/a.n),pc(a.rare/a.n),String(Math.round(a.plain/a.n)).padStart(8),String(Math.round(a.bonus/a.n)).padStart(8)));
const tb=agg.reduce((s,a)=>s+a.bonus/a.n,0),tp=agg.reduce((s,a)=>s+a.plain/a.n,0);
console.log('Sunnyvale per-run: plain $'+Math.round(tp)+'  bonus $'+Math.round(tb)+'  bonus factor f = '+(fTot/pTot).toFixed(2));
agg.forEach((a,i)=>{if([1,2,5,10,15,20].includes(i+1))console.log('after U'+(i+1)+': bank $'+Math.round(a.bank/a.n)+'  town '+Math.round(a.pct/a.n)+'% built');});
const hist=(arr)=>{const o={};arr.forEach(x=>o[x||'never']=(o[x||'never']||0)+1);return Object.entries(o).map(([k,v])=>'U'+k+': '+Math.round(v/arr.length*100)+'%').join('  ');};
console.log((CASUAL?'CASUAL player':'Good player')+'. First bonus game (box or safe) at '+hist(firstBonusAt));console.log('First Rush at '+hist(firstRushAt));console.log('Longest run of units without a bonus game (Unit 3+): '+Math.max(...agg.slice(2).map(a=>a.gap||0)));
console.log('Unit 1 sale: $'+R.FIRST_SALE+' - stall $'+R.STALL_COST+' = $'+(R.FIRST_SALE-R.STALL_COST)+' left; Unit 2 costs $0 to enter.');
