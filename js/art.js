/* Storage Rush v2 — cartoon art. Thick warm-brown ink, 2–3 cel bands, hard specular commas, one 3/4 camera.
   Everything is drawn live on canvas. No image files. */
(function(){
'use strict';
const TAU=Math.PI*2, INK='#3a2210';
const DISPLAY='"Luckiest Guy","Arial Black",system-ui,sans-serif';
function rr(c,x,y,w,h,r){r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function lg(c,x0,y0,x1,y1,st){const g=c.createLinearGradient(x0,y0,x1,y1);st.forEach(s=>g.addColorStop(s[0],s[1]));return g;}
function rg(c,x0,y0,r0,x1,y1,r1,st){const g=c.createRadialGradient(x0,y0,r0,x1,y1,r1);st.forEach(s=>g.addColorStop(s[0],s[1]));return g;}
function seeded(s){return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function poly(c,pts){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();}
/* fill a shape flat, then a cel shadow crescent (bottom-right), then ink */
function cel(c,path,base,shade,s,o){o=o||{};
  c.save();path(c);c.fillStyle=shade;c.fill();c.clip();
  c.translate(-s*(o.dx==null?.06:o.dx),-s*(o.dy==null?.07:o.dy));path(c);c.fillStyle=base;c.fill();c.restore();
  if(o.ink!==false){path(c);c.lineJoin='round';c.lineCap='round';c.lineWidth=o.lw||s*.07;c.strokeStyle=INK;c.stroke();}}
function flat(c,path,fill,lw){path(c);c.fillStyle=fill;c.fill();if(lw){c.lineJoin='round';c.lineWidth=lw;c.strokeStyle=INK;c.stroke();}}
function comma(c,x,y,w,h,rot,a){c.save();c.translate(x,y);c.rotate(rot||-.5);c.fillStyle='rgba(255,255,255,'+(a||.9)+')';c.beginPath();c.ellipse(0,0,w,h,0,0,TAU);c.fill();c.restore();}
function line(c,pts,lw,col){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.lineWidth=lw;c.strokeStyle=col||INK;c.lineCap='round';c.lineJoin='round';c.stroke();}
function shadow(c,s,w,y){c.fillStyle='rgba(40,25,10,.28)';c.beginPath();c.ellipse(s*.04,y*s,w*s,w*s*.26,0,0,TAU);c.fill();}
function star(c,x,y,r,col,n,inner){n=n||5;c.beginPath();for(let i=0;i<n*2;i++){const a=i/(n*2)*TAU-Math.PI/2,rr2=i%2?r*(inner||.45):r;c.lineTo(x+Math.cos(a)*rr2,y+Math.sin(a)*rr2);}c.closePath();c.fillStyle=col;c.fill();}
/* 3/4 box helper: front rect + top + right side; camera offset (dx,-dy) */
function box3(c,s,x,y,w,h,d,cols,lw){const dx=d*.75,dy=d*.55;
  const top=[[x,y],[x+dx,y-dy],[x+w+dx,y-dy],[x+w,y]],side=[[x+w,y],[x+w+dx,y-dy],[x+w+dx,y+h-dy],[x+w,y+h]];
  flat(c,cc=>poly(cc,top),cols[0]);flat(c,cc=>poly(cc,side),cols[2]);flat(c,cc=>{cc.beginPath();cc.rect(x,y,w,h);},cols[1]);
  c.lineWidth=lw*.55;c.strokeStyle=INK;c.lineJoin='round';poly(c,top);c.stroke();c.beginPath();c.moveTo(x+w,y);c.lineTo(x+w,y+h);c.stroke();
  c.lineWidth=lw;poly(c,[[x,y],[x+dx,y-dy],[x+w+dx,y-dy],[x+w+dx,y+h-dy],[x+w,y+h],[x,y+h]]);c.stroke();
  return {top,side};}

/* ---------------- six storage items (padding ~12%) ---------------- */
function tote(c,s){const L=s*.075;shadow(c,s,.38,.36);
  // bin body (tapered) front + side
  const fx=-.36*s,fw=.58*s,top=-.12*s,bot=.33*s,d=.17*s,dx=d*.75,dy=d*.55;
  flat(c,cc=>poly(cc,[[fx+fw,top],[fx+fw+dx,top-dy],[fx+fw+dx-.04*s,bot-dy],[fx+fw-.04*s,bot]]),'#1550b8');
  flat(c,cc=>poly(cc,[[fx,top],[fx+fw,top],[fx+fw-.04*s,bot],[fx+.04*s,bot]]),'#2a86f2');
  c.fillStyle='#1d6ad8';c.beginPath();poly(c,[[fx+fw*.62,top],[fx+fw,top],[fx+fw-.04*s,bot],[fx+fw*.6,bot]]);c.fill();
  // ribs
  for(let i=1;i<4;i++){const x=fx+i*fw/4;line(c,[[x,top+.08*s],[x-(i-2)*.012*s,bot-.04*s]],L*.4,'rgba(10,40,110,.6)');}
  // handle slot
  c.fillStyle='#0b2a66';rr(c,fx+fw*.3,top+.05*s,fw*.4,.06*s,.03*s);c.fill();
  // lid
  flat(c,cc=>poly(cc,[[fx-.03*s,top],[fx-.03*s+dx,top-dy],[fx+fw+.03*s+dx,top-dy],[fx+fw+.03*s,top]]),'#7cc2ff');
  flat(c,cc=>{cc.beginPath();cc.rect(fx-.03*s,top-.0*s,fw+.06*s,.07*s);},'#3e9bff');
  flat(c,cc=>poly(cc,[[fx+fw+.03*s,top],[fx+fw+.03*s+dx,top-dy],[fx+fw+.03*s+dx,top-dy+.07*s],[fx+fw+.03*s,top+.07*s]]),'#1f63c9');
  c.lineWidth=L;c.strokeStyle=INK;c.lineJoin='round';
  poly(c,[[fx-.03*s,top],[fx-.03*s+dx,top-dy],[fx+fw+.03*s+dx,top-dy],[fx+fw+.03*s+dx,top-dy+.07*s],[fx+fw+dx-.04*s,bot-dy],[fx+fw-.04*s,bot],[fx+.04*s,bot],[fx-.03*s,top+.07*s]]);c.stroke();
  line(c,[[fx-.03*s,top+.07*s],[fx+fw+.03*s,top+.07*s],[fx+fw+.03*s+dx,top-dy+.07*s]],L*.5);line(c,[[fx-.03*s,top],[fx+fw+.03*s,top],[fx+fw+.03*s+dx,top-dy]],L*.5);
  comma(c,fx+.1*s,top-dy*.5,.08*s,.022*s,-.15);comma(c,fx+.07*s,top+.2*s,.018*s,.07*s,.1,.6);}
function box(c,s){const L=s*.075;shadow(c,s,.4,.36);
  const x=-.36*s,y=-.1*s,w=.56*s,h=.44*s,d=.2*s;
  box3(c,s,x,y,w,h,d,['#ffd08a','#eba653','#b9722c'],L);
  const dx=d*.75,dy=d*.55;
  // tape
  c.fillStyle='rgba(255,240,200,.95)';poly(c,[[x+w*.42,y],[x+w*.42+dx,y-dy],[x+w*.58+dx,y-dy],[x+w*.58,y]]);c.fill();c.fillRect(x+w*.42,y,w*.16,h*.38);
  line(c,[[x+w*.42,y+h*.38],[x+w*.58,y+h*.38]],L*.35,'rgba(120,70,20,.5)');
  // flap line + marker
  line(c,[[x+dx*.5,y-dy*.5],[x+w+dx*.5,y-dy*.5]],L*.35,'rgba(110,60,15,.55)');
  line(c,[[x+w*.12,y+h*.68],[x+w*.3,y+h*.58],[x+w*.45,y+h*.72],[x+w*.68,y+h*.6]],L*.45,'#3a2210');
  comma(c,x+.08*s,y+.08*s,.02*s,.07*s,.1,.55);}
function crate(c,s){const L=s*.075;shadow(c,s,.4,.37); // yellow caution milk crate
  const x=-.36*s,y=-.1*s,w=.56*s,h=.44*s,d=.2*s,dx=d*.75,dy=d*.55;
  box3(c,s,x,y,w,h,d,['#3a2a10','#ffcc1f','#d99a00'],L);
  // top rim
  c.lineWidth=L*.9;c.strokeStyle='#ffe066';poly(c,[[x+.02*s,y-.01*s],[x+dx,y-dy+.02*s],[x+w+dx-.02*s,y-dy+.02*s],[x+w-.01*s,y-.01*s]]);c.stroke();
  c.lineWidth=L*.45;c.strokeStyle=INK;poly(c,[[x,y],[x+dx,y-dy],[x+w+dx,y-dy],[x+w,y]]);c.stroke();
  // grid holes on front
  c.fillStyle='#6b4700';for(let i=0;i<3;i++)for(let j=0;j<2;j++){rr(c,x+w*.1+i*w*.29,y+h*.18+j*h*.4,w*.2,h*.24,s*.025);c.fill();}
  // hazard stripe band
  c.save();c.beginPath();c.rect(x,y+h*.82,w,h*.18);c.clip();c.fillStyle='#ffcc1f';c.fillRect(x,y+h*.82,w,h*.18);c.fillStyle='#2a1a08';for(let k=-2;k<8;k++){poly(c,[[x+k*w*.16,y+h],[x+k*w*.16+w*.08,y+h],[x+k*w*.16+w*.16,y+h*.82],[x+k*w*.16+w*.08,y+h*.82]]);c.fill();}c.restore();
  line(c,[[x,y+h*.82],[x+w,y+h*.82]],L*.45);
  c.lineWidth=L;c.strokeStyle=INK;poly(c,[[x,y],[x+dx,y-dy],[x+w+dx,y-dy],[x+w+dx,y+h-dy],[x+w,y+h],[x,y+h]]);c.stroke();
  comma(c,x+.07*s,y+.06*s,.018*s,.05*s,.1,.7);}
function toolbox(c,s){const L=s*.075;shadow(c,s,.42,.36);
  const x=-.38*s,y=-.06*s,w=.62*s,h=.38*s,d=.16*s,dx=d*.75,dy=d*.55;
  // handle
  c.lineWidth=s*.075;c.strokeStyle=INK;c.lineCap='round';c.beginPath();c.moveTo(x+w*.25+dx*.5,y-dy*.5);c.lineTo(x+w*.25+dx*.5,y-dy*.5-.16*s);c.lineTo(x+w*.75+dx*.5,y-dy*.5-.16*s);c.lineTo(x+w*.75+dx*.5,y-dy*.5);c.stroke();
  c.lineWidth=s*.035;c.strokeStyle='#c9d2db';c.stroke();
  box3(c,s,x,y,w,h,d,['#ff8a70','#ec3b2c','#a8231a'],L);
  line(c,[[x,y+h*.32],[x+w,y+h*.32],[x+w+dx,y+h*.32-dy]],L*.55);
  [.22,.7].forEach(f=>{flat(c,cc=>rr(cc,x+w*f,y+h*.2,w*.12,h*.24,s*.02),'#e7edf2',L*.45);});
  comma(c,x+.1*s,y+.07*s,.09*s,.02*s,-.05,.85);}
function paint(c,s){const L=s*.075;shadow(c,s,.34,.37);
  const w=.5*s,x=-w/2-.03*s,top=-.2*s,bot=.3*s,ry=.1*s,cx=x+w/2;
  // bail
  c.lineWidth=s*.03;c.strokeStyle=INK;c.beginPath();c.moveTo(x+.02*s,top+.03*s);c.quadraticCurveTo(cx,top-.38*s,x+w-.02*s,top+.03*s);c.stroke();
  const body=cc=>{cc.beginPath();cc.moveTo(x,top);cc.lineTo(x,bot);cc.ellipse(cx,bot,w/2,ry,0,Math.PI,0,true);cc.lineTo(x+w,top);cc.closePath();};
  flat(c,body,'#c3ccd5');
  c.save();body(c);c.clip();c.fillStyle='#8d98a3';c.fillRect(x+w*.7,top-ry,w*.4,bot-top+ry*2);
  // label band
  c.fillStyle='#22b45a';c.fillRect(x,top+.1*s,w,.26*s);c.fillStyle='#168a42';c.fillRect(x+w*.7,top+.1*s,w*.3,.26*s);
  c.fillStyle='#fff';c.beginPath();c.arc(cx-.03*s,top+.23*s,.075*s,0,TAU);c.fill();c.fillStyle='#ff5a3c';c.beginPath();c.arc(cx-.03*s,top+.23*s,.04*s,0,TAU);c.fill();
  c.restore();
  line(c,[[x,top+.1*s],[x+w,top+.1*s]],L*.4);line(c,[[x,top+.36*s],[x+w,top+.36*s]],L*.4);
  body(c);c.lineWidth=L;c.strokeStyle=INK;c.stroke();
  flat(c,cc=>{cc.beginPath();cc.ellipse(cx,top,w/2,ry,0,0,TAU);},'#e8eef3',L*.8);
  flat(c,cc=>{cc.beginPath();cc.ellipse(cx,top,w*.36,ry*.62,0,0,TAU);},'#aeb8c2',L*.4);
  // drip
  c.fillStyle='#22b45a';c.beginPath();c.moveTo(cx+.1*s,top+ry*.5);c.lineTo(cx+.1*s,top+.14*s);c.arc(cx+.125*s,top+.14*s,.025*s,Math.PI,0,true);c.lineTo(cx+.15*s,top+ry*.4);c.fill();
  comma(c,x+.07*s,top+.18*s,.02*s,.08*s,0,.8);}
function tire(c,s){const L=s*.075;shadow(c,s,.38,.38);
  const R=.36*s,cx=-.03*s,cy=0;
  // thickness (3/4): back ellipse
  flat(c,cc=>{cc.beginPath();cc.ellipse(cx+.07*s,cy-.04*s,R*.9,R,0,0,TAU);},'#24242c',L);
  flat(c,cc=>{cc.beginPath();cc.ellipse(cx,cy,R*.9,R,0,0,TAU);},'#43434f',L);
  // tread band highlight
  c.save();c.beginPath();c.ellipse(cx,cy,R*.9,R,0,0,TAU);c.clip();c.fillStyle='#2c2c35';c.beginPath();c.ellipse(cx+.06*s,cy+.06*s,R*.9,R,0,0,TAU);c.rect(-s,-s,2*s,2*s);c.fill('evenodd');c.restore();
  // tread ticks
  c.strokeStyle='rgba(20,20,26,.9)';c.lineWidth=s*.03;for(let i=0;i<14;i++){const a=i/14*TAU;c.beginPath();c.moveTo(cx+Math.cos(a)*R*.78,cy+Math.sin(a)*R*.86);c.lineTo(cx+Math.cos(a)*R*.88,cy+Math.sin(a)*R*.98);c.stroke();}
  // bright rim
  flat(c,cc=>{cc.beginPath();cc.ellipse(cx,cy,R*.5,R*.55,0,0,TAU);},'#eef2f6',L*.8);
  flat(c,cc=>{cc.beginPath();cc.ellipse(cx+.015*s,cy+.015*s,R*.32,R*.36,0,0,TAU);},'#b8c2cc');
  c.fillStyle='#5b6570';for(let i=0;i<5;i++){const a=i/5*TAU-Math.PI/2;c.beginPath();c.arc(cx+Math.cos(a)*R*.22,cy+Math.sin(a)*R*.25,s*.022,0,TAU);c.fill();}
  flat(c,cc=>{cc.beginPath();cc.arc(cx,cy,s*.045,0,TAU);},'#ffffff',L*.4);
  // warm highlight comma
  c.save();c.strokeStyle='#ffd9a0';c.lineWidth=s*.04;c.lineCap='round';c.beginPath();c.ellipse(cx,cy,R*.78,R*.86,0,Math.PI*1.08,Math.PI*1.42);c.stroke();c.restore();
}
const ITEMS=[tote,box,crate,toolbox,paint,tire];
const ITEM_COL=['#2a86f2','#eba653','#ffcc1f','#ec3b2c','#22b45a','#9aa3ad'];

/* ---------------- specials ---------------- */
function dollyOverlay(c,s,dir,t){const L=s*.06;
  // stripes across item
  c.save();c.globalAlpha=.9;c.strokeStyle='#fff';c.lineWidth=s*.035;
  for(let i=-1;i<=1;i++){c.beginPath();if(dir==='h'){c.moveTo(-.34*s,i*.1*s);c.lineTo(.34*s,i*.1*s);}else{c.moveTo(i*.1*s,-.3*s);c.lineTo(i*.1*s,.34*s);}c.stroke();}c.restore();
  // hand truck
  c.save();c.translate(-.3*s,.18*s);c.lineWidth=s*.05;c.strokeStyle=INK;c.lineCap='round';
  c.beginPath();c.moveTo(0,-.36*s);c.lineTo(0,.1*s);c.lineTo(.2*s,.1*s);c.stroke();c.lineWidth=s*.026;c.strokeStyle='#ff4a2a';c.stroke();
  flat(c,cc=>{cc.beginPath();cc.arc(.02*s,.13*s,.07*s,0,TAU);},'#2b2b33',L*.8);flat(c,cc=>{cc.beginPath();cc.arc(.02*s,.13*s,.025*s,0,TAU);},'#ddd');c.restore();
  // arrow badge
  c.save();c.translate(.27*s,-.27*s);flat(c,cc=>{cc.beginPath();cc.arc(0,0,.13*s,0,TAU);},'#ff6a1a',L*.8);
  c.rotate(dir==='h'?0:Math.PI/2);c.fillStyle='#fff';poly(c,[[-.09*s,0],[-.03*s,-.06*s],[-.03*s,-.025*s],[.03*s,-.025*s],[.03*s,-.06*s],[.09*s,0],[.03*s,.06*s],[.03*s,.025*s],[-.03*s,.025*s],[-.03*s,.06*s]]);c.fill();c.restore();}
function wrapOverlay(c,s,t){const L=s*.06;
  c.save();rr(c,-.42*s,-.4*s,.84*s,.8*s,.14*s);c.fillStyle='rgba(220,240,255,.38)';c.fill();c.clip();
  for(let i=0;i<5;i++)for(let j=0;j<5;j++){const x=-.34*s+i*.17*s+(j%2)*.08*s,y=-.32*s+j*.16*s;c.fillStyle='rgba(255,255,255,.45)';c.beginPath();c.arc(x,y,.055*s,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.95)';c.beginPath();c.arc(x-.018*s,y-.018*s,.015*s,0,TAU);c.fill();}
  c.fillStyle='rgba(255,255,255,.5)';poly(c,[[-.5*s,-.1*s],[-.2*s,-.5*s],[-.05*s,-.5*s],[-.5*s,.1*s]]);c.fill();c.restore();
  rr(c,-.42*s,-.4*s,.84*s,.8*s,.14*s);c.lineWidth=L;c.strokeStyle=INK;c.stroke();
  c.fillStyle='#fff';c.strokeStyle=INK;c.lineWidth=s*.03;c.font=Math.round(s*.17)+'px '+DISPLAY;c.textAlign='center';c.textBaseline='middle';c.strokeText('POP',.18*s,.3*s);c.fillText('POP',.18*s,.3*s);}
function gavel(c,s){const L=s*.075;
  c.fillStyle=rg(c,0,0,0,0,0,s*.48,[[0,'rgba(255,236,140,.95)'],[.6,'rgba(255,190,40,.45)'],[1,'rgba(255,190,40,0)']]);c.beginPath();c.arc(0,0,s*.48,0,TAU);c.fill();
  // bid paddle
  flat(c,cc=>{cc.beginPath();cc.arc(-.08*s,.06*s,.26*s,0,TAU);},'#ff7a1a',L);
  flat(c,cc=>{cc.beginPath();cc.arc(-.08*s,.06*s,.17*s,0,TAU);},'#fff3d6',L*.5);
  c.fillStyle='#e05a00';c.font=Math.round(s*.24)+'px '+DISPLAY;c.textAlign='center';c.textBaseline='middle';c.fillText('$',-.08*s,.08*s);
  // gavel
  c.save();c.translate(.12*s,-.1*s);c.rotate(-.7);
  flat(c,cc=>rr(cc,-.03*s,0,.06*s,.42*s,.03*s),'#a8662a',L*.7);
  flat(c,cc=>rr(cc,-.16*s,-.1*s,.32*s,.14*s,.05*s),'#ffcf3a',L);
  c.fillStyle='#d89a00';c.fillRect(-.16*s+.02*s,-.02*s,.28*s,.04*s);
  flat(c,cc=>rr(cc,-.2*s,-.11*s,.06*s,.16*s,.02*s),'#ffe680',L*.6);flat(c,cc=>rr(cc,.14*s,-.11*s,.06*s,.16*s,.02*s),'#ffe680',L*.6);
  comma(c,-.06*s,-.07*s,.06*s,.015*s,0,.9);c.restore();
  star(c,.3*s,-.3*s,.07*s,'#fff',4,.3);}

/* ---------------- tarps (blockers) ---------------- */
function tarp(c,s,layers,glint){const L=s*.075;
  shadow(c,s,.44,.36);
  const mound=cc=>{cc.beginPath();cc.moveTo(-.44*s,.36*s);cc.bezierCurveTo(-.5*s,.02*s,-.36*s,-.22*s,-.16*s,-.34*s);cc.bezierCurveTo(-.02*s,-.42*s,.16*s,-.42*s,.26*s,-.28*s);cc.bezierCurveTo(.4*s,-.14*s,.5*s,.08*s,.44*s,.36*s);cc.closePath();};
  cel(c,mound,glint?'#b9a77c':'#a99d84',glint?'#8c7650':'#857a63',s,{dx:.08,dy:.09,lw:L});
  // folds
  line(c,[[-.2*s,-.22*s],[-.12*s,.05*s],[-.24*s,.34*s]],L*.5);line(c,[[.1*s,-.36*s],[.04*s,-.02*s],[.16*s,.34*s]],L*.5);
  line(c,[[-.16*s,-.2*s],[-.08*s,.04*s],[-.19*s,.3*s]],L*.35,'rgba(255,250,230,.55)');
  // strap
  c.save();mound(c);c.clip();c.fillStyle='#e0452c';poly(c,[[-.5*s,.04*s],[.5*s,.0],[.5*s,.1*s],[-.5*s,.14*s]]);c.fill();c.restore();
  line(c,[[-.44*s,.04*s],[.46*s,.0]],L*.45);line(c,[[-.45*s,.14*s],[.47*s,.1*s]],L*.45);
  // dust
  const r=seeded(11);c.fillStyle='rgba(255,250,235,.55)';for(let i=0;i<14;i++){c.beginPath();c.arc((r()-.5)*.6*s,(r()-.7)*.5*s,s*.012,0,TAU);c.fill();}
  if(glint){c.fillStyle=rg(c,.22*s,.24*s,0,.22*s,.24*s,.18*s,[[0,'rgba(255,240,150,1)'],[.5,'rgba(255,200,40,.5)'],[1,'rgba(255,200,40,0)']]);c.beginPath();c.arc(.22*s,.24*s,.18*s,0,TAU);c.fill();
    star(c,.22*s,.24*s,.12*s,'#fff6c0',4,.28);c.lineWidth=s*.02;c.strokeStyle='#b07800';c.stroke();}
  if(layers>=2)chain(c,s,1);
  if(layers>=3)chain(c,s,-1);
  if(layers>=2)padlock(c,-.02*s,-.02*s,.3*s,0);
  if(layers>=2){c.save();c.translate(.3*s,-.3*s);flat(c,cc=>{cc.beginPath();cc.arc(0,0,.12*s,0,TAU);},layers>=3?'#e0302a':'#ff8a1a',L*.7);c.fillStyle='#fff';c.font=Math.round(s*.17)+'px '+DISPLAY;c.textAlign='center';c.textBaseline='middle';c.fillText(String(layers),0,s*.01);c.restore();}
}
function chain(c,s,sgn){for(let i=0;i<7;i++){const t=i/6,x=sgn*(-.44*s+t*.88*s),y=-.3*s+t*.62*s;c.save();c.translate(x,y);c.rotate(sgn*Math.PI/4+(i%2)*Math.PI/2);
  c.beginPath();c.ellipse(0,0,s*.055,s*.032,0,0,TAU);c.lineWidth=s*.05;c.strokeStyle=INK;c.stroke();c.lineWidth=s*.026;c.strokeStyle='#c9d2db';c.stroke();c.restore();}}
function padlock(c,x,y,s,shOff,open){shOff=shOff||0;const L=Math.max(1.5,s*.09);
  c.save();c.translate(x,y);
  c.lineCap='round';c.beginPath();c.moveTo(-.2*s,-.02*s-shOff);c.lineTo(-.2*s,-.26*s-shOff);c.arc(0,-.26*s-shOff,.2*s,Math.PI,0);c.lineTo(.2*s,open?-.22*s-shOff:-.02*s-shOff);
  c.lineWidth=s*.17;c.strokeStyle=INK;c.stroke();c.lineWidth=s*.09;c.strokeStyle='#cfd8e0';c.stroke();
  cel(c,cc=>rr(cc,-.34*s,-.06*s,.68*s,.52*s,.1*s),'#ffc531','#d98e06',s,{dx:.08,dy:.08,lw:L});
  comma(c,-.18*s,.02*s,.1*s,.03*s,-.1,.85);
  c.fillStyle=INK;c.beginPath();c.arc(0,.16*s,.06*s,0,TAU);c.fill();c.fillRect(-.025*s,.16*s,.05*s,.15*s);
  c.restore();}

/* ---------------- finds ---------------- */
function guitar(c,s){const L=s*.07;shadow(c,s,.3,.4);
  c.save();c.rotate(-.55);
  flat(c,cc=>{cc.beginPath();cc.rect(-.045*s,-.62*s,.09*s,.48*s);},'#6b3a14',L*.7);
  for(let i=0;i<4;i++)line(c,[[-.04*s,-.58*s+i*.11*s],[.04*s,-.58*s+i*.11*s]],s*.01,'#ddd');
  flat(c,cc=>rr(cc,-.075*s,-.74*s,.15*s,.15*s,.03*s),'#3a1d0b',L*.7);
  const body=cc=>{cc.beginPath();cc.arc(0,-.02*s,.17*s,0,TAU);cc.moveTo(.23*s,.2*s);cc.arc(0,.2*s,.23*s,0,TAU);};
  c.save();body(c);c.fillStyle='#b8561a';c.fill();c.clip();c.fillStyle='#f29a32';c.beginPath();c.arc(-.03*s,.12*s,.25*s,0,TAU);c.fill();c.fillStyle='#ffd27a';c.beginPath();c.arc(-.05*s,.1*s,.12*s,0,TAU);c.fill();c.restore();
  c.lineWidth=L;c.strokeStyle=INK;c.beginPath();c.arc(0,-.02*s,.17*s,Math.PI*.85,Math.PI*2.15);c.stroke();c.beginPath();c.arc(0,.2*s,.23*s,-Math.PI*.18,Math.PI*1.18);c.stroke();
  flat(c,cc=>{cc.beginPath();cc.arc(0,.07*s,.065*s,0,TAU);},'#2a1406',L*.5);
  flat(c,cc=>{cc.beginPath();cc.rect(-.09*s,.29*s,.18*s,.035*s);},'#2a1406');
  for(let i=-1;i<=1;i++)line(c,[[i*.014*s,-.6*s],[i*.014*s,.3*s]],s*.007,'#fff');
  comma(c,-.12*s,.14*s,.03*s,.09*s,.3,.8);c.restore();}
function jewelry(c,s){const L=s*.075;shadow(c,s,.4,.36);
  const x=-.36*s,y=-.06*s,w=.56*s,h=.36*s,d=.16*s;
  box3(c,s,x,y,w,h,d,['#ff6fa8','#d81b6a','#8e0f45'],L);
  line(c,[[x,y+h*.3],[x+w,y+h*.3],[x+w+d*.75,y+h*.3-d*.55]],s*.04,'#ffc531');line(c,[[x,y+h*.3],[x+w,y+h*.3]],s*.012);
  flat(c,cc=>rr(cc,x+w*.42,y+h*.18,w*.16,h*.3,s*.02),'#ffd23f',L*.5);
  [[.2,'#43c6ff'],[.8,'#7dff9c']].forEach(g=>{flat(c,cc=>{cc.beginPath();cc.arc(x+w*g[0],y+h*.7,s*.045,0,TAU);},g[1],L*.4);comma(c,x+w*g[0]-s*.012,y+h*.7-s*.012,s*.012,s*.008,0,1);});
  for(let i=0;i<6;i++){const px=x+w*.05+i*.04*s,py=y+h+.03*s+Math.sin(i/5*Math.PI)*.05*s;flat(c,cc=>{cc.beginPath();cc.arc(px,py,.022*s,0,TAU);},'#fff',s*.012);}
  comma(c,x+.08*s,y-.03*s,.08*s,.015*s,-.2,.85);}
function safe(c,s){const L=s*.075;shadow(c,s,.42,.38);
  const x=-.36*s,y=-.28*s,w=.56*s,h=.62*s,d=.14*s;
  box3(c,s,x,y,w,h,d,['#9fb2c6','#5f7489','#3a4a5a'],L);
  rr(c,x+.05*s,y+.05*s,w-.1*s,h-.1*s,s*.03);c.lineWidth=L*.45;c.strokeStyle=INK;c.stroke();
  const cx=x+w*.42,cy=y+h*.45;
  flat(c,cc=>{cc.beginPath();cc.arc(cx,cy,.12*s,0,TAU);},'#e6edf3',L*.7);
  for(let i=0;i<12;i++){const a=i/12*TAU;line(c,[[cx+Math.cos(a)*.08*s,cy+Math.sin(a)*.08*s],[cx+Math.cos(a)*.11*s,cy+Math.sin(a)*.11*s]],s*.012);}
  flat(c,cc=>{cc.beginPath();cc.arc(cx,cy,.04*s,0,TAU);},'#ffc531',L*.4);
  line(c,[[x+w*.82,cy-.09*s],[x+w*.82,cy+.09*s]],s*.05);line(c,[[x+w*.82,cy-.09*s],[x+w*.82,cy+.09*s]],s*.022,'#e6edf3');
  c.fillStyle='#ffc531';c.fillRect(x+.08*s,y+h-.1*s,w-.16*s,.025*s);
  comma(c,x+.08*s,y+.08*s,.02*s,.1*s,0,.6);}
function camera(c,s){const L=s*.075;shadow(c,s,.4,.34);
  flat(c,cc=>rr(cc,-.12*s,-.34*s,.26*s,.14*s,.03*s),'#d9dfe5',L*.7);
  flat(c,cc=>rr(cc,-.4*s,-.22*s,.8*s,.5*s,.07*s),'#2d2d36',L);
  flat(c,cc=>rr(cc,-.4*s,-.22*s,.8*s,.12*s,.05*s),'#d9dfe5',L*.6);
  flat(c,cc=>{cc.beginPath();cc.arc(0,.06*s,.2*s,0,TAU);},'#b8c2cc',L);
  flat(c,cc=>{cc.beginPath();cc.arc(0,.06*s,.13*s,0,TAU);},'#1b3f78',L*.6);
  comma(c,-.05*s,.01*s,.04*s,.022*s,-.6,.95);
  flat(c,cc=>{cc.beginPath();cc.arc(.29*s,-.29*s,.04*s,0,TAU);},'#ff3b2f',L*.4);}
function neon(c,s){const L=s*.06;shadow(c,s,.42,.38);
  flat(c,cc=>rr(cc,-.44*s,-.26*s,.88*s,.52*s,.08*s),'#1c1630',L);
  c.save();c.shadowColor='#ff3fb4';c.shadowBlur=s*.12;c.strokeStyle='#ff6fd0';c.lineWidth=s*.04;rr(c,-.38*s,-.2*s,.76*s,.4*s,.06*s);c.stroke();
  c.shadowColor='#4dfcff';c.fillStyle='#bffcff';c.font=Math.round(s*.22)+'px '+DISPLAY;c.textAlign='center';c.textBaseline='middle';c.fillText('OPEN',0,.02*s);c.restore();}
const FINDS={guitar:{draw:guitar,name:'Guitar',price:350},jewelry:{draw:jewelry,name:'Jewelry Box',price:240},safe:{draw:safe,name:'Safe',price:900},camera:{draw:camera,name:'Vintage Camera',price:180},neon:{draw:neon,name:'Neon Sign',price:600}};

/* ---------------- orange roll-up door (kept) ---------------- */
function rollDoor(c,x,y,w,h,openFrac,opts){opts=opts||{};
  c.fillStyle='#1d1610';c.fillRect(x,y,w,h);
  const vis=h*(1-openFrac);
  if(vis>0){c.save();c.beginPath();c.rect(x,y,w,vis);c.clip();
    const slat=Math.max(9,h/14),off=(h-vis)%slat;
    for(let sy=y-off;sy<y+vis;sy+=slat){c.fillStyle=lg(c,0,sy,0,sy+slat,[[0,'#ffb366'],[.12,'#ff8f2e'],[.55,'#e8691a'],[.9,'#b94b0c'],[1,'#6e2a03']]);c.fillRect(x,sy,w,slat);c.fillStyle='rgba(255,230,190,.4)';c.fillRect(x,sy+1,w,Math.max(1,slat*.07));}
    c.fillStyle=lg(c,x,0,x+w,0,[[0,'rgba(0,0,0,.3)'],[.25,'rgba(0,0,0,0)'],[.75,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,.35)']]);c.fillRect(x,y,w,vis);
    const by=y+vis;c.fillStyle='#c9d0d6';c.fillRect(x,by-h*.045,w,h*.045);c.strokeStyle=INK;c.lineWidth=2;c.strokeRect(x,by-h*.045,w,h*.045);
    flat(c,cc=>rr(cc,x+w/2-w*.09,by-h*.105,w*.18,h*.05,h*.012),'#e4e8ec',2);
    c.restore();}
  const fw=Math.max(6,w*.035);
  flat(c,cc=>{cc.beginPath();cc.rect(x-fw,y-fw,fw,h+fw);},'#8f98a1',2);flat(c,cc=>{cc.beginPath();cc.rect(x+w,y-fw,fw,h+fw);},'#8f98a1',2);
  flat(c,cc=>{cc.beginPath();cc.rect(x-fw,y-fw*1.7,w+fw*2,fw*1.7);},'#b2bac2',2);
  if(opts.label){c.fillStyle='#fff';c.font=Math.round(fw*1.25)+'px '+DISPLAY;c.textAlign='center';c.textBaseline='middle';c.fillText(opts.label,x+w/2,y-fw*.8);}
  c.lineWidth=3;c.strokeStyle=INK;c.strokeRect(x-fw,y-fw*1.7,w+fw*2,h+fw*1.7);}

/* ---------------- scenery ---------------- */
function noiseDots(c,x,y,w,h,n,col,seed,sz){const r=seeded(seed||3);c.fillStyle=col;for(let i=0;i<n;i++){const s2=(sz||1.5)*(.5+r());c.fillRect(x+r()*w,y+r()*h,s2,s2);}}
function sky(c,W,H,h){c.fillStyle=lg(c,0,0,0,h,[[0,'#2f7fd6'],[.6,'#8cc6f2'],[1,'#f4e3c0']]);c.fillRect(0,0,W,h);
  c.fillStyle=rg(c,W*.82,h*.25,0,W*.82,h*.25,h*.6,[[0,'rgba(255,250,220,1)'],[.08,'rgba(255,240,190,.9)'],[.3,'rgba(255,220,150,.25)'],[1,'rgba(255,220,150,0)']]);c.fillRect(0,0,W,h);
  cloud(c,W*.2,h*.25,W*.12);cloud(c,W*.6,h*.14,W*.09);}
function cloud(c,x,y,r){c.save();c.fillStyle='#ffffff';c.strokeStyle='rgba(58,34,16,.35)';c.lineWidth=2;c.beginPath();c.arc(x,y,r*.5,0,TAU);c.arc(x+r*.5,y-r*.2,r*.6,0,TAU);c.arc(x+r*1.1,y,r*.45,0,TAU);c.fill();c.restore();}
function asphalt(c,x,y,w,h,seed){c.fillStyle=lg(c,0,y,0,y+h,[[0,'#7a756d'],[1,'#4a4640']]);c.fillRect(x,y,w,h);noiseDots(c,x,y,w,h,Math.floor(w*h/50),'rgba(255,255,255,.08)',seed||5,1.6);}
function lockerRow(c,x,y,w,h,n){
  flat(c,cc=>{cc.beginPath();cc.rect(x,y-h*.2,w,h*.2);},'#d8dcdf',2);
  flat(c,cc=>{cc.beginPath();cc.rect(x-4,y-h*.24,w+8,h*.05);},'#5f666c',2);
  flat(c,cc=>{cc.beginPath();cc.rect(x,y,w,h);},'#e4ddd0',2);
  const dw=w/n;for(let i=0;i<n;i++)rollDoor(c,x+i*dw+dw*.12,y+h*.14,dw*.76,h*.86,0);
  c.fillStyle='rgba(0,0,0,.3)';c.fillRect(x,y+h,w,h*.06);}
function fence(c,x,y,w,h){c.save();c.strokeStyle='rgba(200,205,210,.6)';c.lineWidth=1.2;const g=Math.max(9,h/9);c.beginPath();c.rect(x,y,w,h);c.clip();
  for(let i=-h;i<w+h;i+=g){c.beginPath();c.moveTo(x+i,y);c.lineTo(x+i+h,y+h);c.stroke();c.beginPath();c.moveTo(x+i+h,y);c.lineTo(x+i,y+h);c.stroke();}c.restore();
  flat(c,cc=>{cc.beginPath();cc.rect(x,y-3,w,5);},'#c9cfd5',1.5);for(let px=x;px<=x+w;px+=w/4)flat(c,cc=>{cc.beginPath();cc.rect(px-3,y-6,6,h+6);},'#b8c0c8',1.5);}
function woodSign(c,x,y,w,h,lines,fontPx){
  c.fillStyle='rgba(0,0,0,.3)';rr(c,x+4,y+6,w,h,10);c.fill();
  cel(c,cc=>rr(cc,x,y,w,h,10),'#f3dfb4','#d9bd86',Math.max(w,h),{dx:.0,dy:-.03,lw:4});
  c.strokeStyle='rgba(140,100,50,.25)';c.lineWidth=1.5;for(let i=1;i<4;i++){c.beginPath();c.moveTo(x+8,y+i*h/4);c.lineTo(x+w-8,y+i*h/4);c.stroke();}
  [[x+10,y+10],[x+w-10,y+10],[x+10,y+h-10],[x+w-10,y+h-10]].forEach(p=>flat(c,cc=>{cc.beginPath();cc.arc(p[0],p[1],3.5,0,TAU);},'#c9d2db',1.5));
  c.fillStyle='#3a2210';c.textAlign='center';c.textBaseline='middle';c.font=fontPx+'px '+DISPLAY;
  const lh=fontPx*1.2,y0=y+h/2-(lines.length-1)*lh/2+fontPx*.08;lines.forEach((l,i)=>c.fillText(l,x+w/2,y0+i*lh));}
function vignette(c,W,H,a){c.fillStyle=rg(c,W/2,H*.45,Math.min(W,H)*.35,W/2,H*.5,Math.max(W,H)*.8,[[0,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,'+(a||.45)+')']]);c.fillRect(0,0,W,H);}

/* unit backgrounds (kept from v1, warmed up); the board frame is drawn by the game on top */
function bgIndoor(c,W,H){for(let x=0;x<W;x+=14){c.fillStyle=lg(c,x,0,x+14,0,[[0,'#97a2ad'],[.35,'#dfe5ea'],[.6,'#b5bec6'],[1,'#86909a']]);c.fillRect(x,0,14,H);}
  c.fillStyle=rg(c,W/2,0,0,W/2,0,H*.7,[[0,'rgba(245,252,255,.85)'],[.5,'rgba(225,240,255,.2)'],[1,'rgba(225,240,255,0)']]);c.fillRect(0,0,W,H);
  c.fillStyle=lg(c,0,H*.8,0,H,[[0,'#b9b3a8'],[1,'#d8d2c6']]);c.fillRect(0,H*.82,W,H*.18);vignette(c,W,H,.35);}
function bgGarage(c,W,H){c.fillStyle='#5e5850';c.fillRect(0,0,W,H);const bh=Math.max(18,H/30),bw=bh*2.1;
  for(let r=0;r*bh<H;r++){for(let x=-(r%2)*bw/2;x<W;x+=bw){c.fillStyle=lg(c,0,r*bh,0,r*bh+bh,[[0,'#8d867b'],[1,'#6b655c']]);c.fillRect(x+1.5,r*bh+1.5,bw-3,bh-3);}}
  [[.2,.5,.14],[.8,.3,.1]].forEach(s=>{c.fillStyle=rg(c,W*s[0],H*s[1],0,W*s[0],H*s[1],W*s[2],[[0,'rgba(20,15,5,.4)'],[1,'rgba(20,15,5,0)']]);c.fillRect(0,0,W,H);});
  c.fillStyle=lg(c,W,0,W*.3,0,[[0,'rgba(255,236,190,.8)'],[.4,'rgba(255,220,160,.2)'],[1,'rgba(255,220,160,0)']]);c.fillRect(0,0,W,H);vignette(c,W,H,.45);}
function bgYard(c,W,H){sky(c,W,H,H*.34);lockerRow(c,-10,H*.2,W*.62,H*.1,4);lockerRow(c,W*.5,H*.22,W*.6,H*.09,4);
  asphalt(c,0,H*.31,W,H*.69,9);c.fillStyle=lg(c,0,H*.31,0,H*.45,[[0,'rgba(255,230,180,.45)'],[1,'rgba(255,230,180,0)']]);c.fillRect(0,H*.31,W,H*.14);
  fence(c,0,H*.27,W,H*.05);vignette(c,W,H,.35);}
const THEMES={indoor:bgIndoor,garage:bgGarage,yard:bgYard};
const FLOORS={indoor:['#e6e1d6','#dbd5c8'],garage:['#d2c9b8','#c6bca9'],yard:['#e3d5b8','#d6c6a6']};

/* ---------------- characters ---------------- */
function mascot(c,s,t){ // Pirate hustler: tricorn, bandana, beard, orange vest, with a dolly
  const L=s*.06;t=t||0;
  c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(0,0,s*.34,s*.08,0,0,TAU);c.fill();
  // dolly
  c.save();c.translate(.24*s,0);line(c,[[0,-.62*s],[0,-.02*s],[.16*s,-.02*s]],s*.06);line(c,[[0,-.62*s],[0,-.02*s],[.16*s,-.02*s]],s*.03,'#ff4a2a');
  flat(c,cc=>{cc.beginPath();cc.arc(.02*s,-.03*s,.07*s,0,TAU);},'#2b2b33',L);
  box3(c,s,.02*s,-.32*s,.18*s,.28*s,.08*s,['#ffd08a','#eba653','#b9722c'],L*.8);c.restore();
  // legs
  flat(c,cc=>rr(cc,-.14*s,-.36*s,.11*s,.34*s,.04*s),'#2f4d7a',L);flat(c,cc=>rr(cc,.0,-.36*s,.11*s,.34*s,.04*s),'#2f4d7a',L);
  flat(c,cc=>rr(cc,-.17*s,-.06*s,.15*s,.07*s,.03*s),'#3a2210');flat(c,cc=>rr(cc,-.01*s,-.06*s,.15*s,.07*s,.03*s),'#3a2210');
  // body + vest
  cel(c,cc=>rr(cc,-.19*s,-.74*s,.36*s,.42*s,.12*s),'#f4f1ea','#cfc8b8',s,{lw:L});
  cel(c,cc=>{poly(cc,[[-.19*s,-.66*s],[-.06*s,-.7*s],[-.03*s,-.34*s],[-.19*s,-.34*s]]);},'#ff7a1a','#c9500a',s,{lw:L*.8});
  cel(c,cc=>{poly(cc,[[.17*s,-.66*s],[.04*s,-.7*s],[.01*s,-.34*s],[.17*s,-.34*s]]);},'#ff7a1a','#c9500a',s,{lw:L*.8});
  // arm to dolly
  line(c,[[.14*s,-.62*s],[.24*s,-.56*s]],s*.08);line(c,[[.14*s,-.62*s],[.24*s,-.56*s]],s*.05,'#f1c39a');
  // head
  cel(c,cc=>{cc.beginPath();cc.arc(-.01*s,-.88*s,.15*s,0,TAU);},'#f6c9a0','#dba077',s,{lw:L});
  flat(c,cc=>{cc.beginPath();cc.moveTo(-.15*s,-.86*s);cc.quadraticCurveTo(-.01*s,-.62*s,.13*s,-.86*s);cc.quadraticCurveTo(-.01*s,-.76*s,-.15*s,-.86*s);},'#5a3218',L*.7);
  c.fillStyle=INK;c.beginPath();c.arc(-.06*s,-.9*s,.018*s,0,TAU);c.arc(.04*s,-.9*s,.018*s,0,TAU);c.fill();
  // red bandana + tricorn
  flat(c,cc=>{cc.beginPath();cc.ellipse(-.01*s,-.98*s,.155*s,.06*s,0,Math.PI,0);},'#e0302a',L*.7);
  cel(c,cc=>{cc.beginPath();cc.moveTo(-.28*s,-1.0*s);cc.quadraticCurveTo(-.01*s,-1.24*s,.26*s,-1.0*s);cc.quadraticCurveTo(-.01*s,-1.06*s,-.28*s,-1.0*s);},'#2b2b33','#14141a',s,{lw:L});
  flat(c,cc=>{cc.beginPath();cc.arc(-.01*s,-1.08*s,.035*s,0,TAU);},'#fff',L*.4);
  comma(c,-.08*s,-.96*s,.03*s,.012*s,-.3,.6);
}
function scrapper(c,s,grin){ // rival: skinny, backwards green cap, stubble, dirty vest, grabber
  const L=s*.06;
  cel(c,cc=>{cc.beginPath();cc.moveTo(-.34*s,.5*s);cc.quadraticCurveTo(-.3*s,.02*s,0,0);cc.quadraticCurveTo(.3*s,.02*s,.34*s,.5*s);cc.closePath();},'#8a8f94','#6b7075',s,{lw:L});
  cel(c,cc=>{poly(cc,[[-.3*s,.5*s],[-.24*s,.06*s],[-.06*s,.06*s],[-.1*s,.5*s]]);},'#7a5a32','#5a3f1f',s,{lw:L*.8});
  cel(c,cc=>{poly(cc,[[.3*s,.5*s],[.24*s,.06*s],[.06*s,.06*s],[.1*s,.5*s]]);},'#7a5a32','#5a3f1f',s,{lw:L*.8});
  c.fillStyle='rgba(40,25,10,.35)';c.beginPath();c.arc(-.18*s,.3*s,.04*s,0,TAU);c.arc(.2*s,.2*s,.03*s,0,TAU);c.fill();
  cel(c,cc=>{cc.beginPath();cc.ellipse(0,-.22*s,.16*s,.21*s,0,0,TAU);},'#e8b88f','#c48f66',s,{lw:L});
  c.fillStyle='rgba(60,40,30,.5)';const r=seeded(4);for(let i=0;i<16;i++){c.fillRect((r()-.5)*.22*s,-.12*s+r()*.1*s,s*.012,s*.012);}
  c.fillStyle=INK;c.beginPath();c.ellipse(-.06*s,-.26*s,.024*s,.03*s,0,0,TAU);c.ellipse(.06*s,-.26*s,.024*s,.03*s,0,0,TAU);c.fill();
  line(c,[[-.1*s,-.32*s],[-.03*s,-.3*s]],s*.022);line(c,[[.1*s,-.32*s],[.03*s,-.3*s]],s*.022);
  flat(c,cc=>{cc.beginPath();cc.moveTo(-.08*s,-.14*s);cc.quadraticCurveTo(0,(grin?-.06:-.1)*s,.08*s,-.14*s);cc.closePath();},'#fff',L*.6);
  cel(c,cc=>{cc.beginPath();cc.ellipse(0,-.38*s,.17*s,.09*s,0,Math.PI,0);cc.closePath();},'#3e8f3a','#2a6a27',s,{lw:L});
  flat(c,cc=>{cc.beginPath();cc.ellipse(.17*s,-.38*s,.1*s,.03*s,0,0,TAU);},'#2a6a27',L*.6);}
function grabber(c,s,len){const L=s*.06; // arm reaching left from origin, glove at -len
  line(c,[[0,0],[-len,0]],s*.2);line(c,[[0,0],[-len,0]],s*.14,'#8a8f94');
  cel(c,cc=>{cc.beginPath();cc.ellipse(-len-.06*s,0,.13*s,.11*s,0,0,TAU);},'#e8c35a','#b8902a',s,{lw:L});
  for(let i=0;i<3;i++)flat(c,cc=>{cc.beginPath();cc.ellipse(-len-.18*s,-.07*s+i*.07*s,.07*s,.03*s,0,0,TAU);},'#e8c35a',L*.6);}

/* ---------------- ladder dioramas ---------------- */
function disc(c,u,col){flat(c,cc=>{cc.beginPath();cc.ellipse(0,u*.06,u*.62,u*.2,0,0,TAU);},'#8a5a2b',u*.03);
  flat(c,cc=>{cc.beginPath();cc.ellipse(0,0,u*.62,u*.2,0,0,TAU);},col||'#7ccf5a',u*.03);
  c.fillStyle='rgba(255,255,255,.25)';c.beginPath();c.ellipse(-u*.15,-u*.05,u*.3,u*.07,0,0,TAU);c.fill();}
function truck(c,u,up){up=up||{};const L=u*.03;
  // 3/4 pickup facing left-front
  const x=-u*.48,y=-u*.34;
  c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(0,0,u*.5,u*.08,0,0,TAU);c.fill();
  // bed (back) + cab
  cel(c,cc=>rr(cc,x+u*.42,y+u*.08,u*.5,u*.2,u*.03),'#f6f1e7','#d6cfc0',u,{dx:.02,dy:.03,lw:L});
  cel(c,cc=>{cc.beginPath();cc.moveTo(x+u*.16,y+u*.08);cc.lineTo(x+u*.24,y-u*.1);cc.lineTo(x+u*.42,y-u*.1);cc.lineTo(x+u*.46,y+u*.08);cc.closePath();},'#f6f1e7','#d6cfc0',u,{dx:.02,dy:.03,lw:L});
  flat(c,cc=>{cc.beginPath();cc.moveTo(x+u*.2,y+u*.07);cc.lineTo(x+u*.26,y-u*.07);cc.lineTo(x+u*.4,y-u*.07);cc.lineTo(x+u*.42,y+u*.07);cc.closePath();},'#8fd3ff',L*.7);
  if(!up.visor){line(c,[[x+u*.28,y-u*.05],[x+u*.36,y+u*.04]],L*.6,'#fff');} // cracked windshield
  // hood + lower body orange
  cel(c,cc=>rr(cc,x,y+u*.08,u*.94,u*.18,u*.05),'#ff8a2a','#cf5a0a',u,{dx:.02,dy:.03,lw:L});
  // rust / patch
  if(!up.fender){c.fillStyle='#8a3d12';c.beginPath();c.ellipse(x+u*.14,y+u*.2,u*.05,u*.03,0,0,TAU);c.fill();c.fillStyle='#a8521c';c.beginPath();c.ellipse(x+u*.7,y+u*.15,u*.04,u*.025,0,0,TAU);c.fill();}
  else flat(c,cc=>rr(cc,x+u*.08,y+u*.16,u*.12,u*.07,u*.02),'#ffb05a',L*.5);
  if(!up.wash){c.fillStyle='rgba(90,60,30,.35)';const r=seeded(9);for(let i=0;i<18;i++){c.beginPath();c.arc(x+r()*u*.9,y+u*.12+r()*u*.12,u*.012,0,TAU);c.fill();}}
  // wheels
  [x+u*.2,x+u*.76].forEach(wx=>{flat(c,cc=>{cc.beginPath();cc.arc(wx,y+u*.28,u*.09,0,TAU);},'#2b2b33',L);flat(c,cc=>{cc.beginPath();cc.arc(wx,y+u*.28,u*.04,0,TAU);},'#d9dfe5',L*.5);});
  // headlight
  flat(c,cc=>{cc.beginPath();cc.arc(x+u*.04,y+u*.13,u*.03,0,TAU);},'#fff6c0',L*.5);
  // bed cargo: table + dolly
  if(up.table)flat(c,cc=>rr(cc,x+u*.5,y-u*.02,u*.36,u*.1,u*.02),'#a8662a',L*.7);else{flat(c,cc=>rr(cc,x+u*.5,y+u*.0,u*.34,u*.05,u*.01),'#f2f2f2',L*.6);line(c,[[x+u*.54,y+u*.05],[x+u*.58,y+u*.1]],L*.5);line(c,[[x+u*.8,y+u*.05],[x+u*.76,y+u*.1]],L*.5);}
  line(c,[[x+u*.9,y-u*.12],[x+u*.9,y+u*.08]],L*1.4);line(c,[[x+u*.9,y-u*.12],[x+u*.9,y+u*.08]],L*.7,'#ff4a2a');
  if(up.visor){flat(c,cc=>rr(cc,x+u*.22,y-u*.15,u*.22,u*.06,u*.015),'#2b2b33',L*.5);c.fillStyle='#ffcf5a';c.font=Math.round(u*.045)+'px '+DISPLAY;c.textAlign='center';c.textBaseline='middle';c.fillText('PIRATE',x+u*.33,y-u*.118);}
  if(up.hitch){line(c,[[x+u*.94,y+u*.24],[x+u*1.04,y+u*.24]],L*1.2);flat(c,cc=>{cc.beginPath();cc.arc(x+u*1.06,y+u*.24,u*.025,0,TAU);},'#c9d2db',L*.5);}
  // bid card on dash
  flat(c,cc=>rr(cc,x+u*.28,y+u*.0,u*.06,u*.05,u*.01),'#fff',L*.4);
}
function dPickup(c,u,up){disc(c,u);c.save();c.translate(u*.22,-u*.06);c.scale(.5,.5);lockerRow(c,-u*.5,-u*.5,u*.9,u*.5,1);c.restore();c.save();c.translate(-u*.04,u*.02);truck(c,u*.9,up);c.restore();}
function dYard(c,u,up){up=up||{};disc(c,u);const n=up.second?3:2;c.save();c.translate(-u*.4,-u*.42);lockerRow(c,0,0,u*.8,u*.36,n);c.restore();
  if(up.canopy){flat(c,cc=>poly(cc,[[-u*.5,-u*.56],[u*.45,-u*.56],[u*.55,-u*.44],[-u*.6,-u*.44]]),'#ff7a1a',u*.02);for(let i=0;i<6;i++){c.fillStyle='#fff';c.fillRect(-u*.5+i*u*.18,-u*.56,u*.09,u*.12);}line(c,[[-u*.55,-u*.44],[-u*.55,-u*.04]],u*.02);line(c,[[u*.5,-u*.44],[u*.5,-u*.04]],u*.02);}
  if(up.truck){c.save();c.translate(u*.42,-u*.04);line(c,[[0,-u*.3],[0,0],[u*.1,0]],u*.04);line(c,[[0,-u*.3],[0,0],[u*.1,0]],u*.02,'#ff4a2a');c.restore();}}
function dApt(c,u){disc(c,u);cel(c,cc=>{cc.beginPath();cc.rect(-u*.36,-u*.9,u*.6,u*.86);},'#d96a4a','#a84a30',u,{dx:.03,dy:.02,lw:u*.03});
  for(let r=0;r<3;r++)for(let k=0;k<2;k++)flat(c,cc=>{cc.beginPath();cc.rect(-u*.28+k*u*.26,-u*.82+r*u*.24,u*.17,u*.14);},'#ffe9a8',u*.02);
  flat(c,cc=>{cc.beginPath();cc.rect(u*.24,-u*.36,u*.3,u*.32);},'#e4ddd0',u*.02);c.save();c.translate(0,0);rollDoor(c,u*.29,-u*.3,u*.2,u*.26,0);c.restore();
  flat(c,cc=>{cc.beginPath();cc.rect(-u*.42,-u*.96,u*.72,u*.07);},'#6b7178',u*.02);}
function dHouse(c,u){disc(c,u);cel(c,cc=>{cc.beginPath();cc.rect(-u*.42,-u*.46,u*.62,u*.42);},'#fff4e0','#e0d0b0',u,{dx:.03,dy:.02,lw:u*.03});
  cel(c,cc=>poly(cc,[[-u*.5,-u*.44],[-u*.11,-u*.8],[u*.28,-u*.44]]),'#d8402a','#a82a18',u,{lw:u*.03});
  flat(c,cc=>{cc.beginPath();cc.rect(-u*.16,-u*.26,u*.12,u*.22);},'#3e8f3a',u*.02);
  flat(c,cc=>{cc.beginPath();cc.rect(-u*.36,-u*.36,u*.13,u*.12);},'#ffe9a8',u*.02);flat(c,cc=>{cc.beginPath();cc.rect(u*.04,-u*.36,u*.13,u*.12);},'#ffe9a8',u*.02);
  cel(c,cc=>{cc.beginPath();cc.rect(u*.26,-u*.28,u*.26,u*.24);},'#c98a4a','#a06a30',u,{lw:u*.025});flat(c,cc=>poly(cc,[[u*.22,-u*.27],[u*.39,-u*.4],[u*.56,-u*.27]]),'#7a4a22',u*.025);
  flat(c,cc=>{cc.beginPath();cc.arc(-u*.52,-u*.12,u*.1,0,TAU);},'#3fae3a',u*.02);}
function dWarehouse(c,u){disc(c,u);cel(c,cc=>{cc.beginPath();cc.moveTo(-u*.55,-u*.04);cc.lineTo(-u*.55,-u*.5);cc.quadraticCurveTo(0,-u*.78,u*.55,-u*.5);cc.lineTo(u*.55,-u*.04);cc.closePath();},'#c9d2db','#9aa6b2',u,{lw:u*.03});
  rollDoor(c,-u*.42,-u*.36,u*.28,u*.32,0);rollDoor(c,u*.1,-u*.36,u*.28,u*.32,0);
  flat(c,cc=>rr(cc,-u*.18,-u*.6,u*.36,u*.1,u*.03),'#1c1630',u*.02);c.save();c.shadowColor='#ff3fb4';c.shadowBlur=u*.05;c.fillStyle='#ff9fe0';c.font=Math.round(u*.08)+'px '+DISPLAY;c.textAlign='center';c.textBaseline='middle';c.fillText('OPEN',0,-u*.545);c.restore();}
function dFacility(c,u){disc(c,u);c.save();c.translate(-u*.56,-u*.4);lockerRow(c,0,0,u*1.12,u*.36,5);c.restore();
  flat(c,cc=>rr(cc,-u*.36,-u*.92,u*.72,u*.22,u*.05),'#ff7a1a',u*.025);line(c,[[0,-u*.7],[0,-u*.6]],u*.04);
  c.fillStyle='#fff';c.font=Math.round(u*.1)+'px '+DISPLAY;c.textAlign='center';c.textBaseline='middle';c.fillText('MY STORAGE',0,-u*.8);
  [-u*.56,u*.56].forEach(fx=>{line(c,[[fx,-u*.1],[fx,-u*.7]],u*.02);flat(c,cc=>poly(cc,[[fx,-u*.7],[fx+u*.14,-u*.65],[fx,-u*.6]]),'#ffcf3a',u*.015);});}
function dMansion(c,u){disc(c,u);
  cel(c,cc=>{cc.beginPath();cc.rect(-u*.46,-u*.62,u*.92,u*.58);},'#fff4e0','#ddcbab',u,{dx:.02,dy:.02,lw:u*.03});
  cel(c,cc=>poly(cc,[[-u*.52,-u*.6],[0,-u*.92],[u*.52,-u*.6]]),'#2b4fa6','#1a3478',u,{lw:u*.03});
  [-u*.52,u*.36].forEach(tx=>{cel(c,cc=>{cc.beginPath();cc.rect(tx,-u*.86,u*.16,u*.82);},'#f2e6cf','#d2c0a0',u,{lw:u*.025});flat(c,cc=>poly(cc,[[tx-u*.03,-u*.86],[tx+u*.08,-u*1.04],[tx+u*.19,-u*.86]]),'#2b4fa6',u*.025);flat(c,cc=>poly(cc,[[tx+u*.08,-u*1.04],[tx+u*.08,-u*1.16],[tx+u*.18,-u*1.12],[tx+u*.08,-u*1.08]]),'#ffcf3a',u*.015);});
  for(let k=0;k<3;k++)flat(c,cc=>{cc.beginPath();cc.rect(-u*.3+k*u*.22,-u*.5,u*.13,u*.16);},'#ffe9a8',u*.02);
  rollDoor(c,-u*.12,-u*.26,u*.24,u*.22,0);
  flat(c,cc=>{cc.beginPath();cc.arc(u*.6,-u*.16,u*.08,0,TAU);},'#3fae3a',u*.02);line(c,[[u*.6,-u*.1],[u*.6,0]],u*.03);}
const DIORAMAS=[dPickup,dYard,dApt,dHouse,dWarehouse,dFacility,dMansion];
const LADDER=['The Pickup','First Yard','The Apartment','Starter Home','The Warehouse','Own Facilities','Castles & Mansions'];

/* title yard */
function yardScene(c,W,H){sky(c,W,H,H*.42);lockerRow(c,W*.04,H*.3,W*.72,H*.2,3);
  asphalt(c,0,H*.5,W,H*.5,13);c.fillStyle=lg(c,0,H*.5,0,H*.6,[[0,'rgba(0,0,0,.3)'],[1,'rgba(0,0,0,0)']]);c.fillRect(0,H*.5,W,H*.1);
  c.save();c.translate(W*.83,H*.535);truck(c,Math.min(W*.38,H*.2),{});c.restore();
  fence(c,0,H*.6,W,H*.1);vignette(c,W,H,.35);}

window.ART={rr,lg,rg,poly,cel,flat,line,comma,star,seeded,INK,DISPLAY,ITEMS,ITEM_COL,dollyOverlay,wrapOverlay,gavel,tarp,padlock,FINDS,rollDoor,THEMES,FLOORS,
  yardScene,woodSign,vignette,DIORAMAS,LADDER,mascot,scrapper,grabber,truck,box,tote,crate,tire,lockerRow,sky,cloud,box3};
})();
