/* Storage Rush — board engine. Pure logic, no DOM: matches, specials, tarps, finds, Scrappers.
   Used by the game in the browser and by test/sim.js in Node. */
(function(root){
'use strict';
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
function rng(seed){let s=(seed>>>0)||1;return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
const SCRAP_WARN=3, SCRAP_LIMIT=6;
const FIND_PRICES={guitar:350,jewelry:240,safe:900,camera:180};

function Engine(def,seed){
  this.R=7;this.C=7;this.def=def;this.types=def.types||6;this.rnd=rng(def.seed||seed||1);
  this.moves=def.moves;this.used=0;this.cart=0;this.collected=[];this.snatched=[];this.nid=1;
  this.scrapper=def.scrapper||'off';this.pending=[];this.lastSwap=null;this.totalFinds=0;
  this.build();
  this.rnd=rng(seed==null?(def.seed||1)*7919:seed);
}
const P=Engine.prototype;
P.mk=function(k,t){return {id:this.nid++,k:k,t:t,sp:null,dir:null,layers:0,find:null,born:0};};
P.at=function(r,c){return r>=0&&r<this.R&&c>=0&&c<this.C?this.g[r][c]:null;};
P.ri=function(n){return Math.floor(this.rnd()*n);};
const matchable=t=>t&&t.k==='item'&&t.t>=0;
const swappable=t=>t&&t.k==='item';
Engine.matchable=matchable;Engine.swappable=swappable;
P.build=function(){
  const d=this.def;this.g=[];for(let r=0;r<this.R;r++)this.g.push(new Array(this.C).fill(null));
  const fixed=new Set();
  (d.tarps||[]).forEach(a=>{const t=this.mk('tarp',-1);t.layers=a[2];t.find=a[3]||null;if(t.find)this.totalFinds++;this.g[a[0]][a[1]]=t;fixed.add(a[0]*7+a[1]);});
  (d.pre||[]).forEach(a=>{this.g[a[0]][a[1]]=this.mk('item',a[2]);fixed.add(a[0]*7+a[1]);});
  for(let r=0;r<this.R;r++)for(let c=0;c<this.C;c++){if(this.g[r][c])continue;
    let t,n=0;do{t=this.ri(this.types);n++;}while(n<40&&this.makesRun(r,c,t));
    this.g[r][c]=this.mk('item',t);}
  for(let k=0;k<200;k++){const gs=this.findGroups();if(!gs.length)break;gs.forEach(g=>g.cells.forEach(key=>{if(!fixed.has(key))this.g[Math.floor(key/7)][key%7].t=this.ri(this.types);}));}
  this.fixed=fixed;
  if(!this.bestMove())this.shuffle();
};
P.makesRun=function(r,c,t){const a=this.at.bind(this),same=(x)=>matchable(x)&&x.t===t;
  return (same(a(r,c-1))&&same(a(r,c-2)))||(same(a(r-1,c))&&same(a(r-2,c)))||(same(a(r,c+1))&&same(a(r,c+2)))||(same(a(r+1,c))&&same(a(r+2,c)))||(same(a(r,c-1))&&same(a(r,c+1)))||(same(a(r-1,c))&&same(a(r+1,c)));};
P.findGroups=function(){
  const runs=[];
  for(let r=0;r<this.R;r++){let c=0;while(c<this.C){const t=this.at(r,c);if(!matchable(t)){c++;continue;}let e=c+1;while(e<this.C&&matchable(this.at(r,e))&&this.at(r,e).t===t.t)e++;if(e-c>=3){const cells=[];for(let k=c;k<e;k++)cells.push(r*7+k);runs.push({cells,dir:'h',t:t.t});}c=e;}}
  for(let c=0;c<this.C;c++){let r=0;while(r<this.R){const t=this.at(r,c);if(!matchable(t)){r++;continue;}let e=r+1;while(e<this.R&&matchable(this.at(e,c))&&this.at(e,c).t===t.t)e++;if(e-r>=3){const cells=[];for(let k=r;k<e;k++)cells.push(k*7+c);runs.push({cells,dir:'v',t:t.t});}r=e;}}
  // union runs sharing cells
  const groups=[];
  runs.forEach(run=>{let g=groups.find(g=>g.t===run.t&&run.cells.some(k=>g.cells.has(k)));
    if(g){run.cells.forEach(k=>g.cells.add(k));g.runs.push(run);}else groups.push({t:run.t,cells:new Set(run.cells),runs:[run]});});
  // merge groups that became connected
  for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++){if(groups[i].t===groups[j].t&&[...groups[j].cells].some(k=>groups[i].cells.has(k))){groups[j].cells.forEach(k=>groups[i].cells.add(k));groups[i].runs.push(...groups[j].runs);groups.splice(j,1);j=i;}}
  groups.forEach(g=>{const maxLen=Math.max(...g.runs.map(r=>r.cells.length));const hv=g.runs.some(r=>r.dir==='h')&&g.runs.some(r=>r.dir==='v');
    g.special=maxLen>=5?'gavel':hv?'wrap':maxLen===4?'dolly':null;g.maxLen=maxLen;
    const long=g.runs.reduce((a,b)=>b.cells.length>a.cells.length?b:a);g.longDir=long.dir;g.mid=long.cells[Math.floor(long.cells.length/2)];
    if(hv){const h=g.runs.find(r=>r.dir==='h'),v=g.runs.find(r=>r.dir==='v');const x=h.cells.find(k=>v.cells.includes(k));if(x!=null)g.mid=x;}});
  return groups;
};
P.mostCommonType=function(){const n=new Array(this.types).fill(0);this.each((t)=>{if(matchable(t))n[t.t]++;});let b=0;for(let i=1;i<n.length;i++)if(n[i]>n[b])b=i;return b;};
P.each=function(fn){for(let r=0;r<this.R;r++)for(let c=0;c<this.C;c++){const t=this.g[r][c];if(t)fn(t,r,c);}};
P.area=function(t,r,c){const a=[];
  if(t.sp==='dolly'){if(t.dir==='h')for(let k=0;k<7;k++)a.push(r*7+k);else for(let k=0;k<7;k++)a.push(k*7+c);}
  else if(t.sp==='wrap'){for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const rr=r+i,cc=c+j;if(rr>=0&&rr<7&&cc>=0&&cc<7)a.push(rr*7+cc);}}
  else if(t.sp==='gavel'){const ty=this.mostCommonType();this.each((x,rr,cc)=>{if(matchable(x)&&x.t===ty)a.push(rr*7+cc);});a.push(r*7+c);}
  return a;};
/* one resolution step; returns null when the board is settled */
P.step=function(){
  const groups=this.findGroups();
  if(!groups.length&&!this.pending.length)return null;
  const clear=new Map(),spawns=[],spawnKeys=new Set();
  const sw=this.lastSwap;
  groups.forEach(g=>{let key=null;
    if(g.special){const cand=[];if(sw){[sw.a,sw.b].forEach(p=>{const k=p[0]*7+p[1];if(g.cells.has(k))cand.push(k);});}cand.push(g.mid);g.cells.forEach(k=>cand.push(k));
      key=cand.find(k=>{const t=this.g[Math.floor(k/7)][k%7];return t&&!t.sp;});
      if(key!=null){spawnKeys.add(key);spawns.push({key,sp:g.special,t:g.t,dir:sw&&sw.dir?sw.dir:(g.longDir)});}}
    g.cells.forEach(k=>{if(k!==key)clear.set(k,'match');});});
  this.pending.forEach(k=>{if(!spawnKeys.has(k))clear.set(k,'blast');});this.pending=[];
  const fired=[];const queue=[...clear.keys()];
  while(queue.length){const k=queue.pop();const r=Math.floor(k/7),c=k%7;const t=this.g[r][c];
    if(t&&t.k==='item'&&t.sp&&!t.fired){t.fired=true;fired.push({r,c,sp:t.sp,dir:t.dir,t:t.t});
      this.area(t,r,c).forEach(k2=>{if(spawnKeys.has(k2))return;if(!clear.has(k2)){clear.set(k2,'blast');queue.push(k2);}else if(clear.get(k2)==='match')clear.set(k2,'blast');});}}
  const cleared=[],hit=new Map();
  clear.forEach((src,k)=>{const r=Math.floor(k/7),c=k%7;const t=this.g[r][c];if(!t)return;
    if(t.k==='item'){cleared.push({r,c,tile:t,src});this.g[r][c]=null;this.cart++;
      DIRS.forEach(d=>{const j=this.at(r+d[0],c+d[1]);if(j&&j.k==='tarp')hit.set(j.id,[r+d[0],c+d[1]]);});}
    else if(t.k==='tarp'&&src==='blast')hit.set(t.id,[r,c]);});
  const hits=[];
  hit.forEach(p=>{const ev=this.chip(p[0],p[1]);if(ev)hits.push(ev);});
  const spawned=[];
  spawns.forEach(s=>{const r=Math.floor(s.key/7),c=s.key%7;const t=this.g[r][c];if(!t||t.k!=='item')return;t.sp=s.sp;t.dir=s.dir;t.fired=false;if(s.sp==='gavel')t.t=-1;spawned.push({r,c,tile:t,sp:s.sp});});
  this.lastSwap=null;
  return {cleared,hits,fired,spawned,matched:groups.length};
};
P.chip=function(r,c){const t=this.at(r,c);if(!t||t.k!=='tarp')return null;t.layers--;const ev={r,c,layers:t.layers,find:t.find,revealed:false,removed:false,tile:t};
  if(t.layers<=0){if(t.find){t.k='find';t.born=this.used;ev.revealed=true;}else{this.g[r][c]=null;ev.removed=true;}}return ev;};
P.gravity=function(){const fell=[];
  for(let c=0;c<this.C;c++){let w=this.R-1;
    for(let r=this.R-1;r>=0;r--){const t=this.g[r][c];if(t){if(r!==w){this.g[w][c]=t;this.g[r][c]=null;}w--;}}
    let k=1;for(let r=w;r>=0;r--){const t=this.mk('item',this.ri(this.types));this.g[r][c]=t;fell.push({tile:t,r,c,k:k++});}}
  return fell;};
P.adj=function(a,b){return Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])===1;};
/* swap; returns {ok, kind} — does not resolve */
P.swap=function(a,b,free){
  if(!this.adj(a,b))return {ok:false};
  const ta=this.at(a[0],a[1]),tb=this.at(b[0],b[1]);
  const okA=free?(ta&&ta.k!=='find'):swappable(ta),okB=free?(tb&&tb.k!=='find'):swappable(tb);
  if(!okA||!okB)return {ok:false};
  if(!free&&this.moves<=0)return {ok:false};
  const dir=a[0]===b[0]?'h':'v';
  const doSwap=()=>{this.g[a[0]][a[1]]=tb;this.g[b[0]][b[1]]=ta;};
  // special combos
  if(swappable(ta)&&swappable(tb)&&(ta.sp||tb.sp)&&(ta.sp==='gavel'||tb.sp==='gavel'||(ta.sp&&tb.sp))){
    doSwap();this.spend(free);this.combo(ta,tb,b);return {ok:true,kind:'combo'};}
  doSwap();
  if(free||this.findGroups().length){this.lastSwap={a,b,dir};this.spend(free);return {ok:true,kind:'match'};}
  doSwap();return {ok:false,kind:'nomatch'};
};
P.spend=function(free){if(!free){this.moves--;}this.used++;};
P.combo=function(ta,tb,at){
  const r=at[0],c=at[1];const cells=new Set();const add=(rr,cc)=>{if(rr>=0&&rr<7&&cc>=0&&cc<7)cells.add(rr*7+cc);};
  const pos=t=>{let p=null;this.each((x,rr,cc)=>{if(x===t)p=[rr,cc];});return p;};
  const pa=pos(ta),pb=pos(tb);add(pa[0],pa[1]);add(pb[0],pb[1]);
  const g=ta.sp==='gavel'?ta:tb.sp==='gavel'?tb:null,other=g===ta?tb:ta;
  if(g&&other.sp==='gavel'){this.each((x,rr,cc)=>add(rr,cc));this.comboKind='gavel+gavel';}
  else if(g&&other.sp){const ty=other.t;this.each((x,rr,cc)=>{if(matchable(x)&&x.t===ty){x.sp=other.sp;x.dir=this.rnd()<.5?'h':'v';x.fired=false;add(rr,cc);}});this.comboKind='gavel+'+other.sp;}
  else if(g){const ty=other.t;this.each((x,rr,cc)=>{if(matchable(x)&&x.t===ty&&!x.sp)add(rr,cc);});this.comboKind='gavel';}
  else{const s=[ta.sp,tb.sp].sort().join('+');
    if(s==='dolly+dolly'){for(let k=0;k<7;k++){add(r,k);add(k,c);}}
    else if(s==='dolly+wrap'){for(let i=-1;i<=1;i++)for(let k=0;k<7;k++){add(r+i,k);add(k,c+i);}}
    else{for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++)add(r+i,c+j);}
    this.comboKind=s;}
  ta.fired=true;tb.fired=true;if(g&&other.sp&&other.sp!=='gavel')other.fired=true;
  if(g&&other.sp&&other.sp!=='gavel'){other.fired=false;} // the converted twin fires with the rest
  this.pending=[...cells];
};
P.findsOnBoard=function(){const a=[];this.each((t,r,c)=>{if(t.k==='find')a.push({r,c,key:t.find,age:this.used-t.born,tile:t});});return a;};
P.collect=function(r,c){const t=this.at(r,c);if(!t||t.k!=='find')return null;this.collected.push(t.find);this.g[r][c]=null;return t;};
P.cut=function(r,c){return this.chip(r,c);};
/* after each move: Scrapper aging. returns {warn:[...], snatch:[...]} */
P.age=function(){const out={warn:[],snatch:[]};if(this.scrapper==='off')return out;
  this.findsOnBoard().forEach(f=>{if(f.age>=SCRAP_LIMIT&&this.scrapper==='on')out.snatch.push(f);else if(f.age>=SCRAP_WARN)out.warn.push(f);});return out;};
P.snatch=function(r,c){const t=this.at(r,c);if(!t||t.k!=='find')return;this.snatched.push(t.find);this.g[r][c]=null;};
P.tarpsLeft=function(){let n=0;this.each(t=>{if(t.k==='tarp')n++;});return n;};
P.status=function(){const d=this.def;
  if(this.collected.length>=d.need&&(!d.clearTarps||this.tarpsLeft()===0))return 'win';
  if(this.totalFinds-this.snatched.length<d.need)return 'scrapped';
  if(this.moves<=0&&!this.findsOnBoard().length)return 'out';
  return 'play';};
P.scoreSwap=function(a,b){
  const ta=this.at(a[0],a[1]),tb=this.at(b[0],b[1]);if(!swappable(ta)||!swappable(tb))return -1;
  if(ta.sp&&tb.sp)return 90;
  if(ta.sp==='gavel'||tb.sp==='gavel')return 60;
  this.g[a[0]][a[1]]=tb;this.g[b[0]][b[1]]=ta;const gs=this.findGroups();this.g[a[0]][a[1]]=ta;this.g[b[0]][b[1]]=tb;
  if(!gs.length)return -1;
  let sc=0;const seen=new Set();
  gs.forEach(g=>{sc+=g.cells.size+(g.special==='gavel'?40:g.special==='wrap'?25:g.special==='dolly'?18:0);
    g.cells.forEach(k=>{const r=Math.floor(k/7),c=k%7;let t0=this.at(r,c);if(t0&&t0.sp)sc+=15;
      DIRS.forEach(d=>{const t=this.at(r+d[0],c+d[1]);if(t&&t.k==='tarp'&&!seen.has(t.id)){seen.add(t.id);sc+=(t.find||this.def.clearTarps)?(t.layers===1?40:28):10;}});});});
  return sc;};
P.bestMove=function(){let best=null,bs=-1;
  for(let r=0;r<7;r++)for(let c=0;c<7;c++){[[0,1],[1,0]].forEach(d=>{const r2=r+d[0],c2=c+d[1];if(r2>6||c2>6)return;const s=this.scoreSwap([r,c],[r2,c2]);if(s>bs){bs=s;best={a:[r,c],b:[r2,c2],score:s};}});}
  return best;};
P.shuffle=function(){const pos=[];this.each((t,r,c)=>{if(matchable(t)&&!t.sp)pos.push(t);});
  for(let n=0;n<300;n++){pos.forEach(t=>{t.t=this.ri(this.types);});if(!this.findGroups().length&&this.bestMove())return true;}return false;};
P.settle=function(){let ev,steps=0;while((ev=this.step())){this.gravity();steps++;if(steps>80)break;}if(!this.bestMove())this.shuffle();return steps;};

/* random board generator for Daily Auction and Endless Auction */
Engine.generate=function(k,seed){
  const r0=rng(seed),ri=n=>Math.floor(r0()*n);
  const finds=['guitar','jewelry','safe','camera'];const tarps=[];
  const blocks=[];for(let i=0;i<k.finds;i++)blocks.push({find:finds[(seed+i)%4],layers:1+ri(k.layerMax)});
  for(let i=0;i<k.dummies;i++)blocks.push({find:null,layers:1+ri(Math.max(1,k.layerMax-1))});
  const used=[];
  blocks.forEach(b=>{for(let n=0;n<200;n++){const r=b.find?3+ri(3):2+ri(5),c=b.find?1+ri(5):ri(7);const gap=n<150?2:1;if(used.every(p=>Math.abs(p[0]-r)+Math.abs(p[1]-c)>gap)){used.push([r,c]);tarps.push([r,c,b.layers,b.find]);break;}}});
  return {moves:k.moves,need:Math.min(k.need,tarps.filter(t=>t[3]).length),types:k.types,tarps,scrapper:k.scrapper||'on',seed};
};
Engine.knobs=function(n){ // difficulty curve for endless board n (0-based)
  return {types:n<3?5:6,finds:3+(n>=6?1:0),need:3,dummies:Math.min(4,1+Math.floor(n/3)),layerMax:Math.min(3,1+Math.floor(n/4)),moves:Math.max(18,26-Math.floor(n/2)),scrapper:'on'};
};
Engine.SCRAP_WARN=SCRAP_WARN;Engine.SCRAP_LIMIT=SCRAP_LIMIT;Engine.FIND_PRICES=FIND_PRICES;Engine.rng=rng;
if(typeof module!=='undefined')module.exports=Engine;else root.Engine=Engine;
})(this);
