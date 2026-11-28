// Economy sim for the /play/ prototype. Run: node test/play-econ-sim.mjs [sessions] [turns]
// Plays the real 16-space loop with the real match-3 engine (play/clearout.js, average player), real items and money curve.
// Money is reported in "lockers' worth" (cash / current locker price) so we can see whether it piles up.
import {createRequire} from 'module';import {ClearOut,LOCKER_TIERS,tierFor} from '../play/clearout.js';
const require=createRequire(import.meta.url);const EC=require('../js/economy.js'),IT=require('../js/items.js'),LV=require('../js/levels.js');
const N=+process.argv[2]||60,TURNS=+process.argv[3]||60;
// keep in sync with play/app.js PE
const PE=JSON.parse(process.env.PE||'null')||{itemK:.3,payday:.5,salvage:.006,pawn:.62,pawnGood:.75,flea:.85,fleaStep:.08,curb:.25,big:3,flUp:[4,8],trUp:[5,9],cases:[.5,1,2],slot:{coin:.5,cash:1.5,bag:3,pair:.2}};
const BOARD=['payday','auction','off','pawn','bonus','auction','flea','upgrade','rival','off','auction','pawn','slot','flea','upgrade','auction'];
const PAWN=['tools','radio','music','jewelry','garage','games','history','shelf'],shopFor=id=>PAWN.includes((IT.get(id)||{}).set)?'pawn':'flea';
const REGEN_PER_TURN=+process.env.REGEN||0.5;   // ~1.5 min per turn with a 3-min refill
function legal(e){const a=[];for(let r=0;r<7;r++)for(let c=0;c<7;c++)for(const d of [[0,1],[1,0]]){const r2=r+d[0],c2=c+d[1];if(r2>6||c2>6)continue;const x=e.g[r][c],y=e.g[r2][c2];if(!x||!y||x.k!=='item'||y.k!=='item'||x.t===y.t)continue;e.g[r][c]=y;e.g[r2][c2]=x;const ok=e.groups().length;e.g[r][c]=x;e.g[r2][c2]=y;if(ok)a.push([[r,c],[r2,c2]]);}return a;}
function playClear(def,seed,R){const e=new ClearOut(def,seed);const finds=[];
  for(let g=0;g<300;g++){if(e.status()!=='play')break;const f=e.fairness();if(f==='haul'){e.haul().forEach(o=>{if(o.tile.find)finds.push(o.tile.find);});continue;}if(f==='shove'){if(!e.shove())e.haul();continue;}
    const L=legal(e);const m=R()<.5?L[Math.floor(R()*L.length)]:(b=>[b.a,b.b])(e.bestMove());if(!m)break;e.swap(...m);while(e.step())e.gravity();e.findsOnBoard().forEach(x=>{e.collect(x.r,x.c);finds.push(x.key);});e.gravity();
    if(e.fairness()==='haul')e.haul().forEach(o=>{if(o.tile.find)finds.push(o.tile.find);});}
  return {win:e.status()==='win',finds,cleared:e.totalObjs-e.left()};}
function boardDef(G,kind,R){const units=LV.YARD1.units;const ix=kind==='curb'?0:Math.min(units.length-1,G.clean%6);const b=JSON.parse(JSON.stringify(units[ix].boards[0]));
  b.scrapper='off';b.tut=null;b.teach=null;b.seed=(b.seed||1)+G.clean*31+(kind==='curb'?997:0);const up=kind==='big'||kind==='rival';
  b.tarps=b.tarps.map(t=>{let s=t[3];if(s==='hook')s=G.clean===0?'tinrobot':'c';else if(s==='lock')s='c';if(up&&s==='c')s='u';if(up&&s==='u'&&kind==='rival')s='r';const id=s&&!IT.get(s)?IT.pick(s,G.L,R,{}):s;return [t[0],t[1],t[2],id];});
  const T=LOCKER_TIERS[tierFor(G.L,kind)];b.types=T.types;b.clearMoves=T.moves+G.truckLv;delete b.moves;return b;}
function session(seed){let s=seed;const R=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
  const G={cash:10,rolls:0,pos:0,truck:[],cap:6,flea:0,truckLv:0,L:1,clean:0,earned:0,tickets:0,lap:0,regenAcc:0};const raw=()=>EC.raw(G.L),val=id=>Math.max(1,Math.round(IT.value(id,G.L,EC)*(PE.itemK||1)));
  const SRC={};const earn=(k,v)=>{G.cash+=v;SRC[k]=(SRC[k]||0)+v/EC.locker(G.L);};const log={SRC,ratio:[],upgrades:[],stuck:0,curb:0,curbCash:0,spent:0,cleans:0,fails:0,slotCash:0,peakRatio:0};
  const add=id=>{if(G.truck.length<G.cap)G.truck.push(id);else{const c=Math.max(1,Math.round(val(id)*PE.curb));earn('curb',c);log.curbCash+=c;}};
  const clean=(kind,price)=>{const def=boardDef(G,kind,R);for(let a=0;a<3;a++){const r=playClear(def,def.seed*7+G.clean+a*101,R);if(r.win||a===2){r.finds.forEach(add);const sal=Math.max(1,EC.nice(PE.salvage*r.cleared*raw()*(r.win?1:.5)));earn('salvage',sal);G.clean++;if(kind!=='curb')G.L++;
      if(r.win){G.rolls=Math.min(5,G.rolls+1);log.cleans++;}else log.fails++;if(r.win&&(kind==='big'||kind==='rival'))G.tickets++;return;}}};
  // first locker
  G.cash-=1;clean('small',1);
  for(let t=0;t<TURNS;t++){G.regenAcc+=REGEN_PER_TURN;while(G.regenAcc>=1){G.regenAcc--;if(G.rolls<5)G.rolls++;}
    if(G.rolls<=0){log.curb++;clean('curb',0);continue;}G.rolls--;const v=1+Math.floor(R()*6);
    for(let i=1;i<=v;i++){if((G.pos+i)%16===0){earn('payday',EC.nice(PE.payday*raw()));G.rolls=Math.min(5,G.rolls+1);G.lap++;}}G.pos=(G.pos+v)%16;const sp=BOARD[G.pos];
    if(sp==='auction'){const small=EC.locker(G.L),big=EC.nice(PE.big*raw());if(G.cash>=big*1.5&&R()<.5){G.cash-=big;log.spent+=big;clean('big',big);}else if(G.cash>=small){G.cash-=small;log.spent+=small;clean('small',small);}}
    else if(sp==='rival'){const base=EC.nice(3*raw());if(G.cash>=base*2){const bid=Math.round(base*(1.25+R()*1.2));if(G.cash>=bid){G.cash-=bid;log.spent+=bid;clean('rival',bid);}}}
    else if(sp==='pawn'){for(let i=G.truck.length-1;i>=0;i--){const id=G.truck[i];if(shopFor(id)!=='pawn')continue;const rate=['jewelry','shelf','history'].includes(IT.get(id)?.set)?PE.pawnGood:PE.pawn;earn('pawn',Math.max(1,Math.round(val(id)*rate*1.05)));G.truck.splice(i,1);}}
    else if(sp==='flea'){const l=G.truck.map((id,i)=>({id,i,p:Math.max(1,Math.round(val(id)*PE.flea*(1+PE.fleaStep*G.flea)))})).filter(o=>shopFor(o.id)==='flea').sort((a,b)=>b.p-a.p).slice(0,3+G.flea);
      l.map(o=>o.i).sort((a,b)=>b-a).forEach((i,k)=>{earn('flea',Math.max(1,Math.round(val(G.truck[i])*PE.flea*(1+PE.fleaStep*G.flea))));G.truck.splice(i,1);});}
    else if(sp==='upgrade'){const f=G.flea<2?EC.nice(PE.flUp[G.flea]*raw()):null,tr=G.truckLv<2?EC.nice(PE.trUp[G.truckLv]*raw()):null;
      if(f&&G.cash>=f&&(!tr||G.flea<=G.truckLv)){G.cash-=f;G.flea++;log.upgrades.push('flea@'+t);log.spent+=f;}else if(tr&&G.cash>=tr){G.cash-=tr;G.truckLv++;G.cap+=4;log.upgrades.push('truck@'+t);log.spent+=tr;}}
    else if(sp==='bonus'){const pairs=2+Math.floor(R()*3);for(let k=0;k<pairs;k++){const w=Math.floor(R()*6);const CX=PE.cases||[2,4,10];if(w<3)earn('cases',EC.nice(CX[w]*raw()));else if(w===3)add(IT.pick('u',G.L,R,{}));else if(w===4)G.rolls=Math.min(5,G.rolls+1);else G.tickets++;}}
    else if(sp==='slot'){G.tickets++;}
    while(G.tickets>0){G.tickets--;const W=[5,3,1.2,1.4,1.6,.8],T=W.reduce((a,b)=>a+b,0);const pick=()=>{let r=R()*T;for(let i=0;i<6;i++){if((r-=W[i])<0)return i;}return 0;};const a=[pick(),pick(),pick()];
      const w=a.filter(x=>x===5).length,rest=a.filter(x=>x!==5);let k=null;if(w===3)k='j';else if(rest.every(x=>x===rest[0]))k=rest[0];else{const c={};a.forEach(x=>c[x]=(c[x]||0)+1);if(Object.values(c).some(n=>n===2)||w)k='p';}
      let cash=0;if(k==='j')cash=EC.nice(PE.slot.bag*2*raw());else if(k===0)cash=EC.nice(PE.slot.coin*raw());else if(k===1)cash=EC.nice(PE.slot.cash*raw());else if(k===2)cash=EC.nice(PE.slot.bag*raw());else if(k===3)G.rolls=Math.min(5,G.rolls+1);else if(k===4)add(IT.pick('u',G.L,R,{}));else if(k==='p')cash=Math.max(1,EC.nice(PE.slot.pair*raw()));earn('slot',cash);log.slotCash+=cash;}
    const ratio=G.cash/EC.locker(G.L);log.ratio.push(ratio);log.peakRatio=Math.max(log.peakRatio,ratio);}
  log.final={cash:G.cash,L:G.L,locker:EC.locker(G.L),ratio:+(G.cash/EC.locker(G.L)).toFixed(1),flea:G.flea,truckLv:G.truckLv,truck:G.truck.length,laps:G.lap};return log;}
const res=[];for(let i=0;i<N;i++)res.push(session(1000+i*7919));
const med=a=>{const s=[...a].sort((x,y)=>x-y);return s[s.length>>1];};const pct=(a,p)=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length*p)];};
const at=k=>res.map(r=>r.ratio[Math.min(r.ratio.length-1,k)]);
const firstUp=res.map(r=>{const u=r.upgrades[0];return u?+u.split('@')[1]:TURNS;}),allUp=res.map(r=>r.upgrades.length);
console.log(JSON.stringify({sessions:N,turns:TURNS,regenPerTurn:REGEN_PER_TURN,PE,
  cashInLockersWorth:{turn10:{med:+med(at(9)).toFixed(1),p90:+pct(at(9),.9).toFixed(1)},turn30:{med:+med(at(29)).toFixed(1),p90:+pct(at(29),.9).toFixed(1)},turn60:{med:+med(at(TURNS-1)).toFixed(1),p90:+pct(at(TURNS-1),.9).toFixed(1)},peakMed:+med(res.map(r=>r.peakRatio)).toFixed(1)},
  upgrades:{firstAtTurnMed:med(firstUp),boughtOf4Med:med(allUp),allFourPct:Math.round(allUp.filter(x=>x===4).length/N*100)},
  lockerLevelMed:med(res.map(r=>r.final.L)),lapsMed:med(res.map(r=>r.final.laps)),curbPilesMed:med(res.map(r=>r.curb)),failedClearsMed:med(res.map(r=>r.fails)),itemsLeftInTruckMed:med(res.map(r=>r.final.truck)),
  earnedByLockersWorthMed:Object.fromEntries(['payday','salvage','pawn','flea','cases','slot','curb'].map(k=>[k,+med(res.map(r=>r.SRC[k]||0)).toFixed(1)])),spentLockersWorthNote:'see cash ratio',
  example:res[0].final},null,1));
