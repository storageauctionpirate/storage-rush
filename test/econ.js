// Storage Rush money curve report, L1-500 (no browser). Group plan, Nov 22.
// 1) World 1 (Sunnyvale, 10 units): the hint-only bot plays every room (retries are free), finds come from the item ladder,
//    cart lots, box/safe bonuses and the one-time locker bid use js/economy.js. Prints per-unit income and when each build opens.
// 2) Every later world (20 units): same per-room pattern, values on the curve. Checks a FREE player (no bonus games at all)
//    can pay for every town build of every world from plain income, and that carry-over never trivialises the next world.
// Run: node test/econ.js   (RUNS=40 by default)
const E=require('../js/engine.js'),EC=require('../js/economy.js'),IT=require('../js/items.js');const {YARD1}=require('../js/levels.js');
const RUNS=+process.env.RUNS||40;
function play(def,seed){const e=new E(def,seed);let g=0;while(e.status()==='play'&&g++<400){const f=e.findsOnBoard();if(f.length){f.forEach(x=>e.collect(x.r,x.c));e.gravity();e.settle();continue;}if(e.moves<=0)break;const m=e.bestMove();if(!m){e.shuffle();continue;}const r=e.swap(m.a,m.b);if(!r.ok){e.shuffle();continue;}e.settle();}return e;}
function lcg(s){return()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648;};}
const LM=require('../js/build-costs.js');
// ---- World 1 ----
const U=YARD1.units.length,acc=[...Array(U)].map(()=>({plain:0,bonus:0,bid:0,cart:0,finds:0,tries:0,slots:[]}));
for(let run=0;run<RUNS;run++){const R=lcg(run*7919+17);
  YARD1.units.forEach((u,ui)=>{const L=ui+1,a=acc[ui];let finds=0,cart=0,locks=0;
    u.boards.forEach(b=>{const tarps=b.tarps.map(t=>[t[0],t[1],t[2],t[3]?IT.pick(t[3],L,R,{noRare:ui<2}):null]);
      for(let t=0;t<8;t++){const e=play(Object.assign({},b,{tarps}),b.seed*1000+run*10+t);a.tries+=1/RUNS;if(e.status()==='win'){e.collected.forEach(k=>{const i=IT.get(k);if(i.lockbox)locks++;else finds+=IT.value(k,L,EC);});cart+=e.cart;break;}}});
    const lot=ui===0?EC.U1.lot:EC.cartLot(L,cart);const bid=EC.locker(L,u.finale);
    // bonus games (earned): U1 lockbox = $40 robot; lockbox safes; first box at Unit 3, then about one every 2 units
    let bonus=ui===0?EC.U1.robot:0;if(ui>0&&locks)bonus+=EC.safe(R()<.6?'common':R()<.75?'rare':'legendary',L);if(ui===2||(ui>2&&R()<.55))bonus+=EC.box(R()<.6?'common':R()<.75?'rare':'gold',L);
    a.plain+=(finds+lot-bid)/RUNS;a.bonus+=bonus/RUNS;a.bid+=bid/RUNS;a.cart+=cart/RUNS;a.finds+=finds/RUNS;});}
const f=EC.fmt;console.log('WORLD 1 — Sunnyvale Storage (10 units), '+RUNS+' bot runs');
let cumP=0,cumB=0;const opens=LM.SUNNYVALE;
acc.forEach((a,ui)=>{cumP+=a.plain;cumB+=a.bonus;const L=ui+1;const lm=opens.filter(l=>l.unlock===L).map(l=>l.name+' '+f(l.cost)).join(', ');
  console.log(`  Unit ${String(L).padStart(2)}  locker ${f(EC.locker(L,YARD1.units[ui].finale)).padStart(5)}  finds ${f(a.finds).padStart(5)}  cart ${String(Math.round(a.cart)).padStart(3)} items = ${f(ui===0?EC.U1.lot:EC.cartLot(L,a.cart)).padStart(4)}  net plain ${f(a.plain).padStart(5)}  bonus ${f(a.bonus).padStart(5)}  | free-player bank ${f(cumP).padStart(5)}  with bonuses ${f(cumP+cumB).padStart(5)}${lm?'  | opens: '+lm:''}`);});
const w1cost=opens.reduce((s,l)=>s+l.cost,0)+LM.PICKUP.reduce((s,t)=>s+t.price,0)+LM.YARD.reduce((s,t)=>s+t.price,0);
console.log(`  Town builds total ${f(opens.reduce((s,l)=>s+l.cost,0))} + Pickup ${f(LM.PICKUP.reduce((s,t)=>s+t.price,0))} + First Yard ${f(LM.YARD.reduce((s,t)=>s+t.price,0))} = ${f(w1cost)}; a player who never wins a bonus game earns ${f(cumP)} by Unit 10 (with the usual earned bonuses ${f(cumP+cumB)}) -> ${cumP>=w1cost?'FINISHES':'SHORT by '+f(w1cost-cumP)} (${Math.round(w1cost/cumP*100)}% of plain income)`);
// free player builds greedily as builds open: never stuck?
{let bank=0,stuck=0;const todo=opens.slice().concat(LM.PICKUP.map(t=>({name:t.name,unlock:t.at,cost:t.price})),LM.YARD.map(t=>({name:t.name,unlock:6,cost:t.price})));acc.forEach((a,ui)=>{bank+=a.plain;const L=ui+1;todo.filter(l=>!l.done&&l.unlock<=L).sort((x,y)=>x.cost-y.cost).forEach(l=>{if(bank>=l.cost){bank-=l.cost;l.done=1;}});});
  const left=todo.filter(l=>!l.done);console.log('  No-bonus player, building as soon as affordable: '+(left.length?'left unbuilt after Unit 10: '+left.map(l=>l.name).join(', '):'everything built by Unit 10')+`, ${f(bank)} left over`);}
// ---- curve, L1-500 ----
const avgCartPerUnit=acc.slice(5).reduce((s,a)=>s+a.cart,0)/5,avgFindX=acc.slice(5).reduce((s,a,ui)=>s+a.finds/EC.raw(ui+6),0)/5;
console.log('\nLOCKER CURVE (one locker per level; the last level of a world is a 3x "Big One")');
const marks=[1,2,3,5,10,15,20,25,30,40,50,60,75,100,125,150,175,200,250,300,350,400,450,500];
console.log('  '+marks.map(L=>'L'+L+' '+f(EC.locker(L))).join(' · '));
function worldPlain(w){const n=EC.WORLD_UNITS(w),L0=EC.levelOf(w,0);let plain=0;for(let ui=0;ui<n;ui++){const L=L0+ui;plain+=avgFindX*EC.raw(L)+EC.cartLot(L,avgCartPerUnit)-EC.locker(L,ui===n-1);}return plain;}
function nextBuild(w){return Math.round(worldPlain(w)*0.8);}
console.log('\nPER WORLD (plain income = finds + cart - locker bids, no bonus games; builds priced at 80% of it; World 1 uses the real build list)');
for(let w=1;w<=26;w++){const n=EC.WORLD_UNITS(w),L0=EC.levelOf(w,0),L1=EC.levelOf(w,n-1);let plain=0;
  for(let ui=0;ui<n;ui++){const L=L0+ui,fin=ui===n-1;plain+=avgFindX*EC.raw(L)+EC.cartLot(L,avgCartPerUnit)-EC.locker(L,fin);}
  if(w===1)plain=cumP;const build=w===1?w1cost:Math.round(plain*0.8),carry=w===1?0:Math.round(plain*0.2);
  const nextFirst=EC.locker(L1+1);
  if(w<=6||w%5===0||w===26)console.log(`  World ${String(w).padStart(2)}  L${L0}-${L1}  lockers ${f(EC.locker(L0))}-${f(EC.locker(L1,true))}  plain income ${f(plain)}  builds ${f(build)}  ${plain>=build?'free finish OK':'FREE PLAYER SHORT'}  left over ${f(plain-build)} (${Math.round(Math.max(0,plain-build)/Math.max(1,nextBuild(w+1))*100)}% of next world's builds)`);}
