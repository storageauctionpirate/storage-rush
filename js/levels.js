/* Storage Rush — Sunnyvale Storage campaign: 20 hand-authored levels (one board each).
   Each board: moves, need, item types, tarps [row, col, layers, find|null], fixed pre-placed items,
   tutorial / teach flags and Scrapper mode. Item fill is seeded so every board is the same each time.
   Scrappers stay off for the first few units, are taught on Unit 7, then stay on and fair. */
(function(root){
'use strict';
const B=(o)=>Object.assign({types:6,scrapper:'off',pre:[]},o);
const YARD1={id:'sunnyvale',name:'Sunnyvale Storage',nextWorld:'Desert Gold',units:[
  {id:'Unit 1',name:'First Locker',theme:'indoor',boards:[
    B({seed:101,moves:22,need:1,types:5,tut:'swap',tarps:[[6,3,2,'guitar']],pre:[[5,2,0],[5,4,0],[4,3,0],[5,3,1]]})]},
  {id:'Unit 2',name:'Clean Indoor Unit',theme:'indoor',boards:[
    B({seed:102,moves:20,need:2,types:5,tut:'tarp',tarps:[[6,1,2,'jewelry'],[6,5,2,'camera']]})]},
  {id:'Unit 3',name:'Clean Indoor Unit',theme:'indoor',boards:[
    B({seed:103,moves:20,need:3,tarps:[[5,1,2,'guitar'],[6,3,2,'jewelry'],[5,5,2,'safe']]})]},
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
const TUTORIAL={swap:'Swap two neighbors to make 3 in a row.',tarp:'Match right next to a tarp to rip it.',layers:'Chained tarps take 2 hits.',dummy:'Some tarps are just junk. Gold glint = a find!',
  dolly:'Match 4 to build a DOLLY!',wrap:'Match an L or T for BUBBLE WRAP!',gavel:'Match 5 in a row for the AUCTION GAVEL!'};
const MAP_PATH=[{n:1,x:0.47,y:0.926},{n:2,x:0.538,y:0.846},{n:3,x:0.574,y:0.774},{n:4,x:0.564,y:0.708},{n:5,x:0.514,y:0.656},{n:6,x:0.458,y:0.61},{n:7,x:0.395,y:0.57},{n:8,x:0.352,y:0.532},{n:9,x:0.336,y:0.497},{n:10,x:0.358,y:0.465},{n:11,x:0.408,y:0.436},{n:12,x:0.46,y:0.413},{n:13,x:0.512,y:0.393},{n:14,x:0.56,y:0.375},{n:15,x:0.596,y:0.354},{n:16,x:0.636,y:0.3375},{n:17,x:0.635,y:0.32},{n:18,x:0.608,y:0.305},{n:19,x:0.575,y:0.2935},{n:20,x:0.532,y:0.281}];
const api={YARD1,TUTORIAL,MAP_PATH};
if(typeof module!=='undefined')module.exports=api;else root.LEVELS=api;
})(this);
