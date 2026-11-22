// Pacing + economy estimate (no browser). Plays every room with the hint-only bot, replays failed rooms,
// banks finds + cart + the earned Safe bonus, then builds the next landmark whenever it is reached and affordable.
// Run: node test/econ.js   (SECS_PER_MOVE=5 by default for a normal player)
const E=require('../js/engine.js');const {YARD1}=require('../js/levels.js');
const PRICE={guitar:350,jewelry:240,safe:900,camera:180,neon:600},JUNK=2;
const LM=JSON.parse(process.env.LM||'null')||[['sign',1,0],['truck',3,0],['office',5,5500],['units',7,8000],['flea',9,8500],['thrift',11,9500],['garage',13,10500],['pawn',15,12000],['warehouse',17,15500]];
const TRUCK=JSON.parse(process.env.TRUCK||'[1000,1500,2000,3000]');
const WT={sign:1,truck:1.5},WSUM=LM.reduce((a,l)=>a+(WT[l[0]]||2),0);
const SPM=+process.env.SECS_PER_MOVE||5,RUNS=+process.env.RUNS||20;
function play(def,seed){const e=new E(def,seed);let g=0;while(e.status()==='play'&&g++<400){const f=e.findsOnBoard();if(f.length){f.forEach(x=>e.collect(x.r,x.c));e.gravity();e.settle();continue;}if(e.moves<=0)break;const m=e.bestMove();if(!m){e.shuffle();continue;}const r=e.swap(m.a,m.b);if(!r.ok){e.shuffle();continue;}e.settle();}return e;}
let rows=[];const agg={};
for(let run=0;run<RUNS;run++){let bank=0,tl=0,built=new Set(),rng=run*7919+13;const R=()=>{rng=(rng*1103515245+12345)%2147483648;return rng/2147483648;};
  YARD1.units.forEach((u,ui)=>{let haul=[],cart=0,moves=0,tries=0;
    u.boards.forEach((b,bi)=>{for(let t=0;t<6;t++){const e=play(Object.assign({},b),b.seed*1000+run*10+t);moves+=e.used;tries++;if(e.status()==='win'){haul.push(...e.collected);cart+=e.cart;break;}}});
    let inc=haul.reduce((s,k)=>s+(PRICE[k]||0),0)+cart*JUNK;
    if(ui>=2&&(R()<.35||ui===2||haul.includes('safe'))){const r=R();inc+=r<.6?300:r<.9?700:1600;}
    bank+=inc;const n=ui+1;
    if(n>=3)built.add('truck');
    for(;;){const L=LM.find(([id,at])=>!built.has(id)&&id!=='truck'&&n>=at);const tc=n>=([3,8,12,16][tl]||99)&&tl<TRUCK.length?TRUCK[tl]:null;
      const opts=[];if(L&&bank>=L[2])opts.push(['lm',L[2]]);if(tc!=null&&bank>=tc)opts.push(['tr',tc]);if(!opts.length)break;opts.sort((a,b)=>a[1]-b[1]);
      if(opts[0][0]==='lm'){bank-=L[2];built.add(L[0]);}else{bank-=tc;tl++;}}
    const mins=(moves*SPM+40+u.boards.length*15+(tries-u.boards.length)*10)/60;
    const a=agg[n]=agg[n]||{mins:0,bank:0,pct:0,inc:0};a.mins+=mins/RUNS;a.bank+=bank/RUNS;a.pct+=[...built].reduce((q,id)=>q+(WT[id]||2),0)/WSUM*100/RUNS;a.tl=(a.tl||0)+tl/RUNS;a.inc+=inc/RUNS;});}
let tot=0;Object.entries(agg).forEach(([n,a])=>{tot+=a.mins;console.log(`Unit ${n.padStart(2)}  ~${a.mins.toFixed(1)} min  (total ${tot.toFixed(0)} min)  earned $${Math.round(a.inc)}  bank $${Math.round(a.bank)}  built ${Math.round(a.pct)}%  truck L${(a.tl+1).toFixed(1)}`);});
