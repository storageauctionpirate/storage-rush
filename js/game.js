/* Storage Rush v3 — Sunnyvale Storage, art-sheet assets, 20 levels, map / safe / flea / truck. */
(function(){
'use strict';
const A=window.ART,SFX=window.SFX,E=window.Engine,LV=window.LEVELS,IM=window.IMGS,RH=window.RHYTHM,TAU=Math.PI*2;
const $=id=>document.getElementById(id);
const cv=$('cv'),ctx=cv.getContext('2d');
const DISP=A.DISPLAY;
const YARD=LV.YARD1;const UNITS=YARD.units;
const QS=new URLSearchParams(location.search);const DEBUG=QS.get('debug')==='1';
/* Store / live-ops flags: design only. Nothing here charges, shows a buyable price, or loads ads. */
const FLAGS={store:false,continuePaid:false,ads:false};
const PICKUP_TASKS=[{id:'wash',name:'Lift kit & chrome rims',price:1000,at:3},{id:'fender',name:'Light bar & hood stripe',price:1500,at:8},{id:'visor',name:'Loaded cargo rack',price:2000,at:12},{id:'hitch',name:'Pirate trailer',price:3000,at:16}];
const TRUCK_NAMES=['Beat-up Pickup','Fresh paint','Lift kit & chrome rims','Light bar & hood stripe','Loaded cargo rack','Pirate trailer'];
function truckLv(){const n=PICKUP_TASKS.filter(t=>save.tasks.includes(t.id)).length;return Math.min(5,(save.truckSeen?1:0)+n);}
function truckImg(n){return IM.get('truck-L'+Math.max(0,Math.min(5,n)));}
const YARD_TASKS=[{id:'truck',name:'Buy a hand truck',price:600},{id:'canopy',name:'Put up a canopy',price:900},{id:'second',name:'Rent a second locker',price:1500}];
const NODES_TO_YARD=10, JUNK_PRICE=2;
const BUILT_LINES={wash:'The Pickup is shining.',fender:'The Pickup looks meaner already.',visor:'Pirate visor is up. Respect.',hitch:'Hitch on. Bigger hauls coming.',table:'Sturdy table. Flip like a pro.',
  truck:'Hand truck rolling.',canopy:'Shade for the flip crowd.',second:'Two lockers. Now we\'re talking.'};

/* ---------------- save (v2) + migration from v1 ---------------- */
const KEY='storageRush.v3',OLD2='storageRush.v2',OLD='storageRush.v1';
function fresh(){return {v:3,unit:0,bank:0,sound:true,rung:0,tasks:[],boosters:{cut:2,flash:1,free:0},daily:{day:'',boards:0,punch:[],glove:''},endless:{n:0,best:0},seenLadder:false,taughtBoost:{cut:false,flash:false,free:false},truckSeen:false,built:[],safeBank:0,lmv:2,run:null,safeSeen:false,safeCommons:0,returnBoost:false};}
function load(){
  try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&s.v===3){const o=Object.assign(fresh(),s);
    // landmark ids v2: the first build at stop 2 is now the $400 Flea Market Stall (art 'flea'); the old free Yard Sign moved to stop 9
    if(!s.lmv){o.built=(o.built||[]).map(id=>id==='sign'?'flea':id==='flea'?'sign':id);o.lmv=2;}return o;}}catch(e){}
  const f=fresh();
  try{const o=JSON.parse(localStorage.getItem(OLD2));if(o&&typeof o.bank==='number'){f.bank=o.bank;f.sound=o.sound!==false;f.migratedFrom=2;}}catch(e){}
  try{const o=JSON.parse(localStorage.getItem(OLD));if(o&&typeof o.bank==='number'&&!f.migratedFrom){f.bank=o.bank;f.sound=o.sound!==false;f.migratedFrom=1;}}catch(e){}
  return f;}
let save=load();store();
function store(){try{localStorage.setItem(KEY,JSON.stringify(save));}catch(e){}}
const today=()=>new Date().toLocaleDateString('en-CA');
const money=n=>'$'+Math.round(n).toLocaleString('en-US');

/* ---------------- state ---------------- */
const S={mode:'title',eng:null,run:null,busy:false,sel:null,drag:null,armed:null,dying:[],parts:[],rings:[],beams:[],floats:[],
  door:null,flip:null,lad:null,scr:null,hint:null,tutHand:null,lastAct:0,result:null,continued:false,cam:{z:1,fx:0,fy:0,t0:0,dur:0},shake:0,shakeT:0,
  flash:0,pulse:0,enter:0,taught:false,goalSlots:[],build:null,polaroid:null,hawk:0,lockedShake:0,map:null,safe:null,truck:null};
let W=0,H=0,DPR=1,L={x:0,y:0,cell:50};
let bgCache={},sprites={};

/* ---------------- layout ---------------- */
function resize(){DPR=Math.min(3,window.devicePixelRatio||1);const AR=$('app').getBoundingClientRect();W=Math.round(AR.width)||window.innerWidth;H=Math.round(AR.height)||window.innerHeight;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);
  const top=H<700?164:194,bottom=H<700?102:132;const cell=Math.floor(Math.min((W-30)/7,(H-top-bottom)/7,78));
  L.cell=cell;L.x=Math.round((W-cell*7)/2);L.y=Math.round(top+Math.max(0,(H-top-bottom-cell*7)/2)*.85);bgCache={};sprites={};terrainFlip=null;if(S.cam)S.cam.y=camClamp(S.cam.y);if(typeof placeRush==='function')placeRush();}
function off(w,h){const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*DPR));c.height=Math.max(1,Math.round(h*DPR));const x=c.getContext('2d');x.setTransform(DPR,0,0,DPR,0,0);return [c,x];}
function bg(key,fn){if(!bgCache[key]){const [c,x]=off(W,H);fn(x);bgCache[key]=c;}return bgCache[key];}
function sprite(key,fn){if(!sprites[key]){const s=L.cell;const [c,x]=off(s,s);x.translate(s/2,s/2);fn(x,s*.98);sprites[key]=c;}return sprites[key];}
function tileSprite(t){
  if(t.k==='tarp')return sprite('tp'+t.layers+(t.find?'g':''),(x,s)=>{if(!IM.contain(x,IM.get('tarp'),-s*.5,-s*.44,s,s*.88))A.tarp(x,s,t.layers,!!t.find);if(t.find)A.star(x,s*.27,-s*.25,s*.095,'#ffe69b',4,.2);x.fillStyle='#3a2919';x.strokeStyle='#dabd85';x.lineWidth=2;A.rr(x,-s*.2,s*.15,s*.4,s*.25,s*.06);x.fill();x.stroke();x.fillStyle='#fff3d2';x.font=Math.round(s*.2)+'px '+DISP;x.textAlign='center';x.textBaseline='middle';x.fillText(String(t.layers),0,s*.285);});
  if(t.k==='find')return sprite('f'+t.find,(x,s)=>{if(!(IM&&IM.contain(x,IM.get(t.find),-s/2,-s/2,s,s)))A.FINDS[t.find].draw(x,s);});
  if(t.sp==='gavel')return sprite('gv',(x,s)=>{if(!(IM&&IM.contain(x,IM.get('gavel'),-s/2,-s/2,s,s)))A.gavel(x,s);});
  return sprite('i'+t.t+(t.sp||'')+(t.dir||''),(x,s)=>{if(IM&&IM.piece(x,t.t,s*1.02))gloss(x,s*1.02);else A.ITEMS[t.t](x,s);if(t.sp==='dolly')A.dollyOverlay(x,s,t.dir);if(t.sp==='wrap')A.wrapOverlay(x,s);});}

function gloss(x,s){x.save();x.globalCompositeOperation='source-atop';let g=x.createLinearGradient(0,-s/2,0,s/2);g.addColorStop(0,'rgba(255,255,255,.42)');g.addColorStop(.3,'rgba(255,255,255,.12)');g.addColorStop(.5,'rgba(255,255,255,0)');g.addColorStop(.78,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(40,10,0,.28)');x.fillStyle=g;x.fillRect(-s/2,-s/2,s,s);
  g=x.createRadialGradient(-s*.17,-s*.27,0,-s*.17,-s*.27,s*.26);g.addColorStop(0,'rgba(255,255,255,.75)');g.addColorStop(.35,'rgba(255,255,255,.25)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(-s/2,-s/2,s,s);x.restore();
  x.save();x.globalCompositeOperation='destination-over';x.shadowColor='rgba(0,0,0,.45)';x.shadowBlur=s*.08;x.shadowOffsetY=s*.05;x.restore();}
/* ---------------- helpers ---------------- */
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let rnd=Math.random;
function cellCenter(r,c){return {x:L.x+(c+.5)*L.cell,y:L.y+(r+.5)*L.cell};}
function shake(px){S.shake=Math.max(S.shake,px);S.shakeT=performance.now();}
function burst(r,c,col,n,shape,spd){const p=cellCenter(r,c);const now=performance.now();for(let i=0;i<n;i++){const a=rnd()*TAU,v=(spd||.32)*(.5+rnd());S.parts.push({x:p.x,y:p.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-.12,rot:rnd()*TAU,vr:(rnd()-.5)*.02,life:420+rnd()*260,t0:now,col,size:(shape==='dust'?8:6)+rnd()*6,shape:shape||'star'});}}
function ring(x,y,col,maxR,dur){S.rings.push({x,y,col,maxR,dur:dur||450,t0:performance.now()});}
function floatText(x,y,txt,col,size){S.floats.push({x,y,txt,col:col||'#ffcf5a',size:size||24,t0:performance.now()});}
let bannerT=0;function banner(txt,ms){const b=$('banner');b.textContent=txt;b.classList.remove('hidden');b.style.animation='none';void b.offsetWidth;b.style.animation='';clearTimeout(bannerT);bannerT=setTimeout(()=>b.classList.add('hidden'),ms||900);}
let toastT=0;function toast(txt,ms){const t=$('toast');t.textContent=txt;t.classList.remove('hidden');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.add('hidden'),ms||1800);}
function punchChip(id){const e=$(id);e.classList.remove('punch');void e.offsetWidth;e.classList.add('punch');}
function zoomTo(x,y,z,dur){S.cam={z,fx:x,fy:y,t0:performance.now(),dur:dur||400};}

/* ---------------- screens ---------------- */
const SCREENS=['title','ladderUI','doorUI','playUI','flipUI','lockedUI','dailyUI','safeUI','truckUI','empireUI','boxUI'];
function show(id){document.body.dataset.scene=S.mode;hideTut();clearTimeout(bannerT);SCREENS.forEach(s=>$(s).classList.toggle('hidden',s!==id));$('bHome').classList.toggle('hidden',id==='title');$('msg').classList.add('hidden');$('sign').classList.add('hidden');$('banner').classList.add('hidden');}
let msgFn=null,msgFn2=null;
function showMsg(o){$('msgH').textContent=o.h;$('msgP').innerHTML=o.p||'';$('msgB').textContent=o.b;msgFn=o.fn;
  const b2=$('msgB2');b2.classList.toggle('hidden',!o.b2);b2.textContent=o.b2||'';msgFn2=o.fn2||null;
  const st=$('msgStamp');st.classList.toggle('hidden',!o.stamp);st.textContent=o.stamp||'';$('msg').classList.remove('hidden');}
function music(){if(!save.sound){SFX.music('off');return;}SFX.music(S.mode==='safe'||S.mode==='box'?'safe':S.mode==='play'||S.mode==='door'?'unit':'yard');}

function goTitle(){S.mode='title';S.busy=false;show('title');S.hawk=S.hawk||performance.now();
  $('bOpenTxt').textContent=save.unit>0?'Keep Going':'Open Unit';$('bReset').classList.toggle('hidden',save.unit===0&&save.bank===0&&!save.tasks.length);
  const dOk=save.unit>=3;$('bDaily').disabled=!dOk;$('bDaily').textContent=dOk?'Daily Auction':'Daily: after Unit 3';music();}

/* ---------------- ladder ---------------- */
const PAD_D=[0,2.7,4.1,5.5,6.9,8.3,9.7],PAD_X=[0,.42,-.4,.44,-.42,.3,0];
function pawnU(){return save.rung>=1?1:Math.min(NODES_TO_YARD,save.unit)/NODES_TO_YARD;}
function goLadder(hopFrom){return goMap(hopFrom);}
function artGate(test,fn){if(test()){$('loader').classList.add('hidden');fn();return;}$('loader').classList.remove('hidden');const t0=performance.now();const tick=()=>{if(test()||performance.now()-t0>20000){$('loader').classList.add('hidden');fn();}else setTimeout(tick,80);};setTimeout(tick,80);}
function goMap(hopFrom){if(!IM.mapReady()){artGate(()=>IM.mapReady(),()=>goMap(hopFrom));return;}S.mode='map';S.build=null;show('ladderUI');
  const first=!save.seenLadder;save.seenLadder=true;store();
  $('ladH').textContent='Sunnyvale Storage';
  $('ladSub').textContent=save.run&&save.run.u===save.unit&&!save.run.cleared?('Unit '+(save.unit+1)+' · room '+(save.run.bi+1)+' of '+UNITS[save.unit].boards.length+' saved'):save.run&&save.run.u===save.unit?('Unit '+(save.unit+1)+' cleared · saved'):save.unit===0?'Your first unit is waiting.':save.unit>=20?'20 / 20 · Sunnyvale cleared!':('Unit '+(save.unit+1)+' of 20 · '+(save.rung?'First Yard':'The Pickup'));$('mapBank').textContent=money(save.bank);
  $('ladBuilt').classList.add('hidden');
  $('bLadNext').textContent=save.unit>=UNITS.length?'Desert Gold':'Unit '+(save.unit+1)+' ▸';
  const from=hopFrom==null?save.unit:hopFrom;
  const walking=hopFrom!=null&&hopFrom<save.unit;
  S.map={from,to:save.unit,t0:performance.now(),walking};S.lmb=null;S.cam={y:camTarget(stopW(Math.min(19,from)).y),free:false,focus:null};if(!save.built)save.built=[];updBuildUI();
  S.lad={from:pawnU(),to:pawnU(),t0:0,phase:'done',sfx:{}};
  if(walking){$('bLadNext').classList.add('hidden');$('tasks').classList.add('hidden');setTimeout(afterHop,1400);}
  else afterHop();
  $('bGlove').classList.toggle('hidden',!(save.unit>=3&&save.daily.glove!==today()));
  music();}
function afterHop(){if(S.map)S.map.walking=false;$('bLadNext').classList.remove('hidden');

  if(save.unit>=NODES_TO_YARD&&save.rung<1){save.rung=1;store();setTimeout(()=>{banner('You reached First Yard!',1600);SFX.built();},200);}
  $('bLadNext').classList.remove('hidden');
  $('bLadNext').textContent=save.unit>=UNITS.length?'Desert Gold':'Unit '+(save.unit+1)+' ▸';
  updBuildUI();renderTasks();
  // first build: the $400 Flea Market Stall, paid from the $474 guitar sale. Unit 2 stays open either way (it costs nothing).
  const g=nextLm();$('bBuild').classList.toggle('nudge',!!(g&&g.id==='flea'&&save.bank>=g.cost));
  if(g&&g.id==='flea'&&save.bank>=g.cost&&!S.lmb&&!S.stallTold){S.stallTold=true;setTimeout(()=>{if(S.mode!=='map'||S.lmb||lmBuilt(g))return;banner('Build your first stall!',1600);toast(money(save.bank)+' banked! Stall: '+money(g.cost),2600);},450);}
  else if(save.returnBoost&&!S.returnTold){S.returnTold=true;setTimeout(()=>{if(S.mode==='map')toast('Big haul! Next unit: Rush '+RH.RETURN_BOOST+'%',2400);},600);}}
function taskList(){if(save.unit<3)return [];
  const nt=PICKUP_TASKS.find(t=>!save.tasks.includes(t.id)),list=nt?[nt]:[];
  if(save.rung>=1)list.push(...YARD_TASKS.filter(t=>!save.tasks.includes(t.id)));
  return list.sort((a,b)=>a.price-b.price).slice(0,2);}
function renderTasks(){const el=$('tasks');const list=taskList();
  if(!list.length||S.mode!=='empire'){el.classList.add('hidden');return;}
  const pickup=PICKUP_TASKS.some(t=>list.includes(t));
  el.innerHTML='<h3>'+(pickup?'Fix up The Pickup':'Build out First Yard')+'</h3>';let sug=false;
  list.forEach(t=>{const d=document.createElement('div');const reached=save.unit>=(t.at||0),can=reached&&save.bank>=t.price;d.className='task'+(can&&!sug?' suggest':'');if(can)sug=true;
    d.innerHTML='<span>'+t.name+'</span>';const b=document.createElement('button');b.dataset.task=t.id;b.disabled=!can;b.textContent=!reached?'After Unit '+t.at:can?money(t.price):'Need '+money(t.price-save.bank);
    b.onclick=()=>buyTask(t);d.appendChild(b);el.appendChild(d);});
  el.classList.remove('hidden');}
function goEmpire(){S.mode='empire';S.build=null;show('empireUI');$('empireBank').textContent=money(save.bank);$('empireName').textContent=save.rung?'First Yard':'The Pickup';$('empireSub').textContent=(PICKUP_TASKS.concat(YARD_TASKS).filter(t=>save.tasks.includes(t.id)).length)+'/7 upgrades · earned game cash only';renderTasks();music();}
function buyTask(t){if(S.build||save.bank<t.price||save.unit<(t.at||0)||save.tasks.includes(t.id))return;const from=truckLv(),isTruck=PICKUP_TASKS.some(q=>q.id===t.id);
  SFX.till();save.bank-=t.price;save.tasks.push(t.id);store();$('empireBank').textContent=money(save.bank);
  S.build={rung:0,t0:performance.now(),task:t,sfx:{}};$('tasks').classList.add('hidden');
  if(isTruck)save.truckLevel=truckLv();store();S.truck={t0:performance.now(),task:t.name,from,to:isTruck?truckLv():from,kind:isTruck?'truck':'yard',lm:({truck:'units',canopy:'flea',second:'warehouse'})[t.id]};S.mode='truck';show('truckUI');$('truckTitle').textContent=isTruck?'Pickup Level '+from+' → '+S.truck.to:'First Yard upgraded!';$('truckSub').textContent=t.name+' · '+money(t.price)+' game cash';$('bTruckNext').classList.add('hidden');S.truck.returnTo='empire';music();}
function upFlags(rung){const o={};save.tasks.forEach(id=>o[id]=1);return o;}

/* ---------------- units / boards ---------------- */
function startCampaign(){if(!IM.ready()){artGate(()=>IM.ready(),startCampaign);return;}if(save.unit>=UNITS.length){goLocked();return;}
  if(save.run&&save.run.u===save.unit&&UNITS[save.unit]){resumeRun(save.run);return;}
  startRun('campaign',UNITS[save.unit]);}
function newRun(kind,unit,bi){return {kind,unit,bi:bi||0,haul:[],cart:0,meter:0,rushNo:0,rushX:0,best:0,bonus:0,box:null,safe:null,cleared:false};}
function startRun(kind,unit){S.run=newRun(kind,unit,kind==='daily'?Math.min(save.daily.boards,2):0);
  if(kind==='campaign'&&save.returnBoost&&rushOn()){S.run.meter=RH.RETURN_BOOST;S.run.welcome=true;save.returnBoost=false;store();}
  openDoorScene();}
/* ---------------- room save / resume: every cleared room is saved, a reload never replays it ---------------- */
function persistRun(){const r=S.run;if(!r||r.kind!=='campaign')return;
  save.run={u:UNITS.indexOf(r.unit),bi:r.bi,haul:r.haul.slice(),cart:r.cart,meter:r.meter,rushNo:r.rushNo,best:r.best,bonus:r.bonus,box:r.box,safe:r.safe,cleared:!!r.cleared};store();}
function resumeRun(sv){const r=newRun('campaign',UNITS[sv.u],sv.bi);Object.assign(r,{haul:(sv.haul||[]).slice(),cart:sv.cart||0,meter:sv.meter||0,rushNo:sv.rushNo||0,best:sv.best||0,bonus:sv.bonus||0,box:sv.box||null,safe:sv.safe||null,cleared:!!sv.cleared});
  r.bi=Math.min(r.bi,r.unit.boards.length-1);S.run=r;r.resumed=true;
  if(r.cleared){S.mode='door';S.door={t0:performance.now()-5000,phase:'open'};newEngine();show('doorUI');$('doorUI').querySelector('.tapme').classList.add('hidden');$('doorName').textContent=r.unit.id+' · '+r.unit.name;$('doorGoal').textContent='Cleared · saved';afterClear();return;}
  openDoorScene();}
function rushOn(){return !!(S.run&&S.run.kind==='campaign'&&UNITS.indexOf(S.run.unit)>=RH.RUSH_FROM);}
function boardDef(){return S.run.unit.boards[S.run.bi];}
function isTutorial(){return S.run.kind==='campaign'&&save.unit<3;}
function openDoorScene(){S.mode='door';S.result=null;S.busy=false;S.dying=[];S.parts=[];S.floats=[];S.rings=[];S.beams=[];S.scr=null;
  newEngine();show('doorUI');const U=S.run.unit,d=boardDef();roomLabel();
  $('doorName').textContent=U.id+' · '+U.name;$('doorGoal').textContent='Pull '+d.need+' find'+(d.need>1?'s':'')+' in '+d.moves+' moves';
  $('doorUI').querySelector('.tapme').classList.remove('hidden');S.door={t0:0,phase:'closed'};updateHUD();music();}
function newEngine(){const d=boardDef();S.eng=new E(d,Math.floor(rnd()*1e9));if(S.run){const r=S.run;r.rushX=0;r.snap={meter:r.meter,rushNo:r.rushNo,best:r.best,bonus:r.bonus,box:r.box};}S.continued=false;S.taught=false;S.result=null;S.hint=null;S.tutHand=null;S.armed=null;S.flash=0;S.tarpTold=false;S.tarpGlow=0;
  S.eng.each((t,r,c)=>{t.x=c;t.y=r;t.vy=0;t.sq=0;});buildGoals();}
function openDoor(){if(S.mode!=='door'||S.door.phase!=='closed')return;
  S.door={t0:performance.now(),phase:'open'};SFX.jiggle();setTimeout(()=>{SFX.snap();shake(6);},200);setTimeout(()=>SFX.rattle(1.0),560);
  $('doorUI').querySelector('.tapme').classList.add('hidden');
  setTimeout(()=>beginPlay(),1650);}
function beginPlay(){S.mode='play';show('playUI');S.enter=performance.now();S.lastAct=performance.now();updateHUD();placeRush();music();
  if(S.run&&S.run.resumed&&S.run.bi>0){S.run.resumed=false;setTimeout(()=>banner('Welcome back! Room '+(S.run.bi+1)+' of '+S.run.unit.boards.length,1500),300);}
  else if(S.run&&S.run.welcome){S.run.welcome=false;setTimeout(()=>banner('Back at it! Rush Meter '+RH.RETURN_BOOST+'%',1500),300);}
  const d=boardDef();const tip=d.teach||d.tut;
  if(tip&&LV.TUTORIAL[tip]){showTut(LV.TUTORIAL[tip]);if(d.tut==='swap'||d.teach){const m=S.eng.bestMove();if(m)S.tutHand={a:m.a,b:m.b,t0:performance.now()};}}
  else hideTut();}
function showTut(t){const e=$('tut');e.textContent=t;e.classList.remove('hidden');}
function hideTut(){$('tut').classList.add('hidden');}
function buildGoals(){const d=boardDef(),g=$('goals');g.innerHTML='';S.goalSlots=[];
  (d.tarps||[]).filter(t=>t[3]).forEach(t=>{const el=document.createElement('div');el.className='goal buried';el.title=A.FINDS[t[3]].name;const c=document.createElement('canvas');c.width=c.height=96;const x=c.getContext('2d');x.translate(48,50);IM.contain(x,IM.get(t[3]),-36,-42,72,78)||A.FINDS[t[3]].draw(x,80);el.appendChild(c);g.appendChild(el);S.goalSlots.push({key:t[3],el});});}
function updateHUD(){
  if(S.eng){$('movesN').textContent=S.eng.moves;$('ticket').classList.toggle('low',S.eng.moves<=5);$('cartN').textContent=S.run?S.run.cart+S.eng.cart:0;}
  $('bankN').textContent=money(save.bank);
  if(S.eng){const onb=S.eng.findsOnBoard().map(f=>f.key),got=S.eng.collected.slice(),gone=S.eng.snatched.slice(),out=onb.slice();
    S.goalSlots.forEach(s=>{let cls='buried',i;if((i=got.indexOf(s.key))>=0){got.splice(i,1);cls='got';}else if((i=gone.indexOf(s.key))>=0){gone.splice(i,1);cls='gone';}else if((i=out.indexOf(s.key))>=0){out.splice(i,1);cls='out';}s.el.className='goal '+cls;});}
  rushHUD();
  const b=save.boosters;[['bCut','cut'],['bFlash','flash'],['bFree','free']].forEach(([id,k])=>{const el=$(id);el.querySelector('i').textContent=b[k];el.classList.toggle('empty',!b[k]);el.classList.toggle('armed',S.armed===k);});}

/* ---------------- board actions ---------------- */
async function resolveAll(){let chain=0;const kinds=[];
  for(;;){const ev=S.eng.step();if(!ev)break;chain++;stepFx(ev,chain);rushStep(ev,chain,kinds);updateHUD();
    await wait(ev.fired.length?300:190);
    S.eng.gravity().forEach(f=>{f.tile.x=f.c;f.tile.y=-f.k-.25;f.tile.vy=0;f.tile.sq=0;});
    await settle();}
  if(!S.eng.bestMove()){S.eng.shuffle();banner('Shuffle!');}
  if(chain>=2&&!(S.run&&S.run.rushT&&performance.now()-S.run.rushT<1500))banner(chain>=4?'BIG CHAIN x'+chain+'!':'Chain x'+chain,800);
  if(rushOn()&&UNITS.indexOf(S.run.unit)>=RH.BOX_FROM&&!S.run.box&&RH.boxEarned(chain,kinds))earnBox();
  updateHUD();}
/* ---------------- Rush Meter: fills from cascades, earned 2X-5X, never sold ---------------- */
function rushStep(ev,chain,kinds){if(!rushOn())return;const r=S.run;ev.fired.forEach(f=>kinds.push(f.sp));
  const items=ev.cleared.filter(c=>c.tile&&c.tile.k==='item').length,pay=RH.itemPay(r.meter,r.rushX);
  if(pay>2&&items){r.bonus+=items*(pay-2);if(r.rushX){const p=cellCenter(3,3);floatText(p.x+(rnd()-.5)*L.cell*3,p.y+(rnd()-.5)*L.cell*2,'+'+money(items*(pay-2)),'#ffe066',22);}}
  if(r.rushX)return;const was=r.meter;r.meter=Math.min(RH.METER,r.meter+RH.gain(chain,ev.cleared.length,ev.fired.length,ev.hits.filter(h=>h.revealed).length));
  if(was<RH.HOT&&r.meter>=RH.HOT&&r.meter<RH.METER){banner('HOT! Cart pays $3',900);SFX.special();}
  if(r.meter>=RH.METER)startRush();}
function startRush(){const r=S.run;r.rushNo++;r.rushX=RH.mult(r.rushNo);r.best=Math.max(r.best,r.rushX);r.meter=0;r.rushT=performance.now();
  banner('RUSH '+r.rushX+'X!',1600);shake(9);SFX.gavel();setTimeout(()=>SFX.special(),220);const p=cellCenter(3,3);confetti(p.x,p.y,60,.6);ring(p.x,p.y,'#ffcf5a',L.cell*6,700);
  floatText(W/2,L.y+L.cell*2.2,r.rushX+'X CART + FINDS','#fff',26);updateHUD();}
function earnBox(){const r=S.run;r.box=Object.assign(RH.rollBox(rnd,1),{opened:false});SFX.reveal();shake(6);banner('MYSTERY BOX!',1400);
  const p=cellCenter(3,3);ring(p.x,p.y,'#c9a2ff',L.cell*4,600);confetti(p.x,p.y,40,.5);floatText(p.x,p.y-L.cell,'Opens when the room is clear','#fff',20);updateHUD();}
function restoreSnap(){const r=S.run;if(r&&r.snap){Object.assign(r,r.snap);r.rushX=0;}}
function placeRush(){const el=$('rush');if(!el)return;const on=S.mode==='play'&&rushOn();el.classList.toggle('hidden',!on);if(!on)return;
  const pb=$('pbot').getBoundingClientRect(),cr=cv.getBoundingClientRect(),bb=L.y+L.cell*7,top=pb.top-cr.top,h=el.offsetHeight||30;
  el.style.top=Math.round(Math.max(bb+2,Math.min(top-h-4,(bb+top)/2-h/2)))+'px';}
function rushHUD(){const el=$('rush');if(!el||!S.run||!rushOn())return;const r=S.run,hot=r.meter>=RH.HOT;
  $('rushFill').style.width=(r.rushX?100:r.meter)+'%';el.classList.toggle('hot',hot&&!r.rushX);el.classList.toggle('on',!!r.rushX);
  $('rushTxt').textContent=r.rushX?'RUSH '+r.rushX+'X':hot?'HOT · CART $3':'RUSH METER';
  $('rushNext').textContent=r.rushX?('+'+money(r.bonus)):('next '+RH.mult(r.rushNo+1)+'X');
  $('rushBox').classList.toggle('hidden',!(r.box&&!r.box.opened));}
function stepFx(ev,chain){
  SFX.match(chain);S.pulse=performance.now();
  ev.cleared.forEach(c=>{const t=c.tile;burst(c.r,c.c,t.t>=0?A.ITEM_COL[t.t]:'#ffcf5a',5,'star');S.dying.push({tile:t,x:c.c,y:c.r,t0:performance.now(),fly:rnd()<.35?'cart':null});});
  ev.fired.forEach(f=>{const p=cellCenter(f.r,f.c);
    if(f.sp==='dolly'){S.beams.push({r:f.r,c:f.c,dir:f.dir,t0:performance.now()});SFX.shot();shake(4);floatText(p.x,p.y,'Dolly!','#fff',30);}
    if(f.sp==='wrap'){ring(p.x,p.y,'#bfe6ff',L.cell*2.2,450);SFX.boom();shake(5);floatText(p.x,p.y,'POP!','#fff',34);}
    if(f.sp==='gavel'){ring(p.x,p.y,'#ffcf5a',L.cell*6,650);SFX.gavel();shake(7);floatText(W/2,L.y+L.cell*3.5,'Sold, all of them!','#ffcf5a',30);}});
  if(S.eng.comboKind){const p=cellCenter(3,3);floatText(p.x,p.y-30,'COMBO!','#ff7a6a',36);S.eng.comboKind=null;}
  ev.spawned.forEach(s=>{const p=cellCenter(s.r,s.c);ring(p.x,p.y,'#fff',L.cell*.9,350);SFX.special();floatText(p.x,p.y-L.cell*.4,s.sp==='dolly'?'DOLLY!':s.sp==='wrap'?'BUBBLE WRAP!':'GAVEL!','#ffcf5a',26);});
  if(ev.hits.length){SFX.rip();shake(3);}
  ev.hits.forEach(h=>{burst(h.r,h.c,'#cbb98f',8,'shard',.36);burst(h.r,h.c,'rgba(235,225,200,.8)',4,'dust',.12);const p=cellCenter(h.r,h.c);
    if(h.revealed)reveal(h);else if(!h.removed)floatText(p.x,p.y-L.cell*.3,String(h.layers),'#fff',28);});}
function reveal(h){const p=cellCenter(h.r,h.c);setTimeout(()=>SFX.reveal(),120);burst(h.r,h.c,'#ffd84a',14,'star',.4);ring(p.x,p.y,'#ffd84a',L.cell*1.4,500);
  floatText(p.x,p.y-L.cell*.55,A.FINDS[h.find].name+'!','#ffcf5a',30);zoomTo(p.x,p.y,1.1,450);confetti(p.x,p.y,30,.45);shake(5);banner('FOUND IT!',1000);
  if(S.eng.scrapper==='teach'&&!S.taught){S.taught=true;S.scr={phase:'teach',r:h.r,c:h.c,t0:performance.now()+500,tile:h.tile};showTut('Tap it before the Scrapper does!');}
  else if(boardDef().tut==='swap')showTut('Tap the find to put it on the cart!');}
async function trySwap(a,b){
  if(S.busy||S.mode!=='play'||S.result)return;
  const free=S.armed==='free'&&save.boosters.free>0;
  const ta=S.eng.at(a[0],a[1]),tb=S.eng.at(b[0],b[1]);if(!ta||!tb)return;
  S.busy=true;S.sel=null;S.hint=null;S.lastAct=performance.now();
  const res=S.eng.swap(a,b,free);
  if(!res.ok){if(res.kind==='nomatch'){SFX.swap();S.bounceAnim={ta,tb,a,b,t0:performance.now()};await wait(300);S.bounceAnim=null;SFX.bump();}S.busy=false;return false;}
  SFX.swap();ta.ease=tb.ease=true;await settle();
  if(free){save.boosters.free--;S.armed=null;hideTut();store();}
  if(S.tutHand){S.tutHand=null;}
  if(boardDef().tut!=='swap')hideTut();
  updateHUD();await resolveAll();await ageFinds();S.busy=false;updateHUD();teachTarp();checkEnd();return true;}
function tarpCells(){const a=[],all=S.run&&boardDef().clearTarps;if(S.eng)S.eng.each((t,r,c)=>{if(t.k==='tarp'&&(t.find||all))a.push({r,c,t});});return a;}
function teachTarp(){if(boardDef().tut!=='swap'||S.result||S.mode!=='play')return;const tc=tarpCells();if(!tc.length){S.tarpGlow=0;return;}
  if(S.eng.findsOnBoard().length)return;
  if(!S.tarpTold){S.tarpTold=true;S.tarpGlow=performance.now();showTut(LV.TUTORIAL.tarp);}
  else if((S.eng.collected.length||tc.length<(boardDef().tarps||[]).length)&&S.tarpTold!==2){S.tarpTold=2;S.tarpGlow=performance.now();showTut(boardDef().clearTarps?'Nice! Rip every tarp to clear the unit.':'Nice! Rip the other tarps the same way.');}
  const m=S.eng.bestMove();if(m&&m.score>=20)S.tutHand={a:m.a,b:m.b,t0:performance.now()};}

async function ageFinds(){const r=S.eng.age();
  if(r.warn.length&&!(S.scr&&(S.scr.phase==='grab'||S.scr.phase==='teach'))){const f=r.warn[0];S.scr={phase:'peek',r:f.r,c:f.c,t0:performance.now(),tile:f.tile};SFX.scrapperWarn();}
  if(!r.warn.length&&S.scr&&S.scr.phase==='peek')S.scr=null;
  for(const f of r.snatch){S.scr={phase:'grab',r:f.r,c:f.c,t0:performance.now(),tile:f.tile};SFX.snatch();
    const p=cellCenter(f.r,f.c);floatText(p.x,p.y,'Scrapper grabbed it!','#ff7a6a',24);await wait(480);
    S.eng.snatch(f.r,f.c);S.dying.push({tile:f.tile,x:f.c,y:f.r,t0:performance.now(),fly:'scrapper'});await wait(520);S.scr=null;
    S.eng.gravity().forEach(g=>{g.tile.x=g.c;g.tile.y=-g.k-.25;});await settle();await resolveAll();updateHUD();}}
async function collect(r,c){const t=S.eng.at(r,c);if(!t||t.k!=='find'||S.busy||S.mode!=='play'||S.result)return;
  S.busy=true;S.lastAct=performance.now();SFX.collect();S.eng.collect(r,c);S.run.haul.push(t.find);
  S.dying.push({tile:t,x:c,y:r,t0:performance.now(),fly:'cart',spin:1});burst(r,c,'#ffd84a',14,'star',.35);
  const p=cellCenter(r,c);floatText(p.x,p.y-L.cell*.4,'On the cart!','#9ff08a',24);setTimeout(()=>punchChip('cartChip'),450);
  if(S.scr&&S.scr.tile===t){if(S.scr.phase==='teach'){S.scr.phase='miss';S.scr.t0=performance.now();floatText(W-60,p.y-30,'Too slow, Scrapper!','#fff',22);}else S.scr=null;}
  if(boardDef().tut==='swap')hideTut();
  {const pr=A.FINDS[t.find]&&A.FINDS[t.find].price;if(pr)floatText(p.x,p.y-L.cell*1.05,'+'+money(pr),'#ffdd72',30);confetti(p.x,p.y,24,.4);
   if(pr&&S.run.rushX){const ex=pr*(S.run.rushX-1);S.run.bonus+=ex;floatText(p.x,p.y-L.cell*1.6,S.run.rushX+'X  +'+money(ex),'#ffe066',28);}}
  updateHUD();await wait(260);S.eng.gravity().forEach(g=>{g.tile.x=g.c;g.tile.y=-g.k-.25;});await settle();await resolveAll();
  S.busy=false;updateHUD();teachTarp();checkEnd();}
async function useCut(r,c){const t=S.eng.at(r,c);if(!t||t.k!=='tarp'||save.boosters.cut<=0||S.busy)return;
  S.busy=true;save.boosters.cut--;S.armed=null;hideTut();store();SFX.snap();shake(4);const ev=S.eng.cut(r,c);
  burst(r,c,'#cbb98f',10,'shard',.4);const p=cellCenter(r,c);floatText(p.x,p.y-20,'Snip!','#fff',28);
  if(ev.revealed)reveal(ev);else if(!ev.removed)floatText(p.x,p.y+10,String(ev.layers),'#fff',26);
  updateHUD();await wait(220);if(ev.removed){S.eng.gravity().forEach(g=>{g.tile.x=g.c;g.tile.y=-g.k-.25;});await settle();await resolveAll();}
  S.busy=false;updateHUD();checkEnd();}
function useFlash(){if(save.boosters.flash<=0||S.busy||S.mode!=='play')return;save.boosters.flash--;store();S.flash=performance.now();SFX.reveal();banner('Flashlight!',700);updateHUD();}
function checkEnd(){if(S.mode!=='play'||S.result)return;const st=S.eng.status();
  if(st==='win'){S.result='win';S.busy=true;SFX.win();setTimeout(boardWon,650);return;}
  if(st==='scrapped'){S.result='fail';S.busy=true;SFX.fail();setTimeout(()=>failMsg('Scrapped!','The Scrappers got too many finds. Tap finds fast next time.'),650);return;}
  if(st==='out'){S.busy=true;
    if(!isTutorial()&&!S.continued){setTimeout(()=>showMsg({h:'Out of bid cards!',p:'Take 5 more moves? First one is on the house.',b:'+5 Moves (free)',stamp:'',fn:()=>{S.continued=true;S.eng.moves+=5;S.busy=false;updateHUD();banner('+5 moves!');},b2:'No thanks',fn2:()=>failMsg('Out of moves',failText())}),500);return;}
    S.result='fail';SFX.fail();setTimeout(()=>failMsg('Out of moves',failText()),650);}}
function failText(){const d=boardDef(),got=S.eng?S.eng.collected.length:0,left=d.need-got;
  if(d.clearTarps&&S.eng){const tl=S.eng.tarpsLeft();if(tl&&tl<(d.tarps||[]).length)return tl===1?'So close! Just 1 tarp left.':'Good start! '+tl+' tarps left to rip.';}
  if(got===0)return 'No finds pulled yet. Match right next to a tarp to rip it open.';if(left===1)return 'So close! Just 1 more find.';return 'You pulled '+got+' of '+d.need+'. Rip the tarps first.';}
function failMsg(h,p){S.result='fail';showMsg({h,p,b:'Try again',fn:()=>{S.run.haul.splice(S.run.haul.length-S.eng.collected.length,S.eng.collected.length);restoreSnap();openDoorScene();}});}
function roomLabel(){if(!S.run)return;const U=S.run.unit,n=U.boards.length,d=boardDef();$('unitLabel').textContent='SUNNYVALE · '+U.id.toUpperCase();const nf=(d.tarps||[]).filter(t=>t[3]).length;$('goalLabel').textContent=U.id.toUpperCase()+' · '+(d.clearTarps?'RIP '+(d.tarps||[]).length+' TARPS':n>1?'ROOM '+(S.run.bi+1)+'/'+n+' · FIND '+d.need:'FIND '+d.need+' OF '+nf);}
function boardWon(){const run=S.run;run.cart+=S.eng.cart;run.rushX=0;
  if(run.bi<run.unit.boards.length-1){if(run.kind==='daily'){save.daily.day=today();save.daily.boards=run.bi+1;store();}
    run.bi++;persistRun();roomLabel();
    const next=()=>{banner('Room '+(run.bi+1)+' of '+run.unit.boards.length+'!',1100);SFX.special();setTimeout(()=>{newEngine();S.result=null;S.busy=false;beginPlay();S.enter=performance.now();},900);};
    if(run.box&&!run.box.opened){setTimeout(()=>startBox(next),700);return;}
    banner('Room saved!',800);next();return;}
  run.cleared=true;
  if(run.kind!=='endless'&&!run.safe&&RH.safeEarned(run.haul,run.best)&&!(run.kind==='campaign'&&UNITS.indexOf(run.unit)<2))
    run.safe={rarity:RH.rollSafe(rnd,{first:!save.safeSeen,bestRush:run.best,commons:save.safeCommons||0}),done:false};
  persistRun();
  if(run.box&&!run.box.opened){setTimeout(()=>startBox(afterClear),700);return;}
  afterClear();}
function cartPrice(run){return run.kind==='campaign'&&UNITS.indexOf(run.unit)===0?Math.max(0,RH.FIRST_SALE-run.haul.reduce((a,k)=>a+A.FINDS[k].price,0)):run.cart*JUNK_PRICE;}
function afterClear(){const run=S.run;S.busy=true;S.result='win';
  const first=run.kind==='campaign'&&UNITS.indexOf(run.unit)===0;
  const lines=run.haul.map(k=>'<div class="line"><span>'+A.FINDS[k].name+'</span><span>'+money(A.FINDS[k].price)+'</span></div>').join('')+'<div class="line"><span>Cart of stuff ('+run.cart+')'+(first?' · lot price':'')+'</span><span>'+money(cartPrice(run))+'</span></div>'+
    (run.bonus?'<div class="line"><span>Hot + Rush bonus</span><span>'+money(run.bonus)+'</span></div>':'');
  const go=()=>{if(run.safe&&!run.safe.done)startSafe(run.safe.rarity);else startFlip();};
  showMsg({h:run.unit.id+' cleared!',p:lines+(run.resumed&&run.cleared?'<p class="sub">Saved. Picked up right where you left off.</p>':''),b:run.safe&&!run.safe.done?'Crack the safe!':'Flip it!',stamp:'CLEARED',fn:go});}

/* ---------------- flip table ---------------- */
function startFlip(){const run=S.run;
  const items=run.haul.map(k=>({key:k,name:A.FINDS[k].name,price:A.FINDS[k].price}));items.push({key:'cart',name:'Cart of stuff ('+run.cart+')'+(run.kind==='campaign'&&UNITS.indexOf(run.unit)===0?' · lot price':''),price:cartPrice(run)});
  if(run.bonus)items.push({key:'bonus',name:'Hot + Rush bonus',price:run.bonus});
  const total=items.reduce((a,b)=>a+b.price,0);
  S.flip={items,t0:performance.now(),bank0:save.bank,total,done:false,sfx:{},coins:[],sold:false};
  S.mode='flip';show('flipUI');const hd=$('flipUI').querySelector('h2');if(hd)hd.textContent='Flea Market';$('bFlipNext').classList.add('hidden');$('haul').classList.add('hidden');$('flipBank').textContent=money(save.bank);S.flip.tapped=false;
  // Bank the haul once on entry, before any animation or reload. The saved run is cleared in the same write, so a reload can't pay twice.
  save.bank+=total;if(run.kind==='campaign'){save.run=null;if(run.best>=5||(run.safe&&run.safe.rarity!=='common'))save.returnBoost=true;}
  if(run.kind==='campaign'){S.flip.hopFrom=save.unit;save.unit=Math.max(save.unit,UNITS.indexOf(run.unit)+1);}
  if(run.kind==='daily'){const d=today();save.daily.day=d;save.daily.boards=3;if(!save.daily.punch.includes(d))save.daily.punch.push(d);save.daily.punch=save.daily.punch.slice(-7);}
  if(run.kind==='endless'){save.endless.n++;save.endless.best=Math.max(save.endless.best,save.endless.n);}
  store();music();}
function nextBuildHTML(){const l=LANDMARKS.find(q=>!lmBuilt(q)&&q.id!=='truck');if(!l)return '<p class="next">Sunnyvale is fully built!</p>';const need=l.cost-save.bank,at=lmAt(l);
  return '<p class="next">Next build: <b>'+l.name+'</b> · '+(save.unit<at?'opens after Unit '+at:need<=0?'you can build it now!':money(need)+' to go')+'</p>';}
function flipNext(){if(S.mode!=='flip')return;const F=S.flip;if(!F.sold){F.sold=true;F.soldT=performance.now();SFX.cashPop();$('bFlipNext').textContent='Next Unit';$('haul').classList.remove('hidden');return;}const k=S.run.kind;if(k==='campaign'){if(!save.truckSeen&&save.unit>=3)startTruck();else goMap(F.hopFrom);}else if(k==='daily')goDaily();else goLocked();}

/* ---------------- daily + endless + next yard ---------------- */
function dailyBoards(){const d=today(),seed=parseInt(d.replace(/-/g,''),10);const themes=['indoor','garage','yard'];
  return {id:'Daily Lot',name:'Daily Auction',theme:themes[seed%3],boards:[0,1,2].map(i=>E.generate(E.knobs(2+i*2),seed*10+i))};}
function goDaily(){S.mode='daily';show('dailyUI');const d=today();if(save.daily.day!==d){save.daily.day=d;save.daily.boards=0;store();}
  const p=$('punch');p.innerHTML='';const streak=save.daily.punch.length;for(let i=0;i<7;i++){const e=document.createElement('div');e.textContent=i+1;if(i<streak)e.className='on';p.appendChild(e);}
  const done=save.daily.boards>=3;$('dailySub').textContent=done?'Done for today. Come back tomorrow!':'Board '+(save.daily.boards+1)+' of 3 · Day '+Math.min(7,streak+1)+' of 7';
  $('bDailyGo').textContent=done?'Done today':'Play';$('bDailyGo').disabled=done;$('bGlove2').classList.toggle('hidden',save.daily.glove===d);music();}
function claimGlove(){const d=today();if(save.daily.glove===d)return;save.daily.glove=d;const k=['cut','flash','free'][parseInt(d.slice(-2),10)%3];save.boosters[k]++;store();SFX.collect();
  toast({cut:'Glove box: Bolt Cutters!',flash:'Glove box: Flashlight!',free:'Glove box: Free Swap!'}[k]);$('bGlove').classList.add('hidden');$('bGlove2').classList.add('hidden');}
function startEndless(){const n=save.endless.n;startRun('endless',{id:'Endless #'+(n+1),name:'Endless Auction',theme:['yard','garage','indoor'][n%3],boards:[E.generate(E.knobs(n),n*7919+13)]});}
function goLocked(){S.mode='locked';show('lockedUI');$('lockBank').textContent=money(save.bank);S.lockedShake=0;
  const lh=$('lockedUI').querySelector('h2');if(lh)lh.textContent='Desert Gold';
  const lp=$('lockedUI').querySelector('.head p');if(lp&&!lp.querySelector('b')){}
  $('bEndless').textContent=save.endless.n?'Endless #'+(save.endless.n+1):'Endless Auction';
  $('debugNote').classList.add('hidden');
  music();}

/* ---------------- input ---------------- */
function cellAt(x,y){const c=Math.floor((x-L.x)/L.cell),r=Math.floor((y-L.y)/L.cell);return r>=0&&r<7&&c>=0&&c<7?[r,c]:null;}
function doorRect(){const p=8;return {x:L.x-p,y:L.y-p,w:L.cell*7+p*2,h:L.cell*7+p*2};}
function lockedDoorRect(){const w=Math.min(W*.62,280),h=Math.min(H*.25,w*.9);return {x:(W-w)/2,y:Math.max(H*.17,152),w,h};}
function ptr(e){const r=cv.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
cv.addEventListener('pointerdown',e=>{SFX.unlock();music();const P=ptr(e),x=P.x,y=P.y;
  if(S.mode==='door'){const d=doorRect();if(x>d.x-20&&x<d.x+d.w+20&&y>d.y-20&&y<d.y+d.h+60)openDoor();return;}
  if(S.mode==='locked'){const d=lockedDoorRect();if(x>d.x&&x<d.x+d.w&&y>d.y&&y<d.y+d.h+30){SFX.locked();S.lockedShake=performance.now();toast('Unlock coming soon');}return;}
  if(S.mode==='safe'||S.mode==='truck'||S.mode==='box')return;
  if(S.mode==='map'){S.mdrag={y,x,cam:S.cam.y,moved:false};return;}
  if(S.mode==='flip'&&S.flip&&!S.flip.tapped){S.flip.tapped=true;SFX.cashPop&&SFX.cashPop();burst(3,3,'#ffd84a',18,'star',.4);return;}
  if(S.mode!=='play'||S.busy||S.result)return;
  const cell=cellAt(x,y);if(!cell)return;const t=S.eng.at(cell[0],cell[1]);
  if(S.armed==='cut'){if(t&&t.k==='tarp')useCut(cell[0],cell[1]);return;}
  if(t&&t.k==='find'){collect(cell[0],cell[1]);return;}
  if(!t||(t.k!=='item'&&S.armed!=='free'))return;
  S.drag={cell,x,y,moved:false};});
cv.addEventListener('pointermove',e=>{const P=ptr(e);if(S.mdrag&&S.mode==='map'){const dy=P.y-S.mdrag.y;if(Math.abs(dy)>7)S.mdrag.moved=true;if(S.mdrag.moved){S.cam.free=true;S.cam.y=camClamp(S.mdrag.cam-dy);}return;}if(!S.drag||S.drag.moved)return;const dx=P.x-S.drag.x,dy=P.y-S.drag.y;
  if(Math.hypot(dx,dy)>L.cell*.3){S.drag.moved=true;const a=S.drag.cell;const b=Math.abs(dx)>Math.abs(dy)?[a[0],a[1]+Math.sign(dx)]:[a[0]+Math.sign(dy),a[1]];if(b[0]>=0&&b[0]<7&&b[1]>=0&&b[1]<7)trySwap(a,b);}});
cv.addEventListener('pointerup',e=>{if(S.mdrag){const m=S.mdrag;S.mdrag=null;if(!m.moved&&S.mode==='map')mapTap(m.x,m.y);return;}const d=S.drag;S.drag=null;if(!d||d.moved||S.busy)return;const a=d.cell;
  if(S.sel&&Math.abs(S.sel[0]-a[0])+Math.abs(S.sel[1]-a[1])===1){const s=S.sel;S.sel=null;trySwap(s,a);}
  else if(S.sel&&S.sel[0]===a[0]&&S.sel[1]===a[1])S.sel=null;else{S.sel=a;SFX.tap();}});
cv.addEventListener('wheel',e=>{if(S.mode==='map'&&S.cam){S.cam.free=true;S.cam.y=camClamp(S.cam.y+e.deltaY);e.preventDefault();}},{passive:false});
cv.addEventListener('pointercancel',()=>{S.drag=null;S.mdrag=null;});
const tap=fn=>()=>{SFX.unlock();SFX.tap();fn();};
$('bOpen').onclick=tap(()=>goLadder());
$('bDaily').onclick=tap(()=>{if(save.unit>=3)goDaily();});
$('bReset').onclick=tap(()=>showMsg({h:'Start over?',p:'This wipes your bank, your ladder and your upgrades.',b:'Keep my stuff',fn:()=>{},b2:'Wipe it',fn2:()=>{const snd=save.sound;save=fresh();save.sound=snd;store();goTitle();}}));
$('bLadNext').onclick=tap(()=>startCampaign());
$('bBuild').onclick=tap(()=>{const l=LANDMARKS.find(q=>q.id===$('bBuild').dataset.lm);if(l)buildLm(l);});
$('bGlove').onclick=tap(claimGlove);$('bGlove2').onclick=tap(claimGlove);
$('bDailyGo').onclick=tap(()=>{if(save.daily.boards<3)startRun('daily',dailyBoards());});
$('bFlipNext').onclick=tap(flipNext);
$('bUnlock').onclick=tap(()=>{SFX.locked();S.lockedShake=performance.now();toast('Unlock coming soon');});
$('bEndless').onclick=tap(startEndless);
$('bVisit').onclick=tap(()=>goMap());
$('bEmpire').onclick=tap(goEmpire);$('bEmpireBack').onclick=tap(()=>goMap());$('bSafeNext').onclick=tap(()=>{if(S.safe&&S.safe.phase==='open')finishSafe();else skipSafe();});$('bTruckNext').onclick=tap(finishTruck);$('bBoxNext').onclick=tap(()=>{if(S.box&&S.box.stopped>=3)finishBox();else skipBox();});
$('bHome').onclick=tap(()=>{if(S.busy&&S.mode==='play')return;if(S.mode==='play'||S.mode==='door'){showMsg({h:'Leave this unit?',p:'Your bank, upgrades and every cleared room are saved. This room starts fresh next time.',b:'Keep playing',fn:()=>{},b2:'Back to map',fn2:()=>goMap()});return;}if(S.mode==='safe'||S.mode==='box')return;if(S.mode==='truck')return finishTruck();goTitle();});
$('bReplay').onclick=()=>{if(S.mode!=='play'||S.busy)return;SFX.tap();S.run.haul.splice(S.run.haul.length-S.eng.collected.length,S.eng.collected.length);restoreSnap();openDoorScene();};
$('bCut').onclick=()=>{if(S.mode!=='play'||!save.boosters.cut)return;SFX.tap();S.armed=S.armed==='cut'?null:'cut';if(S.armed){showTut(save.taughtBoost.cut?'Tap a tarp to cut one layer':'Bolt Cutters: first use — tap a tarp to cut one layer, no move spent.');save.taughtBoost.cut=true;store();}else hideTut();updateHUD();};
$('bFlash').onclick=()=>{SFX.tap();if(!save.taughtBoost.flash){save.taughtBoost.flash=true;store();showTut('Flashlight: first use — peek under tarps for 5 seconds.');setTimeout(hideTut,2400);}useFlash();};
$('bFree').onclick=()=>{if(S.mode!=='play'||!save.boosters.free)return;SFX.tap();S.armed=S.armed==='free'?null:'free';if(S.armed){showTut(save.taughtBoost.free?'Swap any two neighbors, free':'Free Swap: first use — swap any two neighbors at no move cost.');save.taughtBoost.free=true;store();}else hideTut();updateHUD();};
$('msgB').onclick=()=>{SFX.tap();$('msg').classList.add('hidden');const f=msgFn;msgFn=null;f&&f();};
$('msgB2').onclick=()=>{SFX.tap();$('msg').classList.add('hidden');const f=msgFn2;msgFn2=null;f&&f();};
function setSound(v){save.sound=v;store();SFX.setOn(v);document.body.classList.toggle('muted',!v);music();}
$('bSound').onclick=()=>{SFX.unlock();setSound(!save.sound);if(save.sound)SFX.tap();};
window.addEventListener('resize',resize);
function boosterIcons(){const ic=(id,fn)=>{const c=$(id).querySelector('canvas').getContext('2d');c.clearRect(0,0,96,96);c.save();c.translate(48,50);const k={bCut:'ic-cut',bFlash:'ic-flash',bFree:'ic-free'}[id];if(!(k&&IM.contain(c,IM.get(k),-39,-41,78,78)))fn(c,80);c.restore();};
  ic('bCut',(c,s)=>{c.rotate(-.6);A.flat(c,x=>A.rr(x,-.06*s,-.05*s,.12*s,.5*s,.05*s),'#e0302a',s*.06);A.flat(c,x=>A.rr(x,.08*s,-.05*s,.12*s,.5*s,.05*s),'#e0302a',s*.06);
    A.flat(c,x=>A.poly(x,[[-.04*s,-.05*s],[.0,-.45*s],[.06*s,-.05*s]]),'#c9d2db',s*.05);A.flat(c,x=>A.poly(x,[[.1*s,-.05*s],[.08*s,-.45*s],[.18*s,-.05*s]]),'#c9d2db',s*.05);});
  ic('bFlash',(c,s)=>{c.rotate(-.5);c.fillStyle='rgba(255,240,150,.7)';A.poly(c,[[.05*s,-.2*s],[.5*s,-.42*s],[.5*s,.42*s],[.05*s,.2*s]]);c.fill();A.flat(c,x=>A.rr(x,-.4*s,-.1*s,.4*s,.2*s,.05*s),'#2b4fa6',s*.06);A.flat(c,x=>A.rr(x,0,-.16*s,.12*s,.32*s,.04*s),'#c9d2db',s*.06);});
  ic('bFree',(c,s)=>{A.flat(c,x=>{x.beginPath();x.arc(0,0,.4*s,0,TAU);},'#7fd36a',s*.06);c.fillStyle='#fff';A.poly(c,[[-.28*s,-.08*s],[-.08*s,-.25*s],[-.08*s,-.14*s],[.24*s,-.14*s],[.24*s,-.02*s],[-.08*s,-.02*s],[-.08*s,.09*s]]);c.fill();A.poly(c,[[.28*s,.1*s],[.08*s,.27*s],[.08*s,.16*s],[-.24*s,.16*s],[-.24*s,.04*s],[.08*s,.04*s],[.08*s,-.07*s]]);c.fill();});}

/* ---------------- rendering ---------------- */
function drawFrame(c,theme){const x=L.x,y=L.y,w=L.cell*7,h=L.cell*7,p=10;const f=A.FLOORS[theme];
  // floor slab (light, warm) with soft 10% checker and contact shadow
  c.fillStyle='rgba(0,0,0,.35)';A.rr(c,x-p+4,y-p+10,w+p*2,h+p*2,14);c.fill();
  A.flat(c,cc=>A.rr(cc,x-p,y-p,w+p*2,h+p*2,14),f[0],4);
  for(let r=0;r<7;r++)for(let k=0;k<7;k++){if((r+k)%2)continue;c.fillStyle=f[1];c.fillRect(x+k*L.cell,y+r*L.cell,L.cell,L.cell);}
  const rr=A.seeded(5);c.fillStyle='rgba(120,100,70,.12)';for(let i=0;i<160;i++)c.fillRect(x+rr()*w,y+rr()*h,2,2);
  // warm overhead key light
  c.fillStyle=A.rg(c,x+w/2,y,0,x+w/2,y,h*1.1,[[0,'rgba(255,245,215,.35)'],[1,'rgba(255,245,215,0)']]);c.fillRect(x,y,w,h);
  // door tracks
  [x-p-9,x+w+p-1].forEach(tx=>{A.flat(c,cc=>A.rr(cc,tx,y-p-18,10,h+p*2+18,3),'#9aa3ad',3);for(let k=0;k<6;k++){c.fillStyle='#5b6570';c.beginPath();c.arc(tx+5,y+k*h/5,2,0,TAU);c.fill();}});
  // rolled-up door drum + tube light
  A.flat(c,cc=>A.rr(cc,x-p-12,y-p-26,w+p*2+24,22,11),'#ff8a2a',3);c.fillStyle='rgba(150,60,10,.45)';for(let k=0;k<4;k++)c.fillRect(x-p,y-p-22+k*5,w+p*2,1.5);
  c.fillStyle='rgba(255,255,255,.4)';c.fillRect(x-p,y-p-23,w+p*2,3);
  A.line(c,[[x-p-12,y-p-4],[x+w+p+12,y-p-4]],3);
  // margin props on tall phones: a stack by the left track, a tire and a dolly on the right
  const gap=H-84-(y+h+p);if(gap>70){const s=Math.min(gap*.8,L.cell*1.3),py=y+h+p+gap*.55;
    c.save();c.translate(x+s*.45,py);A.box(c,s);c.restore();c.save();c.translate(x+s*1.15,py+s*.08);A.tote(c,s*.8);c.restore();c.save();c.translate(x+s*.75,py-s*.5);A.box(c,s*.75);c.restore();
    c.save();c.translate(x+w-s*.5,py+s*.05);A.tire(c,s*.9);c.restore();c.save();c.translate(x+w-s*1.25,py+s*.1);A.crate(c,s*.75);c.restore();}}
function drawBoard(now){const c=ctx,cell=L.cell;
  c.save();c.beginPath();c.rect(L.x-4,L.y-4,cell*7+8,cell*7+8);c.clip();
  const fl=S.flash&&now-S.flash<5000;
  for(let r=0;r<7;r++)for(let k=0;k<7;k++){const t=S.eng.g[r][k];if(!t)continue;
    let px=L.x+(t.x+.5)*cell,py=L.y+(t.y+.5)*cell,sx=1,sy=1;
    if(S.bounceAnim&&(t===S.bounceAnim.ta||t===S.bounceAnim.tb)){const ba=S.bounceAnim,q=Math.sin(Math.min(1,(now-ba.t0)/300)*Math.PI)*.45;const from=t===ba.ta?ba.a:ba.b,to=t===ba.ta?ba.b:ba.a;px+=(to[1]-from[1])*cell*q;py+=(to[0]-from[0])*cell*q;}
    if(t.ease){const dx=Math.abs(t.x-k),dy=Math.abs(t.y-r);if(dx>.02){sx=1.1;sy=.92;}else if(dy>.02){sx=.92;sy=1.1;}}
    if(t.sq){sx*=1+.14*t.sq;sy*=1-.16*t.sq;py+=cell*.07*t.sq;}
    if(S.sel&&S.sel[0]===r&&S.sel[1]===k){const b=1.1+Math.sin(now/120)*.04;sx*=b;sy*=b;}
    if(S.hint&&((S.hint.a[0]===r&&S.hint.a[1]===k)||(S.hint.b[0]===r&&S.hint.b[1]===k))){const b=1+Math.abs(Math.sin(now/180))*.1;sx*=b;sy*=b;}
    c.save();c.translate(px,py);
    if(t.k==='find'){const pu=.5+.5*Math.sin(now/220);c.fillStyle=A.rg(c,0,0,0,0,0,cell*.62,[[0,'rgba(255,240,150,'+(.75+pu*.25)+')'],[.5,'rgba(255,190,40,.45)'],[1,'rgba(255,190,40,0)']]);c.fillRect(-cell*.62,-cell*.62,cell*1.24,cell*1.24);
      c.save();c.rotate(now/1400);c.fillStyle='rgba(255,250,210,.35)';for(let i=0;i<8;i++){c.rotate(TAU/8);c.beginPath();c.moveTo(0,0);c.lineTo(cell*.62,-cell*.08);c.lineTo(cell*.62,cell*.08);c.fill();}c.restore();
      const f2=Math.floor(now/350)%2;if(f2){A.star(c,cell*.3,-cell*.3,cell*.09,'#fff',4,.3);}else A.star(c,-cell*.3,-cell*.22,cell*.07,'#fff',4,.3);
      sx*=1+pu*.05;sy*=1+pu*.05;}
    if(t.sp==='gavel'){c.rotate(Math.sin(now/200)*.08);}
    c.scale(sx,sy);c.drawImage(tileSprite(t),-cell/2,-cell/2,cell,cell);
    if(fl&&t.k==='tarp'&&t.find){c.globalAlpha=.55+.25*Math.sin(now/150);c.drawImage(tileSprite({k:'find',find:t.find}),-cell*.36,-cell*.36,cell*.72,cell*.72);c.globalAlpha=1;}
    c.restore();
    if(t.k==='find'&&S.eng.scrapper==='on'){const age=S.eng.used-t.born;if(age>=E.SCRAP_WARN){const left=E.SCRAP_LIMIT-age;A.flat(c,cc=>{cc.beginPath();cc.arc(px+cell*.32,py-cell*.32,cell*.18,0,TAU);},'#e0302a',3);c.fillStyle='#fff';c.font=Math.round(cell*.26)+'px '+DISP;c.textAlign='center';c.textBaseline='middle';c.fillText(left,px+cell*.32,py-cell*.29);}}}
  if(fl){c.fillStyle='rgba(10,10,30,.25)';c.fillRect(L.x,L.y,cell*7,cell*7);}
  c.restore();
  // beams (dolly shots)
  S.beams=S.beams.filter(b=>{const k=(now-b.t0)/320;if(k>=1)return false;c.save();c.globalAlpha=1-k;c.fillStyle='#fff';const p=cellCenter(b.r,b.c);
    if(b.dir==='h')c.fillRect(L.x,p.y-cell*.18*(1-k),cell*7,cell*.36*(1-k));else c.fillRect(p.x-cell*.18*(1-k),L.y,cell*.36*(1-k),cell*7);c.restore();return true;});
  // dying tiles
  S.dying=S.dying.filter(d=>{const dur=d.fly?560:260;const k=(now-d.t0)/dur;if(k>=1)return false;
    let px=L.x+(d.x+.5)*cell,py=L.y+(d.y+.5)*cell,sc,a=1,rot=0;
    if(d.fly==='cart'){const ch=$('cartChip').getBoundingClientRect();const tx=ch.x+ch.width/2,ty=ch.y+ch.height/2;const e=k*k;px+=(tx-px)*e;py+=(ty-py)*e-Math.sin(k*Math.PI)*cell*1.4;sc=1-k*.55;rot=d.spin?k*TAU:0;}
    else if(d.fly==='scrapper'){px+=(W+cell-px)*k*k;py-=Math.sin(k*Math.PI)*cell*.6;sc=1;}
    else{sc=k<.35?1+k*.7:Math.max(0,1.25*(1-(k-.35)/.65));}
    c.save();c.globalAlpha=a;c.translate(px,py);c.rotate(rot);c.scale(sc,sc);c.drawImage(tileSprite(d.tile),-cell/2,-cell/2,cell,cell);c.restore();return true;});
  if(S.scr)drawScrapper(now);
  if(S.tarpGlow&&S.mode==='play'&&!S.result)drawTarpGlow(now);
  if(S.tutHand||(!S.busy&&S.hint))drawHand(now,S.tutHand||S.hint);}
function drawTarpGlow(now){const c=ctx,cell=L.cell,k=.5+.5*Math.sin((now-S.tarpGlow)/200);tarpCells().forEach(({r,c:col})=>{const x=L.x+col*cell,y=L.y+r*cell;c.save();c.shadowColor='#ffd23f';c.shadowBlur=14+10*k;c.strokeStyle='rgba(255,226,90,'+(.65+.35*k)+')';c.lineWidth=3+2*k;A.rr(c,x+2,y+2,cell-4,cell-4,8);c.stroke();c.restore();
    [[-1,0],[0,-1],[0,1]].forEach(([dr,dc])=>{const rr=r+dr,cc=col+dc;if(rr<0||cc<0||cc>6)return;const t=S.eng.at(rr,cc);if(!t||t.k==='tarp')return;c.save();c.globalAlpha=.18+.14*k;c.fillStyle='#fff2a0';A.rr(c,L.x+cc*cell+3,L.y+rr*cell+3,cell-6,cell-6,7);c.fill();c.restore();});});}

function drawHand(now,h){const a=cellCenter(h.a[0],h.a[1]),b=cellCenter(h.b[0],h.b[1]);const k=(now/1100)%1,e=k<.15?0:k>.7?1:(k-.15)/.55;
  const x=a.x+(b.x-a.x)*e,y=a.y+(b.y-a.y)*e;const c=ctx,s=L.cell*.6;c.save();c.translate(x+s*.15,y+s*.25);c.rotate(-.35);
  A.flat(c,cc=>A.rr(cc,-s*.16,-s*.5,s*.32,s*.7,s*.16),'#fff',3);A.flat(c,cc=>A.rr(cc,-s*.3,-s*.05,s*.6,s*.55,s*.2),'#fff',3);c.restore();}
function drawScrapper(now){const s=S.scr,cell=L.cell,c=ctx;if(!s)return;const p=cellCenter(s.r,s.c);
  const bustX=W-cell*.6,by=Math.min(H-120,Math.max(L.y+cell,p.y));let slide=Math.min(1,Math.max(0,(now-s.t0)/350));
  let reach=0;
  if(s.phase==='peek'){reach=.15+Math.sin(now/180)*.05;}
  if(s.phase==='grab'){const k=Math.min(1,(now-s.t0)/450),back=Math.max(0,Math.min(1,(now-s.t0-450)/500));reach=k-back*1.1;}
  if(s.phase==='teach'){const k=Math.max(0,Math.min(1,(now-s.t0)/3200));reach=k*.85;if(now-s.t0>4200){s.phase='miss';s.t0=now;floatText(W-80,by-40,'Next time...','#fff',22);}}
  if(s.phase==='miss'){const k=Math.min(1,(now-s.t0)/600);reach=(1-k)*.6;slide=1-k;if(k>=1){S.scr=null;hideTut();return;}}
  const len=Math.max(0,(bustX-cell*.4-p.x)*reach);
  // shadow crossing the find
  if(reach>.3){c.fillStyle='rgba(0,0,0,'+(.25*reach)+')';c.beginPath();c.ellipse(p.x+cell*.2,p.y+cell*.1,cell*.5,cell*.3,0,0,TAU);c.fill();}
  c.save();c.translate(bustX+(1-slide)*cell*2,by);c.save();c.translate(-cell*.35,cell*.15);A.grabber(c,cell*1.1,len);c.restore();if(!IM.contain(c,IM.get('scrapper-bust'),-cell*.8,-cell*1.25,cell*1.6,cell*1.8))A.scrapper(c,cell*1.6,s.phase!=='miss');c.restore();
  c.save();c.translate(Math.min(W-52,bustX),by-cell*1.05);A.flat(c,cc=>A.rr(cc,-48,-13,96,26,9),'#e0302a',3);c.fillStyle='#fff';c.font='16px '+DISP;c.textAlign='center';c.textBaseline='middle';c.fillText(s.phase==='teach'?"THAT'S MINE!":'SCRAPPER!',0,2);c.restore();}
function drawFx(now){const c=ctx;
  S.rings=S.rings.filter(r=>{const k=(now-r.t0)/r.dur;if(k>=1)return false;c.save();c.globalAlpha=1-k;c.strokeStyle=r.col;c.lineWidth=8*(1-k)+2;c.beginPath();c.arc(r.x,r.y,r.maxR*Math.sqrt(k),0,TAU);c.stroke();c.restore();return true;});
  S.parts=S.parts.filter(p=>{const dt=now-p.t0,k=dt/p.life;if(k>=1)return false;const x=p.x+p.vx*dt,y=p.y+p.vy*dt+.0006*dt*dt;c.save();c.globalAlpha=1-k*k;c.translate(x,y);c.rotate(p.rot+p.vr*dt);
    if(p.shape==='star'){A.star(c,0,0,p.size*(1-k*.5),p.col,5,.42);c.lineWidth=1.5;c.strokeStyle='rgba(58,34,16,.7)';c.stroke();}
    else if(p.shape==='shard'){c.fillStyle=p.col;A.poly(c,[[-p.size*.5,-p.size*.3],[p.size*.5,0],[-p.size*.2,p.size*.4]]);c.fill();c.lineWidth=1.2;c.strokeStyle='#3a2210';c.stroke();}
    else if(p.shape==='coin'){A.flat(c,cc=>{cc.beginPath();cc.ellipse(0,0,p.size,p.size*Math.abs(Math.cos(dt/90)),0,0,TAU);},'#ffcf3a',2);}
    else{c.fillStyle=p.col;c.beginPath();c.arc(0,0,p.size*(1+k),0,TAU);c.fill();}
    c.restore();return true;});
  S.floats=S.floats.filter(f=>{const k=(now-f.t0)/1200;if(k>=1)return false;const sc=k<.15?.6+k/.15*.5:1.1-Math.min(.1,(k-.15));c.save();c.globalAlpha=k<.75?1:1-(k-.75)/.25;c.translate(f.x,f.y-k*36);c.scale(sc,sc);
    c.font=f.size+'px '+DISP;c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.lineWidth=6;c.strokeStyle='#3a2210';c.strokeText(f.txt,0,0);c.fillStyle=f.col;c.fillText(f.txt,0,0);c.restore();return true;});}
function stepTiles(dt){if(!S.eng)return;const g=S.eng.g;
  for(let r=0;r<7;r++)for(let k=0;k<7;k++){const t=g[r][k];if(!t)continue;if(t.x==null){t.x=k;t.y=r;}
    if(t.ease||t.y>r){const step=dt*.008;const mv=(cur,tg)=>{const d=tg-cur;return Math.abs(d)<=step+Math.abs(d)*.22?tg:cur+d*.22+Math.sign(d)*step;};t.x=mv(t.x,k);t.y=mv(t.y,r);if(t.x===k&&t.y===r)t.ease=false;}
    else{if(t.x!==k)t.x=k;if(t.y<r){t.vy=Math.min(.03,(t.vy||0)+dt*.00012);t.y+=t.vy*dt;if(t.y>=r){t.y=r;if(t.vy>.006)t.sq=1;t.vy=0;}}}
    if(t.sq)t.sq=Math.max(0,t.sq-dt*.006);}}
function settle(){return new Promise(res=>{const chk=()=>{let ok=true;if(S.eng)S.eng.each((t,r,c)=>{if(Math.abs(t.x-c)>.001||Math.abs(t.y-r)>.001)ok=false;});if(ok)res();else setTimeout(chk,16);};chk();});}

function applyCam(now){const c=ctx;let ox=0,oy=0;
  if(S.shake){const k=(now-S.shakeT)/260;if(k>=1)S.shake=0;else{ox=(rnd()-.5)*2*S.shake*(1-k);oy=(rnd()-.5)*2*S.shake*(1-k);}}
  c.translate(ox,oy);
  const cm=S.cam;if(cm.dur){const k=(now-cm.t0)/cm.dur;let z=1;if(k<1)z=1+(cm.z-1)*Math.sin(Math.min(1,k)*Math.PI);if(k<1){c.translate(cm.fx,cm.fy);c.scale(z,z);c.translate(-cm.fx,-cm.fy);}}
  if(S.enter){const k=Math.min(1,(now-S.enter)/520);if(k<1){const e=1-Math.pow(1-k,3);const z=.86+.14*e;const cx=W/2,cy=L.y+L.cell*3.5;c.translate(cx,cy);c.scale(z,z);c.translate(-cx,-cy);c.globalAlpha=.4+.6*e;}else S.enter=0;}
  if(S.pulse){const k=(now-S.pulse)/140;if(k<1){const z=1+.006*Math.sin(k*Math.PI);const cx=W/2,cy=L.y+L.cell*3.5;c.translate(cx,cy);c.scale(z,z);c.translate(-cx,-cy);}else S.pulse=0;}}
function drawPlay(now){const th=S.run.unit.theme;ctx.save();applyCam(now);
  drawUnitRoom(now);drawBoardFrame(ctx);
  ctx.globalAlpha=1;drawBoard(now);ctx.restore();
  if(!S.busy&&!S.result&&S.eng.moves>0&&now-S.lastAct>6000&&!S.hint&&!S.tutHand){S.hint=S.eng.bestMove();}}
function drawDoor(now){const th=S.run.unit.theme;ctx.save();applyCam(now);
  drawUnitRoom(now);drawBoardFrame(ctx);drawBoard(now);
  const d=doorRect();let k=0,lockY=0,shOff=0,lockA=1,rot=0;
  if(S.door.phase==='open'){const t=now-S.door.t0;if(t<200)rot=Math.sin(t/200*Math.PI*6)*.18;
    else{shOff=Math.min(1,(t-200)/100)*L.cell*.16;if(t>320){const f=(t-320)/520;lockY=f*f*H*.6;rot=f*1.6;lockA=Math.max(0,1-f);}}
    k=Math.max(0,Math.min(1,(t-560)/950));k=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;}
  A.rollDoor(ctx,d.x,d.y,d.w,d.h,k,{label:S.run.unit.id.toUpperCase()});
  if(k<.7)scaredSign(ctx,d.x+d.w/2,d.y+d.h*.2-k*d.h,d.w*.62,1-k/.7);
  if(lockA>0){const ls=Math.min(120,L.cell*2);const lx=d.x+d.w/2,ly=d.y+d.h*(1-k)-ls*.3+lockY;
    if(S.door.phase==='closed'){const pu=1+Math.sin(now/200)*.06;ctx.fillStyle='rgba(255,220,120,.3)';ctx.beginPath();ctx.arc(lx,ly,ls*.62*pu,0,TAU);ctx.fill();}
    ctx.save();ctx.globalAlpha=lockA;ctx.translate(lx,ly);ctx.rotate(rot);A.padlock(ctx,0,0,ls,shOff,shOff>0);ctx.restore();}
  ctx.restore();}

function scaredSign(c,cx,cy,sw,alpha){const sh=sw*.34,sx=cx-sw/2,sy=cy-sh/2;c.save();c.globalAlpha=alpha;c.translate(cx,cy);c.rotate(-.03);c.translate(-cx,-cy);c.shadowColor='#0007';c.shadowBlur=8;c.shadowOffsetY=4;
  c.fillStyle=A.lg(c,0,sy,0,sy+sh,[[0,'#ffe46a'],[.55,'#ffd23f'],[1,'#e0a915']]);c.beginPath();c.moveTo(sx+8,sy);c.quadraticCurveTo(cx,sy-6,sx+sw-8,sy);c.quadraticCurveTo(sx+sw,sy,sx+sw,sy+8);c.lineTo(sx+sw,sy+sh-8);c.quadraticCurveTo(sx+sw,sy+sh,sx+sw-8,sy+sh);c.quadraticCurveTo(cx,sy+sh+5,sx+8,sy+sh);c.quadraticCurveTo(sx,sy+sh,sx,sy+sh-8);c.lineTo(sx,sy+8);c.quadraticCurveTo(sx,sy,sx+8,sy);c.fill();c.shadowColor='transparent';c.strokeStyle='#2b1a0a';c.lineWidth=3;c.stroke();
  [[sx+10,sy+10],[sx+sw-10,sy+10],[sx+10,sy+sh-10],[sx+sw-10,sy+sh-10]].forEach(p=>{c.fillStyle='#c9d2db';c.beginPath();c.arc(p[0],p[1],3.5,0,TAU);c.fill();c.strokeStyle='#555';c.lineWidth=1;c.stroke();});
  c.fillStyle='#1a1a1a';c.textAlign='center';c.textBaseline='middle';const fs=Math.round(sw*.095);c.font=fs+'px '+DISP;c.fillText('SCARED MONEY',cx,sy+sh*.36);c.fillText("DON'T MAKE MONEY",cx,sy+sh*.72);c.restore();}
/* title */
function label(c,txt,x,y,size,col='#fff3d2',align='center'){c.save();c.font=size+'px '+DISP;c.textAlign=align;c.textBaseline='middle';c.lineJoin='round';c.lineWidth=Math.max(3,size*.13);c.strokeStyle='#2b160c';c.strokeText(txt,x,y);c.fillStyle=col;c.fillText(txt,x,y);c.restore();}
function drawUnitRoom(now){const c=ctx;IM.cover(c,IM.get('bg-door'),W,H);c.fillStyle=A.lg(c,0,0,0,H,[[0,'rgba(10,4,0,.05)'],[.6,'rgba(10,4,0,0)'],[1,'rgba(10,4,0,.3)']]);c.fillRect(0,0,W,H);}
function drawBoardFrame(c){const x=L.x,y=L.y,w=L.cell*7,h=w,p=10;c.save();c.shadowColor='#0009';c.shadowBlur=18;c.shadowOffsetY=8;A.rr(c,x-p,y-p,w+p*2,h+p*2,10);c.fillStyle=A.lg(c,x,0,x+w,0,[[0,'#985222'],[.06,'#e6ac56'],[.15,'#6e3918'],[.85,'#8a4b20'],[.94,'#f4c97c'],[1,'#5e2f15']]);c.fill();c.shadowBlur=0;c.shadowOffsetY=0;c.lineWidth=2;c.strokeStyle='#e7b95e';c.stroke();c.fillStyle=A.lg(c,0,y,0,y+h,[[0,'#442910'],[1,'#8a5429']]);c.fillRect(x,y,w,h);for(let r=0;r<7;r++)for(let k=0;k<7;k++){c.fillStyle=(r+k)%2?'#c1915030':'#fbd39318';A.rr(c,x+k*L.cell+1,y+r*L.cell+1,L.cell-2,L.cell-2,5);c.fill();}c.strokeStyle='#29150988';c.lineWidth=1;for(let i=0;i<=7;i++){c.beginPath();c.moveTo(x+i*L.cell,y);c.lineTo(x+i*L.cell,y+h);c.moveTo(x,y+i*L.cell);c.lineTo(x+w,y+i*L.cell);c.stroke();}c.restore();}
function drawTitle(now){const c=ctx;IM.cover(c,IM.get('bg-map'),W,H);c.fillStyle=A.lg(c,0,0,0,H,[[0,'rgba(12,9,5,.45)'],[.4,'rgba(12,9,5,.05)'],[1,'rgba(12,9,5,.7)']]);c.fillRect(0,0,W,H);const sz=Math.min(W*.52,H*.32),bob=Math.sin(now/850)*3;IM.contain(c,IM.get('hustler-idle'),W*.63-sz/2,H*.37+bob,sz,sz*1.2);{const sw=Math.min(W*.47,200),sh=sw*.46,sx=W*.04,sy=H*.565;c.save();c.translate(sx+sw/2,sy+sh/2);c.rotate(-.035);c.translate(-(sx+sw/2),-(sy+sh/2));c.fillStyle='#5b3a1e';c.fillRect(sx+sw*.2-3,sy+sh,6,H*.1);c.fillRect(sx+sw*.8-3,sy+sh,6,H*.1);A.woodSign(c,sx,sy,sw,sh,["You can't hit a home run",'unless you swing the bat.'],Math.round(sw*.068));c.restore();}label(c,'THE NEXT FIND IS YOURS.',W/2,H*.755,Math.min(18,W*.045),'#fbe1a6');drawDust(now,.25);}

/* flip table */
function coverRect(im){const aw=im?im.naturalWidth:720,ah=im?im.naturalHeight:1280,sc=Math.max(W/aw,H/ah);return {x:(W-aw*sc)/2,y:(H-ah*sc)/2,w:aw*sc,h:ah*sc};}
function confetti(x,y,n,spd){const now=performance.now(),cols=['#ffd23f','#ff6a3d','#3fc1ff','#7ee36b','#ff8bd0','#fff2b0'];for(let i=0;i<n;i++){const a=rnd()*TAU,v=(spd||.45)*(.4+rnd());S.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-.25,rot:rnd()*TAU,vr:(rnd()-.5)*.03,life:700+rnd()*600,t0:now,col:cols[i%cols.length],size:5+rnd()*6,shape:i%3===0?'coin':i%3===1?'star':'shard'});}}
function flipLayout(){const F=S.flip,bgi=IM.get('bg-flea'),R=coverRect(bgi);
  // the hustler stands behind the back table, fully inside the frame; finds go on the empty front table
  const him=IM.get('hustler-idle'),ar=him?him.naturalWidth/him.naturalHeight:.6,hh=Math.min(R.h*.47,H*.47),hw=hh*.86,dw=hh*ar,hc=Math.min(R.x+R.w*.78,W-dw/2-6),hx=hc-hw/2,hy=R.y+R.h*.31;
  const list=F.items.filter(it=>it.key!=='cart');const show=list.length?list.slice(0,4):[F.items[0]];const n=show.length;
  const fy=R.y+R.h*.74,cx=Math.min(W*.34,hc-dw*.55),span=Math.min(W*.66,(hc-dw*.2)*.98),sz=n===1?Math.min(W*.42,H*.24):Math.min(span/n*1.1,H*.17);
  return {R,hh,hw,hx,hy,show,n,fy,cx,span,sz};}
function drawFlip(now){const F=S.flip,c=ctx;const bgi=IM.get('bg-flea');IM.cover(c,bgi,W,H);const el=now-F.t0;const Q=flipLayout(),R=Q.R;
  const sold=!!F.sold;{const hy=Q.hy+(sold?-Math.abs(Math.sin((now-F.soldT)/180))*8:Math.sin(now/900)*2);c.save();c.beginPath();c.rect(0,0,W,R.y+R.h*.655);c.clip();if(sold){c.translate(Q.hx+Q.hw/2,0);c.scale(-1,1);c.translate(-(Q.hx+Q.hw/2),0);}IM.contain(c,IM.get(sold?'hustler-cheer':'hustler-idle'),Q.hx,hy,Q.hw,Q.hh);c.restore();}
  const {show,n,fy,cx,span,sz}=Q;
  show.forEach((it,i)=>{const ix=cx+(i-(n-1)/2)*(n>1?span/n:0),t=el-i*160;if(t<0)return;const bounce=1+Math.sin(Math.min(1,t/600)*Math.PI)*.14;const big=i===0&&n>1?1.12:1;
    if(t<60&&!F.sfx['in'+i]){F.sfx['in'+i]=1;confetti(ix,fy-sz*.5,10,.25);}
    const fk=F.sold?Math.min(1,Math.max(0,(now-F.soldT-150)/550)):0;if(fk>=1)return;
    c.save();if(!fk){c.fillStyle='rgba(0,0,0,.28)';c.beginPath();c.ellipse(ix,fy+sz*.02,sz*.42,sz*.08,0,0,TAU);c.fill();}c.globalAlpha=1-fk*fk;c.translate(ix+(W/2-ix)*fk*fk,fy+(H*.3+sz*.4-fy)*fk*fk-Math.sin(fk*Math.PI)*H*.08);c.scale(bounce*big*(1-fk*.7),bounce*big*(1-fk*.7));c.shadowColor='#0009';c.shadowBlur=18;c.shadowOffsetY=8;if(it.key==='cart'){IM.contain(c,IM.get('box'),-sz*.5,-sz*.6,sz*.6,sz*.6);IM.contain(c,IM.get('tote'),-sz*.05,-sz*.66,sz*.6,sz*.66);}else IM.contain(c,IM.get(it.key),-sz/2,-sz*.95,sz,sz*1.0);c.restore();
    if(!F.sold){const nm=(it.name||'').toUpperCase();label(c,nm,ix,fy+sz*.16,Math.max(9,Math.min(n===1?22:15,W*(n===1?.055:.036),(n>1?span/n:W*.5)/(nm.length*.62))),'#fff2d0');}});
  if(!F.done&&el>700){F.done=true;const h=$('haul');h.innerHTML=F.items.map(it=>'<div class="line"><span>'+it.name+'</span><span>'+money(it.price)+'</span></div>').join('')+'<div class="line"><span>Haul total</span><span>'+money(F.total)+'</span></div>'+nextBuildHTML();$('bFlipNext').textContent='Flip +'+money(F.total);$('bFlipNext').classList.remove('hidden');}
  $('flipBank').textContent=money(F.sold?Math.round(F.bank0+(save.bank-F.bank0)*Math.min(1,(now-F.soldT)/900)):F.bank0);
  if(F.sold){const k=Math.min(1,(now-F.soldT)/350);c.save();c.translate(W/2,H*.43);c.rotate(-.22);c.scale(1.8-.8*k,1.8-.8*k);c.globalAlpha=k;c.fillStyle='#fff3dccc';A.rr(c,-58,-24,116,48,5);c.fill();c.strokeStyle='#ba2915';c.lineWidth=5;c.stroke();label(c,'SOLD',0,1,32,'#ba2915');c.restore();
    const pk=Math.min(1,(now-F.soldT)/420),ps=pk<1?.5+pk*.7:1.2-.08*Math.sin((now-F.soldT)/160);c.save();c.translate(W/2,H*.3);c.scale(ps,ps);label(c,'+'+money(F.total),0,0,50,'#ffdd72');c.restore();
    if(!F.sfx.cash){F.sfx.cash=true;shake(6);confetti(cx,fy-sz*.6,46,.55);confetti(W/2,H*.3,30,.4);for(let i=0;i<18;i++)S.parts.push({x:rnd()*W,y:-20-rnd()*120,vx:(rnd()-.5)*.05,vy:.12+rnd()*.15,rot:0,vr:0,life:1500+rnd()*700,t0:performance.now()+rnd()*300,col:'#ffcf3a',size:8+rnd()*5,shape:'coin'});}
    if(now-F.soldT>500&&!F.sfx.c2){F.sfx.c2=1;confetti(W*.25,H*.4,16,.35);confetti(W*.75,H*.4,16,.35);}}
}

/* ladder board */
let CAM=0;const LAD={top:0,bot:0};
function catmull(p0,p1,p2,p3,t){const t2=t*t,t3=t2*t;return .5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t2+(-p0+3*p1-3*p2+p3)*t3);}
function pathPt(u){const i=Math.max(0,Math.min(5,Math.floor(u))),t=u-i;const gx=k=>PAD_X[Math.max(0,Math.min(6,k))],gd=k=>{if(k<0)return -1.4;if(k>6)return PAD_D[6]+1.4;return PAD_D[k];};
  return {x:catmull(gx(i-1),gx(i),gx(i+1),gx(i+2),t),d:catmull(gd(i-1),gd(i),gd(i+1),gd(i+2),t)};}
function proj(x,d){const rel=d-CAM;const z=Math.max(.45,1+rel*.3);const y0=LAD.bot,yt=LAD.top;const K=(y0-yt)/(1-1/2.5);const hy=y0-K;return {x:W/2+x*W*.62/z,y:hy+K/z,s:1/z,rel};}
function drawLadderGround(c){c.fillStyle=A.lg(c,0,0,0,H*.3,[[0,'#3d8ee0'],[1,'#bfe2ff']]);c.fillRect(0,0,W,H*.3);A.cloud(c,W*.15,H*.08,W*.1);A.cloud(c,W*.7,H*.05,W*.08);
  c.fillStyle='#6fb84a';c.beginPath();c.moveTo(0,H*.2);for(let x=0;x<=W;x+=10)c.lineTo(x,H*.17+Math.sin(x/W*6)*H*.02);c.lineTo(W,H);c.lineTo(0,H);c.fill();
  for(let i=0;i<14;i++){c.fillStyle=i%2?'rgba(255,255,255,.06)':'rgba(0,60,0,.05)';c.fillRect(0,H*.2+i*H*.06,W,H*.03);}
  const r=A.seeded(77);for(let i=0;i<46;i++){const x=r()*W,y=H*.22+r()*H*.78;const s=2+y/H*4;c.fillStyle=['#fff','#ffd23f','#ff7ab0'][i%3];c.beginPath();c.arc(x,y,s,0,TAU);c.fill();}
  [[.06,.32],[.94,.4],[.04,.62],[.96,.7],[.9,.24],[.1,.86]].forEach(p=>{const x=W*p[0],y=H*p[1],s=W*.07;A.line(c,[[x,y],[x,y+s*.9]],s*.28);A.line(c,[[x,y],[x,y+s*.9]],s*.16,'#8a5a2b');
    A.cel(c,cc=>{cc.beginPath();cc.arc(x,y-s*.2,s*.55,0,TAU);cc.arc(x+s*.35,y+s*.1,s*.4,0,TAU);cc.arc(x-s*.35,y+s*.1,s*.4,0,TAU);},'#4fae3a','#36852a',s,{lw:3});});}
function drawLadder(now){const c=ctx;const Ld=S.lad;
  const tasksEl=$('tasks'),btn=$('bLadNext');const panelTop=Math.min(tasksEl.classList.contains('hidden')?H:tasksEl.getBoundingClientRect().top,btn.getBoundingClientRect().top||H);
  LAD.top=H*.2;LAD.bot=Math.min(H*.8,panelTop-58);
  let pu=Ld.to,el=now-Ld.t0;
  if(Ld.phase==='hop'){const dur=800;if(el<0)pu=Ld.from;else if(el<dur){pu=Ld.from+(Ld.to-Ld.from)*el/dur;const seg=Math.floor(el/200);if(!Ld.sfx['h'+seg]){Ld.sfx['h'+seg]=1;SFX.hop();}}else{pu=Ld.to;Ld.phase='done';afterHop();}}
  const pp=pathPt(pu);CAM=Math.max(0,pp.d-.5);
  c.drawImage(bg('ladG',drawLadderGround),0,0,W,H);
  // path ribbon
  const N=120,left=[],right=[];const u0=Math.max(0,pu-1.2);
  for(let i=0;i<=N;i++){const u=u0+i/N*(6-u0);const p=pathPt(u),q=pathPt(Math.min(6,u+.01)),o=pathPt(Math.max(0,u-.01));let tx=q.x-o.x,td=(q.d-o.d)*.5;const len=Math.hypot(tx,td)||1;const nx=-td/len,nd=tx/len*2,w=.11;
    left.push(proj(p.x+nx*w,p.d+nd*w));right.push(proj(p.x-nx*w,p.d-nd*w));}
  const ribbon=(off,col,lw)=>{c.beginPath();left.forEach((p,i)=>i?c.lineTo(p.x,p.y+off*p.s):c.moveTo(p.x,p.y+off*p.s));for(let i=right.length-1;i>=0;i--)c.lineTo(right[i].x,right[i].y+off*right[i].s);c.closePath();c.fillStyle=col;c.fill();if(lw){c.lineWidth=lw;c.strokeStyle='#3a2210';c.stroke();}};
  c.save();c.beginPath();c.rect(0,H*.17,W,H);c.clip();ribbon(10,'#8a5a2b',3);ribbon(0,'#f2deb0',3);
  // stepping stones (nodes)
  const stones=[];for(let k=1;k<NODES_TO_YARD;k++)stones.push(k/NODES_TO_YARD);for(let i=1;i<6;i++)for(let k=1;k<4;k++)stones.push(i+k/4);
  stones.sort((a,b)=>b-a).forEach(u=>{const p=pathPt(u),q=proj(p.x,p.d);if(q.rel<-1.3||q.y<H*.18)return;const rw=W*.045*q.s,rh=rw*.45;const done=u<=pu+1e-6&&u<1.001;
    A.flat(c,cc=>{cc.beginPath();cc.ellipse(q.x,q.y+4*q.s,rw,rh,0,0,TAU);},'#8a4a14');A.flat(c,cc=>{cc.beginPath();cc.ellipse(q.x,q.y,rw,rh,0,0,TAU);},done?'#ff9a3c':'#fff1d0',2);});
  c.restore();
  // dioramas far -> near, pawn by depth
  const items=[];for(let i=0;i<7;i++)items.push({d:PAD_D[i],i});items.push({d:pp.d-.05,pawn:true});items.sort((a,b)=>b.d-a.d);
  const up=upFlags();
  items.forEach(it=>{
    if(it.pawn){const q=proj(pp.x,pp.d);const s=W*.2*q.s;const frac=(pu*NODES_TO_YARD)%1;const hop=Ld.phase==='hop'?Math.abs(Math.sin(frac*Math.PI))*W*.07*q.s:0;c.save();c.translate(q.x+W*.13*q.s,q.y+W*.02*q.s-hop);A.mascot(c,s);c.restore();return;}
    const i=it.i,q=proj(PAD_X[i],PAD_D[i]);if(q.rel<-1.6||q.y<H*.16)return;
    const a=Math.max(0,Math.min(1,(q.y-H*.16)/(H*.08)));const u=W*.34*q.s;
    const reached=i===0||(i===1&&save.rung>=1);const ghost=!reached;
    c.save();c.globalAlpha=a*(ghost?(i===1?.6:.4):1);c.translate(q.x,q.y);
    const building=S.build&&S.build.rung===i&&now-S.build.t0<1700;
    if(building){const k=(now-S.build.t0)/1700;c.save();c.beginPath();c.rect(-u,-u*1.6*Math.min(1,.3+k),u*2,u*2);c.clip();A.DIORAMAS[i](c,u,up);c.restore();
      c.strokeStyle='rgba(140,100,50,'+(1-k*.5)+')';c.lineWidth=3;for(let s2=-2;s2<=2;s2++){c.beginPath();c.moveTo(s2*u*.22,0);c.lineTo(s2*u*.22,-u*.9);c.stroke();}for(let s2=1;s2<4;s2++){c.beginPath();c.moveTo(-u*.5,-s2*u*.25);c.lineTo(u*.5,-s2*u*.25);c.stroke();}
      for(let w=0;w<3;w++){const wx=-u*.4+w*u*.4,wy=-u*.1-Math.abs(Math.sin(now/120+w))*u*.12;A.flat(c,cc=>{cc.beginPath();cc.arc(wx,wy-u*.12,u*.05,0,TAU);},'#ffcf3a',2);A.flat(c,cc=>A.rr(cc,wx-u*.04,wy-u*.08,u*.08,u*.12,u*.02),'#ff7a1a',2);}
      if(rnd()<.4)S.parts.push({x:q.x+(rnd()-.5)*u,y:q.y-rnd()*u*.3,vx:(rnd()-.5)*.05,vy:-.04-rnd()*.06,rot:0,vr:0,life:700,t0:now,col:'rgba(225,205,165,.85)',size:6+rnd()*6,shape:'dust'});
      if(!S.build.sfx.h){S.build.sfx.h=1;SFX.hammer();setTimeout(()=>SFX.hammer(),650);}}
    else A.DIORAMAS[i](c,u,up);
    c.restore();
    if(ghost&&a>0){c.save();c.globalAlpha=a;if(i===1){const txt=Math.max(0,NODES_TO_YARD-save.unit)+' units';c.font=Math.round(Math.max(12,16*q.s))+'px '+DISP;const tw=c.measureText(txt).width+16;A.flat(c,cc=>A.rr(cc,q.x-tw/2,q.y-u*.9,tw,22*Math.max(.8,q.s),9),'#ff7a1a',2);c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';c.fillText(txt,q.x,q.y-u*.9+11*Math.max(.8,q.s)+1);}
      else A.padlock(c,q.x+u*.42,q.y-u*.62,Math.max(18,u*.3),0);c.restore();}
    // label
    c.save();c.globalAlpha=a;const fs=Math.max(12,Math.round(19*Math.pow(q.s,.6)));c.font=fs+'px '+DISP;const txt=A.LADDER[i];const tw=c.measureText(txt).width+18;const ly=q.y+u*.3;
    A.flat(c,cc=>A.rr(cc,q.x-tw/2,ly-fs*.7,tw,fs*1.45,fs*.55),reached?'#fff8e6':'rgba(255,248,230,.75)',2.5);c.fillStyle=reached?'#e8691a':'#7a6a55';c.textAlign='center';c.textBaseline='middle';c.fillText(txt,q.x,ly+fs*.08);c.restore();});
  // build -> polaroid
  if(S.build){const el2=now-S.build.t0;if(el2>1700){if(!S.build.sfx.b){S.build.sfx.b=1;SFX.built();shake(3);const b=$('ladBuilt');b.textContent=BUILT_LINES[S.build.task.id]||'Built!';b.classList.remove('hidden');}
      const k=Math.min(1,(el2-1700)/300);const pw=Math.min(W*.7,260),ph=pw*1.05;c.save();c.translate(W/2,H*.44);c.rotate(-.05);c.scale(.6+.4*k,.6+.4*k);c.globalAlpha=k;
      A.flat(c,cc=>A.rr(cc,-pw/2,-ph/2,pw,ph,6),'#fffdf6',4);c.save();c.beginPath();c.rect(-pw/2+12,-ph/2+12,pw-24,pw-30);c.clip();c.fillStyle=A.lg(c,0,-ph/2,0,ph/2,[[0,'#bfe2ff'],[1,'#7ccf5a']]);c.fillRect(-pw/2,-ph/2,pw,ph);c.translate(0,-ph/2+pw*.62);A.DIORAMAS[S.build.rung](c,pw*.62,up);c.restore();
      c.fillStyle='#3a2210';c.font=Math.round(pw*.075)+'px '+DISP;c.textAlign='center';c.textBaseline='middle';c.fillText(A.LADDER[S.build.rung],0,ph/2-26);c.restore();
      if(el2>3400){S.build=null;$('bLadNext').classList.remove('hidden');renderTasks();$('ladSub').textContent='Bank '+money(save.bank);}}}
  drawFx(now);}

/* next yard */
function drawLocked(now){const c=ctx;IM.cover(c,IM.get('bg-desert'),W,H);c.fillStyle=A.lg(c,0,H*.7,0,H,[[0,'#0000'],[1,'#211105dd']]);c.fillRect(0,H*.7,W,H*.3);drawDust(now,.65);label(c,'NEW FINDS. BIGGER SECRETS.',W/2,H*.79,Math.min(18,W*.044),'#ffdc8b');}

let last=performance.now();

/* ---------------- Safe Cracking Bonus: earned, random, never sold ---------------- */
const SAFE_RARITY=()=>RH.rollSafe(rnd,{});
const SAFE_PAY=RH.SAFE_PAY;
const SAFE_COLOUR={common:'#d7dce2',rare:'#6de9da',legendary:'#ffcf44'};
// Bigger Safe Cracker: dials 1-2 snap, dial 3 crawls in, then the door swings all the way open on its hinge.
const SAFE_T={first:700,gap:800,last:1500,open:1500};
function startSafe(forced){const run=S.run;if(!run)return;if(run.safe&&run.safe.done)return;const rarity=forced||(run.safe&&run.safe.rarity)||SAFE_RARITY();if(!run.safe)run.safe={rarity,done:false};
  S.safe={rarity,t0:performance.now(),phase:'spin',stopped:0,target:rarity==='legendary'?[7,7,7]:rarity==='rare'?(()=>{const a=1+Math.floor(rnd()*9);return [a,a,(a+3)%10];})():[0,0,0].map(()=>Math.floor(rnd()*10)),pay:SAFE_PAY[rarity],done:false,lastClick:0,face:null};
  S.mode='safe';show('safeUI');$('bHome').classList.add('hidden');$('safeRarity').textContent=rarity.toUpperCase();$('safeRarity').style.color=SAFE_COLOUR[rarity];$('safePay').textContent='';$('safeFind').textContent='';$('bSafeNext').textContent='Cracking…';$('bSafeNext').disabled=true;SFX.special();music();}
function skipSafe(){if(!S.safe)return;S.safe.stopped=3;S.safe.phase='open';S.safe.openT=performance.now()-SAFE_T.open;}
function finishSafe(){if(!S.safe||S.safe.done||S.safe.phase!=='open')return;const sf=S.safe;sf.done=true;save.bank+=sf.pay;save.safeBank=(save.safeBank||0)+sf.pay;
  save.safeSeen=true;save.safeCommons=sf.rarity==='common'?(save.safeCommons||0)+1:0;if(S.run){if(!S.run.safe)S.run.safe={rarity:sf.rarity};S.run.safe.done=true;}
  if(S.run&&S.run.kind==='campaign'&&save.run)persistRun();else store();SFX.cashPop();S.safe=null;startFlip();}
function deducedSafeName(s){$('safeFind').textContent=s.rarity==='common'?'Vintage camera + cash':s.rarity==='rare'?'Sapphire set + cash':'Legendary treasure + cash';}
function safeRect(){const h=Math.min(H*.48,W*1.06,490),w=h*.8;return {x:W/2-w/2,y:H*.28,w,h};}
function stopTimes(){return [SAFE_T.first,SAFE_T.first+SAFE_T.gap,SAFE_T.first+SAFE_T.gap+SAFE_T.last];}
function drawDials(c,s,d,now){for(let i=0;i<3;i++){const x=[.261,.487,.71][i]*d.w,y=.452*d.h,r=d.w*.083;const spinning=i>=s.stopped&&s.phase==='spin';
    // dial 3 slows down near the end: suspense
    const el=now-s.t0,T=stopTimes()[2],slow=i===2&&spinning?Math.max(.08,Math.min(1,(T-el)/1200)):1,sp=75/slow;
    c.save();c.beginPath();c.ellipse(x,y,r,r*1.22,0,0,TAU);c.clip();c.fillStyle=A.lg(c,x-r,y,x+r,y,[[0,'#080707'],[.5,'#373129'],[1,'#080707']]);c.fillRect(x-r,y-r*1.5,r*2,r*3);
    const off=spinning?(now/sp+i*2)%1:0,n=spinning?Math.floor(now/sp+i*3)%10:s.target[i];for(let k=-1;k<=1;k++)label(c,String((n+k+10)%10),x,y+(k-off)*r*2.2+2,r*1.9,'#ffe2a0');
    c.fillStyle=A.lg(c,0,y-r*1.3,0,y+r*1.3,[[0,'#000c'],[.35,'#0000'],[.65,'#0000'],[1,'#000d']]);c.fillRect(x-r,y-r*1.4,r*2,r*2.8);c.restore();
    if(!spinning&&s.phase==='spin'){c.save();c.strokeStyle='#ffe28a';c.lineWidth=3;c.globalAlpha=.8;c.beginPath();c.ellipse(x,y,r*1.05,r*1.27,0,0,TAU);c.stroke();c.restore();}}}
function drawSafe(now){const s=S.safe,c=ctx;if(!s)return;IM.cover(c,IM.get('bg-safe'),W,H);const col=SAFE_COLOUR[s.rarity],d=safeRect(),elapsed=now-s.t0;
  const ts=stopTimes();const need=ts.filter(t=>elapsed>=t).length;while(s.stopped<need&&s.phase==='spin'){s.stopped++;SFX.dialStop();shake(s.stopped===3?7:3);}
  const slowNow=s.stopped===2&&s.phase==='spin';if(s.phase==='spin'&&s.stopped<3&&now-s.lastClick>(slowNow?Math.min(420,90+(elapsed-ts[1])/4):90)){SFX.dialClick();s.lastClick=now;}
  if(s.stopped>=3&&s.phase==='spin'&&elapsed>ts[2]+250){s.phase='open';s.openT=now;SFX.safeOpen();shake(12);setTimeout(()=>{SFX.cashPop();banner('SAFE CRACKED!',1300);},450);s.boom=now;}
  const op=s.phase==='open'?Math.min(1,(now-s.openT)/SAFE_T.open):0;
  const zi=1-Math.pow(1-Math.min(1,elapsed/600),3),zoomIn=s.phase==='spin'&&s.stopped===2?Math.min(.07,(elapsed-ts[1])/ (SAFE_T.last)*.07):s.phase==='open'?.07*(1-op):0;
  const sc=(.72+.28*zi)*(1+zoomIn);c.save();c.translate(W/2,d.y+d.h/2);c.scale(sc,sc);c.translate(-W/2,-(d.y+d.h/2));
  const im=IM.get('front-'+s.rarity),X0=.095,X1=.885,Y0=.085,Y1=.875,dx=d.x+X0*d.w,dy=d.y+Y0*d.h,dw=(X1-X0)*d.w,dh=(Y1-Y0)*d.h;
  if(op>0){c.fillStyle=A.rg(c,W/2,d.y+d.h*.5,0,W/2,d.y+d.h*.5,W*.75,[[0,col+'aa'],[.5,col+'33'],[1,col+'00']]);c.fillRect(0,H*.1,W,H*.8);c.save();c.translate(W/2,d.y+d.h*.5);c.rotate(now/3000);for(let i=0;i<14;i++){c.rotate(TAU/14);c.fillStyle=col+'2a';A.poly(c,[[0,0],[W*.9,-W*.07],[W*.9,W*.07]]);c.fill();}c.restore();}
  if(im)c.drawImage(im,d.x,d.y,d.w,d.h);
  if(op>0){c.fillStyle=A.rg(c,dx+dw/2,dy+dh*.55,0,dx+dw/2,dy+dh*.55,dw*.75,[[0,'#3b2a14'],[1,'#070504']]);c.fillRect(dx,dy,dw,dh);c.fillStyle=A.rg(c,dx+dw/2,dy+dh*.62,0,dx+dw/2,dy+dh*.62,dw*.55,[[0,col+'cc'],[1,col+'00']]);c.fillRect(dx,dy,dw,dh);
    const pop=Math.min(1,Math.max(0,(op-.3)/.45)),ps=.55+.5*pop+Math.sin(Math.min(1,pop)*Math.PI)*.18,rise=-(1-pop)*dh*.08;c.save();c.translate(dx+dw/2,dy+dh*.55+rise);c.scale(ps,ps);IM.contain(c,IM.get(s.rarity==='common'?'camera':s.rarity==='rare'?'jewelry':'treasure'),-dw*.36,-dh*.3,dw*.72,dh*.52);c.restore();
    for(let i=0;i<7;i++){const cx=dx+dw*(.18+i*.11),cy=dy+dh*.86-Math.abs(Math.sin(i*1.7))*dh*.04;c.fillStyle=A.lg(c,0,cy-6,0,cy+6,[[0,'#fff2a0'],[1,'#c58408']]);c.beginPath();c.ellipse(cx,cy,dw*.055,dw*.022,0,0,TAU);c.fill();c.strokeStyle='#7a4a06';c.lineWidth=1;c.stroke();}}
  // door face (front art + dials) rendered once per frame into its own canvas, then swung on the left hinge in perspective
  const pw=Math.max(2,Math.round(dw*DPR)),ph=Math.max(2,Math.round(dh*DPR));if(!s.face||s.face.width!==pw||s.face.height!==ph){s.face=document.createElement('canvas');s.face.width=pw;s.face.height=ph;}
  if(s.phase==='spin'||!s.faceDone){const fx=s.face.getContext('2d');fx.setTransform(DPR,0,0,DPR,0,0);fx.clearRect(0,0,dw,dh);fx.translate(d.x-dx,d.y-dy);if(im)fx.drawImage(im,d.x-d.x,0,d.w,d.h);drawDials(fx,s,d,now);if(s.phase==='open')s.faceDone=true;}
  const ease=op<1?1-Math.pow(1-op,3)*(1+2.2*op*(1-op)):1,ang=ease*Math.PI*.7;// up to ~126 degrees: the door ends wide open, its steel back showing
  const N=48,F=dw*2.4;for(let k=0;k<N;k++){const u0=k/N,u1=(k+1)/N,x0=dx+u0*dw*Math.cos(ang),x1=dx+u1*dw*Math.cos(ang),z=(u0+u1)/2*dw*Math.sin(ang),pz=F/(F-z),hh=dh*pz;
    const back=Math.cos(ang)<0,lx=Math.min(x0,x1),sw=Math.abs(x1-x0)+.8;if(sw<.3)continue;const sy=dy+dh/2-hh/2;
    if(back){const g=48+Math.round(55*(1-u0));c.fillStyle='rgb('+g+','+(g+6)+','+(g+4)+')';c.fillRect(lx,sy,sw,hh);if(k===2||k===N-3){c.fillStyle='#1a1a1a';c.fillRect(lx,sy+hh*.04,sw,hh*.92);}
      if(k%6===3){for(let j=0;j<4;j++){c.fillStyle='#d8b25a';c.beginPath();c.arc(lx+sw/2,sy+hh*(.2+j*.2),Math.max(1.5,sw*.9),0,TAU);c.fill();}}}
    else{c.drawImage(s.face,Math.floor(u0*pw),0,Math.ceil(pw/N)+1,ph,lx,sy,sw,hh);if(op>0){c.fillStyle='rgba(0,0,0,'+(Math.sin(ang)*.45*u0)+')';c.fillRect(lx,sy,sw,hh);}}}
  if(op>0&&op<1){c.fillStyle='#0008';c.fillRect(dx-4,dy,6,dh);}
  c.restore();
  if(s.boom){const k=(now-s.boom)/500;if(k<1){c.fillStyle='rgba(255,250,220,'+(.75*(1-k))+')';c.fillRect(0,0,W,H);}
    if(!s.coins){s.coins=[];const n=s.rarity==='legendary'?70:s.rarity==='rare'?45:28;for(let i=0;i<n;i++){const a=-Math.PI/2+(rnd()-.5)*2.4,v=4+rnd()*7;s.coins.push({x:W/2,y:d.y+d.h*.55,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r:5+rnd()*5,t:rnd()*6});}}
    s.coins.forEach(q=>{q.x+=q.vx;q.y+=q.vy;q.vy+=.28;q.t+=.2;if(q.y<H+20){c.save();c.translate(q.x,q.y);c.scale(Math.abs(Math.cos(q.t)),1);c.fillStyle=A.lg(c,0,-q.r,0,q.r,[[0,'#fff2a0'],[1,'#c58408']]);c.beginPath();c.arc(0,0,q.r,0,TAU);c.fill();c.restore();}});}
  if(s.phase==='open'&&op>.8){$('safePay').textContent='+'+money(s.pay);deducedSafeName(s);$('bSafeNext').textContent='Collect & Flip';$('bSafeNext').disabled=false;for(let i=0;i<8;i++){const a=i*TAU/8+now/1300,x=W/2+Math.cos(a)*W*.36,y=d.y+d.h*.5+Math.sin(a)*H*.21;A.star(c,x,y,3+Math.sin(now/200+i)*2,col,4,.22);}}
  drawDust(now,.3);
}
/* ---------------- Mystery Box: earned by a big chain or a Gavel, opens after the room. Odds shown, never sold ---------------- */
const BOX_COL={common:'#d9c7a0',rare:'#6de9da',gold:'#ffcf44'};
const BOOST_NAME={cut:'Bolt Cutters',flash:'Flashlight',free:'Free Swap'};
function startBox(next){const r=S.run;if(!r||!r.box||r.box.opened){next&&next();return;}S.box={b:r.box,t0:performance.now(),next,stopped:0,done:false};S.mode='box';show('boxUI');$('bHome').classList.add('hidden');
  $('boxTier').textContent='';$('boxPay').textContent='';$('bBoxNext').textContent='Opening…';$('bBoxNext').disabled=true;SFX.special();music();}
const BOX_T=[1500,2100,2800];
function skipBox(){if(S.box)S.box.t0=performance.now()-BOX_T[2]-400;}
function finishBox(){const X=S.box;if(!X||X.done||X.stopped<3)return;X.done=true;const b=X.b,r=S.run;b.opened=true;save.bank+=b.cash;if(b.booster)save.boosters[b.booster]=(save.boosters[b.booster]||0)+1;
  if(b.meter&&r)r.meter=Math.min(RH.METER-1,r.meter+b.meter);if(r&&r.kind==='campaign')persistRun();else store();SFX.cashPop();
  toast('+'+money(b.cash)+' banked'+(b.booster?' · +1 '+BOOST_NAME[b.booster]:'')+(b.meter?' · Rush Meter +'+b.meter+'%':''),2000);const nx=X.next;S.box=null;nx&&nx();}
function drawBox(now){const X=S.box,c=ctx;if(!X)return;IM.cover(c,IM.get('bg-safe'),W,H);c.fillStyle='rgba(20,10,4,.35)';c.fillRect(0,0,W,H);const b=X.b,col=BOX_COL[b.tier],el=now-X.t0;
  const need=BOX_T.filter(t=>el>=t).length;while(X.stopped<need){X.stopped++;SFX.dialStop();shake(X.stopped===3?8:3);if(X.stopped===3){SFX.reveal();banner(RH.BOX[b.tier].label.toUpperCase()+' BOX!',1300);$('boxTier').textContent=RH.BOX[b.tier].label.toUpperCase();$('boxTier').style.color=col;}}
  if(X.stopped<3&&now-(X.click||0)>110){SFX.dialClick();X.click=now;}
  const bw=Math.min(W*.56,300),cx=W/2,cy=H*.36;const open=Math.min(1,Math.max(0,(el-700)/500));
  if(open>0){c.save();c.translate(cx,cy);c.rotate(now/2600);for(let i=0;i<12;i++){c.rotate(TAU/12);c.fillStyle=col+'26';A.poly(c,[[0,0],[W*.8,-W*.06],[W*.8,W*.06]]);c.fill();}c.restore();
    c.fillStyle=A.rg(c,cx,cy,0,cx,cy,bw,[[0,col+'aa'],[1,col+'00']]);c.fillRect(0,cy-bw,W,bw*2);}
  const jig=el<700?Math.sin(el/35)*6*(el/700):0;c.save();c.translate(cx+jig,cy+bw*.15);c.scale(1+open*.06,1+open*.06);IM.contain(c,IM.get('box'),-bw/2,-bw/2,bw,bw);c.restore();
  if(open>0){const lid=open;c.save();c.translate(cx-bw*.1-lid*bw*.6,cy-bw*.35-lid*bw*.45);c.rotate(-lid*1.1);c.fillStyle='#8a5a2a';A.rr(c,-bw*.45,-bw*.06,bw*.9,bw*.12,6);c.fill();c.strokeStyle='#4a2a10';c.lineWidth=3;c.stroke();c.restore();}
  // three reel panels: ITEM / VALUE / BONUS
  const pw=Math.min(W*.27,150),ph=pw*1.05,py=cy+bw*.62,gap=pw*.1,x0=cx-pw*1.5-gap;const items=['guitar','camera','jewelry','treasure'],tiers=['common','rare','gold'];
  for(let i=0;i<3;i++){const x=x0+i*(pw+gap),stopped=i<X.stopped;c.save();c.fillStyle='#fff6df';c.strokeStyle=stopped?col:'#3a2316';c.lineWidth=stopped?5:3;A.rr(c,x,py,pw,ph,12);c.fill();c.stroke();c.beginPath();A.rr(c,x+3,py+3,pw-6,ph-6,10);c.clip();
    const spin=Math.floor(now/80);
    if(i===0){const k=stopped?b.item:items[(spin+i)%4];IM.contain(c,IM.get(k),x+pw*.12,py+ph*.08,pw*.76,ph*.62);label(c,'ITEM',x+pw/2,py+ph*.86,Math.round(pw*.15),'#7a4a20');}
    if(i===1){const t=stopped?b.tier:tiers[spin%3];label(c,stopped?money(b.cash):RH.BOX[t].label.toUpperCase(),x+pw/2,py+ph*.42,Math.round(pw*(stopped?.24:.17)),stopped?'#c97a00':BOX_COL[t]==='#d9c7a0'?'#8a6a45':BOX_COL[t]);label(c,'CASH',x+pw/2,py+ph*.86,Math.round(pw*.15),'#7a4a20');}
    if(i===2){const opts=['ic-cut','ic-flash','ic-free','meter'];const k=stopped?(b.booster?'ic-'+b.booster:'meter'):opts[(spin+2)%4];
      if(k==='meter'){c.fillStyle='#3a2316';A.rr(c,x+pw*.14,py+ph*.32,pw*.72,ph*.16,8);c.fill();c.fillStyle='#ffb52e';A.rr(c,x+pw*.14,py+ph*.32,pw*.72*(stopped?.5:.5+.5*Math.sin(now/120)),ph*.16,8);c.fill();label(c,'+50%',x+pw/2,py+ph*.62,Math.round(pw*.17),'#c95a00');}
      else IM.contain(c,IM.get(k),x+pw*.16,py+ph*.08,pw*.68,ph*.62);
      label(c,stopped&&b.booster&&b.meter?'BOTH!':'BONUS',x+pw/2,py+ph*.86,Math.round(pw*.15),'#7a4a20');}
    if(!stopped){c.fillStyle=A.lg(c,0,py,0,py+ph,[[0,'#0006'],[.3,'#0000'],[.7,'#0000'],[1,'#0006']]);c.fillRect(x,py,pw,ph);}
    c.restore();}
  if(X.stopped>=3){$('boxPay').textContent='+'+money(b.cash);$('bBoxNext').textContent='Collect';$('bBoxNext').disabled=false;
    for(let i=0;i<10;i++){const a=i*TAU/10+now/1100,x=cx+Math.cos(a)*W*.36,y=cy+Math.sin(a)*H*.16;A.star(c,x,y,3+Math.sin(now/180+i)*2,col,4,.22);}}
  drawDust(now,.3);}
/* ---------------- visible empire / truck upgrade ---------------- */
function startTruck(){const from=truckLv();save.truckSeen=true;save.truckLevel=truckLv();store();S.mode='truck';S.truck={t0:performance.now(),returnTo:'map',from,to:truckLv(),kind:'truck'};show('truckUI');$('bHome').classList.add('hidden');$('truckTitle').textContent='Pickup Level '+from+' → '+S.truck.to;$('truckSub').textContent='Fresh paint · Three flips. Your first big step.';$('bTruckNext').classList.add('hidden');SFX.built();music();}
function finishTruck(){if(!S.truck)return;const ret=S.truck.returnTo;S.truck=null;S.build=null;if(ret==='empire')goEmpire();else goMap(S.flip&&S.flip.hopFrom);}
function drawTruck(now){const c=ctx,t=S.truck;if(!t)return;IM.cover(c,IM.get('bg-truck'),W,H);const el=now-t.t0,k=Math.max(0,Math.min(1,(el-1000)/900)),w=Math.min(W*.98,720),y=H*.42;label(c,k<.5?(t.kind==='yard'?'BEFORE':'BEFORE · LEVEL '+t.from):(t.kind==='yard'?'AFTER':'AFTER · LEVEL '+t.to),W/2,y-8,22,k<.5?'#f4d3a0':'#ffda68');const im0=t.kind==='yard'?IM.get('lm-'+t.lm+'-b'):truckImg(t.from),im1=t.kind==='yard'?IM.get('lm-'+t.lm):truckImg(t.to);if(t.kind!=='yard')label(c,TRUCK_NAMES[k<.5?t.from:t.to],W/2,y+w*.68,22,'#ffe08a');
  c.save();c.globalAlpha=1-k;IM.contain(c,im0,W/2-w/2,y,w,w*.67);c.restore();c.save();c.globalAlpha=k;const z=1+Math.sin(k*Math.PI)*.05;c.translate(W/2,y+w*.34);c.scale(z,z);IM.contain(c,im1,-w/2,-w*.34,w,w*.67);c.restore();
  if(el>1000&&el<2100){const x=W*.1+W*.8*k;c.fillStyle=A.lg(c,x-25,0,x+25,0,[[0,'#ffec9a00'],[.5,'#fffad7bb'],[1,'#ffec9a00']]);c.fillRect(x-25,y-10,50,w*.7);}
  if(k>.9){IM.contain(c,IM.get('hustler-cheer'),W*.7,H*.66,W*.22,H*.23);for(let i=0;i<9;i++){const x=W*(.15+(i*37%70)/100),yy=H*.4+Math.sin(now/550+i)*H*.13;A.star(c,x,yy,3+Math.sin(now/190+i)*2,'#ffe29c',4,.22);}if(!t.celebrated){t.celebrated=true;SFX.built();}$('bTruckNext').classList.remove('hidden');}
}
function drawEmpire(now){const c=ctx;IM.cover(c,IM.get('bg-truck'),W,H);const w=Math.min(W*.9,650);IM.contain(c,truckImg(truckLv()),W/2-w/2,H*.29,w,w*.65);if(save.rung){const bx=W*.15,by=H*.3;label(c,'FIRST YARD',W/2,by-16,22,'#ffda83');}IM.contain(c,IM.get('hustler-idle'),W*.72,H*.44,W*.2,H*.22);}
/* ---------------- animated world map, live numbered path ---------------- */
function drawDust(now,alpha=1){const c=ctx;for(let i=0;i<22;i++){const x=((i*79+Math.sin(now/3500+i)*14)%W+W)%W,y=(i*113-now*.008)%H;c.fillStyle='rgba(255,225,158,'+alpha*(.12+Math.sin(now/1000+i)*.1)+')';c.beginPath();c.arc(x,y<0?y+H:y,1+i%2,0,TAU);c.fill();}}
/* ---------------- Sunnyvale scrolling world map ---------------- */
const LANDMARKS=[{id:'flea',n:2,unlock:1,name:'Flea Market Stall',cost:RH.STALL_COST,w:1},{id:'truck',n:3,name:'The Pickup',cost:0,w:1.5},{id:'office',n:5,name:'Office',cost:5500},{id:'units',n:7,name:'Unit Row',cost:8000},
  {id:'sign',n:9,name:'Sunnyvale Sign',cost:8500},{id:'thrift',n:11,name:'Thrift Shop',cost:9500},{id:'garage',n:13,name:'Garage',cost:10500},{id:'pawn',n:15,name:'Pirate Pawn',cost:12000},{id:'warehouse',n:17,name:'Warehouse',cost:15500}];
function lmBuilt(l){return l.id==='truck'?!!(save.truckSeen||save.tasks.length):(save.built||[]).includes(l.id);}
function lmWt(l){return l.w||2;}
function lmAt(l){return l.unlock||l.n;}
function builtPct(){const tot=LANDMARKS.reduce((a,l)=>a+lmWt(l),0);return Math.round(LANDMARKS.filter(lmBuilt).reduce((a,l)=>a+lmWt(l),0)/tot*100);}
function nextLm(){return LANDMARKS.find(l=>!lmBuilt(l)&&l.id!=='truck'&&save.unit>=lmAt(l))||null;}
function MG(){const sp=W*.27,top=W*380/720,base=W*.46;return {sp,top,base,h:base+19*sp+top+W*.16};}
function stopW(i){const g=MG();const k=Math.max(0,Math.min(19,i)),f=Math.floor(k),t=k-f;const P=j=>({x:W*(.5+.17*Math.sin(j*1.1+.3)),y:g.h-g.base-j*g.sp});const a=P(f),b=P(Math.min(19,f+1));return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};}
// hand-checked spots (W units) so no landmark touches a stop, a tag, another landmark, the hustler or the Unit button (test/layout-check)
const LMPOS={flea:[.21,.08,.42],truck:[.81,-.2,.34],office:[.81,0,.34],units:[.21,.04,.42],sign:[.21,.12,.38],thrift:[.81,.04,.38],garage:[.21,.08,.42],pawn:[.78,-.04,.38],warehouse:[.81,.04,.34]};
function lmW(l){const p=stopW(l.n-1),q=LMPOS[l.id]||[p.x>W*.5?.21:.79,-.01,.42];return {x:W*q[0],y:p.y+W*q[1],s:W*q[2],left:q[0]<.5};}
function lmRects(){const R=[];LANDMARKS.forEach(l=>{const q=lmW(l),s2=q.s*(l.id==='truck'?1.05:1);let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;['lm-'+l.id,'lm-'+l.id+'-b'].forEach(k=>{const im=IM.get(k),iw=im?im.naturalWidth:340,ih=im?im.naturalHeight:300,kk=Math.min(s2/iw,.85*s2/ih),dw=iw*kk,dh=ih*kk,bx=q.x-dw/2,by=q.y-.85*s2+(.85*s2-dh)/2;x0=Math.min(x0,bx);y0=Math.min(y0,by);x1=Math.max(x1,bx+dw);y1=Math.max(y1,by+dh);});R.push([x0,y0,x1,y1]);
  const names=[l.name,l.cost?'BUILD '+money(l.cost):l.name,'Unit '+l.n],tw=(Math.max(...names.map(t=>t.length))*W*.032*.62+W*.07)*1.06,th=W*.058*1.06,ty=q.y+q.s*.1;R.push([q.x-tw/2,ty-th/2,q.x+tw/2,ty+th/2]);});return R;}
function stopRects(){const a=[];for(let j=0;j<20;j++){const q=stopW(j),w=W*(j===19?.17:.135),h=w*.56;a.push([q.x-w/2,q.y-h/2-W*.03,q.x+w/2+W*.02,q.y+h/2]);}return a;}
function rOv(a,b,pad){pad=pad==null?W*.008:pad;return a[0]<b[2]+pad&&b[0]<a[2]+pad&&a[1]<b[3]+pad&&b[1]<a[3]+pad;}
const slotCache=new Map();
function stopSlot(i,bw,bh){const key=[W,i,bw,bh,IM.mapReady()].join(':');if(slotCache.has(key))return slotCache.get(key);const p=stopW(i),hs=W*.2,R=lmRects(),SR2=stopRects();let best=null;
  [-1,1].forEach(side=>{const cx=p.x+side*hs*.42,hb=[cx-hs*.33,p.y-hs*1.05,cx+hs*.33,p.y+hs*.03];if(hb[0]<0||hb[2]>W)return;const hbad=R.filter(r=>rOv(hb,r)).length;
    const rx=Math.max(hb[2],p.x+W*.075)+W*.01,lx=Math.min(hb[0],p.x-W*.075)-W*.01-bw,C=[];
    [0,-.6,.6,-1.1,1.1].forEach(dy=>{C.push([rx,p.y-bh/2+dy*bh]);C.push([lx,p.y-bh/2+dy*bh]);});
    [0,-.5,.5].forEach(dx=>{C.push([p.x-bw/2+dx*bw,p.y+W*.06]);C.push([p.x-bw/2+dx*bw,p.y-W*.09-bh]);C.push([p.x-bw/2+dx*bw,p.y+W*.06+bh*.7]);});
    C.forEach((c,k)=>{const bx=Math.max(8,Math.min(W-bw-8,c[0])),bb=[bx,c[1],bx+bw,c[1]+bh];
      const bad=hbad*10+R.filter(r=>rOv(bb,r)).length*10+(rOv(bb,hb)?6:0)+SR2.filter(r=>rOv(bb,r,W*.006)).length*10+(side<0?0:.1)+k*.02;if(!best||bad<best.bad)best={bad,side,bx,by:c[1]};});});
  const ans=best||{side:-1,bx:p.x+W*.08,by:p.y-bh/2};slotCache.set(key,ans);return ans;}
function camClamp(y){return Math.max(0,Math.min(MG().h-H,y));}
function camTarget(wy){return camClamp(wy-H*.52);}
function mapXY(idx){const p=stopW(idx);return {x:p.x,y:p.y-(S.cam?S.cam.y:0),sc:W/390};}
function mapTap(x,y){const cy=S.cam.y;const cur=Math.min(save.unit,19),p=stopW(cur);
  if(Math.hypot(x-p.x,y-(p.y-cy))<W*.1){startCampaign();return;}
  for(const l of LANDMARKS){const q=lmW(l);if(Math.abs(x-q.x)<q.s*.45&&Math.abs(y-(q.y-cy)+q.s*.25)<q.s*.45){if(nextLm()===l)buildLm(l);else toast(lmBuilt(l)?l.name+' is built!':save.unit<lmAt(l)?'Clear Unit '+lmAt(l)+' to fix the '+l.name:l.id==='truck'?'Flip 3 units to fix The Pickup':'Build the '+nextLm().name+' first',1400);return;}}}
function buildLm(l){if(S.lmb||!l||lmBuilt(l))return;if(save.bank<l.cost){toast('Need '+money(l.cost-save.bank)+' more. Flip finds!',1600);S.cam.free=false;S.cam.focus=lmW(l).y;return;}
  SFX.till();save.bank-=l.cost;save.built=(save.built||[]).concat(l.id);store();$('bBuild').classList.remove('nudge');if(l.id==='flea')setTimeout(()=>toast('Stall open! '+money(save.bank)+' left',2600),1500);S.lmb={id:l.id,t0:performance.now(),sfx:{}};S.cam.free=false;S.cam.focus=lmW(l).y;$('mapBank').textContent=money(save.bank);updBuildUI();}
function updBuildUI(){const pc=builtPct();$('builtTxt').textContent='Sunnyvale '+pc+'% built';$('builtFill').style.width=pc+'%';const l=nextLm(),b=$('bBuild');
  if(!l||S.lmb){b.classList.add('hidden');return;}b.classList.remove('hidden');b.dataset.lm=l.id;const can=save.bank>=l.cost;b.classList.toggle('poor',!can);b.innerHTML='<small>'+(can?'Build':'Fix up')+'</small>'+l.name+' · '+(l.cost?money(l.cost):'FREE');}
let terrainFlip=null;
function uiZones(){const cr=cv.getBoundingClientRect(),z=[];['#ladderUI .maphead','#ladderUI .coin','#bEmpire','#bGlove','#bHome','#bSound'].forEach(q=>{const e=document.querySelector(q);if(!e||e.classList.contains('hidden')||!e.offsetParent)return;const r=e.getBoundingClientRect();z.push([r.left-cr.left-4,r.top-cr.top-4,r.right-cr.left+4,r.bottom-cr.top+4]);});return z;}
function drawMap(now){const c=ctx,g=MG();S.zones=uiZones();if(!S.cam)S.cam={y:camTarget(stopW(Math.min(save.unit,19)).y),free:false};
  const m=S.map||{from:save.unit,to:save.unit,walking:false,t0:now};
  let u=Math.min(19,m.to),walk=0;if(m.walking){walk=Math.max(0,Math.min(1,(now-m.t0-250)/1100));u=Math.min(19,m.from+(Math.min(19,m.to)-m.from)*walk);}
  const tok=stopW(u);
  if(!S.cam.free){const tgt=S.cam.focus!=null?camClamp(S.cam.focus-H*.5):camTarget(tok.y);S.cam.y+=(tgt-S.cam.y)*.09;}
  const cy=S.cam.y;
  // terrain tiles (mirrored so seams match) + desert top with the Desert Gold gate
  const ti=IM.get('bg-terrain');if(ti){const th=W*ti.naturalHeight/ti.naturalWidth;if(!terrainFlip){const [fc,fx]=off(W,th);fx.translate(0,th);fx.scale(1,-1);fx.drawImage(ti,0,0,W,th);terrainFlip=fc;}
    for(let k=Math.floor((cy-g.top*.6)/th)-1;k*th<cy+H;k++){const y=g.top*.6+k*th-cy;if(y+th<0)continue;c.drawImage(Math.abs(k)%2?terrainFlip:ti,0,y,W,th+1);}}
  else{c.fillStyle='#7b8a3a';c.fillRect(0,0,W,H);}
  const tp=IM.get('bg-maptop');if(tp)c.drawImage(tp,0,-cy,W,g.top*1.0);
  // the dirt path through all 20 stops
  c.save();c.translate(0,-cy);const pts=[{x:stopW(0).x,y:g.h+20}];for(let i=0;i<20;i++)pts.push(stopW(i));pts.push({x:W*.78,y:g.top*.7});
  const road=(lw,col)=>{c.beginPath();c.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length-1;i++){const mx=(pts[i].x+pts[i+1].x)/2,my=(pts[i].y+pts[i+1].y)/2;c.quadraticCurveTo(pts[i].x,pts[i].y,mx,my);}c.lineTo(pts[pts.length-1].x,pts[pts.length-1].y);c.lineWidth=lw;c.strokeStyle=col;c.lineCap='round';c.lineJoin='round';c.stroke();};
  road(W*.17,'rgba(70,40,15,.35)');road(W*.14,'#d9b07a');road(W*.1,'#e8c792');c.setLineDash([W*.02,W*.03]);road(W*.012,'rgba(140,95,50,.45)');c.setLineDash([]);
  // landmarks behind stops, back to front
  LANDMARKS.slice().sort((a,b)=>lmW(a).y-lmW(b).y).forEach(l=>drawLm(c,l,now));
  // stops
  for(let i=19;i>=0;i--){const p=stopW(i),done=i<save.unit,cur=i===Math.min(19,save.unit)&&save.unit<20,big=i===19,w=W*(big?.17:.135),h=w*.56;
    c.save();c.shadowColor='#0007';c.shadowBlur=6;c.shadowOffsetY=4;c.fillStyle=A.lg(c,0,p.y-h/2,0,p.y+h/2,big?[[0,'#fff1a6'],[.5,'#f3b631'],[1,'#a45f0c']]:done?[[0,'#e9f7c6'],[.5,'#b4d77c'],[1,'#5f8a32']]:[[0,'#fbf1dc'],[.55,'#d8c6a4'],[1,'#8f7a5a']]);c.beginPath();c.ellipse(p.x,p.y,w/2,h/2,0,0,TAU);c.fill();c.restore();
    c.lineWidth=2;c.strokeStyle='#4a2f16';c.beginPath();c.ellipse(p.x,p.y,w/2,h/2,0,0,TAU);c.stroke();
    if(cur){c.save();c.strokeStyle='#ffe392';c.lineWidth=3;c.shadowColor='#ffb52e';c.shadowBlur=14;const k2=1+.08*Math.sin(now/220);c.beginPath();c.ellipse(p.x,p.y,w*.58*k2,h*.62*k2,0,0,TAU);c.stroke();c.restore();}
    label(c,String(i+1),p.x,p.y+1,Math.round(W*(big?.06:.05)),cur?'#ffd25a':done?'#ffffff':'#fff3d2',);
    if(done){const bx=p.x+w*.42,by=p.y-h*.35;c.fillStyle='#2e9a3b';c.strokeStyle='#123d17';c.lineWidth=2;c.beginPath();c.arc(bx,by,W*.022,0,TAU);c.fill();c.stroke();c.strokeStyle='#fff';c.lineWidth=2.4;c.beginPath();c.moveTo(bx-W*.011,by);c.lineTo(bx-W*.002,by+W*.009);c.lineTo(bx+W*.012,by-W*.009);c.stroke();
      for(let s2=0;s2<3;s2++)A.star(c,p.x+(s2-1)*W*.032,p.y-h*.62-(s2===1?W*.012:0),W*.016,'#ffd23f',5,.45);}
    if(big)label(c,'THE BIG ONE',p.x,p.y+h*.85,Math.round(W*.03),'#ffe08a');}
  // the hustler token
  const slotI=Math.round(u),SL=stopSlot(slotI,($('bLadNext').offsetWidth||130),($('bLadNext').offsetHeight||56)),hs=W*.2,bob=m.walking?Math.abs(Math.sin(walk*Math.PI*5))*W*.015:Math.sin(now/950)*1.2,flip=m.walking&&stopW(Math.min(19,m.to)).x<stopW(m.from).x;
  c.save();c.fillStyle='rgba(0,0,0,.25)';c.beginPath();c.ellipse(tok.x+SL.side*hs*.42,tok.y+hs*.02,hs*.26,hs*.07,0,0,TAU);c.fill();c.translate(tok.x+SL.side*hs*.42,0);if(flip)c.scale(-1,1);IM.contain(c,IM.get(m.walking?'hustler-walk':'hustler-idle'),-hs/2,tok.y-hs*1.05-bob,hs,hs*1.1);c.restore();
  if(m.walking&&walk>=1&&!m.arrived){m.arrived=true;SFX.walk&&SFX.walk();}
  // Desert Gold teaser chip
  {const gx=W*.78,gy=g.top*.22;c.font='13px '+DISP;const tw=c.measureText('NEXT WORLD').width+34;c.fillStyle='#2b160cdd';A.rr(c,gx-tw/2,gy-12,tw,24,12);c.fill();c.strokeStyle='#ffd062';c.lineWidth=2;c.stroke();A.padlock(c,gx-tw/2+13,gy+1,15,0);label(c,'NEXT WORLD',gx+8,gy+1,13,'#ffd062');
    c.fillStyle=A.rg(c,gx,g.top*.5,0,gx,g.top*.5,W*.2,[[0,'rgba(255,213,83,'+(.1+.07*Math.sin(now/800))+')'],[1,'#ffd55300']]);c.fillRect(gx-W*.2,g.top*.3,W*.4,W*.4);}
  c.restore();
  c.fillStyle=A.lg(c,0,0,0,H,[[0,'#1a0d0588'],[.16,'#1a0d0500'],[.82,'#1a0d0500'],[1,'#1a0d05aa']]);c.fillRect(0,0,W,H);drawDust(now,.4);
  // build animation finish
  if(S.lmb){const el=now-S.lmb.t0;if(el>700&&!S.lmb.sfx.a){S.lmb.sfx.a=1;SFX.special&&SFX.special();}if(el>1300&&!S.lmb.sfx.b){S.lmb.sfx.b=1;SFX.built();const l=LANDMARKS.find(q=>q.id===S.lmb.id);banner(l.name+' fixed up!',1500);}
    if(el>2300){S.lmb=null;S.cam.focus=null;updBuildUI();}}
  const settled=!S.lmb&&S.cam.focus==null&&(S.cam.free||Math.abs((camTarget(tok.y))-S.cam.y)<1.5);if(!m.walking&&!S.cam.free&&S.cam.focus==null&&settled)S.cam.y=camTarget(tok.y);S.map&&(S.map.settled=!m.walking&&settled);
  const btn=$('bLadNext');if(btn)btn.style.visibility=(!m.walking&&settled)?'visible':'hidden';if(!m.walking&&btn&&!btn.classList.contains('hidden')){const bw=btn.offsetWidth||130,bh=btn.offsetHeight||56;let bx=SL.bx,by=SL.by-cy;by=Math.max(150,Math.min(H-bh-118,by));btn.style.left=Math.round(bx)+'px';btn.style.top=Math.round(by)+'px';}
}
function drawLm(c,l,now){const q=lmW(l),built=lmBuilt(l),b=S.lmb&&S.lmb.id===l.id?S.lmb:null,el=b?now-b.t0:9e9;
  let key='lm-'+l.id+(built&&el>1000?'':'-b');const im=l.id==='truck'&&built?truckImg(truckLv()):IM.get(key);const s=q.s*(l.id==='truck'?1.05:1);
  c.save();let sx=q.x,sy=q.y;if(b&&el<1000){sx+=Math.sin(el/30)*3;}
  if(b&&el>1000&&el<1500){const k=(el-1000)/500;c.translate(sx,sy);c.scale(1+.15*Math.sin(k*Math.PI),1+.15*Math.sin(k*Math.PI));c.translate(-sx,-sy);}
  c.fillStyle='rgba(0,0,0,.22)';c.beginPath();c.ellipse(sx,sy+s*.02,s*.42,s*.1,0,0,TAU);c.fill();
  if(im)IM.contain(c,im,sx-s/2,sy-s*.85,s,s*.85);
  if(b&&el<1300){for(let i=0;i<7;i++){const a=i/7*TAU+el/300,r=s*(.25+.15*Math.sin(el/120+i));c.fillStyle='rgba(235,215,180,'+(.55-.35*el/1300)+')';c.beginPath();c.arc(sx+Math.cos(a)*r,sy-s*.35+Math.sin(a)*r*.5,s*(.07+.03*Math.sin(i+el/90)),0,TAU);c.fill();}
    if(el<1000)A.star(c,sx+Math.sin(el/90)*s*.25,sy-s*.6,s*.06,'#fff2b0',4,.3);}
  if(b&&el>1000&&el<2300)for(let i=0;i<8;i++){const a=i/8*TAU,r=s*.2+(el-1000)/1300*s*.45;A.star(c,sx+Math.cos(a)*r,sy-s*.4+Math.sin(a)*r*.6,s*.04,'#ffd23f',5,.4);}
  c.restore();
  // tag under the landmark
  const nx=nextLm()===l&&!S.lmb,locked=save.unit<lmAt(l),ty=sy+s*.1;let txt=built?l.name:nx?(l.cost?'BUILD '+money(l.cost):'FREE!'):locked?'Unit '+lmAt(l):l.name;
  c.save();c.font=Math.round(W*.032)+'px '+DISP;const tw=c.measureText(txt).width+(locked&&!built?W*.07:W*.04),th=W*.058;const pu=nx?1+.06*Math.sin(now/200):1;
  {const cy0=S.cam?S.cam.y:0,tr=[sx-tw/2,ty-cy0-th/2,sx+tw/2,ty-cy0+th/2];let a=1;(S.zones||[]).forEach(z=>{if(rOv(tr,z,0)){const d=Math.min(tr[3]-z[1],z[3]-tr[1]);a=Math.min(a,Math.max(0,1-d/(th*.6)));}});if(a<=0){c.restore();return;}c.globalAlpha=a;}
  c.translate(sx,ty);c.scale(pu,pu);
  c.fillStyle=built?'#2b160cd0':nx?(save.bank>=l.cost?'#2f9b3a':'#b5651d'):'#2b160cb0';A.rr(c,-tw/2,-th/2,tw,th,th/2);c.fill();c.strokeStyle=built?'#ffd062':nx?'#fff2c2':'#8a6a45';c.lineWidth=2;c.stroke();
  if(locked&&!built){A.padlock(c,-tw/2+W*.035,1,W*.03,0);label(c,txt,W*.015,1,Math.round(W*.032),'#e9d6b2');}else label(c,txt,0,1,Math.round(W*.032),built?'#ffe08a':'#fff');c.restore();}

function frame(now){const dt=Math.min(50,now-last);last=now;ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,W,H);stepTiles(dt);
  if(S.mode==='title'||S.mode==='daily')drawTitle(now);
  else if(S.mode==='ladder'||S.mode==='map')drawMap(now);
  else if(S.mode==='door')drawDoor(now);
  else if(S.mode==='play')drawPlay(now);
  else if(S.mode==='flip')drawFlip(now);
  else if(S.mode==='safe')drawSafe(now);
  else if(S.mode==='box')drawBox(now);
  else if(S.mode==='truck')drawTruck(now);
  else if(S.mode==='empire')drawEmpire(now);
  else if(S.mode==='locked')drawLocked(now);
  if(S.mode!=='ladder'&&S.mode!=='map'){ctx.save();if(S.mode==='play')applyCam(now);drawFx(now);ctx.restore();}
  requestAnimationFrame(frame);}



/* ---------------- test hooks (read-only helpers + taps go through real input) ---------------- */
function ofs(p){const r=cv.getBoundingClientRect();return {x:p.x+r.left,y:p.y+r.top};}
window.SR={
  state:()=>({mode:S.mode,busy:S.busy,result:S.result,kind:S.run&&S.run.kind,unitId:S.run&&S.run.unit.id,bi:S.run&&S.run.bi,boards:S.run&&S.run.unit.boards.length,
    moves:S.eng&&S.eng.moves,used:S.eng&&S.eng.used,collected:S.eng?S.eng.collected.slice():[],snatched:S.eng?S.eng.snatched.slice():[],status:S.eng&&S.eng.status(),
    finds:S.eng?S.eng.findsOnBoard().map(f=>({r:f.r,c:f.c,key:f.key,age:f.age})):[],tarps:S.eng?(()=>{const a=[];S.eng.each((t,r,c)=>{if(t.k==='tarp')a.push({r,c,layers:t.layers,find:t.find});});return a;})():[],
    specials:S.eng?(()=>{const a=[];S.eng.each((t,r,c)=>{if(t.sp)a.push({r,c,sp:t.sp});});return a;})():[],
    scr:S.scr&&S.scr.phase,taught:S.taught,continued:S.continued,armed:S.armed,flash:!!(S.flash&&performance.now()-S.flash<5000),
    save:JSON.parse(JSON.stringify(save)),lad:S.lad&&{phase:S.lad.phase,from:S.lad.from,to:S.lad.to},building:!!S.build,flipDone:S.flip&&S.flip.done,door:S.door&&S.door.phase,scrapperMode:S.eng&&S.eng.scrapper,teach:S.run&&boardDef().teach,tut:S.run&&boardDef().tut,map:S.map&&{from:S.map.from,to:S.map.to,walking:!!S.map.walking||S.map.settled===false},safe:S.safe&&{phase:S.safe.phase,rarity:S.safe.rarity,done:!!S.safe.done},rush:S.run&&{on:rushOn(),meter:S.run.meter,x:S.run.rushX,rushNo:S.run.rushNo,best:S.run.best,bonus:S.run.bonus,box:S.run.box&&{tier:S.run.box.tier,opened:!!S.run.box.opened},safe:S.run.safe,cleared:!!S.run.cleared},box:S.box&&{stopped:S.box.stopped,done:!!S.box.done},truck:!!S.truck,tarpGlow:!!S.tarpGlow,mapArt:IM.mapReady()}),
  cellXY:(r,c)=>ofs(cellCenter(r,c)),bestMove:()=>S.eng&&S.eng.bestMove(),
  noMatchSwap:()=>{for(let r=0;r<7;r++)for(let c=0;c<6;c++){if(S.eng.scoreSwap([r,c],[r,c+1])<0&&E.swappable(S.eng.at(r,c))&&E.swappable(S.eng.at(r,c+1)))return {a:[r,c],b:[r,c+1]};}return null;},
  lockXY:()=>{const d=doorRect();return ofs({x:d.x+d.w/2,y:d.y+d.h*.8});},lockedDoorXY:()=>{const d=lockedDoorRect();return ofs({x:d.x+d.w/2,y:d.y+d.h/2});},
  mapCheck:()=>{const R=lmRects(),bad=[],b=$('bLadNext'),bw=b.offsetWidth||130,bh=b.offsetHeight||56,ids=LANDMARKS.map(l=>l.id);const nm=k=>ids[k>>1]+(k%2?' tag':'');
    const stopR=i=>{const p=stopW(i),w=W*(i===19?.17:.135),h=w*.56;return [p.x-w/2-W*.005,p.y-h*.62-W*.04,p.x+w/2+W*.03,p.y+h/2+W*(i===19?.05:.005)];};
    R.forEach((r,k)=>{if(r[0]<-W*.01||r[2]>W*1.01)bad.push(nm(k)+' off-edge');for(let i=0;i<20;i++)if(rOv(r,stopR(i),0))bad.push(nm(k)+' x stop '+(i+1));R.forEach((q,j)=>{if(j>k&&(j>>1)!==(k>>1)&&rOv(r,q,0))bad.push(nm(k)+' x '+nm(j));});});
    for(let i=0;i<20;i++){const sl=stopSlot(i,bw,bh),p=stopW(i),hs=W*.2,cx=p.x+sl.side*hs*.42,hb=[cx-hs*.33,p.y-hs*1.05,cx+hs*.33,p.y+hs*.03],bb=[sl.bx,sl.by,sl.bx+bw,sl.by+bh];R.forEach((r,k)=>{if(rOv(hb,r,0))bad.push('hustler@'+(i+1)+' x '+nm(k));if(rOv(bb,r,0))bad.push('button@'+(i+1)+' x '+nm(k));});stopRects().forEach((r,j)=>{if(rOv(bb,r,0))bad.push('button@'+(i+1)+' x stop '+(j+1));});}
    return bad;},
  mapLayout:()=>({W,rects:lmRects().map(r=>r.map(Math.round)),names:LANDMARKS.map(l=>l.id),stops:Array.from({length:20},(_,i)=>{const p=stopW(i);return [p.x,p.y].map(Math.round);})}),
  village:()=>({pct:builtPct(),built:(save.built||[]).slice(),next:nextLm()&&nextLm().id,cam:S.cam&&Math.round(S.cam.y),worldH:Math.round(MG().h),stops:Array.from({length:20},(_,i)=>ofs(mapXY(i))),building:!!S.lmb}),
  units:UNITS.length,flags:FLAGS,setMoves:n=>{if(S.eng){S.eng.moves=n;updateHUD();}},layout:()=>({x:L.x,y:L.y,cell:L.cell,W,H}),
  skipSafe,finishSafe,startSafe,finishTruck,mapTile:()=>save.unit,yardName:()=>YARD.name,
  board:()=>S.eng?S.eng.g.map(row=>row.map(t=>t&&({k:t.k,t:t.t,sp:t.sp,find:t.find,layers:t.layers}))):null,
  debugSafe:r=>{if(!DEBUG)return;S.run=S.run||Object.assign(newRun('campaign',UNITS[2]),{haul:['guitar','safe'],cart:85});S.run.safe=null;startSafe(r);},
  rushAdd:n=>{if(!DEBUG||!S.run||!rushOn()||S.run.rushX)return;S.run.meter=Math.min(RH.METER,S.run.meter+n);if(S.run.meter>=RH.METER)startRush();updateHUD();},
  debugBox:t=>{if(!DEBUG||!S.run||S.mode!=='play')return;earnBox();if(t){Object.assign(S.run.box,RH.rollBox(()=>t==='gold'?.95:t==='rare'?.7:.1,1),{opened:false});}updateHUD();},
  boxNow:t=>{if(!DEBUG)return;S.run=S.run||newRun('campaign',UNITS[3]);S.run.box=Object.assign(RH.rollBox(()=>t==='gold'?.95:t==='rare'?.7:.1,1),{opened:false});startBox(()=>goMap());},
  skipBox,finishBox,rushRect:()=>{const e=$('rush');if(!e||e.classList.contains('hidden'))return null;const r=e.getBoundingClientRect();return [r.left,r.top,r.width,r.height];},
  debugFlip:(h)=>{if(!DEBUG)return;S.run=Object.assign(newRun('campaign',UNITS[2]),{haul:h||['guitar','camera'],cart:50});startFlip();},
  debugTruck:(n)=>{if(!DEBUG)return;if(n==null){startTruck();return;}n=Math.max(1,Math.min(5,n));S.truck={t0:performance.now(),returnTo:'map',from:n-1,to:n,kind:'truck'};S.mode='truck';show('truckUI');$('truckTitle').textContent='Pickup Level '+(n-1)+' → '+n;$('truckSub').textContent=TRUCK_NAMES[n];$('bTruckNext').classList.add('hidden');},
  truckLevel:()=>truckLv(),debugWin:()=>{if(!DEBUG||!S.eng||S.mode!=='play')return;S.busy=true;S.result='win';boardWon();},
  artReady:()=>IM.ready(),mapPath:()=>Array.from({length:20},(_,i)=>({n:i+1,...ofs(mapXY(i))}))};

resize();boosterIcons();setSound(save.sound!==false);if(IM&&IM.load)IM.load(()=>{bgCache={};sprites={};boosterIcons();if(S.eng)buildGoals();});goTitle();requestAnimationFrame(frame);
if(document.fonts&&document.fonts.load)document.fonts.load('30px "Luckiest Guy"').then(()=>{bgCache={};sprites={};boosterIcons();}).catch(()=>{});
})();
