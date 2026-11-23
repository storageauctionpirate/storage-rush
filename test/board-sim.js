// Simulated players for the board clear-out (board/clearout.js). Run: node test/board-sim.js [N]
import {ClearOut,LOCKER_TIERS} from '../board/clearout.js';
const N=+process.argv[2]||400;
function legal(e){const a=[];for(let r=0;r<7;r++)for(let c=0;c<7;c++)for(const d of [[0,1],[1,0]]){const r2=r+d[0],c2=c+d[1];if(r2>6||c2>6)continue;const x=e.g[r][c],y=e.g[r2][c2];if(!x||!y||x.k!=='item'||y.k!=='item'||x.t===y.t)continue;e.g[r][c]=y;e.g[r2][c2]=x;const ok=e.groups().length;e.g[r][c]=x;e.g[r2][c2]=y;if(ok)a.push([[r,c],[r2,c2]]);}return a;}
const players={random:(e,L,R)=>L[Math.floor(R()*L.length)],average:(e,L,R)=>R()<.5?L[Math.floor(R()*L.length)]:[e.bestMove().a,e.bestMove().b],skilled:(e)=>[e.bestMove().a,e.bestMove().b]};
export function play(def,seed,pick,R){const e=new ClearOut(def,seed);
  for(let g=0;g<300;g++){if(e.status()!=='play')break;const f=e.fairness();if(f==='haul'){e.haul();continue;}if(f==='shove'){if(!e.shove())e.haul();continue;}
    const L=legal(e);e.swap(...pick(e,L,R));while(e.step())e.gravity();e.findsOnBoard().forEach(x=>e.collect(x.r,x.c));e.gravity();
    const f2=e.fairness();if(f2==='haul')e.haul();}
  return {win:e.status()==='win',left:e.moves,objs:e.left(),shoves:e.shoves};}
const tarps=[[1,1,2,'a'],[3,4,1,'b'],[5,2,1,null]];
if(process.argv[1]&&process.argv[1].endsWith("board-sim.js")){
const out=[];
LOCKER_TIERS.forEach((T,ti)=>{const row={tier:ti,name:T.name,moves:T.moves,types:T.types};
  for(const [pn,pick] of Object.entries(players)){let s=7,R=()=>{s=(s*1103515245+12345)>>>0;return s/4294967296;};let w=0;const hist={};let leftObjs=0;
    for(let i=1;i<=N;i++){const r=play({tarps,types:T.types,clearMoves:T.moves},i*7919+ti,pick,R);if(r.win){w++;hist[r.left]=(hist[r.left]||0)+1;}else leftObjs+=r.objs;}
    row[pn]={clear:Math.round(w/N*100)+'%',movesLeftOnClear:hist,avgObjsLeftOnFail:+(leftObjs/Math.max(1,N-w)).toFixed(1)};}
  out.push(row);});
console.log(JSON.stringify(out,null,1));}
