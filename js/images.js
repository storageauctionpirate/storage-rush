/* Storage Rush — load local art-sheet assets. No network. CSP-safe (img-src 'self'). */
(function(root){
'use strict';
const FILES={
  tote:'assets/pieces/tote.png', box:'assets/pieces/box.png', crate:'assets/pieces/crate.png',
  lamp:'assets/pieces/lamp.png', toy:'assets/pieces/toy.png', treasure:'assets/pieces/treasure.png',
  guitar:'assets/finds/guitar.png', jewelry:'assets/finds/jewelry.png', camera:'assets/finds/camera.png', tarp:'assets/finds/tarp.png',
  safe:'assets/safes/rare.png',
  dolly:'assets/specials/dolly.png', gavel:'assets/specials/gavel.png',
  'hustler-idle':'assets/chars/hustler-idle.png', 'hustler-walk':'assets/chars/hustler-walk.png',
  'hustler-cheer':'assets/chars/hustler-cheer.png', 'hustler-token':'assets/chars/hustler-token.png',
  'scrapper-bust':'assets/chars/scrapper-bust.png',
  'safe-common':'assets/safes/common.png', 'safe-rare':'assets/safes/rare.png', 'safe-legendary':'assets/safes/legendary.png',
  'front-common':'assets/safes/front-common.png', 'front-rare':'assets/safes/front-rare.png', 'front-legendary':'assets/safes/front-legendary.png',
  'truck-before':'assets/chars/truck-before.png', 'truck-after':'assets/chars/truck-after.png',
  'ic-cut':'assets/ui/cutters.png', 'ic-flash':'assets/ui/flashlight.png', 'ic-free':'assets/ui/swap.png',
  'bg-door':'assets/bg/unit-door.jpg', 'bg-map':'assets/bg/map-clean.jpg', 'bg-flea':'assets/bg/flea-empty.jpg',
  'bg-truck':'assets/bg/truck-lot.jpg', 'bg-safe':'assets/bg/vault-room.jpg', 'bg-desert':'assets/bg/desert-gold.jpg',
  'bg-terrain':'assets/bg/terrain.jpg', 'bg-maptop':'assets/bg/map-top.png',
  'lm-truck':'assets/landmarks/truck.png', 'lm-truck-b':'assets/landmarks/truck-b.png',
  'lm-sign':'assets/landmarks/sign.png', 'lm-sign-b':'assets/landmarks/sign-b.png',
  'lm-office':'assets/landmarks/office.png', 'lm-office-b':'assets/landmarks/office-b.png',
  'lm-units':'assets/landmarks/units.png', 'lm-units-b':'assets/landmarks/units-b.png',
  'lm-flea':'assets/landmarks/flea.png', 'lm-flea-b':'assets/landmarks/flea-b.png',
  'lm-thrift':'assets/landmarks/thrift.png', 'lm-thrift-b':'assets/landmarks/thrift-b.png',
  'lm-garage':'assets/landmarks/garage.png', 'lm-garage-b':'assets/landmarks/garage-b.png',
  'lm-pawn':'assets/landmarks/pawn.png', 'lm-pawn-b':'assets/landmarks/pawn-b.png',
  'lm-warehouse':'assets/landmarks/warehouse.png', 'lm-warehouse-b':'assets/landmarks/warehouse-b.png'
};
const PIECE_KEYS=['tote','box','crate','lamp','toy','treasure'];
const cache={};
let ready=false, pending=[];
function load(cb){
  if(ready){cb&&cb();return;}
  if(cb)pending.push(cb);
  if(pending.length>1)return;
  const keys=Object.keys(FILES); let n=0, total=keys.length;
  keys.forEach(k=>{
    const im=new Image();
    im.onload=im.onerror=()=>{n++; if(n>=total){ready=true; pending.splice(0).forEach(fn=>fn());}};
    im.src=FILES[k]; cache[k]=im;
  });
}
function get(k){const im=cache[k]; return im&&im.complete&&im.naturalWidth?im:null;}
function cover(c,im,W,H){
  if(!im)return false;
  const s=Math.max(W/im.naturalWidth, H/im.naturalHeight);
  const w=im.naturalWidth*s, h=im.naturalHeight*s;
  c.drawImage(im,(W-w)/2,(H-h)/2,w,h); return true;
}
function contain(c,im,x,y,w,h){
  if(!im)return false;
  const s=Math.min(w/im.naturalWidth, h/im.naturalHeight);
  const dw=im.naturalWidth*s, dh=im.naturalHeight*s;
  c.drawImage(im, x+(w-dw)/2, y+(h-dh)/2, dw, dh); return true;
}
function piece(c, type, s){
  const im=get(PIECE_KEYS[type]||type);
  if(!im)return false;
  contain(c,im,-s/2,-s/2,s,s); return true;
}
root.IMGS={load,get,cover,contain,piece,PIECE_KEYS,ready:()=>ready};
})(this);
