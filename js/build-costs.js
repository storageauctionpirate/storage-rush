/* Storage Rush — World 1 build prices (shared by the game and test/econ.js). Group plan, Nov 22.
   Priced from test/econ.js so a free player (no bonus games) can finish every build by Unit 10 with plain income. */
(function(root){
'use strict';
const SUNNYVALE=[{id:'flea',n:2,unlock:1,name:'Flea Market Stall',cost:40,w:1},{id:'truck',n:3,unlock:3,name:'The Pickup',cost:0,w:1.5},
  {id:'office',n:5,unlock:3,name:'Office',cost:10},{id:'units',n:7,unlock:4,name:'Unit Row',cost:15},{id:'sign',n:9,unlock:5,name:'Sunnyvale Sign',cost:15},
  {id:'thrift',n:11,unlock:6,name:'Thrift Shop',cost:20},{id:'garage',n:13,unlock:7,name:'Garage',cost:25},{id:'pawn',n:15,unlock:8,name:'Pirate Pawn',cost:30},{id:'warehouse',n:17,unlock:9,name:'Warehouse',cost:50}];
const PICKUP=[{id:'wash',name:'Lift kit & chrome rims',price:5,at:3},{id:'fender',name:'Light bar & hood stripe',price:8,at:5},{id:'visor',name:'Loaded cargo rack',price:10,at:7},{id:'hitch',name:'Pirate trailer',price:15,at:9}];
const YARD=[{id:'truck',name:'Buy a hand truck',price:6},{id:'canopy',name:'Put up a canopy',price:8},{id:'second',name:'Rent a second locker',price:10}];
const api={SUNNYVALE,PICKUP,YARD};
if(typeof module!=='undefined')module.exports=api;else root.BUILDS=api;
})(this);
