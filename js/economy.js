/* Storage Rush — money curve (pure, no DOM). Shared by the game and the Node sims (test/econ.js).
   Group plan, Nov 22: lockers start at $1 and grow about 10x every 20 levels, then a soft cap keeps late numbers readable.
   Every payout is scaled from the same curve, so a level always pays a few times its locker price.
   Nothing here is sold. Failed tries are never charged; the locker bid is paid once, out of the haul, when the unit is cleared. */
(function(root){
'use strict';
const E={};
// log10 of the raw locker price at level L (L = 1, 2, 3 ... across all worlds)
// L1-100: 10x every 20 levels. L101-200: 10x every 75. L201-500: 10x every 175. 500+: 10x every 250.
E.SEGS=[[1,100,20],[100,200,75],[200,500,175],[500,1e9,250]];
E.logP=function(L){L=Math.max(1,L);let lg=0;for(const [a,b,per] of E.SEGS){if(L<=a)break;lg+=(Math.min(L,b)-a)/per;}return lg;};
E.raw=function(L){return Math.pow(10,E.logP(L));};
// friendly price: $1-$9 whole dollars, then 2 significant figures, never below $1
E.nice=function(x){if(x<1)return 1;if(x<10)return Math.round(x);const d=Math.pow(10,Math.floor(Math.log10(x))-1);return Math.round(x/d)*d;};
// World 1 (Sunnyvale) has 10 units, later worlds 20 each.
E.WORLD_UNITS=function(w){return w<=1?10:20;};
E.levelOf=function(w,ui){let L=0;for(let k=1;k<w;k++)L+=E.WORLD_UNITS(k);return L+ui+1;};
E.worldOf=function(L){let w=1,s=0;while(L>s+E.WORLD_UNITS(w)){s+=E.WORLD_UNITS(w);w++;}return {world:w,ui:L-s-1};};
E.FINALE=3;                       // the last locker of a world is a premium "Big One"
E.locker=function(L,finale){return E.nice(E.raw(L)*(finale?E.FINALE:1));};
// item values: an item's ladder value x (js/items.js) times ITEM_K times the locker price
E.ITEM_K=0.3;
// cart of ordinary stuff: each matched item is worth ~1.5% of a locker; the lot is whole dollars, $1 minimum
E.CART_EACH=0.015;
E.cartEach=function(L){return E.raw(L)*E.CART_EACH;};
E.cartLot=function(L,n,bonus){return Math.max(1,Math.round(n*E.cartEach(L)*(bonus||1)));};
// HOT pays 1.5x per cart item, a Rush pays its multiplier (2x/3x/5x) — same rule as before, now on the curve
E.itemPay=function(L,meter,rushX,hot){return E.cartEach(L)*(rushX?rushX:meter>=hot?1.5:1);};
// earned bonus games, scaled by the locker price
E.BOX_X={common:4,rare:10,gold:25};
E.SAFE_X={common:8,rare:20,legendary:50};
E.box=function(tier,L){return E.nice(E.raw(L)*E.BOX_X[tier]);};
E.safe=function(rarity,L){return E.nice(E.raw(L)*E.SAFE_X[rarity]);};
// Unit 1 (the $1 locker from the opening auction): the lockbox holds a $40 Tin Robot, the cart lot is $8, the bid is $1
E.U1={robot:40,lot:8,bid:1};
E.FIRST_SALE=E.U1.robot+E.U1.lot-E.U1.bid;   // $47 banked after Unit 1
E.STALL_COST=40;                            // first Flea Market Stall, leaves $7; Unit 2 needs no cash
// short money: $1,234 up to $99,999, then $120K, $1.9M, $100M
E.fmt=function(n){n=Math.round(n);const a=Math.abs(n),s=n<0?'-':'';
  if(a<100000)return s+'$'+a.toLocaleString('en-US');
  const u=a>=1e9?[1e9,'B']:a>=1e6?[1e6,'M']:[1e3,'K'];const v=a/u[0];return s+'$'+(v>=100?Math.round(v):v>=10?Math.round(v*10)/10:Math.round(v*100)/100)+u[1];};
if(typeof module!=='undefined')module.exports=E;else root.ECON=E;
})(this);
