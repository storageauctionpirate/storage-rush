// Reward-rhythm sim for Sunnyvale: hint-only bot, step-by-step cascades, Rush Meter, Mystery Box, Safe Cracker.
// Prints per unit: win rate, rushes, top multiplier, box / safe chance, bonus cash, and the bonus factor f
// (total cash / plain finds+cart cash) that test/econ-world.js uses for Worlds 2-50.
// Run: node test/rhythm-sim.js   (RUNS=40)
const E=require('../js/engine.js');const {YARD1}=require('../js/levels.js');const R=require('../js/rhythm.js');
const PRICE={guitar:350,jewelry:240,safe:900,camera:180,neon:600};
const RUNS=+process.env.RUNS||40;
function lcg(seed){let s=seed>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function playRoom(def,seed,st,ui){const e=new E(def,seed);let g=0,box=false;const rushOn=ui>=R.RUSH_FROM;st.rushX=0;let plainCart=0,extra=0;
  const onSteps=()=>{let chain=0,kinds=[];for(;;){const ev=e.step();if(!ev)break;chain++;e.gravity();
      const items=ev.cleared.filter(c=>c.tile.k==='item').length;plainCart+=items;
      if(rushOn){extra+=items*(R.itemPay(st.meter,st.rushX)-2);ev.fired.forEach(f=>kinds.push(f.sp));
        if(!st.rushX){st.meter+=R.gain(chain,ev.cleared.length,ev.fired.length,ev.hits.filter(h=>h.revealed).length);
          if(st.meter>=R.METER){st.rushes++;st.rushX=R.mult(st.rushes);st.best=Math.max(st.best,st.rushX);st.meter=0;}}}}
    if(rushOn&&ui>=R.BOX_FROM&&!st.box&&R.boxEarned(chain,kinds)){st.box=true;}
    if(!e.bestMove())e.shuffle();};
  while(e.status()==='play'&&g++<400){const f=e.findsOnBoard();if(f.length){f.forEach(x=>{e.collect(x.r,x.c);if(st.rushX)extra+=(PRICE[x.key]||0)*(st.rushX-1);});e.gravity();onSteps();continue;}
    if(e.moves<=0)break;const m=e.bestMove();if(!m){e.shuffle();continue;}const r=e.swap(m.a,m.b);if(!r.ok){e.shuffle();continue;}onSteps();}
  st.rushX=0;return {e,plainCart,extra};}
const agg=[];let fTot=0,pTot=0;
for(let run=0;run<RUNS;run++){const rnd=lcg(run*7919+5);let commons=0,firstSafe=true,returnBoost=0;
  YARD1.units.forEach((u,ui)=>{const st={meter:returnBoost,rushes:0,best:0,box:false,rushX:0};returnBoost=0;let haul=[],cart=0,extra=0,wins=0,tries=0;
    u.boards.forEach((b,bi)=>{for(let t=0;t<6;t++){tries++;const snap=st.meter;const r=playRoom(Object.assign({},b),b.seed*1000+run*10+t,st,ui);
      if(r.e.status()==='win'){wins++;haul.push(...r.e.collected);cart+=r.plainCart;extra+=r.extra;break;}st.meter=snap;}});
    let plain=haul.reduce((s,k)=>s+(PRICE[k]||0),0)+cart*2;if(ui===0)plain=R.FIRST_SALE;
    let boxCash=0,safeCash=0,safe=null;
    if(st.box){const bx=R.rollBox(rnd,1);boxCash=bx.cash;}
    if(ui>=2&&R.safeEarned(haul,st.best)){safe=R.rollSafe(rnd,{first:firstSafe,bestRush:st.best,commons});firstSafe=false;commons=safe==='common'?commons+1:0;safeCash=R.SAFE_PAY[safe];}
    if(safe==='rare'||safe==='legendary'||st.best>=5)returnBoost=R.RETURN_BOOST;
    const a=agg[ui]=agg[ui]||{n:0,win:0,rush:0,r2:0,r3:0,r5:0,box:0,safe:0,rare:0,plain:0,bonus:0};
    a.n++;a.win+=wins===u.boards.length?1:0;a.rush+=st.rushes;a.r2+=st.best>=2;a.r3+=st.best>=3;a.r5+=st.best>=5;a.box+=st.box;a.safe+=!!safe;a.rare+=safe&&safe!=='common';
    a.plain+=plain;a.bonus+=extra+boxCash+safeCash;fTot+=plain+extra+boxCash+safeCash;pTot+=plain;});}
const pc=x=>String(Math.round(x*100)).padStart(3)+'%';
console.log('unit rooms  rush/unit  any  3X+  5X   box  safe rare+  plain$   bonus$');
agg.forEach((a,i)=>console.log(('U'+(i+1)).padEnd(5),String(YARD1.units[i].boards.length).padStart(4),(a.rush/a.n).toFixed(2).padStart(9),pc(a.r2/a.n),pc(a.r3/a.n),pc(a.r5/a.n),pc(a.box/a.n),pc(a.safe/a.n),pc(a.rare/a.n),String(Math.round(a.plain/a.n)).padStart(8),String(Math.round(a.bonus/a.n)).padStart(8)));
const tb=agg.reduce((s,a)=>s+a.bonus/a.n,0),tp=agg.reduce((s,a)=>s+a.plain/a.n,0);
console.log('Sunnyvale per-run: plain $'+Math.round(tp)+'  bonus $'+Math.round(tb)+'  bonus factor f = '+(fTot/pTot).toFixed(2));
console.log('Unit 1 sale: $'+R.FIRST_SALE+' - stall $'+R.STALL_COST+' = $'+(R.FIRST_SALE-R.STALL_COST)+' left; Unit 2 costs $0 to enter.');
