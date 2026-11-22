/* Storage Rush — item ladder (pure data + picks, no DOM). Shared by the game and the Node sims.
   Every item has a value (a multiple "x" of the locker price at the level it is found, capped at its tier's top level),
   a rarity, and a collection set. Contents grow with the locker price: cheap household stuff first, museum pieces last.
   Tiers (group plan, Nov 22):
     T1  L1-10    household: books, mugs, lamps, basic tools, toys, kitchen
     T2  L11-25   small electronics, fishing gear, vintage toys, radios
     T3  L26-50   better tools, bikes, consoles, collectibles
     T4  L51-100  instruments, antiques, jewelry, rare collectibles
     T5  L101-200 designer furniture, big collections, vintage machines
     T6  L201-350 rare antiques, premium collections, historical artifacts
     T7  L351-500 museum-quality and legendary pieces
     500+        new worlds bring new categories, variants (Gold / Mint editions) and themed collections (TIER_PLAN_500).
   No guitars, expensive cameras or big safes before T3/T4. */
(function(root){
'use strict';
const TIERS=[{t:1,from:1,to:10,name:'Household'},{t:2,from:11,to:25,name:'Small Electronics & Vintage Toys'},{t:3,from:26,to:50,name:'Garage Gear & Collectibles'},
  {t:4,from:51,to:100,name:'Instruments, Antiques & Jewelry'},{t:5,from:101,to:200,name:'Designer & Vintage Machines'},{t:6,from:201,to:350,name:'Specialty & Historical'},
  {t:7,from:351,to:500,name:'Museum & Legendary'}];
const TIER_PLAN_500=['World themes past L500 (Harbor, Mountain, Mansion...) each add a new category pool',
  'Variants of known items: Mint, Gold, Signed, First Edition (value x2-x5, same set slot)','Themed collections that span every tier (a $3 toy can finish a set at L400)'];
const RAR=['junk','common','uncommon','rare','epic','legendary'];
const RAR_COL={junk:'#8d8d8d',common:'#d7dce2',uncommon:'#7bd389',rare:'#4fc3f7',epic:'#c08cff',legendary:'#ffcf44'};
// [id, name, emoji, x (multiple of locker), rarity, set, tier, art?]
const RAW=[
 // ---- T1 household (L1-10) ----
 ['books','Paperback Books','📚',1,'common','reading',1],['mug','Coffee Mug','☕',1,'common','kitchen',1],['lamp','Desk Lamp','💡',2,'common','reading',1],
 ['hammer','Claw Hammer','🔨',2,'common','tools',1],['wrench','Wrench','🔧',2,'common','tools',1],['screwdriver','Screwdriver Set','🪛',2,'common','tools',1],
 ['teddy','Teddy Bear','🧸',2,'common','toys',1],['pan','Frying Pan','🍳',1,'common','kitchen',1],['teapot','Teapot','🫖',3,'common','kitchen',1],
 ['clock','Alarm Clock','⏰',2,'common','reading',1],['flashlight','Flashlight','🔦',1,'common','tools',1],['yoyo','Yo-Yo','🪀',1,'common','toys',1],
 ['puzzle','Jigsaw Puzzle','🧩',1,'common','toys',1],['dice','Dice Set','🎲',1,'common','toys',1],['candle','Candles','🕯️',1,'common','reading',1],
 ['frame','Picture Frame','🖼️',2,'common','reading',1],['plant','Potted Plant','🪴',1,'common',null,1],['sneakers','Old Sneakers','👟',2,'common',null,1],
 ['cap','Ball Cap','🧢',1,'common',null,1],['basket','Picnic Basket','🧺',1,'common','kitchen',1],['kite','Kite','🪁',2,'common','toys',1],
 ['cookiejar','Cookie Jar','🍪',2,'common','kitchen',1],['umbrella','Umbrella','☂️',1,'common',null,1],['scissors','Scissors','✂️',1,'common','tools',1],
 ['toolbox','Toolbox','🧰',6,'uncommon','tools',1],['boardgame','Chess Set','♟️',5,'uncommon','toys',1],['skates','Roller Skates','🛼',7,'uncommon','toys',1],
 ['lunchbox','Bento Lunchbox','🍱',4,'uncommon','kitchen',1],['baseball','Baseball','⚾',4,'uncommon','sports',1],['basketball','Basketball','🏀',5,'uncommon','sports',1],
 ['racket','Tennis Racket','🎾',6,'uncommon','sports',1],['hourglass','Hourglass','⏳',6,'uncommon','reading',1],['lantern','Paper Lantern','🏮',4,'uncommon',null,1],
 ['tinrobot','Tin Robot','🤖',40,'rare','shelf',1],['silverdollar','Silver Dollar','🪙',30,'rare','shelf',1],['card','Rookie Card','🃏',25,'rare','shelf',1],
 ['stamp','Rare Stamp','📮',20,'rare','shelf',1],['marbles','Glass Marbles','🔮',15,'rare','toys',1],
 ['lockbox','Rusty Lockbox','🔒',0,'uncommon',null,1,'lockbox'],['oldsafe','Old Locked Safe','🔒',0,'uncommon',null,1,'lockbox'],
 // ---- T2 small electronics, fishing, vintage toys, radios (L11-25) ----
 ['radio','Transistor Radio','📻',8,'uncommon','radio',2],['rod','Fishing Rod','🎣',6,'uncommon','fishing',2],['tackle','Tackle Box','🪝',4,'common','fishing',2],
 ['joystick','Arcade Joystick','🕹️',7,'uncommon','games',2],['gamepad','Game Controller','🎮',6,'uncommon','games',2],['headphones','Headphones','🎧',5,'uncommon','radio',2],
 ['vhs','VHS Tapes','📼',2,'common','radio',2],['phone','Rotary Phone','☎️',9,'uncommon','radio',2],['train','Toy Train','🚂',12,'rare','toys',2],
 ['racecar','Toy Race Car','🏎️',8,'uncommon','toys',2],['dolls','Nesting Dolls','🪆',7,'uncommon','toys',2],['mic','Old Microphone','🎙️',10,'uncommon','radio',2],
 ['suitcase','Old Suitcase','🧳',3,'common',null,2],['tent','Camping Tent','⛺',4,'common','fishing',2],['pager','Pager','📟',2,'common','radio',2],
 ['floppy','Floppy Disks','💾',1,'common','games',2],['cds','CD Stack','💿',2,'common','radio',2],['calculator','Calculator','🧮',2,'common',null,2],
 ['fishnet','Fishing Net','🐟',3,'common','fishing',2],['comic','Mint Comic Book','📕',30,'rare','shelf',2],['signedball','Signed Baseball','⚾',35,'rare','sports',2],
 ['telescope','Brass Telescope','🔭',60,'epic','shelf',2],['lockbox2','Steel Lockbox','🔒',0,'uncommon',null,2,'lockbox'],
 // ---- T3 better tools, bikes, consoles, collectibles (L26-50) ----
 ['bike','Bicycle','🚲',8,'uncommon','garage',3],['console','Retro Console','👾',10,'uncommon','games',3],['drill','Power Drill','🔩',4,'common','tools',3],
 ['skateboard','Skateboard','🛹',5,'common','sports',3],['tv','Retro TV','📺',6,'uncommon','radio',3],['records','Record Collection','💽',9,'uncommon','radio',3],
 ['trophy','Old Trophy','🏆',4,'common','sports',3],['reel','Film Reel','🎞️',5,'common',null,3],['compass','Brass Compass','🧭',7,'uncommon','shelf',3],
 ['watch','Wristwatch','⌚',20,'rare','jewelry',3],['sewing','Sewing Machine','🧵',6,'uncommon',null,3],['camera','Vintage Camera','📷',30,'rare','shelf',3,'camera'],
 ['helmet','Bike Helmet','⛑️',2,'common','garage',3],['tires','Spare Tires','🛞',2,'common','garage',3],['neon','Neon Sign','🪧',40,'epic','garage',3,'neon'],
 ['floorsafe','Floor Safe','🔒',0,'uncommon',null,3,'lockbox'],
 // ---- T4 instruments, antiques, jewelry, rare collectibles (L51-100) ----
 ['guitar','Guitar','🎸',12,'uncommon','music',4,'guitar'],['sax','Saxophone','🎷',14,'uncommon','music',4],['violin','Violin','🎻',20,'rare','music',4],
 ['trumpet','Trumpet','🎺',10,'uncommon','music',4],['accordion','Accordion','🪗',9,'uncommon','music',4],['vase','Antique Vase','🏺',25,'rare','antique',4],
 ['jewelry','Jewelry Box','💍',30,'rare','jewelry',4,'jewelry'],['gem','Loose Gemstone','💎',80,'epic','jewelry',4],['banjo','Banjo','🪕',8,'common','music',4],
 ['drum','Drum Kit','🥁',7,'common','music',4],['mirror','Antique Mirror','🪞',6,'common','antique',4],['chair','Antique Chair','🪑',5,'common','antique',4],
 ['safe','Wall Safe','🔒',0,'uncommon',null,4,'safe'],
 // ---- T5 designer furniture, collections, vintage machines (L101-200) ----
 ['sofa','Designer Sofa','🛋️',10,'uncommon','designer',5],['grandclock','Grandfather Clock','🕰️',14,'uncommon','antique',5],['moto','Vintage Motorcycle','🏍️',30,'rare','garage',5],
 ['piano','Grand Piano','🎹',40,'rare','music',5],['car','Classic Car','🚗',120,'epic','garage',5],['bed','Designer Bed','🛏️',6,'common','designer',5],
 ['lamp2','Designer Lamp','🪔',5,'common','designer',5],['typewriter','Typewriter','⌨️',8,'common','radio',5],
 // ---- T6 rare antiques, premium collections, historical artifacts (L201-350) ----
 ['sword','Antique Sword','🗡️',14,'uncommon','history',6],['scroll','Historic Scroll','📜',25,'rare','history',6],['crown','Jeweled Crown','👑',120,'epic','jewelry',6],
 ['fossil','Fossil','🦴',10,'uncommon','history',6],['shield','Knight Shield','🛡️',12,'uncommon','history',6],['coinhoard','Roman Coin Hoard','🪙',40,'rare','shelf',6],
 ['map','Old Treasure Map','🗺️',8,'common','history',6],['amphora','Amphora','⚱️',7,'common','antique',6],
 // ---- T7 museum-quality and legendary (L351-500) ----
 ['dino','Dinosaur Skull','🦖',150,'epic','history',7],['statue','Stone Statue','🗿',60,'rare','history',7],['bluegem','Legendary Gem','💠',400,'legendary','jewelry',7],
 ['medal','Historic Medal','🎖️',20,'uncommon','history',7],['treasure','Treasure Chest','💰',500,'legendary','shelf',7,'treasure'],['tapestry','Royal Tapestry','🧶',15,'uncommon','antique',7]
];
// cart filler: ordinary stuff, some of it worthless (value x0)
const JUNK=['Bent Spoon','Odd Socks','Broken Umbrella','Old Magazines','Cracked Plate','Tangled Cords','Empty Jar','Lone Shoe','Rusty Nails','Dusty Rug'];
const CAT=RAW.map(a=>({id:a[0],name:a[1],emoji:a[2],x:a[3],rarity:a[4],set:a[5],tier:a[6],art:a[7]||null,lockbox:a[7]==='lockbox'||a[7]==='safe'}));
const BY={};CAT.forEach(i=>BY[i.id]=i);
const SETS={reading:{name:'Reading Nook',x:6},kitchen:{name:'Kitchen Drawer',x:6},tools:{name:'Tool Bench',x:8},toys:{name:'Toy Box',x:10},sports:{name:'Sports Shelf',x:8},
  shelf:{name:"Collector's Shelf",x:40},radio:{name:'Radio Days',x:12},fishing:{name:'Tackle Shop',x:10},games:{name:'Game Room',x:12},garage:{name:'Garage Classics',x:15},
  music:{name:'Band Room',x:20},antique:{name:'Antique Parlor',x:20},jewelry:{name:'Jewel Case',x:40},designer:{name:'Designer Loft',x:20},history:{name:'History Hall',x:40}};
Object.keys(SETS).forEach(s=>SETS[s].items=CAT.filter(i=>i.set===s).map(i=>i.id));
function tierAt(L){for(const t of TIERS)if(L<=t.to)return t.t;return 7;}
function tierInfo(t){return TIERS[Math.min(7,Math.max(1,t))-1];}
function get(id){return BY[id]||null;}
// value of an item found at level L: x times the locker price, but capped at the top of the item's own tier
// (so an old $3 toy stays a $3 toy late in the game; it matters there because it can finish a set)
function value(id,L,ECON){const i=BY[id];if(!i)return 0;const t=tierInfo(i.tier);return i.x<=0?0:Math.max(1,ECON.nice(i.x*(ECON.ITEM_K||1)*ECON.raw(Math.min(L,t.to))));}
// a tarp slot: 'c' ordinary find, 'u' good find (small chance of a surprise collectible), 'r' collectible, 'lock' lockbox (opens the Safe Cracker)
const SLOT={c:[['common',.85],['uncommon',.15]],u:[['uncommon',.80],['rare',.18],['epic',.02]],r:[['rare',.80],['epic',.18],['legendary',.02]]};
const LEGACY={guitar:'u',camera:'u',jewelry:'u',safe:'lock',neon:'r',treasure:'r'};
function pool(t,rar){return CAT.filter(i=>i.tier===t&&i.rarity===rar&&!i.lockbox);}
function pick(slot,L,rnd,o){o=o||{};slot=LEGACY[slot]||slot;const t=tierAt(L);
  if(slot==='hook')return 'oldsafe';
  if(slot==='lock'){let k=t;while(k>1&&!CAT.some(i=>i.tier===k&&i.lockbox&&i.id!=='oldsafe'))k--;return CAT.find(i=>i.tier===k&&i.lockbox&&i.id!=='oldsafe').id;}
  const odds=SLOT[slot]||SLOT.c;let r=rnd(),acc=0,rar=odds[0][0];for(const [q,p] of odds){acc+=p;if(r<acc){rar=q;break;}}
  if(o.noRare&&(rar==='rare'||rar==='epic'||rar==='legendary'))rar='uncommon';
  // 1 in 10 finds past the first world is a throwback: a missing piece of a set you have started
  if(o.owned&&L>10&&rnd()<.1){const miss=CAT.filter(i=>i.set&&i.tier<t&&!i.lockbox&&!o.owned[i.id]&&SETS[i.set].items.some(k=>o.owned[k]));if(miss.length)return miss[Math.floor(rnd()*miss.length)].id;}
  // mostly this tier, sometimes one tier back (ordinary leftovers)
  let tt=t>1&&rnd()<.2?t-1:t,p=pool(tt,rar);while(!p.length&&tt>1){tt--;p=pool(tt,rar);}if(!p.length){const down=['legendary','epic','rare','uncommon','common'];for(let j=down.indexOf(rar)+1;j<down.length&&!p.length;j++)p=pool(t,down[j]);}// no epic in this tier yet: next rarity down, never straight to common
  return p[Math.floor(rnd()*p.length)].id;}
// the cart of ordinary stuff, itemized for the flip receipt: about 15 objects, some worthless
function cartList(L,n,rnd){const t=tierAt(L),k=Math.max(3,Math.min(15,Math.round(n/4))),out=[];const com=pool(t,'common').concat(t>1?pool(t-1,'common'):[]);
  for(let j=0;j<k;j++){if(rnd()<.3)out.push({name:JUNK[Math.floor(rnd()*JUNK.length)],junk:true});else{const i=com[Math.floor(rnd()*com.length)];out.push({name:i.name,emoji:i.emoji});}}return out;}
// collections: owned = {id:count}. Returns the set ids that this new item completes.
function completes(id,owned){const i=BY[id];if(!i||!i.set)return [];const s=SETS[i.set];if(owned[id])return [];return s.items.every(k=>k===id||owned[k])?[i.set]:[];}
function setBonus(set,L,ECON){return ECON.nice(SETS[set].x*(ECON.ITEM_K||1)*ECON.raw(L));}
const api={TIERS,TIER_PLAN_500,RAR,RAR_COL,CAT,SETS,JUNK,get,tierAt,tierInfo,value,pick,cartList,completes,setBonus,SLOT};
if(typeof module!=='undefined')module.exports=api;else root.ITEMS=api;
})(this);
