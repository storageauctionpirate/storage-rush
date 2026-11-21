/* Storage Rush — Yard 1 campaign: 12 units, 21 hand-authored boards.
   Each board: moves, need, item types, tarps [row, col, layers, find|null], fixed pre-placed items [row, col, type],
   tutorial / teach flags and Scrapper mode. Item fill is seeded so every board is the same each time. */
(function(root){
'use strict';
const B=(o)=>Object.assign({types:6,scrapper:'off',pre:[]},o);
const YARD1={id:'yard1',name:"Pirate's First Yard",units:[
  {id:'Unit 12',name:'Clean Indoor Unit',theme:'indoor',boards:[
    B({seed:101,moves:22,need:1,types:5,tut:'swap',tarps:[[6,3,2,'guitar']],pre:[[5,2,0],[5,4,0],[4,3,0],[5,3,1]]})]},
  {id:'Unit 14',name:'Clean Indoor Unit',theme:'indoor',boards:[
    B({seed:102,moves:20,need:2,types:5,tut:'tarp',tarps:[[6,1,2,'jewelry'],[6,5,2,'camera']]})]},
  {id:'Unit 19',name:'Clean Indoor Unit',theme:'indoor',boards:[
    B({seed:103,moves:20,need:3,tarps:[[5,1,2,'guitar'],[6,3,2,'jewelry'],[5,5,2,'safe']]})]},
  {id:'Unit 27',name:'Greasy Garage',theme:'garage',boards:[
    B({seed:104,moves:24,need:2,teach:'dolly',tarps:[[6,2,2,'camera'],[6,5,2,'guitar'],[4,0,1,null]],pre:[[2,1,2],[2,2,2],[2,3,3],[2,4,2],[1,3,2]]}),
    B({seed:105,moves:23,need:2,tut:'layers',tarps:[[5,2,2,'safe'],[6,5,2,'jewelry'],[3,4,1,null]]})]},
  {id:'Unit 31',name:'Greasy Garage',theme:'garage',boards:[
    B({seed:106,moves:22,need:2,tut:'dummy',tarps:[[5,1,2,'guitar'],[6,4,3,'camera'],[3,3,2,null],[6,6,2,null],[3,0,1,null]]}),
    B({seed:107,moves:24,need:2,teach:'wrap',tarps:[[4,1,2,'jewelry'],[6,6,3,'safe'],[2,5,2,null]],pre:[[5,2,1],[5,3,1],[3,4,1],[4,4,1],[5,4,4],[5,5,1]]})]},
  {id:'Unit 33',name:'Greasy Garage',theme:'garage',boards:[
    B({seed:108,moves:18,need:3,tarps:[[4,1,2,'guitar'],[6,3,3,'safe'],[4,5,2,'camera'],[6,0,2,null],[2,3,2,null]]}),
    B({seed:109,moves:20,need:2,scrapper:'teach',tarps:[[5,3,2,'jewelry'],[6,1,3,'guitar'],[6,5,2,null],[3,1,2,null]]})]},
  {id:'Lot 9',name:'Outdoor Auction Yard',theme:'yard',boards:[
    B({seed:110,moves:21,need:3,scrapper:'on',tarps:[[4,1,2,'camera'],[6,3,3,'safe'],[4,5,2,'guitar'],[2,3,2,null],[6,0,2,null]]}),
    B({seed:111,moves:22,need:2,scrapper:'on',teach:'gavel',tarps:[[6,2,3,'jewelry'],[6,5,3,'guitar'],[5,0,2,null]],pre:[[3,0,2],[3,1,2],[3,2,4],[3,3,2],[3,4,2],[2,2,2]]})]},
  {id:'Lot 11',name:'Outdoor Auction Yard',theme:'yard',boards:[
    B({seed:112,moves:22,need:3,scrapper:'on',tarps:[[3,2,3,'guitar'],[6,4,3,'safe'],[5,0,2,'camera'],[6,2,2,null],[2,5,2,null]]}),
    B({seed:113,moves:20,need:3,scrapper:'on',tarps:[[4,1,3,'jewelry'],[4,5,3,'camera'],[6,3,2,'guitar'],[2,3,2,null],[6,0,2,null]]})]},
  {id:'Unit 40',name:'Clean Indoor Unit',theme:'indoor',boards:[
    B({seed:114,moves:19,need:3,scrapper:'on',tarps:[[3,3,3,'safe'],[6,1,2,'guitar'],[5,5,3,'jewelry'],[6,3,2,null],[1,1,2,null]]}),
    B({seed:115,moves:19,need:3,scrapper:'on',tarps:[[4,1,3,'camera'],[3,4,3,'guitar'],[6,3,2,'jewelry'],[6,6,3,'safe'],[2,1,2,null],[6,0,1,null]]})]},
  {id:'Unit 44',name:'Greasy Garage',theme:'garage',boards:[
    B({seed:116,moves:21,need:3,scrapper:'on',tarps:[[6,1,3,'safe'],[4,3,3,'guitar'],[6,5,3,'camera'],[2,2,2,null],[2,5,2,null]]}),
    B({seed:117,moves:19,need:3,scrapper:'on',tarps:[[4,0,3,'jewelry'],[3,3,3,'safe'],[4,6,3,'guitar'],[6,3,2,'camera'],[1,3,2,null]]})]},
  {id:'Lot 15',name:'Outdoor Auction Yard',theme:'yard',boards:[
    B({seed:118,moves:20,need:3,scrapper:'on',tarps:[[6,2,3,'guitar'],[5,5,3,'safe'],[3,1,3,'camera'],[3,4,2,null],[1,2,2,null]]}),
    B({seed:119,moves:18,need:3,scrapper:'on',tarps:[[4,1,3,'jewelry'],[4,4,3,'safe'],[6,3,3,'guitar'],[2,6,2,'camera'],[2,2,2,null]]})]},
  {id:'The Big One',name:'Outdoor Auction Yard',theme:'yard',boards:[
    B({seed:120,moves:19,need:3,scrapper:'on',tarps:[[3,1,3,'jewelry'],[3,5,3,'safe'],[5,3,3,'guitar'],[6,0,3,'camera'],[1,3,2,null],[6,6,2,null]]}),
    B({seed:121,moves:19,need:3,scrapper:'on',tarps:[[4,2,3,'safe'],[4,5,3,'guitar'],[6,1,3,'camera'],[2,4,3,'jewelry'],[6,5,3,null],[2,0,2,null]]})]}
]};
const TUTORIAL={swap:'Swap two neighbors to make 3 in a row.',tarp:'Match right next to a tarp to rip it.',layers:'Chained tarps take 2 hits.',dummy:'Some tarps are just junk. Gold glint = a find!',
  dolly:'Match 4 to build a DOLLY!',wrap:'Match an L or T for BUBBLE WRAP!',gavel:'Match 5 in a row for the AUCTION GAVEL!'};
const api={YARD1,TUTORIAL};
if(typeof module!=='undefined')module.exports=api;else root.LEVELS=api;
})(this);
