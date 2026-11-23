// Storage Auction Rush — Board Adventure (isolated playtest). Own save key; never touches the live game's storageRush.v3.
import * as S3 from './scene.js';
import {ClearOut,LOCKER_TIERS,tierFor} from './clearout.js';
const EC=window.ECON,IT=window.ITEMS,LV=window.LEVELS,Engine=window.Engine;
const KEY='storageRush.board.v1',QS=new URLSearchParams(location.search),DEBUG=QS.get('debug')==='1';
const T0=performance.now();
const $=id=>document.getElementById(id),wait=ms=>new Promise(r=>setTimeout(r,ms));
const fmt=n=>EC.fmt(Math.round(n));
// 16-space loop: auctions to fill the truck, shops to empty it, a bonus or rival every few spaces
const BOARD=['payday','auction','off','pawn','bonus','auction','flea','upgrade','rival','off','auction','pawn','bonus','flea','upgrade','auction'];
const NAMES={payday:'Payday',auction:'Storage Auction',off:'Day Off',pawn:"Pawn Shop",bonus:'Bonus: Case Match',flea:'Flea Market',upgrade:'Business Upgrade',rival:"Rival Auction · Big Earl"};
const PAWN_SETS=['tools','radio','music','jewelry','garage','games','designer','history'];
const FLEA_SETS=['kitchen','toys','reading','sports','shelf',null];
const MAX_ROLLS=5;
function fresh(){return {v:1,cash:10,rolls:0,pos:0,truck:[],cap:6,flea:0,truckLv:0,L:1,lap:0,clean:0,earned:0,sold:0,earl:{beat:0,lost:0},seed:(Date.now()%100000)+7,started:false,checkpoint:false,perk:{moves:0},seen:{},active:null};}
let G=load();
function load(){if(QS.get('fresh')==='1'){try{localStorage.removeItem(KEY);}catch(e){}return fresh();}try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&s.v===1)return Object.assign(fresh(),s);}catch(e){}return fresh();}
function save(){try{localStorage.setItem(KEY,JSON.stringify(G));}catch(e){}}
let rs=G.seed;const rnd=()=>{rs=(rs*1664525+1013904223)>>>0;return rs/4294967296;};

// ---------- sound (synthesized) ----------
let AC=null,soundOn=true;
function sfx(k){if(!soundOn)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();}catch(e){return;}const t=AC.currentTime;
  const tone=(f,d,type='triangle',v=.12,at=0,slide)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t+at);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+at+d);g.gain.setValueAtTime(v,t+at);g.gain.exponentialRampToValueAtTime(.001,t+at+d);o.connect(g).connect(AC.destination);o.start(t+at);o.stop(t+at+d+.02);};
  ({pop:()=>tone(520+Math.random()*200,.09,'sine',.09),chain:()=>tone(700,.12,'triangle',.1,0,1100),coin:()=>{tone(1320,.08,'square',.05);tone(1760,.12,'square',.05,.07);},roll:()=>{for(let i=0;i<6;i++)tone(180+Math.random()*120,.04,'square',.04,i*.07);},
    hop:()=>tone(330,.07,'sine',.07,0,520),door:()=>tone(90,.6,'sawtooth',.06,0,160),win:()=>[523,659,784,1046].forEach((f,i)=>tone(f,.18,'triangle',.1,i*.1)),bad:()=>tone(220,.25,'sawtooth',.06,0,140),
    up:()=>[392,523,659,784,1046].forEach((f,i)=>tone(f,.2,'triangle',.11,i*.08)),flip:()=>tone(880,.05,'sine',.06)})[k]?.();}

// ---------- HUD ----------
function hud(){$('cash').textContent=fmt(G.cash);$('rolls').textContent=G.rolls+(G.rolls>=MAX_ROLLS?' MAX':'');$('capacity').textContent=G.truck.length+' / '+G.cap;S3.setTruckLoad(G.truck.length,G.cap);save();}
function label(ch,place,sub){$('chapter').textContent=ch;$('place').textContent=place;$('subtitle').textContent=sub||'';}
let toastT;function toast(msg,ms=1700){const t=$('toast');t.innerHTML=msg;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),ms);}
function bubble(msg,ms=1500){const b=$('bubble'),p=S3.pirateScreen();b.style.top=Math.max(60,p.y-50)+'px';b.style.left=p.x+'px';b.innerHTML=msg;b.classList.add('show');setTimeout(()=>b.classList.remove('show'),ms);}
function panel(html){const p=$('panel');p.innerHTML=html;p.classList.remove('hidden');}
function hidePanel(){$('panel').classList.add('hidden');}
let modalDone=null;
function modal(html,closable=true){$('modalBody').innerHTML=html;$('modal').classList.remove('hidden');$('close').classList.toggle('hidden',!closable);return new Promise(r=>{modalDone=r;});}
function closeModal(v){$('modal').classList.add('hidden');const d=modalDone;modalDone=null;if(d)d(v);}
$('close').onclick=()=>closeModal(null);
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b&&!b.disabled){e.preventDefault();act(b.dataset.act,b.dataset);}});
const handlers={};function act(a,d){if(handlers[a])handlers[a](d);}

// ---------- items ----------
const itemOf=id=>IT.get(id)||{name:id,emoji:'📦',set:null,rarity:'common'};
const valueOf=id=>Math.max(1,IT.value(id,G.L,EC));
function pawnRate(id){return PAWN_SETS.includes(itemOf(id).set)?.8:.65;}
function fleaRate(id){return (FLEA_SETS.includes(itemOf(id).set)?1:.7)*(1+.1*G.flea);}
const fleaSlots=()=>3+G.flea;
const curbPrice=id=>Math.max(1,Math.round(valueOf(id)*.4));
function addToTruck(id,quiet){if(G.truck.length<G.cap){G.truck.push(id);return {truck:true};}const curb=curbPrice(id);G.cash+=curb;G.earned+=curb;if(!quiet)toast('Truck full: '+itemOf(id).emoji+' sold at the curb for '+fmt(curb));return {truck:false,curb};}
function rarityTag(id){const r=itemOf(id).rarity;return r==='common'?'':'<span class="badge">'+r.toUpperCase()+'</span>';}

// ---------- upgrade prices on the money curve ----------
const raw=()=>EC.raw(G.L);
const cost={flea:()=>G.flea>=2?null:EC.nice((G.flea?45:20)*raw()),truck:()=>G.truckLv>=2?null:EC.nice((G.truckLv?55:25)*raw())};

// ---------- board loop ----------
function boardPanel(){const sp=BOARD[G.pos];S3.highlight(-1);
  label('SUNNYVALE · LAP '+(G.lap+1),NAMES[sp],G.rolls?'Roll to travel. Shops buy what is in your truck.':'Unload a locker to earn your next roll.');
  const roll=G.rolls>0?`<button class="primary" data-act="roll">ROLL THE DIE · ${G.rolls} EARNED</button>`:`<button class="primary" data-act="curb">UNLOAD THE CURB PILE · FREE</button><p class="note">No rolls left. The Curb Pile is always free and always pays a roll, so you never get stuck.</p>`;
  const here=(sp==='auction'||sp==='rival')&&!G.usedHere?`<div class="row"><button class="secondary" data-act="land">${sp==='rival'?'Bid against Big Earl':'Look at the lockers here'}</button></div>`:'';
  panel(`<div class="eyebrow">YOU ARE ON · ${NAMES[sp].toUpperCase()}</div>${roll}${here}<div class="row"><button class="secondary" data-act="truckview">Truck · ${G.truck.length}/${G.cap}</button><button class="secondary" data-act="menu">Playtest menu</button></div>`);}
handlers.roll=async()=>{if(G.rolls<=0||busy)return;busy=true;hidePanel();G.rolls--;hud();const v=1+Math.floor(rnd()*6);sfx('roll');S3.followPirate();await S3.rollDice(v);
  bubble('Rolled a <b>'+v+'</b>!');const from=G.pos;await S3.movePirate(from,v,i=>{sfx('hop');if(i===0)payday(true);});G.pos=(from+v)%BOARD.length;G.usedHere=false;hud();busy=false;await land();};
handlers.land=()=>land();
function payday(passing){const cash=EC.nice(5*raw());G.cash+=cash;G.earned+=cash;G.lap++;const r=G.rolls<MAX_ROLLS;if(r)G.rolls++;sfx('coin');S3.pirateBurst();
  toast((passing?'Passed ':'')+'PAYDAY! +'+fmt(cash)+(r?' and a milestone bonus roll':''));hud();}
async function land(){const sp=BOARD[G.pos];S3.highlight(G.pos);
  if(sp==='payday'){if(!G.passedThisTurn)/* landing exactly: payday already paid on the hop */;}
  if(sp==='auction')await auction();
  else if(sp==='pawn')await pawn();
  else if(sp==='flea')await fleaMarket();
  else if(sp==='upgrade')await upgrade();
  else if(sp==='rival')await rival();
  else if(sp==='bonus')await cases();
  else if(sp==='off'){const had=G.perk.moves;G.perk.moves=Math.min(3,G.perk.moves+2);hud();bubble(had>=3?'Day off. The crew is already rested. ☕':'Day off. Rested crew: <b>+2 moves</b> in your next locker. ☕',2200);await wait(1200);}
  checkpoint();boardPanel();}
function checkpoint(){if(G.checkpoint||(G.clean<4&&G.lap<1))return;G.checkpoint=true;save();
  modal(`<div class="eyebrow">PLAYTEST CHECKPOINT</div><h2>Your storage business is growing.</h2><div class="loot"><span class="emoji">🏚️</span><span class="desc">Lockers unloaded<small>each earned a roll</small></span><b>${G.clean}</b></div><div class="loot"><span class="emoji">💵</span><span class="desc">Cash earned<small>sales, salvage, Payday</small></span><b>${fmt(G.earned)}</b></div><div class="loot"><span class="emoji">🏷️</span><span class="desc">Items sold</span><b>${G.sold}</b></div><div class="loot"><span class="emoji">🏪</span><span class="desc">Flea stall</span><b>${['Yard sale','Market stall','Pirate Flea shop'][G.flea]}</b></div><p>Keep playing as long as you like. Mike: would you roll again?</p><button class="primary" data-act="closeModal">KEEP ROLLING</button>`);}
handlers.closeModal=()=>closeModal(true);

// ---------- auctions ----------
async function auction(){const small=EC.locker(G.L),big=EC.nice(3*raw());const can=v=>G.cash>=v;
  label('STORAGE AUCTION','Two doors. One bid.','Bids are paid once. Retries are always free.');
  const pick=await modal(`<div class="eyebrow">STORAGE AUCTION · LOCKER LEVEL ${G.L}</div><h2>Which locker do you bid on?</h2>
    <div class="loot"><span class="emoji">🚪</span><span class="desc">Dusty garage unit<small>household stuff, maybe a surprise</small></span><button class="secondary" data-act="pickL" data-k="small" ${can(small)?'':'disabled'}>${fmt(small)}</button></div>
    <div class="loot"><span class="emoji">🔐</span><span class="desc">Sealed estate unit<small>better finds, harder to unload</small></span><button class="secondary" data-act="pickL" data-k="big" ${can(big)?'':'disabled'}>${fmt(big)}</button></div>
    ${!can(small)?'<p class="note">Short on cash? Unload the free Curb Pile from the board.</p>':''}<p class="note">You have ${fmt(G.cash)}.</p>`);
  if(!pick)return;const price=pick==='big'?big:small;G.cash-=price;hud();sfx('coin');toast('SOLD for '+fmt(price)+'! The door is yours.');
  await cleanout({kind:pick,price,title:pick==='big'?'SEALED ESTATE UNIT':'DUSTY GARAGE UNIT'});}
handlers.pickL=d=>closeModal(d.k);
handlers.curb=async()=>{if(busy)return;await cleanout({kind:'curb',price:0,title:'THE CURB PILE · FREE'});boardPanel();};

// ---------- Big Earl ----------
async function rival(){const base=EC.nice(3*raw());if(G.cash<base){S3.earlFocus();bubble('Big Earl: "Come back when you have '+fmt(base)+', rookie."',2400);await wait(1500);S3.followPirate();return;}
  S3.earlFocus();label('RIVAL AUCTION','Big Earl wants this one.','Raise or fold. He folds at a secret limit.');
  const limit=base*(1.25+rnd()*1.2);let bid=base;const step=Math.max(1,EC.nice(base*.5));
  for(;;){const earlRaises=bid<=limit;const mood=bid<limit*.7?'😏 Big Earl smirks.':bid<limit?'😤 Big Earl is sweating.':'';
    if(!earlRaises){sfx('win');S3.coinBurst(S3.fleaPos(),0);G.earl.beat++;G.cash-=bid;hud();await modal(`<div class="eyebrow">RIVAL AUCTION</div><h2>Big Earl folds!</h2><p>"Fine. Take the sealed unit, pirate." You win it for <b>${fmt(bid)}</b>. Wins against Earl: ${G.earl.beat}.</p><button class="primary" data-act="closeModal">UNLOAD IT</button>`,false);
      S3.followPirate();await cleanout({kind:'rival',price:bid,title:'BIG EARL\'S LOST LOCKER'});return;}
    const ans=await modal(`<div class="eyebrow">RIVAL AUCTION · BIG EARL</div><h2>${mood||'Big Earl raises.'}</h2><p>Earl bids <b>${fmt(bid)}</b>. Raise to ${fmt(bid+step)}? You have ${fmt(G.cash)}.</p><div class="row"><button class="primary" data-act="earl" data-a="raise" ${G.cash>=bid+step?'':'disabled'}>RAISE ${fmt(bid+step)}</button><button class="secondary" data-act="earl" data-a="fold">Fold</button></div>`,false);
    if(ans!=='raise'){G.earl.lost++;hud();bubble('Big Earl: "Better luck next lap!"',1800);S3.followPirate();return;}bid+=step;sfx('flip');}}
handlers.earl=d=>closeModal(d.a);

// ---------- pawn: take it or push ----------
async function pawn(){if(!G.truck.length){bubble('Pawn shop: "Bring me something to sell."',1800);await wait(1000);return;}
  label('PAWN SHOP','Fast cash. Haggle if you dare.','Tools, radios and jewelry get the best offers here.');
  const list=G.truck.map((id,i)=>({id,i,v:valueOf(id)})).sort((a,b)=>b.v*pawnRate(b.id)-a.v*pawnRate(a.id));
  const pickI=await modal(`<div class="eyebrow">PAWN SHOP</div><h2>What are you selling?</h2>${list.slice(0,6).map(o=>`<div class="loot"><span class="emoji">${itemOf(o.id).emoji}</span><span class="desc">${itemOf(o.id).name} ${rarityTag(o.id)}<small>worth about ${fmt(o.v)} · pawn starts near ${Math.round(pawnRate(o.id)*100)}%</small></span><button class="secondary" data-act="pawnPick" data-i="${o.i}">Offer</button></div>`).join('')}`);
  if(pickI==null)return;const id=G.truck[+pickI],v=valueOf(id);let offer=Math.max(1,Math.round(v*pawnRate(id))),push=0,dropped=false;
  for(;;){const odds=push===0?75:50;
    const a=await modal(`<div class="eyebrow">PAWN SHOP · NEGOTIATE</div><h2>${itemOf(id).emoji} ${itemOf(id).name}</h2><div class="big-value">${fmt(offer)}</div><p>${dropped?'"That is my final offer." ':push?'"Hmm… alright."':'"I can do this."'} It's worth about ${fmt(v)}.</p>
      <div class="row"><button class="primary" data-act="pawnA" data-a="take">TAKE ${fmt(offer)}</button>${push<2&&!dropped?`<button class="secondary" data-act="pawnA" data-a="push">PUSH FOR ${fmt(offer+Math.max(1,Math.round(v*.15)))}<br><small>${odds}% he says yes</small></button>`:''}</div><p class="note">If he says no, he lowers his offer once, or walks. You never lose the item.</p>`,false);
    if(a==='take'){sellItem(+pickI,offer,'pawn');await modal(`<div class="eyebrow">SOLD</div><h2>+${fmt(offer)}</h2><p>${itemOf(id).name} sold at the pawn shop.</p><button class="primary" data-act="closeModal">NICE</button>`,false);return;}
    push++;const yes=rnd()*100<odds;if(yes){offer+=Math.max(1,Math.round(v*.15));sfx('chain');continue;}
    sfx('bad');if(push>=2||dropped){await modal(`<div class="eyebrow">PAWN SHOP</div><h2>He walked away.</h2><p>"Too rich for me." The ${itemOf(id).name} stays in your truck. Try the flea market.</p><button class="primary" data-act="closeModal">OK</button>`,false);return;}
    offer=Math.max(1,offer-Math.max(1,Math.round(v*.1)));dropped=true;}}
handlers.pawnPick=d=>closeModal(d.i);handlers.pawnA=d=>closeModal(d.a);
function sellItem(i,price,where){const id=G.truck.splice(i,1)[0];G.cash+=price;G.earned+=price;G.sold++;sfx('coin');S3.pirateBurst();hud();return id;}

// ---------- flea market ----------
async function fleaMarket(){if(!G.truck.length){bubble('Flea market: nothing to sell yet.',1600);await wait(900);return;}
  S3.focus(S3.fleaPos(),{dist:8.5,h:5.5});label('FLEA MARKET','Full price for everyday stuff.',`Sells up to ${fleaSlots()} items per visit. Your stall adds ${G.flea*10}%.`);
  let left=fleaSlots();for(;;){const list=G.truck.map((id,i)=>({id,i,p:Math.max(1,Math.round(valueOf(id)*fleaRate(id)))})).sort((a,b)=>b.p-a.p);
    if(!list.length||!left)break;
    const a=await modal(`<div class="eyebrow">FLEA MARKET · ${left} SALES LEFT</div><h2>Sell from your truck</h2>${list.map(o=>`<div class="loot"><span class="emoji">${itemOf(o.id).emoji}</span><span class="desc">${itemOf(o.id).name} ${rarityTag(o.id)}<small>${Math.round(fleaRate(o.id)*100)}% of ${fmt(valueOf(o.id))}</small></span><button class="secondary" data-act="fleaSell" data-i="${o.i}">${fmt(o.p)}</button></div>`).join('')}<button class="primary" data-act="fleaSell" data-i="best">SELL THE BEST ${Math.min(left,list.length)}</button>`);
    if(a==null)break;if(a==='best'){const n=Math.min(left,list.length);const picks=list.slice(0,n).map(o=>o.i).sort((x,y)=>y-x);let tot=0;picks.forEach(i=>{const id=G.truck[i];const p=Math.max(1,Math.round(valueOf(id)*fleaRate(id)));sellItem(i,p,'flea');tot+=p;});left-=n;toast('Flea market sales: +'+fmt(tot));break;}
    const i=+a,id=G.truck[i],p=Math.max(1,Math.round(valueOf(id)*fleaRate(id)));sellItem(i,p,'flea');left--;toast(itemOf(id).emoji+' sold for '+fmt(p));}
  closeModal(null);S3.followPirate();}
handlers.fleaSell=d=>closeModal(d.i);

// ---------- upgrades: the flea building transforms ----------
async function upgrade(){const fp=S3.fleaPos();fp.y+=1.4;const port=innerWidth<innerHeight;S3.focus(fp,{dist:port?15:11,h:port?8:6.5});label('BUSINESS UPGRADE','Build your empire.','Upgrades change what you can do.');
  const f=cost.flea(),t=cost.truck();const names=['Yard sale table','Market stall','Pirate Flea shop'];
  const a=await modal(`<div class="eyebrow">BUSINESS UPGRADE · YOU HAVE ${fmt(G.cash)}</div><h2>Grow the business</h2>
    <div class="loot"><span class="emoji">🏪</span><span class="desc">${f?names[G.flea+1]:'Pirate Flea shop'}<small>${f?(G.flea===0?'+1 flea sale, +10% prices · regulars tip you what hides under the tarps':'+1 flea sale per visit, +10% flea prices'):'fully built'}</small></span>${f?`<button class="secondary" data-act="upPick" data-k="flea" ${G.cash>=f?'':'disabled'}>${fmt(f)}</button>`:'<b>✓</b>'}</div>
    <div class="loot"><span class="emoji">🛻</span><span class="desc">${t?'Bigger truck bed':'Truck maxed'}<small>${t?'carry '+(G.cap+4)+' items · +1 move in every locker':'carries '+G.cap+' · +'+G.truckLv+' moves per locker'}</small></span>${t?`<button class="secondary" data-act="upPick" data-k="truck" ${G.cash>=t?'':'disabled'}>${fmt(t)}</button>`:'<b>✓</b>'}</div><p class="note">Prices grow with your locker level, on the same money curve as the main game.</p>`);
  if(a==='flea'){G.cash-=f;G.flea++;hud();sfx('up');await S3.upgradeFlea(G.flea);toast('🏪 '+names[G.flea]+' built!',2200);await wait(1800);}
  S3.followPirate();
  if(a==='truck'){G.cash-=t;G.truckLv++;G.cap+=4;hud();sfx('up');S3.pirateBurst();toast('🛻 Truck upgraded: carries '+G.cap+' items and +1 move in every locker',2400);}}
handlers.upPick=d=>closeModal(d.k);

// ---------- 12-case match bonus (earned by landing) ----------
let caseDeck=null;
async function cases(){label('BONUS GAME','Case Match','Flip two cases. A pair wins what is inside. 6 tries.');
  const cXS=Math.max(1,EC.nice(2*raw())),cS=EC.nice(4*raw()),cM=EC.nice(10*raw()),item=IT.pick('u',G.L,rnd,{});
  // six DIFFERENT prizes; each pair shares the exact same icon and label, so what looks the same always matches
  const prizes=[{k:'cash',v:cXS,e:'🪙',l:fmt(cXS)},{k:'cash',v:cS,e:'💵',l:fmt(cS)},{k:'cash',v:cM,e:'💰',l:fmt(cM)},{k:'item',id:item,e:itemOf(item).emoji,l:itemOf(item).name.split(' ')[0]},{k:'roll',e:'🎲',l:'+1 roll'},{k:'moves',e:'⭐',l:'+1 move'}];
  let deck=[];prizes.forEach((p,i)=>{deck.push({...p,pair:i},{...p,pair:i});});for(let i=deck.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
  caseDeck=deck;  let tries=6,open=[],won=[],busyC=false,total=0;
  const draw=()=>{$('modalBody').innerHTML=`<div class="eyebrow">BONUS · CASE MATCH · ${tries} TRIES LEFT</div><h2>Find the pairs</h2><div class="cases">${deck.map((c,i)=>`<button class="case ${c.open||c.won?'open':''} ${c.won?'won':''}" data-act="case" data-i="${i}" ${c.won||c.open?'disabled':''} aria-label="case ${i+1}">${c.open||c.won?c.e+'<small class="case-l">'+c.l+'</small>':'🧳'}</button>`).join('')}</div><p class="note">Won so far: ${won.length?won.join(', '):'nothing yet'}. Earned only, never sold.</p>${tries<=0?'<button class="primary" data-act="closeModal">COLLECT</button>':''}`;};
  handlers.case=async d=>{if(busyC||tries<=0)return;const c=deck[+d.i];if(c.open||c.won)return;c.open=true;open.push(c);sfx('flip');draw();
    if(open.length<2)return;busyC=true;tries--;await wait(650);const [a,b]=open;open=[];
    if(a.e===b.e&&a.l===b.l){a.won=b.won=true;a.open=b.open=false;sfx('win');let t='';if(a.k==='cash'){G.cash+=a.v;G.earned+=a.v;total+=a.v;t=fmt(a.v);}else if(a.k==='item'){addToTruck(a.id);t=itemOf(a.id).name;}else if(a.k==='moves'){G.perk.moves=Math.min(3,G.perk.moves+1);t='+1 move next locker';}else{if(G.rolls<MAX_ROLLS)G.rolls++;t='+1 roll';}won.push(a.e+' '+t);hud();}
    else{a.open=b.open=false;}busyC=false;draw();};
  const pr=modal('',false);draw();await pr;}

// ---------- truck view + menu ----------
handlers.truckview=()=>modal(`<div class="eyebrow">YOUR TRUCK · ${G.truck.length}/${G.cap}</div><h2>${['Rusty pickup','Pickup + rack','Pickup + trailer'][G.truckLv]}</h2>${G.truck.length?G.truck.map(id=>`<div class="loot"><span class="emoji">${itemOf(id).emoji}</span><span class="desc">${itemOf(id).name} ${rarityTag(id)}<small>${itemOf(id).set||'misc'}</small></span><b>${fmt(valueOf(id))}</b></div>`).join(''):'<p>Empty. Win a locker at an auction space.</p>'}<p class="note">Sell at Pawn Shops (haggle) or Flea Markets (full price for everyday items).</p>`);
handlers.menu=()=>modal(`<div class="eyebrow">PLAYTEST MENU</div><h2>Board Adventure test</h2><p>This page has its own save. It never touches the main game or its save.</p><div class="row"><button class="secondary" data-act="sound">Sound ${soundOn?'on':'off'}</button><button class="secondary" data-act="reset">Start over</button></div><div class="row"><a class="secondary" style="text-align:center;text-decoration:none" href="../">Open the original game</a></div><p class="note">Graphics: ${S3.getQuality()} detail.</p>`);
handlers.reset=()=>{localStorage.removeItem(KEY);location.search='';};
handlers.sound=()=>{soundOn=!soundOn;closeModal(null);toast('Sound '+(soundOn?'on':'off'));};
$('sound').onclick=()=>handlers.sound();$('truck').onclick=()=>handlers.truckview();

// ---------- the cleanout: 2D match-3 over the 3D locker ----------
const IMG={};['box','crate','lamp','tote','toy','treasure'].forEach((k,i)=>{const m=new Image();m.src='../assets/pieces/'+k+'.png';IMG[i]=m;});
const SPI={dolly:'../assets/specials/dolly.png',gavel:'../assets/specials/gavel.png',tarp:'../assets/finds/tarp.png'};Object.keys(SPI).forEach(k=>{const m=new Image();m.src=SPI[k];IMG[k]=m;});
let E=null,CO=null,busy=false,sel=null,disp=new Map(),pops=[],gcv=$('grid'),gx=gcv.getContext('2d'),gW=0,cell=0;
function boardDef(kind){const units=LV.YARD1.units;const ix=kind==='curb'?0:Math.min(units.length-1,G.clean%6);const b=JSON.parse(JSON.stringify(units[ix].boards[0]));
  b.scrapper='off';b.tut=null;b.teach=null;b.seed=(b.seed||1)+G.clean*31+(kind==='curb'?997:0);
  const up=kind==='big'||kind==='rival';b.tarps=b.tarps.map(t=>{let s=t[3];if(s==='hook')s=G.clean===0?'tinrobot':'c';else if(s==='lock')s='c';if(up&&s==='c')s='u';if(up&&s==='u'&&kind==='rival')s='r';
    const id=s&&!IT.get(s)?IT.pick(s,G.L,rnd,{}):s;return [t[0],t[1],t[2],id];});
  // moves come from ONE place: LOCKER_TIERS (clearout.js). The old LEVELS move counts are ignored here.
  const tier=tierFor(G.L,kind),T=LOCKER_TIERS[tier];b.tier=tier;b.tierName=T.name;b.types=T.types;
  b.bonus=[];if(G.truckLv)b.bonus.push(['truck',G.truckLv]);if(G.perk.moves)b.bonus.push(['rested',G.perk.moves]);
  b.clearMoves=T.moves+b.bonus.reduce((a,x)=>a+x[1],0);b.peek=G.flea>=1;delete b.moves;return b;}
function saveActive(){if(!E||!CO)return;G.active={o:{kind:CO.kind,price:CO.price,title:CO.title},def:CO.def,eng:E.save(),collected:CO.collected.slice(),cleared:CO.cleared,attempt:CO.attempt||0};save();}
async function cleanout(o,resume){busy=true;hidePanel();document.body.classList.add('clean');CO={...o,collected:[],layers:0,cleared:0,warned:{}};
  let def;if(resume){def=resume.def;CO.collected=resume.collected;CO.cleared=resume.cleared;CO.attempt=resume.attempt;E=new ClearOut(def,1,resume.eng);}
  else{def=boardDef(o.kind);G.perk.moves=0;E=new ClearOut(def,def.seed*7+G.clean);}
  CO.def=def;disp.clear();pops=[];sel=null;saveActive();
  S3.fillLocker(def.seed);if(resume)S3.setLockerProgress(1-E.left()/E.totalObjs);sfx('door');
  const extra=def.bonus.map(([k,n])=>`+${n} ${k==='truck'?'bigger truck':'rested crew'}`).join(', ');
  label(resume?'RESUMED · YOUR BID IS SAFE':'UNLOADING · '+def.tierName.toUpperCase(),o.title,`Empty the whole locker in ${def.clearMoves} moves${extra?' ('+extra+')':''}. Matched stuff leaves for good.`);await S3.enterLocker();
  $('cleanTitle').textContent=o.title;$('cleanout').classList.remove('hidden');layoutGrid();updateClean();
  if(resume)toast('Welcome back! Your locker was saved: '+E.moves+' moves left.',2200);
  else if(def.peek){const f=[];E.each(t=>{if(t.k==='tarp'&&t.find)f.push(itemOf(t.find));});if(f.length)toast(`🏪 Flea regulars tip you off: ${f.map(x=>x.emoji+' '+x.name).join(', ')} under the tarps!`,2600);}
  busy=false;return new Promise(r=>{CO.done=r;if(resume&&E.status()!=='play')setTimeout(()=>checkEnd(),0);});}
function layoutGrid(){const r=gcv.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);gW=r.width;gcv.width=Math.round(r.width*d);gcv.height=Math.round(r.width*d);gx.setTransform(d,0,0,d,0,0);cell=gW/7;}
addEventListener('resize',()=>{if(!$('cleanout').classList.contains('hidden'))layoutGrid();});
function updateClean(){const mv=$('moves');mv.textContent=E.moves+(E.moves===1?' MOVE':' MOVES');mv.classList.toggle('low',E.moves<=5&&E.status()==='play');const p=1-E.left()/E.totalObjs;$('unloadBar').style.width=Math.round(p*100)+'%';S3.setLockerProgress(p);
  $('rush').textContent=`${E.left()} LEFT IN THE LOCKER · FINDS ${CO.collected.length}`;}
function tip(msg,ms=3200){const t=$('gridTip');t.innerHTML=msg;t.classList.add('flash');clearTimeout(tip.t);tip.t=setTimeout(()=>{t.classList.remove('flash');t.textContent='Tap two neighbors to match 3. Matched stuff leaves for good. Empty the locker!';},ms);}
function lowWarn(){if(E.status()!=='play'||!E.left())return;for(const n of [5,3]){if(E.moves===n&&!CO.warned[n]){CO.warned[n]=1;sfx('bad');toast(`⚠️ ${n} MOVES LEFT · ${E.left()} still in the locker`,1800);tip(n===3?'Running low! Go for matches that set off chains.':'Running low! Plan your last moves.',2600);}}}
function cellOf(ev){const r=gcv.getBoundingClientRect();const c=Math.floor((ev.clientX-r.left)/cell),rr=Math.floor((ev.clientY-r.top)/cell);return c>=0&&c<7&&rr>=0&&rr<7?[rr,c]:null;}
let downAt=null;
gcv.addEventListener('pointerdown',ev=>{if(busy||!E)return;const p=cellOf(ev);if(!p)return;downAt={p,x:ev.clientX,y:ev.clientY};gcv.setPointerCapture(ev.pointerId);
  if(sel&&Math.abs(sel[0]-p[0])+Math.abs(sel[1]-p[1])===1){const a=sel;sel=null;downAt=null;trySwap(a,p);return;}sel=p;});
gcv.addEventListener('pointermove',ev=>{if(!downAt||busy)return;const dx=ev.clientX-downAt.x,dy=ev.clientY-downAt.y;if(Math.hypot(dx,dy)<cell*.35)return;const a=downAt.p,b=Math.abs(dx)>Math.abs(dy)?[a[0],a[1]+Math.sign(dx)]:[a[0]+Math.sign(dy),a[1]];downAt=null;sel=null;if(b[0]>=0&&b[0]<7&&b[1]>=0&&b[1]<7)trySwap(a,b);});
gcv.addEventListener('pointerup',()=>{downAt=null;});
$('hint').onclick=()=>{if(!E||busy)return;const m=E.bestMove();if(m){CO.hint={...m,t:performance.now()};}};
let swapAnim=null;
async function trySwap(a,b){if(busy)return;busy=true;const r=E.swap(a,b);if(!r.ok){swapAnim={a,b,t:performance.now(),bad:true};sfx('bad');await wait(220);busy=false;return;}
  swapAnim={a,b,t:performance.now()};await resolve();saveActive();lowWarn();busy=false;await checkEnd();}
async function resolve(){let chain=0;for(let guard=0;guard<40;guard++){const ev=E.step();
    if(!ev){const f=E.findsOnBoard();if(f.length){for(const x of f){E.collect(x.r,x.c);CO.collected.push(x.key);findFly(x.key,x.r,x.c);}E.gravity();await wait(200);continue;}break;}
    chain++;ev.cleared.forEach(c=>{pops.push({r:c.r,c:c.c,t:performance.now(),ty:c.tile.t});disp.delete(c.tile.id);});CO.cleared+=ev.cleared.length;
    ev.hits.forEach(h=>{pops.push({r:h.r,c:h.c,t:performance.now(),tarp:1});});sfx(chain>1?'chain':'pop');if(chain>2)toast('CHAIN x'+chain+'!',700);updateClean();await wait(150);E.gravity();await wait(170);}
  await fairFinish();updateClean();}
// Fair finish (rule lives in clearout.js): no move left -> free shove; only stragglers that can't make 3 (or bare tarps) -> crew hauls them.
async function fairFinish(){for(let k=0;k<4;k++){const f=E.fairness();if(f==='ok')return;
    if(f==='haul'){await haulRest();return;}
    sfx('roll');disp.clear();if(!G.seen.shove){G.seen.shove=1;save();tip('<b>FREE SHOVE:</b> no match was left, so we pushed the leftovers together. It costs no move.',4200);toast('🫸 FREE SHOVE! No matches left, so we packed the rest together.',2600);}else toast('🫸 Free shove',900);
    if(!E.shove()){await haulRest();return;}await wait(450);}}
async function haulRest(){const items=E.remaining();const out=E.haul();const now=performance.now();out.forEach((o,i)=>{pops.push({r:o.r,c:o.c,t:now+i*40});if(o.tile.k==='item')CO.cleared++;disp.delete(o.tile.id);if(o.tile.find){CO.collected.push(o.tile.find);findFly(o.tile.find,o.r,o.c);}});
  sfx('chain');if(!G.seen.haul){G.seen.haul=1;save();tip(`<b>CREW HAUL:</b> ${items?'the last '+items+' pieces can\'t make 3 anymore':'only tarps were left'}, so the crew carried them out for you.`,4200);toast('🧑‍🔧 CREW HAUL! Leftovers that can\'t make 3 get carried out.',2600);}else toast('🧑‍🔧 Crew hauled the last '+out.length,1100);
  updateClean();await wait(450);}
function findFly(id,r,c){const it=itemOf(id);sfx('win');const full=G.truck.length+CO.collected.length>G.cap;
  toast(full?`${it.emoji} <b>${it.name}</b> found! Truck is full (${G.truck.length}/${G.cap}): it sells at the curb for ${fmt(curbPrice(id))}`:`${it.emoji} <b>${it.name}</b> found! worth about ${fmt(valueOf(id))}`,2200);pops.push({r,c,t:performance.now(),find:it.emoji});}
function lootRows(items){return items.map(id=>{const r=addToTruck(id,true);return `<div class="loot"><span class="emoji">${itemOf(id).emoji}</span><span class="desc">${itemOf(id).name} ${rarityTag(id)}<small>${r.truck?'into the truck':'truck full: sold at curb price'}</small></span><b>${r.truck?fmt(valueOf(id)):'+'+fmt(r.curb)}</b></div>`;}).join('');}
async function checkEnd(){const st=E.status();if(st==='play')return;
  if(st==='win'){busy=true;CO.celebrate=performance.now();S3.lockerDone();sfx('win');setTimeout(()=>sfx('up'),350);toast('🎉 LOCKER EMPTY! Every last thing hauled out.',1800);$('unloadBar').style.width='100%';await wait(1500);
    const salvage=Math.max(1,EC.nice(.03*CO.cleared*raw()));G.cash+=salvage;G.earned+=salvage;G.active=null;
    const rows=lootRows(CO.collected.slice());G.clean++;if(CO.kind!=='curb')G.L++;let rollsGot=0;if(G.rolls<MAX_ROLLS){G.rolls++;rollsGot++;}hud();
    $('cleanout').classList.add('hidden');
    await modal(`<div class="eyebrow">LOCKER UNLOADED · ${E.moves} MOVES TO SPARE</div><h2>${CO.title}</h2>${rows}
      <div class="loot"><span class="emoji">🧹</span><span class="desc">Junk salvage<small>${CO.cleared} pieces hauled out</small></span><b>+${fmt(salvage)}</b></div>
      <div class="loot"><span class="emoji">🎲</span><span class="desc">${rollsGot?'Board roll earned':'Rolls are full (max 5)'}</span><b>+${rollsGot}</b></div><button class="primary" data-act="closeModal">BACK TO THE BOARD</button>`,false);
    await endClean();return;}
  // OUT OF MOVES with stuff left: the locker is NOT cleared. Fair outcome: keep what you dug out, but no roll; or retry free.
  busy=true;sfx('bad');const left=E.left();const partial=Math.max(1,EC.nice(.03*CO.cleared*raw()*.5));
  const a=await modal(`<div class="eyebrow">OUT OF MOVES · ${left} LEFT IN THE LOCKER</div><h2>Not fully cleared.</h2><p>Only a fully empty locker earns a board roll.</p>
    <div class="loot"><span class="emoji">📦</span><span class="desc">Keep what you got<small>${CO.collected.length?CO.collected.length+' find'+(CO.collected.length>1?'s':'')+' + ':''}half salvage ${fmt(partial)} · <b>no roll</b></small></span><button class="secondary" data-act="retry" data-a="keep">Keep</button></div>
    <div class="loot"><span class="emoji">🔁</span><span class="desc">Retry free<small>same locker, fresh layout. Your bid is never charged again.</small></span><button class="primary" data-act="retry" data-a="retry">Retry</button></div>`,false);
  if(a==='retry'){CO.attempt=(CO.attempt||0)+1;E=new ClearOut(CO.def,CO.def.seed*7+G.clean+CO.attempt*101);CO.collected=[];CO.layers=0;CO.cleared=0;CO.warned={};disp.clear();S3.fillLocker(CO.def.seed);await S3.enterLocker();updateClean();saveActive();busy=false;return;}
  G.cash+=partial;G.earned+=partial;G.active=null;const rows=lootRows(CO.collected.slice());G.clean++;hud();$('cleanout').classList.add('hidden');
  await modal(`<div class="eyebrow">PARTLY UNLOADED · NO ROLL</div><h2>${CO.title}</h2>${rows}<div class="loot"><span class="emoji">🧹</span><span class="desc">Half salvage<small>${CO.cleared} pieces hauled out</small></span><b>+${fmt(partial)}</b></div><p class="note">${G.rolls?'You still have '+G.rolls+' roll'+(G.rolls>1?'s':'')+'.':'Out of rolls? The free Curb Pile always pays a roll when you empty it.'}</p><button class="primary" data-act="closeModal">BACK TO THE BOARD</button>`,false);
  await endClean();}
handlers.retry=d=>closeModal(d.a);
async function endClean(){$('cleanout').classList.add('hidden');document.body.classList.remove('clean');G.active=null;await S3.exitLocker();S3.followPirate();E=null;busy=false;G.usedHere=true;save();const d=CO.done;CO=null;if(d)d();}
function drawGrid(){if(!E||$('cleanout').classList.contains('hidden'))return;const now=performance.now();gx.clearRect(0,0,gW,gW);
  for(let r=0;r<7;r++)for(let c=0;c<7;c++){gx.fillStyle=(r+c)%2?'#2a5650':'#244d48';gx.fillRect(c*cell,r*cell,cell,cell);}
  for(let r=0;r<7;r++)for(let c=0;c<7;c++){const t=E.g[r][c];if(!t)continue;let d=disp.get(t.id);if(!d){d={x:c,y:-1-(6-r)*.15-Math.random()*.2};disp.set(t.id,d);}
    d.x+=(c-d.x)*.35;d.y+=(r-d.y)*.3;let x=d.x*cell,y=d.y*cell,s=cell;
    if(swapAnim&&now-swapAnim.t<200&&swapAnim.bad){const k=Math.sin((now-swapAnim.t)/200*Math.PI)*.25;if(r===swapAnim.a[0]&&c===swapAnim.a[1]){x+=(swapAnim.b[1]-c)*k*cell;y+=(swapAnim.b[0]-r)*k*cell;}if(r===swapAnim.b[0]&&c===swapAnim.b[1]){x+=(swapAnim.a[1]-c)*k*cell;y+=(swapAnim.a[0]-r)*k*cell;}}
    if(t.k==='tarp'){gx.drawImage(IMG.tarp,x+2,y+2,s-4,s-4);gx.fillStyle='#fff3d6';gx.font='900 '+(cell*.28)+'px system-ui';gx.textAlign='right';gx.fillText(t.layers>1?'×'+t.layers:'',x+s-5,y+s-6);if(t.find&&CO&&CO.def.peek){gx.globalAlpha=.75;gx.font=(cell*.36)+'px system-ui';gx.textAlign='left';gx.fillText(itemOf(t.find).emoji,x+4,y+cell*.38);gx.globalAlpha=1;}continue;}
    if(t.k==='find'){gx.font=(cell*.7)+'px system-ui';gx.textAlign='center';gx.fillText(itemOf(t.find).emoji,x+s/2,y+s*.75);continue;}
    const img=t.sp==='dolly'?IMG.dolly:t.sp==='gavel'?IMG.gavel:IMG[t.t];const sc=(sel&&sel[0]===r&&sel[1]===c)?1.08:.92;const pad=s*(1-sc)/2;if(sel&&sel[0]===r&&sel[1]===c){gx.fillStyle='#fff3c466';gx.fillRect(x,y,s,s);}
    if(img&&img.complete)gx.drawImage(img,x+pad,y+pad,s*sc,s*sc);if(t.sp==='wrap'){gx.strokeStyle='#9be8ff';gx.lineWidth=3;gx.strokeRect(x+4,y+4,s-8,s-8);}
    if(t.sp==='dolly'){gx.strokeStyle='#ffd36b';gx.lineWidth=2;gx.beginPath();t.dir==='h'?(gx.moveTo(x+3,y+s/2),gx.lineTo(x+s-3,y+s/2)):(gx.moveTo(x+s/2,y+3),gx.lineTo(x+s/2,y+s-3));gx.stroke();}}
  if(CO&&CO.hint&&now-CO.hint.t<1600){const h=CO.hint,a=Math.abs(Math.sin(now/180));gx.strokeStyle=`rgba(255,226,140,${a})`;gx.lineWidth=3;[h.a,h.b].forEach(p=>gx.strokeRect(p[1]*cell+3,p[0]*cell+3,cell-6,cell-6));}
  for(let i=pops.length-1;i>=0;i--){const p=pops[i],k=(now-p.t)/420;if(k>1){pops.splice(i,1);continue;}if(k<0)continue;const x=(p.c+.5)*cell,y=(p.r+.5)*cell;
    if(p.find){gx.globalAlpha=1-k;gx.font=(cell*(1+k))+'px system-ui';gx.textAlign='center';gx.fillText(p.find,x,y-k*cell*1.5);gx.globalAlpha=1;continue;}
    gx.strokeStyle=p.tarp?`rgba(255,200,120,${1-k})`:`rgba(255,240,200,${1-k})`;gx.lineWidth=3;gx.beginPath();gx.arc(x,y,cell*.2+k*cell*.45,0,7);gx.stroke();
    gx.fillStyle=`rgba(255,215,120,${1-k})`;for(let j=0;j<5;j++){const a=j/5*6.28+p.r;gx.fillRect(x+Math.cos(a)*k*cell*.6,y+Math.sin(a)*k*cell*.6,3,3);}}
  if(CO&&CO.celebrate&&now-CO.celebrate<1500){const k=(now-CO.celebrate)/1500;for(let n=0;n<60;n++){const a=n*2.39996,rad=k*gW*.7*(.4+(n%7)/10);gx.fillStyle=['#ffd36b','#6de1bd','#ff7a59','#fff3d6'][n%4];gx.globalAlpha=1-k;gx.fillRect(gW/2+Math.cos(a)*rad,gW/2+Math.sin(a)*rad+k*k*gW*.3,6,6);}
    gx.globalAlpha=Math.min(1,(1-k)*2);gx.fillStyle='#fff3d6';gx.strokeStyle='#17373a';gx.lineWidth=6;gx.textAlign='center';gx.font='900 '+Math.round(cell*.75)+'px system-ui';const y=gW/2+Math.sin(Math.min(1,k*4)*Math.PI/2)*0;gx.strokeText('LOCKER EMPTY!',gW/2,y);gx.fillText('LOCKER EMPTY!',gW/2,y);gx.globalAlpha=1;}}
// ---------- start ----------
function intro(){label('SUNNYVALE · FIRST FORTUNE','From $10 to an empire.','You have $10, a rusty pickup and a dream. The first locker is up for auction.');
  panel(`<div class="eyebrow">BOARD ADVENTURE · PLAYTEST</div><h2>Ten bucks. One rusty truck.</h2><p>Unload lockers with match-3 to earn rolls. Travel the board to sell, haggle and build your flea market into an empire.</p><button class="primary" data-act="start">START · BID $1 ON YOUR FIRST LOCKER</button><p class="note">Dice are earned only. Nothing is sold. Separate test save.</p>`);}
handlers.start=async()=>{if(busy)return;G.started=true;save();S3.followPirate();await wait(700);G.cash-=EC.locker(G.L);hud();sfx('coin');toast('SOLD! First locker for $1');await cleanout({kind:'small',price:1,title:'THE $1 LOCKER'});boardPanel();};

// ---------- perf / QA hooks ----------
const LAT=[];document.addEventListener('pointerdown',ev=>{const t=ev.timeStamp;requestAnimationFrame(()=>{LAT.push(performance.now()-t);if(LAT.length>200)LAT.shift();});},{capture:true});
let readyAt=null,qualityChecked=false;
S3.init($('world'),{spaces:BOARD,maxDpr:QS.get('dpr')?+QS.get('dpr'):2});if(QS.get('q')==='low')S3.setQuality('low');
S3.setFrameHook(()=>{drawGrid();if(!readyAt){readyAt=performance.now();}
  if(!qualityChecked&&readyAt&&performance.now()-readyAt>2000){qualityChecked=true;const n=Math.min(S3.perf.n-1,90);let t=0;for(let i=1;i<=n;i++)t+=S3.perf.frames[(S3.perf.fi-i+600)%600];if(n>0&&t/n>25&&QS.get('q')!=='high')S3.setQuality('low');}});
S3.placePirate(G.pos);hud();
if(G.active&&G.active.eng){const A=G.active;S3.followPirate();S3.snapCam();cleanout(A.o,A).then(()=>{checkpoint();boardPanel();});}
else if(G.started){S3.followPirate();S3.snapCam();boardPanel();}else{S3.overview();S3.snapCam();intro();}
window.BP={state:()=>({G:JSON.parse(JSON.stringify(G)),busy,clean:!!E,moves:E&&E.moves,left:E&&E.left(),tier:E&&CO&&CO.def.tierName,shoves:E&&E.shoves,status:E&&E.status(),modal:!$('modal').classList.contains('hidden'),panel:$('panel').classList.contains('hidden')?null:$('panel').innerText.slice(0,120)}),
  perf:()=>{const f=[],cpu=[],P=S3.perf,n=Math.min(P.n,600);for(let i=n;i>=1;i--){const k=(P.fi-i+600)%600;f.push(P.frames[k]);cpu.push(P.cpu[k]);}return {readyMs:readyAt,moduleStartMs:T0,total:P.n,frames:f,cpu,lat:LAT.slice(),info:S3.info(),heap:performance.memory?performance.memory.usedJSHeapSize:null};},
  bestMove:()=>E&&E.bestMove(),cellXY:(r,c)=>{const b=gcv.getBoundingClientRect();return {x:b.left+(c+.5)*cell,y:b.top+(r+.5)*cell};},
  debug:DEBUG?{set:(o)=>{Object.assign(G,o);hud();},win:()=>{if(E){haulRest('debug haul').then(checkEnd);}},land:()=>land(),panel:boardPanel,deck:()=>caseDeck&&caseDeck.map(c=>({e:c.e,l:c.l,won:!!c.won}))}:null};
