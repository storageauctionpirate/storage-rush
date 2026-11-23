// Board prototype only: a NO-REFILL clear-out grid. Matched merchandise leaves for good,
// leftovers settle, and the locker is done when the grid is empty. Always fair:
// items come in sets of 3, a free "shove" rearranges leftovers if no move exists,
// and stragglers that can no longer make a set are hauled out automatically.
const R=7,C=7;
function rng(s){s=s>>>0||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
export class ClearOut{
  constructor(def,seed){this.def=def;this.rnd=rng(seed);this.nid=1;this.collected=[];this.cart=0;this.shoves=0;this.hauled=0;
    this.types=Math.min(6,def.types||6);
    const tarps=(def.tarps||[]).slice(0,4);
    const cells=R*C-tarps.length;this.sets=Math.floor(cells/3);const n=this.sets*3;
    // sets of 3, spread over the types
    const bag=[];for(let i=0;i<this.sets;i++)for(let k=0;k<3;k++)bag.push(i%this.types);
    this.g=[];for(let r=0;r<R;r++)this.g.push(new Array(C).fill(null));
    tarps.forEach(t=>{this.g[t[0]][t[1]]={id:this.nid++,k:'tarp',t:-1,layers:Math.min(2,t[2]),find:t[3]||null};});
    this.totalFinds=tarps.filter(t=>t[3]).length;
    // fill bottom-up so the few spare cells (if any) are at the top
    let left=n;for(let r=R-1;r>=0;r--)for(let c=0;c<C;c++){if(this.g[r][c]||left<=0)continue;this.g[r][c]={id:this.nid++,k:'item',t:0};left--;}
    this.total=n;this.assign(bag);this.totalObjs=this.left();
    this.moves=def.clearMoves||this.sets+3;this.startMoves=this.moves;}
  each(fn){for(let r=0;r<R;r++)for(let c=0;c<C;c++){const t=this.g[r][c];if(t)fn(t,r,c);}}
  at(r,c){return r>=0&&r<R&&c>=0&&c<C?this.g[r][c]:null;}
  items(){const a=[];this.each((t,r,c)=>{if(t.k==='item')a.push(t);});return a;}
  remaining(){return this.items().length;}
  left(){let n=0;this.each(()=>n++);return n;}
  // randomly deal the types onto the item cells until there is no free match and at least one move
  assign(bag){const its=this.items();for(let n=0;n<400;n++){for(let i=bag.length-1;i>0;i--){const j=Math.floor(this.rnd()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
      its.forEach((t,i)=>{t.t=bag[i];});if(!this.groups().length&&this.bestMove())return true;}
    return !this.groups().length&&!!this.bestMove();}
  groups(){const cl=new Set(),runs=[];const same=(a,b)=>a&&b&&a.k==='item'&&b.k==='item'&&a.t===b.t;
    for(let r=0;r<R;r++){let c=0;while(c<C){let e=c+1;while(e<C&&same(this.g[r][c],this.g[r][e]))e++;if(e-c>=3&&this.g[r][c]&&this.g[r][c].k==='item'){const cells=[];for(let k=c;k<e;k++)cells.push([r,k]);runs.push(cells);}c=e;}}
    for(let c=0;c<C;c++){let r=0;while(r<R){let e=r+1;while(e<R&&same(this.g[r][c],this.g[e][c]))e++;if(e-r>=3&&this.g[r][c]&&this.g[r][c].k==='item'){const cells=[];for(let k=r;k<e;k++)cells.push([k,c]);runs.push(cells);}r=e;}}
    return runs;}
  swap(a,b){if(Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])!==1||this.moves<=0)return {ok:false};const ta=this.at(...a),tb=this.at(...b);
    if(!ta||!tb||ta.k!=='item'||tb.k!=='item')return {ok:false};this.g[a[0]][a[1]]=tb;this.g[b[0]][b[1]]=ta;
    if(this.groups().length){this.moves--;return {ok:true,kind:'match'};}this.g[a[0]][a[1]]=ta;this.g[b[0]][b[1]]=tb;return {ok:false,kind:'nomatch'};}
  step(){const runs=this.groups();if(!runs.length)return null;const clear=new Map();runs.forEach(rc=>rc.forEach(([r,c])=>clear.set(r*7+c,[r,c])));
    const cleared=[],hit=new Map();clear.forEach(([r,c])=>{const t=this.g[r][c];cleared.push({r,c,tile:t});this.g[r][c]=null;this.cart++;
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{const j=this.at(r+d[0],c+d[1]);if(j&&j.k==='tarp')hit.set(j.id,[r+d[0],c+d[1]]);});});
    const hits=[];hit.forEach(([r,c])=>{const t=this.g[r][c];t.layers--;const ev={r,c,layers:t.layers,find:t.find,revealed:false,removed:false};
      if(t.layers<=0){if(t.find){t.k='find';ev.revealed=true;}else{this.g[r][c]=null;ev.removed=true;}}hits.push(ev);});
    return {cleared,hits,fired:[],spawned:[]};}
  gravity(){for(let c=0;c<C;c++){let w=R-1;for(let r=R-1;r>=0;r--){const t=this.g[r][c];if(t){if(r!==w){this.g[w][c]=t;this.g[r][c]=null;}w--;}}}return [];}
  findsOnBoard(){const a=[];this.each((t,r,c)=>{if(t.k==='find')a.push({r,c,key:t.find,tile:t});});return a;}
  collect(r,c){const t=this.at(r,c);if(!t||t.k!=='find')return null;this.collected.push(t.find);this.g[r][c]=null;return t;}
  bestMove(){let best=null,bs=0;for(let r=0;r<R;r++)for(let c=0;c<C;c++)for(const d of [[0,1],[1,0]]){const r2=r+d[0],c2=c+d[1];if(r2>=R||c2>=C)continue;
      const ta=this.g[r][c],tb=this.g[r2][c2];if(!ta||!tb||ta.k!=='item'||tb.k!=='item'||ta.t===tb.t)continue;
      this.g[r][c]=tb;this.g[r2][c2]=ta;const gs=this.groups();this.g[r][c]=ta;this.g[r2][c2]=tb;
      if(gs.length){let s=gs.reduce((a,g)=>a+g.length,0);gs.forEach(g=>g.forEach(([rr,cc])=>[[1,0],[-1,0],[0,1],[0,-1]].forEach(q=>{const j=this.at(rr+q[0],cc+q[1]);if(j&&j.k==='tarp')s+=4;})));
        if(s>bs){bs=s;best={a:[r,c],b:[r2,c2],score:s};}}}
    return best;}
  // can any type still make a set of 3?
  canSet(){const n={};this.items().forEach(t=>{n[t.t]=(n[t.t]||0)+1;});return Object.values(n).some(v=>v>=3);}
  // free shove: pack everything left into a tidy block at the bottom and re-deal so a move exists
  shove(){const objs=[];this.each(t=>objs.push(t));this.g=[];for(let r=0;r<R;r++)this.g.push(new Array(C).fill(null));
    const tarps=objs.filter(t=>t.k!=='item'),its=objs.filter(t=>t.k==='item');let i=0;
    const order=[...its,...tarps];for(let r=R-1;r>=0&&i<order.length;r--)for(let c=0;c<C&&i<order.length;c++)this.g[r][c]=order[i++];
    this.shoves++;const bag=its.map(t=>t.t);return this.assign(bag);}
  // stragglers: haul out whatever is left (items, tarps; finds go to the truck)
  haul(){const out=[];this.each((t,r,c)=>{out.push({r,c,tile:t});if(t.find&&(t.k==='tarp'||t.k==='find'))this.collected.push(t.find);if(t.k==='item')this.cart++;this.g[r][c]=null;});this.hauled+=out.length;return out;}
  shuffle(){return this.shove();}
  status(){let left=0;this.each(()=>left++);if(!left)return 'win';if(this.moves<=0)return 'out';return 'play';}
}
