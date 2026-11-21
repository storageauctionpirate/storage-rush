/* Storage Rush — playable prototype. Match-3 storage cleanouts, flip table and the life ladder. */
(function(){
'use strict';
const A=window.ART, SFX=window.SFX, TAU=Math.PI*2;
const $=id=>document.getElementById(id);
const cv=$('cv'), ctx=cv.getContext('2d');
const ROWS=7, COLS=7, NT=6;
const UNITS=[
  {id:'Unit 12',name:'Clean Indoor Unit',theme:'indoor',moves:22,need:3,finds:[['guitar',1],['jewelry',1],['safe',1]],extra:[]},
  {id:'Unit 27',name:'Greasy Garage',theme:'garage',moves:24,need:3,finds:[['camera',2],['guitar',2],['safe',2]],extra:[2,2]},
  {id:'Lot 9',name:'Outdoor Auction Yard',theme:'yard',moves:26,need:3,finds:[['jewelry',3],['safe',3],['guitar',2],['camera',2]],extra:[2,3,2]}
];
const SCRAP_LIMIT=6, SCRAP_WARN=3, JUNK_PRICE=2;
const KEY='storageRush.v1';
let save=load();
function load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&typeof s.unit==='number')return Object.assign({unit:0,bank:0,sound:true},s);}catch(e){}return {unit:0,bank:0,sound:true};}
function store(){try{localStorage.setItem(KEY,JSON.stringify(save));}catch(e){}}

const S={mode:'title',u:0,g:null,tiles:[],dying:[],parts:[],floats:[],moves:0,used:0,cart:0,collected:[],snatched:[],busy:false,sel:null,drag:null,
  door:null,flip:null,lad:null,scr:null,lastAct:0,hint:null,locked:null,result:null,goalSlots:[]};
let W=0,H=0,DPR=1,L={x:0,y:0,cell:50};
let tid=1;

/* ---------- layout ---------- */
function resize(){
  DPR=Math.min(3,window.devicePixelRatio||1);W=window.innerWidth;H=window.innerHeight;
  cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);
  const top=126, bottom=88;
  const cell=Math.floor(Math.min((W-18)/COLS,(H-top-bottom-8)/ROWS));
  L.cell=cell;L.x=Math.round((W-cell*COLS)/2);L.y=Math.round(top+Math.max(0,(H-top-bottom-cell*ROWS)/2));
  bgCache={};sprites={};
}
let bgCache={},sprites={};
function off(w,h){const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*DPR));c.height=Math.max(1,Math.round(h*DPR));const x=c.getContext('2d');x.setTransform(DPR,0,0,DPR,0,0);return [c,x];}
function bg(key,fn){if(!bgCache[key]){const [c,x]=off(W,H);fn(x);bgCache[key]=c;}return bgCache[key];}
function sprite(key,fn){if(!sprites[key]){const s=L.cell;const [c,x]=off(s,s);x.translate(s/2,s/2);fn(x,s);sprites[key]=c;}return sprites[key];}
function itemSprite(t){return sprite('i'+t,(x,s)=>A.ITEMS[t](x,s*.86));}
function junkSprite(l,gl){return sprite('j'+l+(gl?'g':''),(x,s)=>A.junk(x,s*.98,l,gl));}
function findSprite(k){return sprite('f'+k,(x,s)=>A.FINDS[k].draw(x,s*.86));}

/* ---------- RNG ---------- */
let rnd=Math.random;
const ri=n=>Math.floor(rnd()*n);

/* ---------- board ---------- */
function mk(k,t){return {id:tid++,k,t,layers:0,find:null,x:0,y:0,sc:1,born:0};}
function at(r,c){return r>=0&&r<ROWS&&c>=0&&c<COLS?S.g[r][c]:null;}
const isItem=t=>t&&t.k==='item';
function place(t,r,c){S.g[r][c]=t;}
function buildBoard(){
  const U=UNITS[S.u];
  S.g=[];for(let r=0;r<ROWS;r++)S.g.push(new Array(COLS).fill(null));
  const blocks=U.finds.map(f=>({find:f[0],layers:f[1]})).concat(U.extra.map(l=>({find:null,layers:l})));
  // spread blockers over the lower 4 rows, never touching each other
  let tries=0,chosen;
  do{chosen=[];
    blocks.forEach(b=>{const pool=[];for(let r=b.find?3:2;r<(b.find?ROWS-1:ROWS);r++)for(let c=b.find?1:0;c<(b.find?COLS-1:COLS);c++)pool.push([r,c]);
      const gap=tries<40?2:1;for(let n=0;n<60;n++){const p=pool[ri(pool.length)];if(chosen.every(q=>Math.abs(q[0]-p[0])+Math.abs(q[1]-p[1])>gap&&(Math.abs(q[1]-p[1])>0||!b.find||q[1]!==p[1]))){chosen.push(p);break;}}});
  }while(chosen.length<blocks.length&&++tries<80);
  blocks.forEach((b,i)=>{const t=mk('junk',-1);t.layers=b.layers;t.find=b.find;const [r,c]=chosen[i];place(t,r,c);});
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){if(S.g[r][c])continue;
    let t,n=0;do{t=ri(NT);n++;}while(n<30&&((isItem(at(r,c-1))&&at(r,c-1).t===t&&isItem(at(r,c-2))&&at(r,c-2).t===t)||(isItem(at(r-1,c))&&at(r-1,c).t===t&&isItem(at(r-2,c))&&at(r-2,c).t===t)));
    place(mk('item',t),r,c);}
  if(!bestMove())shuffle();
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const t=S.g[r][c];t.x=c;t.y=r;}
}
function findMatches(){
  const m=new Set();
  for(let r=0;r<ROWS;r++){let c=0;while(c<COLS){const t=at(r,c);if(!isItem(t)){c++;continue;}let e=c+1;while(e<COLS&&isItem(at(r,e))&&at(r,e).t===t.t)e++;if(e-c>=3)for(let k=c;k<e;k++)m.add(r*COLS+k);c=e;}}
  for(let c=0;c<COLS;c++){let r=0;while(r<ROWS){const t=at(r,c);if(!isItem(t)){r++;continue;}let e=r+1;while(e<ROWS&&isItem(at(e,c))&&at(e,c).t===t.t)e++;if(e-r>=3)for(let k=r;k<e;k++)m.add(k*COLS+c);r=e;}}
  return m;
}
function swapCells(a,b){const t=S.g[a[0]][a[1]];S.g[a[0]][a[1]]=S.g[b[0]][b[1]];S.g[b[0]][b[1]]=t;}
function scoreMove(a,b){
  swapCells(a,b);const m=findMatches();swapCells(a,b);
  if(!m.size)return -1;
  let sc=m.size;const seen=new Set();
  m.forEach(k=>{const r=Math.floor(k/COLS),c=k%COLS;[[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{const t=at(r+d[0],c+d[1]);if(t&&t.k==='junk'&&!seen.has(t.id)){seen.add(t.id);sc+=t.find?(t.layers===1?40:25):12;}});});
  return sc;
}
function bestMove(){
  let best=null,bs=-1;
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){if(!isItem(at(r,c)))continue;
    [[0,1],[1,0]].forEach(d=>{const r2=r+d[0],c2=c+d[1];if(!isItem(at(r2,c2)))return;const s=scoreMove([r,c],[r2,c2]);if(s>bs){bs=s;best={a:[r,c],b:[r2,c2],score:s};}});}
  return best;
}
function shuffle(){
  const pos=[];for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(isItem(at(r,c)))pos.push([r,c]);
  for(let n=0;n<200;n++){
    pos.forEach(p=>{S.g[p[0]][p[1]].t=ri(NT);});
    if(!findMatches().size&&bestMove())return;
  }
}
function gravity(){
  for(let c=0;c<COLS;c++){
    let w=ROWS-1;
    for(let r=ROWS-1;r>=0;r--){const t=S.g[r][c];if(t){if(r!==w){S.g[w][c]=t;S.g[r][c]=null;}w--;}}
    let k=1;for(let r=w;r>=0;r--){const t=mk('item',ri(NT));t.x=c;t.y=-k-0.3;k++;S.g[r][c]=t;}
  }
}
function allTiles(){const a=[];for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(S.g[r][c])a.push(S.g[r][c]);return a;}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function settle(){return new Promise(res=>{const chk=()=>{let ok=true;for(let r=0;r<ROWS&&ok;r++)for(let c=0;c<COLS;c++){const t=S.g[r][c];if(t&&(Math.abs(t.x-c)>0.001||Math.abs(t.y-r)>0.001)){ok=false;break;}}if(ok)res();else setTimeout(chk,16);};chk();});}
function cellCenter(r,c){return {x:L.x+(c+.5)*L.cell,y:L.y+(r+.5)*L.cell};}
function kill(t,r,c,fly){S.dying.push({t,t0:performance.now(),fly:fly||null,x:t.x,y:t.y});}
function burst(r,c,col,n,spd){const p=cellCenter(r,c);for(let i=0;i<(n||10);i++){const a=rnd()*TAU,v=(spd||.25)*(0.4+rnd());S.parts.push({x:p.x,y:p.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-.15,life:600+rnd()*300,t0:performance.now(),col:col||'#e8d9b8',sz:2+rnd()*3});}}
function floatText(x,y,txt,col){S.floats.push({x,y,txt,col:col||'#ffcf5a',t0:performance.now()});}

async function resolve(){
  let chain=0;
  for(;;){
    const m=findMatches();if(!m.size)break;
    chain++;SFX.match(chain);
    const hit=new Map();
    m.forEach(k=>{const r=Math.floor(k/COLS),c=k%COLS;const t=S.g[r][c];
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{const j=at(r+d[0],c+d[1]);if(j&&j.k==='junk')hit.set(j.id,[r+d[0],c+d[1]]);});
      kill(t,r,c,'cart');S.g[r][c]=null;S.cart++;burst(r,c,'#d8c7a3',5,.18);});
    if(chain>1){const p=cellCenter(3,3);floatText(p.x,p.y,'Chain x'+chain,'#fff');}
    let crunched=false,revealed=false;
    hit.forEach(([r,c])=>{const j=S.g[r][c];if(!j)return;j.layers--;burst(r,c,'#b9ab90',14,.3);crunched=true;
      if(j.layers<=0){
        if(j.find){j.k='find';j.born=S.used;revealed=true;const p=cellCenter(r,c);floatText(p.x,p.y-L.cell*.5,A.FINDS[j.find].name+'!');burst(r,c,'#ffd84a',22,.35);}
        else{kill(j,r,c);S.g[r][c]=null;}
      }});
    if(crunched)SFX.crunch();if(revealed)setTimeout(()=>SFX.reveal(),120);
    updateHUD();
    await wait(200);
    gravity();await settle();
  }
  if(!bestMove()){shuffle();const p=cellCenter(3,3);floatText(p.x,p.y,'Shuffle!','#fff');}
}
async function trySwap(a,b){
  if(S.busy||S.mode!=='play'||S.moves<=0)return;
  const ta=at(a[0],a[1]),tb=at(b[0],b[1]);
  if(!isItem(ta)||!isItem(tb)||Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])!==1)return;
  S.busy=true;S.sel=null;S.hint=null;S.lastAct=performance.now();
  SFX.swap();swapCells(a,b);await settle();
  if(!findMatches().size){SFX.bump();swapCells(a,b);await settle();S.busy=false;return false;}
  S.moves--;S.used++;updateHUD();
  await resolve();
  await ageFinds();
  S.busy=false;updateHUD();checkEnd();
  return true;
}
async function ageFinds(){
  const list=[];for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const t=S.g[r][c];if(t&&t.k==='find')list.push([t,r,c]);}
  let warn=false;
  for(const [t,r,c] of list){
    const age=S.used-t.born;
    if(age>=SCRAP_LIMIT){await snatch(t,r,c);}
    else if(age>=SCRAP_WARN){warn=true;if(!S.scr||S.scr.phase!=='grab')S.scr={phase:'peek',r,c,t0:performance.now(),tile:t};}
  }
  if(warn)SFX.scrapperWarn();
  if(!list.some(([t])=>t.k==='find'&&S.used-t.born>=SCRAP_WARN&&S.g.flat().includes(t))&&S.scr&&S.scr.phase==='peek')S.scr=null;
}
async function snatch(t,r,c){
  S.scr={phase:'grab',r,c,t0:performance.now(),tile:t};SFX.snatch();
  const p=cellCenter(r,c);floatText(p.x,p.y,'Scrapper grabbed it!','#ff7a6a');
  await wait(450);
  S.g[r][c]=null;S.snatched.push(t.find);kill(t,r,c,'scrapper');
  await wait(550);S.scr=null;
  gravity();await settle();await resolve();updateHUD();
}
async function collect(r,c){
  const t=at(r,c);if(!t||t.k!=='find'||S.busy||S.mode!=='play')return;
  S.busy=true;S.lastAct=performance.now();
  SFX.collect();S.g[r][c]=null;S.collected.push(t.find);kill(t,r,c,'cart');burst(r,c,'#ffd84a',20,.3);
  const p=cellCenter(r,c);floatText(p.x,p.y-L.cell*.4,'On the cart!','#9ff08a');
  if(S.scr&&S.scr.tile===t)S.scr=null;
  updateHUD();await wait(250);gravity();await settle();await resolve();
  S.busy=false;updateHUD();checkEnd();
}
function findsOnBoard(){const a=[];for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const t=S.g[r][c];if(t&&t.k==='find')a.push({r,c,key:t.find,age:S.used-t.born});}return a;}
function checkEnd(){
  if(S.mode!=='play'||S.result)return;
  const U=UNITS[S.u];
  if(S.collected.length>=U.need){S.result='win';S.busy=true;SFX.win();
    setTimeout(()=>showMsg('Unit cleared!','You pulled '+S.collected.length+' finds and '+S.cart+' items onto the cart.','Flip it!',()=>startFlip()),700);return;}
  const total=U.finds.length;
  if(total-S.snatched.length<U.need){S.result='fail';S.busy=true;SFX.fail();
    setTimeout(()=>showMsg('Scrapped!','The Scrappers got too many finds. Tap the finds fast next time.','Try again',()=>startUnit(S.u)),700);return;}
  if(S.moves<=0&&!findsOnBoard().length){S.result='fail';S.busy=true;SFX.fail();
    setTimeout(()=>showMsg('Out of moves','So close. Hit the buried spots first.','Try again',()=>startUnit(S.u)),700);return;}
}

/* ---------- screens ---------- */
function show(id){['title','ladderUI','doorUI','playUI','flipUI','lockedUI'].forEach(s=>$(s).classList.toggle('hidden',s!==id));$('bHome').classList.toggle('hidden',id==='title');$('msg').classList.add('hidden');}
function showMsg(h,p,b,fn){$('msgH').textContent=h;$('msgP').textContent=p;$('msgB').textContent=b;$('msg').classList.remove('hidden');msgFn=fn;}
let msgFn=null;
let toastT=0;function toast(txt,ms){const t=$('toast');t.textContent=txt;t.classList.remove('hidden');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.add('hidden'),ms||1800);}
const money=n=>'$'+Math.round(n).toLocaleString('en-US');

function goTitle(){S.mode='title';S.busy=false;show('title');$('barMid').innerHTML='';
  $('bOpenTxt').textContent=save.unit>=UNITS.length?'Keep Going':(save.unit>0?'Keep Going':'Open Unit');
  $('bReset').classList.toggle('hidden',save.unit===0&&save.bank===0);}
function goLadder(animFrom){
  S.mode='ladder';show('ladderUI');$('barMid').innerHTML='';
  const done=save.unit>=UNITS.length;
  $('ladSub').textContent=done?'3 units done. Bank '+money(save.bank):'Clear a unit to move up. Bank '+money(save.bank);
  $('bLadNext').textContent=done?'Next Door':'Open '+UNITS[save.unit].id;
  $('ladBuilt').classList.add('hidden');
  if(animFrom!=null&&animFrom<save.unit){S.lad={from:animFrom,to:save.unit,t0:performance.now()+400,phase:'hop',sfx:{}};$('bLadNext').classList.add('hidden');}
  else{S.lad={from:save.unit,to:save.unit,t0:0,phase:'done',sfx:{}};$('bLadNext').classList.remove('hidden');}
}
function startUnit(u){
  S.u=u;S.mode='door';S.result=null;S.busy=false;S.sel=null;S.drag=null;S.scr=null;S.hint=null;S.dying=[];S.parts=[];S.floats=[];
  const U=UNITS[u];S.moves=U.moves;S.used=0;S.cart=0;S.collected=[];S.snatched=[];
  buildBoard();buildGoals();
  show('doorUI');$('doorName').textContent=U.id+' · '+U.name;$('doorGoal').textContent='Pull '+U.need+' finds in '+U.moves+' moves';
  $('barMid').innerHTML='';
  S.door={t0:0,phase:'closed'};
}
function openDoor(){
  if(S.mode!=='door'||S.door.phase!=='closed')return;
  S.door={t0:performance.now(),phase:'open'};SFX.snap();setTimeout(()=>SFX.rattle(1.0),380);
  $('doorUI').querySelector('.tapme').classList.add('hidden');
  setTimeout(()=>{S.mode='play';show('playUI');S.lastAct=performance.now();updateHUD();},1500);
}
function buildGoals(){
  const U=UNITS[S.u],g=$('goals');g.innerHTML='';S.goalSlots=[];
  U.finds.forEach(f=>{const d=document.createElement('div');d.className='goal buried';const c=document.createElement('canvas');c.width=c.height=100;const x=c.getContext('2d');x.translate(50,52);A.FINDS[f[0]].draw(x,84);d.appendChild(c);g.appendChild(d);S.goalSlots.push({key:f[0],el:d});});
}
function updateHUD(){
  if(S.mode==='play'||S.mode==='door'){const U=UNITS[S.u];$('barMid').innerHTML='<span>'+S.moves+'</span> moves<small>'+U.id+' · pull '+U.need+(U.finds.length>U.need?' of '+U.finds.length:'')+'</small>';}
  $('cartN').textContent=S.cart;$('bankN').textContent=money(save.bank);
  const onb=S.g?findsOnBoard().map(f=>f.key):[];
  const got=S.collected.slice(),gone=S.snatched.slice(),out=onb.slice();
  S.goalSlots.forEach(s=>{let cls='buried';let i;
    if((i=got.indexOf(s.key))>=0){got.splice(i,1);cls='got';}
    else if((i=gone.indexOf(s.key))>=0){gone.splice(i,1);cls='gone';}
    else if((i=out.indexOf(s.key))>=0){out.splice(i,1);cls='out';}
    s.el.className='goal '+cls;});
  $('tapFind').classList.toggle('hidden',!(S.mode==='play'&&onb.length&&!S.result));
}
function startFlip(){
  const U=UNITS[S.u];
  const items=S.collected.map(k=>({key:k,name:A.FINDS[k].name,price:A.FINDS[k].price}));
  items.push({key:'cart',name:'Cart of stuff ('+S.cart+')',price:S.cart*JUNK_PRICE});
  S.flip={items,t0:performance.now(),bank0:save.bank,total:items.reduce((a,b)=>a+b.price,0),done:false,sfx:{}};
  S.mode='flip';show('flipUI');$('bFlipNext').classList.add('hidden');$('flipBank').textContent=money(save.bank);$('barMid').innerHTML='';
  save.bank+=S.flip.total;save.unit=Math.max(save.unit,S.u+1);store();
}
function goLocked(){S.mode='locked';show('lockedUI');$('lockBank').textContent=money(save.bank);$('barMid').innerHTML='';S.locked={shake:0};}

/* ---------- input ---------- */
function cellAt(x,y){const c=Math.floor((x-L.x)/L.cell),r=Math.floor((y-L.y)/L.cell);return r>=0&&r<ROWS&&c>=0&&c<COLS?[r,c]:null;}
function doorRect(){const p=6;return {x:L.x-p,y:L.y-p,w:L.cell*COLS+p*2,h:L.cell*ROWS+p*2};}
function lockedDoorRect(){const w=Math.min(W*.72,300),h=Math.min(H*.36,w*1.05);return {x:(W-w)/2,y:H*.2,w,h};}
cv.addEventListener('pointerdown',e=>{
  SFX.unlock();const x=e.clientX,y=e.clientY;
  if(S.mode==='door'){const d=doorRect();if(x>d.x-20&&x<d.x+d.w+20&&y>d.y-20&&y<d.y+d.h+60)openDoor();return;}
  if(S.mode==='locked'){const d=lockedDoorRect();if(x>d.x&&x<d.x+d.w&&y>d.y&&y<d.y+d.h+40){SFX.locked();S.locked.shake=performance.now();toast('Unlock coming soon');}return;}
  if(S.mode!=='play'||S.busy)return;
  const cell=cellAt(x,y);if(!cell)return;
  const t=at(cell[0],cell[1]);
  if(t&&t.k==='find'){collect(cell[0],cell[1]);return;}
  if(!isItem(t))return;
  S.drag={cell,x,y,moved:false};cv.setPointerCapture&&cv.setPointerCapture(e.pointerId);
});
cv.addEventListener('pointermove',e=>{
  if(!S.drag||S.drag.moved)return;const dx=e.clientX-S.drag.x,dy=e.clientY-S.drag.y;
  if(Math.hypot(dx,dy)>L.cell*.3){S.drag.moved=true;const a=S.drag.cell;const b=Math.abs(dx)>Math.abs(dy)?[a[0],a[1]+Math.sign(dx)]:[a[0]+Math.sign(dy),a[1]];trySwap(a,b);}
});
cv.addEventListener('pointerup',()=>{
  const d=S.drag;S.drag=null;if(!d||d.moved||S.busy)return;
  const a=d.cell;
  if(S.sel&&Math.abs(S.sel[0]-a[0])+Math.abs(S.sel[1]-a[1])===1){const s=S.sel;S.sel=null;trySwap(s,a);}
  else if(S.sel&&S.sel[0]===a[0]&&S.sel[1]===a[1])S.sel=null;
  else{S.sel=a;SFX.tap();}
});
cv.addEventListener('pointercancel',()=>{S.drag=null;});
$('bOpen').onclick=()=>{SFX.unlock();SFX.tap();goLadder();};
$('bReset').onclick=()=>{SFX.tap();save={unit:0,bank:0,sound:save.sound};store();goTitle();};
$('bLadNext').onclick=()=>{SFX.tap();if(save.unit>=UNITS.length)goLocked();else startUnit(save.unit);};
$('bFlipNext').onclick=()=>{SFX.tap();goLadder(S.u);};
$('bAgain').onclick=()=>{SFX.tap();save={unit:0,bank:0,sound:save.sound};store();goLadder();};
$('bHome').onclick=()=>{SFX.tap();goTitle();};
$('bReplay').onclick=()=>{if(S.mode!=='play')return;SFX.tap();startUnit(S.u);};
$('msgB').onclick=()=>{SFX.tap();$('msg').classList.add('hidden');const f=msgFn;msgFn=null;f&&f();};
function setSound(v){save.sound=v;store();SFX.setOn(v);document.body.classList.toggle('muted',!v);}
$('bSound').onclick=()=>{SFX.unlock();setSound(!save.sound);if(save.sound)SFX.tap();};
window.addEventListener('resize',resize);

/* ---------- rendering ---------- */
function drawTray(c){
  const x=L.x,y=L.y,w=L.cell*COLS,h=L.cell*ROWS,p=8;
  c.fillStyle='rgba(0,0,0,.5)';A.rr(c,x-p+3,y-p+8,w+p*2,h+p*2,16);c.fill();
  c.fillStyle=A.lg(c,0,y-p,0,y+h+p,[[0,'#8a929a'],[.5,'#4a5157'],[1,'#2a2f34']]);A.rr(c,x-p,y-p,w+p*2,h+p*2,16);c.fill();
  c.strokeStyle='rgba(255,255,255,.4)';c.lineWidth=1.5;A.rr(c,x-p+1,y-p+1,w+p*2-2,h+p*2-2,15);c.stroke();
  c.fillStyle=A.lg(c,0,y,0,y+h,[[0,'rgba(20,16,12,.92)'],[1,'rgba(40,32,24,.88)']]);A.rr(c,x,y,w,h,10);c.fill();
  for(let r=0;r<ROWS;r++)for(let cc=0;cc<COLS;cc++){if((r+cc)%2)continue;c.fillStyle='rgba(255,255,255,.04)';c.fillRect(x+cc*L.cell,y+r*L.cell,L.cell,L.cell);}
  c.fillStyle=A.lg(c,0,y,0,y+18,[[0,'rgba(0,0,0,.6)'],[1,'rgba(0,0,0,0)']]);c.fillRect(x,y,w,18);
}
function drawBoard(now){
  const c=ctx,cell=L.cell;
  c.save();c.beginPath();A.rr(c,L.x,L.y,cell*COLS,cell*ROWS,10);c.clip();
  // tiles
  for(let r=0;r<ROWS;r++)for(let cc=0;cc<COLS;cc++){const t=S.g[r][cc];if(!t)continue;
    const px=L.x+(t.x+.5)*cell,py=L.y+(t.y+.5)*cell;
    let sc=1;
    if(S.sel&&S.sel[0]===r&&S.sel[1]===cc)sc=1.12+Math.sin(now/120)*.03;
    if(S.hint&&((S.hint.a[0]===r&&S.hint.a[1]===cc)||(S.hint.b[0]===r&&S.hint.b[1]===cc)))sc=1+Math.abs(Math.sin(now/180))*.1;
    c.save();c.translate(px,py);
    if(t.k==='find'){
      const pulse=.5+.5*Math.sin(now/220);
      c.fillStyle=A.rg(c,0,0,0,0,0,cell*.62,[[0,'rgba(255,240,150,'+(.75+pulse*.25)+')'],[.5,'rgba(255,190,40,.45)'],[1,'rgba(255,190,40,0)']]);c.fillRect(-cell*.6,-cell*.6,cell*1.2,cell*1.2);
      c.save();c.rotate(now/1500);c.fillStyle='rgba(255,245,200,.25)';for(let i=0;i<8;i++){c.rotate(TAU/8);c.beginPath();c.moveTo(0,0);c.lineTo(cell*.6,-cell*.07);c.lineTo(cell*.6,cell*.07);c.fill();}c.restore();
      sc*=1+pulse*.06;
    }
    c.scale(sc,sc);
    const sp=t.k==='item'?itemSprite(t.t):t.k==='junk'?junkSprite(t.layers,!!t.find):findSprite(t.find);
    c.drawImage(sp,-cell/2,-cell/2,cell,cell);
    c.restore();
    if(t.k==='find'){const age=S.used-t.born;if(age>=SCRAP_WARN){const left=SCRAP_LIMIT-age;c.fillStyle='#d8261a';c.beginPath();c.arc(px+cell*.32,py-cell*.32,cell*.18,0,TAU);c.fill();c.strokeStyle='#fff';c.lineWidth=2;c.stroke();c.fillStyle='#fff';c.font='900 '+Math.round(cell*.24)+'px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText(left,px+cell*.32,py-cell*.31);}}
  }
  c.restore();
  // dying tiles
  S.dying=S.dying.filter(d=>{const k=(now-d.t0)/(d.fly?520:260);if(k>=1)return false;
    let px=L.x+(d.x+.5)*cell,py=L.y+(d.y+.5)*cell,sc=1+k*.3,a=1-k;
    if(d.fly==='cart'){const tx=W*.38,ty=H-40;const e=k*k;px+=(tx-px)*e;py+=(ty-py)*e-Math.sin(k*Math.PI)*cell;sc=1-k*.5;a=1-k*k;}
    if(d.fly==='scrapper'){const tx=W+cell;px+=(tx-px)*k*k;py-=Math.sin(k*Math.PI)*cell*.6;sc=1-k*.2;a=1;}
    const t=d.t;const sp=t.k==='item'?itemSprite(t.t):t.k==='junk'?junkSprite(1,false):findSprite(t.find);
    c.save();c.globalAlpha=Math.max(0,a);c.translate(px,py);c.scale(sc,sc);c.drawImage(sp,-cell/2,-cell/2,cell,cell);c.restore();return true;});
  if(S.scr)drawScrapper(now);
}
function drawScrapper(now){
  const s=S.scr,cell=L.cell,c=ctx;
  const p=cellCenter(s.r,s.c);const edge=L.x+cell*COLS+10;
  const k=s.phase==='grab'?Math.min(1,(now-s.t0)/450):0;
  const back=s.phase==='grab'?Math.max(0,Math.min(1,(now-s.t0-450)/500)):0;
  const reach=s.phase==='peek'?edge-cell*.25+Math.sin(now/160)*cell*.12:edge+(p.x-edge)*k+(edge+cell-p.x)*back;
  const hy=p.y;
  // sleeve
  c.save();
  c.fillStyle=A.lg(c,0,hy-cell*.2,0,hy+cell*.2,[[0,'#5b5f3a'],[.5,'#3c3f24'],[1,'#22240f']]);c.fillRect(reach+cell*.18,hy-cell*.17,W-reach,cell*.34);
  c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=2;c.strokeRect(reach+cell*.18,hy-cell*.17,W-reach,cell*.34);
  // glove
  c.fillStyle=A.rg(c,reach,hy-cell*.08,0,reach+cell*.05,hy,cell*.3,[[0,'#f2e3b0'],[.6,'#c9a95a'],[1,'#7a6020']]);
  c.beginPath();c.ellipse(reach+cell*.08,hy,cell*.2,cell*.17,0,0,TAU);c.fill();
  for(let i=0;i<4;i++){c.beginPath();c.ellipse(reach-cell*.1,hy-cell*.12+i*cell*.08,cell*.1,cell*.04,0,0,TAU);c.fill();}
  c.restore();
  // label
  const lx=Math.min(W-50,edge-10),ly=hy-cell*.55;
  c.fillStyle='rgba(180,20,10,.92)';A.rr(c,lx-46,ly-12,92,24,8);c.fill();c.fillStyle='#fff';c.font='900 13px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText('SCRAPPER!',lx,ly+1);
}
function drawFx(now){
  const c=ctx;
  S.parts=S.parts.filter(p=>{const k=(now-p.t0)/p.life;if(k>=1)return false;const dt=now-p.t0;const x=p.x+p.vx*dt,y=p.y+p.vy*dt+0.0006*dt*dt;c.globalAlpha=1-k;c.fillStyle=p.col;c.fillRect(x,y,p.sz,p.sz);c.globalAlpha=1;return true;});
  S.floats=S.floats.filter(f=>{const k=(now-f.t0)/1300;if(k>=1)return false;c.save();c.globalAlpha=k<.7?1:1-(k-.7)/.3;c.font='900 22px "Arial Black",Arial';c.textAlign='center';c.textBaseline='middle';c.lineWidth=5;c.strokeStyle='rgba(0,0,0,.85)';const y=f.y-k*40;c.strokeText(f.txt,f.x,y);c.fillStyle=f.col;c.fillText(f.txt,f.x,y);c.restore();return true;});
}
function stepTiles(dt){
  const sp=dt*0.012;
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const t=S.g[r][c];if(!t)continue;
    if(t.x!==c){const d=c-t.x;t.x=Math.abs(d)<sp?c:t.x+Math.sign(d)*sp;}
    if(t.y!==r){const d=r-t.y;const v=Math.max(sp,dt*0.016);t.y=Math.abs(d)<v?r:t.y+Math.sign(d)*v;}}
}

function drawTitle(now){
  ctx.drawImage(bg('title',c=>{A.yardScene(c,W,H);
    const sw=Math.min(W*.86,340),sh=sw*.36,sx=(W-sw)/2,sy=H*.6-sh*.35;
    c.font='900 10px Arial';
    A.woodSign(c,sx,sy,sw,sh,["You can't hit a home run","unless you swing the bat."],Math.round(sw*.058));
  }),0,0,W,H);
}
function drawDoorScene(now){
  const U=UNITS[S.u];
  ctx.drawImage(bg('th-'+U.theme,c=>{A.THEMES[U.theme](c,W,H);drawTray(c);}),0,0,W,H);
  drawBoard(now);
  const d=doorRect();
  let k=0,lockY=0,shOff=0,lockA=1,rot=0;
  if(S.door.phase==='open'){const t=now-S.door.t0;shOff=Math.min(1,t/120)*L.cell*.14;
    if(t>180){const f=(t-180)/500;lockY=f*f*H*.6;rot=f*1.5;lockA=Math.max(0,1-f);}
    k=Math.max(0,Math.min(1,(t-380)/1000));k=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;}
  A.rollDoor(ctx,d.x,d.y,d.w,d.h,k,{label:U.id.toUpperCase()});
  if(lockA>0){const ls=Math.min(110,L.cell*1.9);const lx=d.x+d.w/2,ly=d.y+d.h*(1-k)-ls*.25+lockY;
    if(S.door.phase==='closed'){const pul=1+Math.sin(now/200)*.05;ctx.fillStyle='rgba(255,220,120,.25)';ctx.beginPath();ctx.arc(lx,ly,ls*.6*pul,0,TAU);ctx.fill();}
    ctx.save();ctx.globalAlpha=lockA;ctx.translate(lx,ly);ctx.rotate(rot);A.padlock(ctx,0,0,ls,shOff>0,shOff);ctx.restore();}
}
function drawPlay(now){
  const U=UNITS[S.u];
  ctx.drawImage(bg('th-'+U.theme,c=>{A.THEMES[U.theme](c,W,H);drawTray(c);}),0,0,W,H);
  drawBoard(now);
  if(!S.busy&&!S.result&&S.moves>0&&now-S.lastAct>6000&&!S.hint){S.hint=bestMove();}
}

/* flip table */
function drawFlip(now){
  const U=UNITS[S.u],F=S.flip,c=ctx;
  c.drawImage(bg('fl-'+U.theme,x=>{A.THEMES[U.theme](x,W,H);x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,0,W,H);
    // table in perspective
    const ty=H*.3,tb=H*.8,tl=W*.1,tr=W*.9;
    x.fillStyle='rgba(0,0,0,.5)';x.beginPath();x.ellipse(W/2,tb+H*.06,W*.48,H*.04,0,0,TAU);x.fill();
    x.fillStyle=A.lg(x,0,ty,0,tb,[[0,'#b07a3e'],[1,'#e0ad6b']]);x.beginPath();x.moveTo(tl,ty);x.lineTo(tr,ty);x.lineTo(W*.98,tb);x.lineTo(W*.02,tb);x.closePath();x.fill();
    x.strokeStyle='rgba(80,45,15,.4)';x.lineWidth=1.5;for(let i=1;i<6;i++){const f=i/6;x.beginPath();x.moveTo(tl+(tr-tl)*f,ty);x.lineTo(W*.02+(W*.96)*f,tb);x.stroke();}
    x.fillStyle=A.lg(x,0,tb,0,tb+H*.05,[[0,'#8a5a28'],[1,'#4a2c10']]);x.fillRect(W*.02,tb,W*.96,H*.05);
    x.fillStyle='#3a220c';x.fillRect(W*.06,tb+H*.05,W*.04,H*.12);x.fillRect(W*.9,tb+H*.05,W*.04,H*.12);
    x.fillStyle='rgba(255,255,255,.25)';x.fillRect(W*.02,tb,W*.96,2);
  }),0,0,W,H);
  const n=F.items.length,ty=H*.3,tb=H*.8;
  const cols=n<=2?n:2,rows=Math.ceil(n/cols);
  const step=900,el=now-F.t0;let bank=F.bank0;
  F.items.forEach((it,i)=>{
    const row=Math.floor(i/cols),col=i%cols,inRow=Math.min(cols,n-row*cols);
    const fy=ty+(tb-ty)*((row+.6)/(rows+.1));const persp=.75+.35*((fy-ty)/(tb-ty));
    const fx=W/2+(col-(inRow-1)/2)*W*.38*persp;
    const s=Math.min(W*.42,(tb-ty)/rows*.95)*persp;
    const t0=i*step+300;const k=Math.max(0,Math.min(1,(el-t0)/300));if(k<=0)return;
    c.save();c.translate(fx,fy-(1-k)*40);c.globalAlpha=k;
    if(it.key==='cart'){c.save();c.translate(-s*.22,s*.05);A.box(c,s*.5);c.restore();c.save();c.translate(s*.22,s*.08);A.tote(c,s*.48);c.restore();c.save();c.translate(0,-s*.25);A.crate(c,s*.42);c.restore();}
    else A.FINDS[it.key].draw(c,s*.9);
    c.restore();
    const sold=el>t0+450;
    if(sold){
      if(!F.sfx[i]){F.sfx[i]=1;SFX.till();floatText(fx,fy-s*.5,'+'+money(it.price),'#9ff08a');}
      bank+=it.price;
      // price tag
      c.save();c.translate(fx,fy+s*.44);c.font='700 12px Arial';const tw=Math.max(96,c.measureText(it.name).width+16);c.fillStyle='#fff8e0';A.rr(c,-tw/2,-20,tw,40,7);c.fill();c.strokeStyle='#8a5a28';c.lineWidth=2;c.stroke();
      c.fillStyle='#5a4030';c.textAlign='center';c.textBaseline='middle';c.fillText(it.name,0,-8);c.fillStyle='#1d6a1a';c.font='900 17px Arial';c.fillText(money(it.price),0,9);c.restore();
      const sk=Math.min(1,(el-t0-450)/200);c.save();c.translate(fx+s*.18,fy-s*.15);c.rotate(-.3);c.scale(2-sk,2-sk);c.globalAlpha=sk;c.strokeStyle='#d8261a';c.lineWidth=3;A.rr(c,-34,-14,68,28,5);c.stroke();c.fillStyle='#d8261a';c.font='900 18px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText('SOLD',0,1);c.restore();
    }
  });
  $('flipBank').textContent=money(bank);
  if(!F.done&&el>n*step+500){F.done=true;$('bFlipNext').classList.remove('hidden');}
}

/* ladder board */
const LX=[0,.48,-.4,.46,-.44,.3,0];
let CAM=0;
function proj(x,d){const rel=d-CAM;const z=Math.max(.5,1+rel*.22);const K=H*.896,hy=-H*.236;return {x:W/2+x*W*.6/z,y:hy+K/z,z,s:1/z,rel};}
function catmull(p0,p1,p2,p3,t){const t2=t*t,t3=t2*t;return .5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t2+(-p0+3*p1-3*p2+p3)*t3);}
function pathPt(u){ // u in [0,6]
  const i=Math.min(5,Math.floor(u)),t=u-i;const g=k=>LX[Math.max(0,Math.min(6,k))];
  return {x:catmull(g(i-1),g(i),g(i+1),g(i+2),t),d:u};
}
function drawLadderGround(c){
  // sky + hills
  c.fillStyle=A.lg(c,0,0,0,H*.3,[[0,'#2a6fc4'],[1,'#bfe2ff']]);c.fillRect(0,0,W,H*.3);
  c.fillStyle=A.rg(c,W*.8,H*.08,0,W*.8,H*.08,H*.25,[[0,'rgba(255,250,220,.9)'],[1,'rgba(255,250,220,0)']]);c.fillRect(0,0,W,H*.3);
  c.fillStyle='#4f8a3a';c.beginPath();c.moveTo(0,H*.2);for(let x=0;x<=W;x+=10)c.lineTo(x,H*.17+Math.sin(x/W*6)*H*.025);c.lineTo(W,H*.3);c.lineTo(0,H*.3);c.fill();
  c.fillStyle=A.lg(c,0,H*.17,0,H,[[0,'#5f9c45'],[.5,'#4b8a33'],[1,'#2f6a20']]);c.fillRect(0,H*.2,W,H*.8);
  const r=A.seeded(77);for(let i=0;i<500;i++){const y=H*.2+r()*H*.8;const s=(y/H)*3;c.fillStyle=r()<.5?'rgba(20,60,10,.35)':'rgba(170,220,120,.25)';c.fillRect(r()*W,y,s,s*1.5);}
}
function drawLadderPath(c){
  c.save();c.beginPath();c.rect(0,H*.185,W,H);c.clip();
  const N=140,left=[],right=[];
  for(let i=0;i<=N;i++){const u=Math.max(0,CAM-1.4)+i/N*(6-Math.max(0,CAM-1.4));const p=pathPt(u),q=pathPt(Math.min(6,u+.01)),o=pathPt(Math.max(0,u-.01));
    let tx=q.x-o.x,td=(q.d-o.d)*.5;const len=Math.hypot(tx,td)||1;const nx=-td/len,nd=tx/len*2;const w=.11;
    left.push(proj(p.x+nx*w,p.d+nd*w));right.push(proj(p.x-nx*w,p.d-nd*w));}
  const poly=(off,col)=>{c.fillStyle=col;c.beginPath();left.forEach((p,i)=>i?c.lineTo(p.x,p.y+off*p.s):c.moveTo(p.x,p.y+off*p.s));for(let i=right.length-1;i>=0;i--)c.lineTo(right[i].x,right[i].y+off*right[i].s);c.closePath();c.fill();};
  poly(14,'rgba(0,0,0,.3)');poly(8,'#7a5a32');poly(0,A.lg(c,0,H*.2,0,H*.8,[[0,'#d9c08e'],[1,'#f0dcae']]));
  // stepping spaces
  for(let i=6*4;i>=0;i--){if(i%4===0)continue;const u=i/4;if(u-CAM<-1.5)continue;const p=pathPt(u);const q=proj(p.x,p.d);const rw=W*.05*q.s,rh=rw*.42;
    c.fillStyle='#8a4a14';c.beginPath();c.ellipse(q.x,q.y+4*q.s,rw,rh,0,0,TAU);c.fill();
    c.fillStyle=i%2?'#ff9a3c':'#fff1d0';c.beginPath();c.ellipse(q.x,q.y,rw,rh,0,0,TAU);c.fill();}
  c.restore();
}
function easeOut(k){return 1-Math.pow(1-k,3);}
function drawLadder(now){
  const c=ctx;const Ld=S.lad;let pieceU=Ld.to,buildK=1,el=now-Ld.t0;
  if(Ld.phase!=='done'){
    const hopT=900*(Ld.to-Ld.from);
    if(el<0){pieceU=Ld.from;buildK=0;}
    else if(el<hopT){const k=el/hopT;pieceU=Ld.from+(Ld.to-Ld.from)*k;buildK=0;const seg=Math.floor(el/225);if(!Ld.sfx['h'+seg]){Ld.sfx['h'+seg]=1;SFX.hop();}}
    else{buildK=Math.min(1,(el-hopT)/1600);if(!Ld.sfx.ham){Ld.sfx.ham=1;SFX.hammer();setTimeout(()=>SFX.hammer(),700);}
      if(buildK>=1&&!Ld.sfx.done){Ld.sfx.done=1;SFX.built();Ld.phase='done';const b=$('ladBuilt');b.textContent='Built: '+A.LADDER[Ld.to]+'!';b.classList.remove('hidden');$('bLadNext').classList.remove('hidden');
        const q=proj(LX[Ld.to],Ld.to);for(let i=0;i<30;i++){const a=rnd()*TAU,v=.3*(0.4+rnd());S.parts.push({x:q.x,y:q.y-W*.12*q.s,vx:Math.cos(a)*v,vy:Math.sin(a)*v-.2,life:900,t0:now,col:['#ffcf5a','#ff8a3d','#fff','#7fd36a'][i%4],sz:3+rnd()*3});}}}
  }
  CAM=Math.max(0,Math.min(3.4,pieceU-.6));
  c.drawImage(bg('ladderG',drawLadderGround),0,0,W,H);drawLadderPath(c);
  for(let i=6;i>=0;i--){
    const q=proj(LX[i],i);if(q.rel<-1.6||q.y<H*.12)continue;c.save();c.globalAlpha=Math.max(0,Math.min(1,(q.y-H*.12)/(H*.1)));const rw=W*.19*q.s,rh=rw*.42,th=10*q.s;
    const built=i<save.unit||(i===save.unit&&(Ld.phase==='done'||Ld.to!==i))||i===0;
    const lockedSpace=i>UNITS.length;
    const current=i===Math.round(pieceU);
    // pad
    if(current&&Ld.phase==='done'){c.fillStyle='rgba(255,220,100,'+(.35+.2*Math.sin(now/250))+')';c.beginPath();c.ellipse(q.x,q.y,rw*1.3,rh*1.3,0,0,TAU);c.fill();}
    c.fillStyle=lockedSpace?'#4a4f55':'#8a4a14';c.beginPath();c.ellipse(q.x,q.y+th,rw,rh,0,0,TAU);c.fill();c.fillRect(q.x-rw,q.y,rw*2,th);
    c.fillStyle=lockedSpace?A.lg(c,0,q.y-rh,0,q.y+rh,[[0,'#b9bec4'],[1,'#7a8087']]):A.lg(c,0,q.y-rh,0,q.y+rh,[[0,'#fff3d6'],[1,'#e8c48a']]);c.beginPath();c.ellipse(q.x,q.y,rw,rh,0,0,TAU);c.fill();
    c.strokeStyle=lockedSpace?'#5a6066':'#e8691a';c.lineWidth=3*q.s;c.beginPath();c.ellipse(q.x,q.y,rw*.86,rh*.86,0,0,TAU);c.stroke();
    // building
    const u=rw*1.25;
    c.save();c.translate(q.x,q.y-rh*.1);
    const growing=i===Ld.to&&Ld.phase!=='done'&&Ld.to!==Ld.from;
    if(growing){
      if(buildK>0){
        // scaffolding
        c.strokeStyle='rgba(120,90,40,'+(1-buildK*.6)+')';c.lineWidth=2*q.s;for(let k=-2;k<=2;k++){c.beginPath();c.moveTo(k*u*.25,0);c.lineTo(k*u*.25,-u*1.1);c.stroke();}for(let k=1;k<5;k++){c.beginPath();c.moveTo(-u*.55,-k*u*.25);c.lineTo(u*.55,-k*u*.25);c.stroke();}
        const bk=easeOut(buildK);c.save();c.beginPath();c.rect(-u*2,-u*2*bk,u*4,u*2*bk+u*.3);c.clip();c.scale(1,.7+.3*bk+(buildK>.85?Math.sin((buildK-.85)/.15*Math.PI)*.06:0));A.BUILDINGS[i](c,u);c.restore();
        if(rnd()<.35){const a=rnd()*TAU;S.parts.push({x:q.x+(rnd()-.5)*u,y:q.y-rnd()*u*.3,vx:Math.cos(a)*.05,vy:-.05-rnd()*.08,life:700,t0:now,col:'rgba(220,200,160,.8)',sz:4+rnd()*5});}
      } else {c.globalAlpha=.25;A.BUILDINGS[i](c,u);}
    } else if(built){A.BUILDINGS[i](c,u);}
    else {c.globalAlpha=lockedSpace?.18:.3;A.BUILDINGS[i](c,u);c.globalAlpha=1;if(lockedSpace)A.padlock(c,0,-u*.4,u*.45,false);}
    c.restore();
    // label
    const fs=Math.max(11,Math.round(17*Math.pow(q.s,.6)));c.font='900 '+fs+'px "Arial Black",Arial';const txt=A.LADDER[i];const tw=c.measureText(txt).width+14;
    const ly=q.y+rh+th+fs*.7;
    c.fillStyle=built?'rgba(20,12,6,.85)':'rgba(20,12,6,.55)';A.rr(c,q.x-tw/2,ly-fs*.7,tw,fs*1.4,fs*.5);c.fill();
    c.fillStyle=built?'#ffcf5a':'rgba(255,255,255,.7)';c.textAlign='center';c.textBaseline='middle';c.fillText(txt,q.x,ly+1);
    // piece on this pad (draw after its own pad so nearer pads overlap correctly)
    c.restore();
    if(Math.round(pieceU)===i)drawPiece(pieceU,now);
  }
  drawFx(now);
}
function drawPiece(u,now){
  const p=pathPt(u),q=proj(p.x,p.d);const frac=u-Math.floor(u);const hop=S.lad.phase==='hop'?Math.abs(Math.sin(frac*Math.PI*4))*W*.08*q.s:0;
  const s=W*.13*q.s,c=ctx;const x=q.x+W*.09*q.s,y=q.y+W*.02*q.s-hop;
  c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.ellipse(x,q.y+W*.02*q.s,s*.32,s*.1,0,0,TAU);c.fill();
  c.save();c.translate(x,y);
  c.fillStyle=A.lg(c,-s*.3,0,s*.3,0,[[0,'#1a1a1a'],[.4,'#555'],[1,'#0a0a0a']]);c.beginPath();c.ellipse(0,0,s*.3,s*.1,0,0,TAU);c.fill();c.fillRect(-s*.3,-s*.08,s*.6,s*.08);c.beginPath();c.ellipse(0,-s*.08,s*.3,s*.1,0,0,TAU);c.fill();
  c.beginPath();c.moveTo(-s*.2,-s*.1);c.quadraticCurveTo(-s*.08,-s*.4,-s*.1,-s*.6);c.lineTo(s*.1,-s*.6);c.quadraticCurveTo(s*.08,-s*.4,s*.2,-s*.1);c.closePath();c.fill();
  c.fillStyle=A.lg(c,-s*.16,0,s*.16,0,[[0,'#8a5b00'],[.5,'#ffe48a'],[1,'#8a5b00']]);c.fillRect(-s*.15,-s*.62,s*.3,s*.07);
  c.fillStyle=A.rg(c,-s*.06,-s*.8,0,0,-s*.74,s*.2,[[0,'#888'],[.3,'#333'],[1,'#050505']]);c.beginPath();c.arc(0,-s*.75,s*.17,0,TAU);c.fill();
  c.fillStyle='#d8261a';c.beginPath();c.ellipse(0,-s*.85,s*.18,s*.08,0,Math.PI,0);c.fill();c.fillRect(s*.12,-s*.86,s*.12,s*.04);
  c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.ellipse(-s*.08,-s*.4,s*.03,s*.12,.2,0,TAU);c.fill();
  c.restore();
}

/* locked door */
function drawLocked(now){
  const c=ctx;c.drawImage(bg('locked',x=>{A.yardScene(x,W,H);x.fillStyle='rgba(0,0,0,.25)';x.fillRect(0,0,W,H);}),0,0,W,H);
  const d=lockedDoorRect();let sx=0;if(S.locked.shake){const k=(now-S.locked.shake)/400;if(k<1)sx=Math.sin(k*40)*6*(1-k);}
  c.fillStyle='rgba(0,0,0,.5)';c.fillRect(d.x-10,d.y-14,d.w+20,d.h+24);
  c.fillStyle=A.lg(c,0,d.y-30,0,d.y+d.h,[[0,'#d7d2c8'],[1,'#a9a397']]);c.fillRect(d.x-24,d.y-34,d.w+48,d.h+34);
  A.rollDoor(c,d.x,d.y,d.w,d.h,0,{label:'NEXT YARD'});
  const ls=Math.min(120,d.w*.36);c.save();c.translate(d.x+d.w/2+sx,d.y+d.h-ls*.32);A.padlock(c,0,0,ls,false);c.restore();
  // sign
  const sw=Math.min(W*.9,360),sh=Math.min(110,sw*.3),sy=d.y+d.h+26;
  c.fillStyle='rgba(0,0,0,.4)';A.rr(c,(W-sw)/2+4,sy+6,sw,sh,10);c.fill();
  c.fillStyle=A.lg(c,0,sy,0,sy+sh,[[0,'#ffd84a'],[1,'#e0a010']]);A.rr(c,(W-sw)/2,sy,sw,sh,10);c.fill();
  c.strokeStyle='#1a1a1a';c.lineWidth=5;A.rr(c,(W-sw)/2+6,sy+6,sw-12,sh-12,7);c.stroke();
  c.fillStyle='#1a1a1a';c.textAlign='center';c.textBaseline='middle';const fs=Math.round(sw*.072);c.font='900 '+fs+'px "Arial Black",Arial';
  c.fillText('SCARED MONEY',W/2,sy+sh*.36);c.fillText("DON'T MAKE MONEY",W/2,sy+sh*.68);
}

let last=performance.now();
function frame(now){
  const dt=Math.min(50,now-last);last=now;
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,W,H);
  if(S.g)stepTiles(dt);
  if(S.mode==='title')drawTitle(now);
  else if(S.mode==='ladder')drawLadder(now);
  else if(S.mode==='door')drawDoorScene(now);
  else if(S.mode==='play')drawPlay(now);
  else if(S.mode==='flip')drawFlip(now);
  else if(S.mode==='locked')drawLocked(now);
  if(S.mode!=='ladder')drawFx(now);
  requestAnimationFrame(frame);
}

/* ---------- test hooks (read-only helpers) ---------- */
window.SR={
  state:()=>({mode:S.mode,unit:S.u,moves:S.moves,used:S.used,cart:S.cart,collected:S.collected.slice(),snatched:S.snatched.slice(),busy:S.busy,result:S.result,save:Object.assign({},save),lad:S.lad&&{phase:S.lad.phase,from:S.lad.from,to:S.lad.to},flipDone:S.flip&&S.flip.done,door:S.door&&S.door.phase,
    junk:S.g?allTiles().filter(t=>t.k==='junk').length:0,finds:S.g?findsOnBoard():[],scr:S.scr&&S.scr.phase}),
  cellXY:(r,c)=>cellCenter(r,c),
  bestMove:()=>bestMove(),
  noMatchSwap:()=>{for(let r=0;r<ROWS;r++)for(let c=0;c<COLS-1;c++){if(isItem(at(r,c))&&isItem(at(r,c+1))&&scoreMove([r,c],[r,c+1])<0)return {a:[r,c],b:[r,c+1]};}return null;},
  lockXY:()=>{const d=doorRect();return {x:d.x+d.w/2,y:d.y+d.h*.8};},
  lockedDoorXY:()=>{const d=lockedDoorRect();return {x:d.x+d.w/2,y:d.y+d.h/2};},
  units:UNITS.length,
  junkInfo:()=>allTiles().filter(t=>t.k==='junk').map(t=>(t.find||'-')+t.layers).join(' '),
  layout:()=>({x:L.x,y:L.y,cell:L.cell,W,H}),
  seed:n=>{const r=A.seeded(n);rnd=r;}
};
const qs=new URLSearchParams(location.search);if(qs.get('seed'))SR.seed(+qs.get('seed'));

resize();setSound(save.sound!==false);goTitle();requestAnimationFrame(frame);
})();
