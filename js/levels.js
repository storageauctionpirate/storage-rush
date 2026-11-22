/* Storage Rush — Sunnyvale Storage campaign: 20 hand-authored levels, 3 rooms each (room 1 hand-made, rooms 2-3 built from it and ramped).
   Each board: moves, need, item types, tarps [row, col, layers, find|null], fixed pre-placed items,
   tutorial / teach flags and Scrapper mode. Item fill is seeded so every board is the same each time.
   Scrappers stay off for the first few units, are taught on Unit 7, then stay on and fair. */
(function(root){
'use strict';
const B=(o)=>Object.assign({types:6,scrapper:'off',pre:[]},o);
const YARD0={units:[
  {id:'Unit 1',name:'First Locker',theme:'indoor',boards:[
    B({seed:485,moves:28,need:1,clearTarps:true,types:6,tut:'swap',tarps:[[6,3,2,'guitar'],[6,1,2,null],[6,5,2,null]],pre:[[5,2,0],[5,4,0],[4,3,0],[5,3,1]]})]},
  {id:'Unit 2',name:'Clean Indoor Unit',theme:'indoor',boards:[
    B({seed:286,moves:26,need:3,types:6,tut:'layers',tarps:[[6,1,2,'jewelry'],[6,5,2,'camera'],[4,3,2,'guitar'],[3,0,1,null]]})]},
  {id:'Unit 3',name:'Clean Indoor Unit',theme:'indoor',boards:[
    B({seed:103,moves:20,need:3,tarps:[[5,1,2,'guitar'],[6,3,2,'jewelry'],[5,5,2,'camera']]})]},
  {id:'Unit 4',name:'Greasy Garage',theme:'garage',boards:[
    B({seed:104,moves:24,need:2,teach:'dolly',tarps:[[6,2,2,'camera'],[6,5,2,'guitar'],[4,0,1,null]],pre:[[2,1,2],[2,2,2],[2,3,3],[2,4,2],[1,3,2]]})]},
  {id:'Unit 5',name:'Greasy Garage',theme:'garage',boards:[
    B({seed:105,moves:23,need:2,tut:'layers',tarps:[[5,2,2,'safe'],[6,5,2,'jewelry'],[3,4,1,null]]})]},
  {id:'Unit 6',name:'Greasy Garage',theme:'garage',boards:[
    B({seed:106,moves:22,need:2,tut:'dummy',tarps:[[5,1,2,'guitar'],[6,4,3,'camera'],[3,3,2,null],[6,6,2,null],[3,0,1,null]]})]},
  {id:'Unit 7',name:'Sunnyvale Row',theme:'garage',boards:[
    B({seed:109,moves:20,need:2,scrapper:'teach',tarps:[[5,3,2,'jewelry'],[6,1,3,'guitar'],[6,5,2,null],[3,1,2,null]]})]},
  {id:'Unit 8',name:'Sunnyvale Row',theme:'garage',boards:[
    B({seed:107,moves:24,need:2,teach:'wrap',scrapper:'on',tarps:[[4,1,2,'jewelry'],[6,6,3,'safe'],[2,5,2,null]],pre:[[5,2,1],[5,3,1],[3,4,1],[4,4,1],[5,4,4],[5,5,1]]})]},
  {id:'Unit 9',name:'Outdoor Lot',theme:'yard',boards:[
    B({seed:110,moves:21,need:3,scrapper:'on',tarps:[[4,1,2,'camera'],[6,3,3,'safe'],[4,5,2,'guitar'],[2,3,2,null],[6,0,2,null]]})]},
  {id:'Unit 10',name:'Outdoor Lot',theme:'yard',boards:[
    B({seed:111,moves:22,need:2,scrapper:'on',teach:'gavel',tarps:[[6,2,3,'jewelry'],[6,5,3,'guitar'],[5,0,2,null]],pre:[[3,0,2],[3,1,2],[3,2,4],[3,3,2],[3,4,2],[2,2,2]]})]},
  {id:'Unit 11',name:'Outdoor Lot',theme:'yard',boards:[
    B({seed:112,moves:22,need:3,scrapper:'on',tarps:[[3,2,3,'guitar'],[6,4,3,'safe'],[5,0,2,'camera'],[6,2,2,null],[2,5,2,null]]})]},
  {id:'Unit 12',name:'Back Row',theme:'indoor',boards:[
    B({seed:113,moves:20,need:3,scrapper:'on',tarps:[[4,1,3,'jewelry'],[4,5,3,'camera'],[6,3,2,'guitar'],[2,3,2,null],[6,0,2,null]]})]},
  {id:'Unit 13',name:'Back Row',theme:'indoor',boards:[
    B({seed:114,moves:19,need:3,scrapper:'on',tarps:[[3,3,3,'safe'],[6,1,2,'guitar'],[5,5,3,'jewelry'],[6,3,2,null],[1,1,2,null]]})]},
  {id:'Unit 14',name:'Back Row',theme:'indoor',boards:[
    B({seed:115,moves:19,need:3,scrapper:'on',tarps:[[4,1,3,'camera'],[3,4,3,'guitar'],[6,3,2,'jewelry'],[6,6,3,'safe'],[2,1,2,null],[6,0,1,null]]})]},
  {id:'Unit 15',name:'Greasy Garage',theme:'garage',boards:[
    B({seed:116,moves:21,need:3,scrapper:'on',tarps:[[6,1,3,'safe'],[4,3,3,'guitar'],[6,5,3,'camera'],[2,2,2,null],[2,5,2,null]]})]},
  {id:'Unit 16',name:'Greasy Garage',theme:'garage',boards:[
    B({seed:117,moves:19,need:3,scrapper:'on',tarps:[[4,0,3,'jewelry'],[3,3,3,'safe'],[4,6,3,'guitar'],[6,3,2,'camera'],[1,3,2,null]]})]},
  {id:'Unit 17',name:'Outdoor Auction Yard',theme:'yard',boards:[
    B({seed:118,moves:20,need:3,scrapper:'on',tarps:[[6,2,3,'guitar'],[5,5,3,'safe'],[3,1,3,'camera'],[3,4,2,null],[1,2,2,null]]})]},
  {id:'Unit 18',name:'Outdoor Auction Yard',theme:'yard',boards:[
    B({seed:119,moves:18,need:3,scrapper:'on',tarps:[[4,1,3,'jewelry'],[4,4,3,'safe'],[6,3,3,'guitar'],[2,6,2,'camera'],[2,2,2,null]]})]},
  {id:'Unit 19',name:'The Big Row',theme:'yard',boards:[
    B({seed:120,moves:19,need:3,scrapper:'on',tarps:[[3,1,3,'jewelry'],[3,5,3,'safe'],[5,3,3,'guitar'],[6,0,3,'camera'],[1,3,2,null],[6,6,2,null]]})]},
  {id:'Unit 20',name:'The Big One',theme:'yard',boards:[
    B({seed:121,moves:19,need:3,scrapper:'on',tarps:[[4,2,3,'safe'],[4,5,3,'guitar'],[6,1,3,'camera'],[2,4,3,'jewelry'],[6,5,3,null],[2,0,2,null]]})]}
]};
/* rooms 2 and 3 of every unit: same unit theme, mirrored/shifted tarps, goals ramp a little each room and each unit.
   Units 1-2 stay gentle for onboarding. */
// fill seeds re-picked so every generated room wins 80%+ for the hint-only bot (test/sim.js)
const SEED_FIX={604:641,607:644,609:720,611:648,612:686,614:651,616:653,618:766,1007:1044,1009:1194,1012:1049,1014:1088,1016:1201,1017:1054,1018:1055};
const FIND_CYCLE=['guitar','camera','jewelry','safe'];
function roomsFor(b,ui){const gentle=ui<2,late=ui>=12,mid=ui>=6;
  const base=b.tarps.map(t=>t.slice());const finds=base.filter(t=>t[3]).length;
  const r2tarps=base.map(([r,c,l,f])=>[r,6-c,gentle?Math.min(l,2):l,f]);
  const r3tarps=base.map(([r,c,l,f])=>[Math.max(1,r-1),c,gentle?Math.min(l,2):Math.min(3,l+(late?1:0)),f]);
  if(!gentle){const used=new Set(r3tarps.map(t=>t[0]+','+t[1]));for(const [r,c] of [[6,3],[5,1],[5,5],[6,0],[6,6],[4,3]]){if(!used.has(r+','+c)){r3tarps.push([r,c,mid?3:2,FIND_CYCLE[ui%4]]);break;}}}
  const sc=b.scrapper==='teach'?'on':b.scrapper;
  const r2=B({seed:b.seed+500,moves:b.moves+(gentle?2:3),need:gentle?Math.min(2,finds):Math.min(finds,b.need),types:b.types,scrapper:sc,tarps:r2tarps});
  const f3=r3tarps.filter(t=>t[3]).length;
  const r3=B({seed:b.seed+900,moves:b.moves+(gentle?3:5),need:gentle?Math.min(2,f3):Math.min(f3,b.need+(mid?1:0)),types:b.types,scrapper:sc,tarps:r3tarps});
  [r2,r3].forEach(r=>{r.seed=SEED_FIX[r.seed]||r.seed;});return [r2,r3];}
const ROOM1_SEED={105:179,107:144,111:222,112:186,113:187,116:412,117:154,118:229,119:156,120:157};
// room ramp: Units 1-2 one room, Units 3-5 two rooms, Unit 6+ three rooms
function roomCount(ui){return ui<2?1:ui<5?2:3;}
const YARD1={id:'sunnyvale',name:'Sunnyvale Storage',nextWorld:'Desert Gold',units:YARD0.units.map((u,i)=>{const r1=Object.assign({},u.boards[0],{seed:ROOM1_SEED[u.boards[0].seed]||u.boards[0].seed});
  return Object.assign({},u,{boards:[r1].concat(roomsFor(u.boards[0],i)).slice(0,roomCount(i))});})};
const TUTORIAL={swap:'Swap two neighbors to make 3 in a row.',tarp:'Match right next to a tarp to rip it.',layers:'Chained tarps take 2 hits.',dummy:'Some tarps are just junk. Gold glint = a find!',
  dolly:'Match 4 to build a DOLLY!',wrap:'Match an L or T for BUBBLE WRAP!',gavel:'Match 5 in a row for the AUCTION GAVEL!'};
const MAP_PATH=[{n:1,x:0.47,y:0.926},{n:2,x:0.538,y:0.846},{n:3,x:0.574,y:0.774},{n:4,x:0.564,y:0.708},{n:5,x:0.514,y:0.656},{n:6,x:0.458,y:0.61},{n:7,x:0.395,y:0.57},{n:8,x:0.352,y:0.532},{n:9,x:0.336,y:0.497},{n:10,x:0.358,y:0.465},{n:11,x:0.408,y:0.436},{n:12,x:0.46,y:0.413},{n:13,x:0.512,y:0.393},{n:14,x:0.56,y:0.375},{n:15,x:0.596,y:0.354},{n:16,x:0.636,y:0.3375},{n:17,x:0.635,y:0.32},{n:18,x:0.608,y:0.305},{n:19,x:0.575,y:0.2935},{n:20,x:0.532,y:0.281}];
const api={YARD1,TUTORIAL,MAP_PATH,roomCount};
if(typeof module!=='undefined')module.exports=api;else root.LEVELS=api;
})(this);
