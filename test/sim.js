// Fast win-rate check (no browser): plays every Yard 1 board with the hint helper only, no boosters, no extra moves.
const E=require('../js/engine.js');const {YARD1}=require('../js/levels.js');
function play(def,seed){const e=new E(def,seed);let g=0;
  while(e.status()==='play'&&g++<400){
    const f=e.findsOnBoard();if(f.length){f.forEach(x=>e.collect(x.r,x.c));e.gravity();e.settle();continue;}
    if(e.moves<=0)break;const m=e.bestMove();if(!m){e.shuffle();continue;}
    const r=e.swap(m.a,m.b);if(!r.ok){e.shuffle();continue;}e.settle();
    // the bot collects immediately, so Scrappers never get a chance here
  }
  return {st:e.status(),used:e.used};}
const N=+process.env.N||40;let i=0;const rows=[];
YARD1.units.forEach(u=>u.boards.forEach(b=>{i++;let w=0,used=0;
  // board layout is fixed by its own seed; vary refill luck with the run index
  for(let k=0;k<N;k++){const def=Object.assign({},b);const r=play(def,b.seed*1000+k);if(r.st==='win'){w++;used+=r.used;}}
  rows.push(`board ${String(i).padStart(2)} ${u.id.padEnd(12)} win ${String(Math.round(w/N*100)).padStart(3)}%  avg moves ${(used/Math.max(1,w)).toFixed(1)} / ${b.moves}`);}));
console.log(rows.join('\n'));
