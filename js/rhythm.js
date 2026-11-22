/* Storage Rush — reward rhythm rules (pure, no DOM). Shared by the game and the Node sims.
   Everything here is earned in play. Nothing is sold, and no chance roll can be bought. */
(function(root){
'use strict';
const R={};
R.FIRST_SALE=474;            // Unit 1: guitar $350 + cart lot $124, always exactly $474
R.STALL_COST=400;            // first Flea Market Stall, paid from that sale, leaves $74
R.METER=100;
R.HOT=50;                    // meter at 50%+ = HOT: cart items pay $3 instead of $2
R.LADDER=[2,3,5];            // 1st Rush in a unit = 2X, 2nd = 3X, 3rd and later = 5X
R.RUSH_FROM=2;               // unit index: Rush Meter shows from Unit 3
R.BOX_FROM=2;                // unit index: Mystery Box can drop from Unit 3 (playtest Nov 22: first bonus by Unit 3)
R.RUSH_MOVES=6;              // a Rush lasts 6 moves, the bar drains one notch per move, then it ends clearly
R.FIRST_RUSH=60;             // the very first Rush ever fills at 60% so new players feel it in Unit 3
R.FIND_GAIN=6;               // putting a find on the cart adds to the meter
R.RETURN_BOOST=20;           // after a big payoff unit, the next unit starts with the meter at 20%
// meter gain for one cascade step: chain 2+ is what fills it (cascades), specials and reveals help
R.gain=function(chain,cleared,fired,revealed){return (chain>=2?4*(chain-1):0)+fired*5+revealed*3;};
R.mult=function(rushNo){return R.LADDER[Math.min(R.LADDER.length-1,Math.max(0,rushNo-1))];};
// cart item pay while HOT or in a Rush (base $2)
R.itemPay=function(meter,rushX){return rushX?2*rushX:meter>=R.HOT?3:2;};
// Mystery Box: earned by one move that chains 5+ or fires an Auction Gavel. One per unit.
// Also earned by clearing a room: the first room cleared in Unit 3+ when no box was ever opened (first bonus),
// and the last room of a unit when the unit before it had no bonus game (so one comes at least every 2 units).
R.boxEarned=function(chain,firedKinds){return chain>=5||firedKinds.some(k=>k==='gavel');};
R.clearBox=function(o){return !!(o.eligible&&!o.hasBox&&((!o.boxSeen)||(o.lastRoom&&!o.bonusThisUnit&&(o.dry||0)>=1)));};
// disclosed odds; every box pays cash AND one extra (booster or meter fill). M = world value boost.
R.BOX_ODDS=[['common',.60],['rare',.30],['gold',.10]];
R.BOX={common:{cash:150,extra:'booster',label:'Common'},rare:{cash:400,extra:'meter',label:'Rare'},gold:{cash:900,extra:'both',label:'Gold'}};
R.rollBox=function(rnd,M){const r=rnd();let acc=0,tier='common';for(const [t,p] of R.BOX_ODDS){acc+=p;if(r<acc){tier=t;break;}}
  const b=R.BOX[tier],boosters=['cut','flash','free'],item=['guitar','camera','jewelry','treasure'][Math.floor(rnd()*4)];
  return {tier,cash:Math.round(b.cash*(M||1)),booster:(b.extra==='booster'||b.extra==='both')?boosters[Math.floor(rnd()*3)]:null,meter:(b.extra==='meter'||b.extra==='both')?50:0,item};};
// Safe Cracker: earned by a Safe find, or by reaching a 3X Rush in the unit. Odds 60/30/10 (disclosed).
// Guarantees: the first safe ever is Rare or better; a 5X Rush safe is Rare or better; never more than 3 Commons in a row.
R.SAFE_PAY={common:300,rare:700,legendary:1600};
R.safeEarned=function(haul,bestRush){return haul.includes('safe')||bestRush>=3;};
R.rollSafe=function(rnd,o){o=o||{};const r=rnd();let t=r<.60?'common':r<.90?'rare':'legendary';
  if(t==='common'&&(o.first||o.bestRush>=5||(o.commons||0)>=3))t='rare';return t;};
// payout scaling for later worlds (design Page formula 1): M(w)=1.25^(w-1)
R.M=function(world){return Math.pow(1.25,Math.max(0,(world||1)-1));};
if(typeof module!=='undefined')module.exports=R;else root.RHYTHM=R;
})(this);
