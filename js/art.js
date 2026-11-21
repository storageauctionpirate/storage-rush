/* Storage Rush — all art drawn live on canvas with gradients, lighting and bevels. No image files. */
(function(){
'use strict';
const TAU=Math.PI*2;
function rr(c,x,y,w,h,r){r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function lg(c,x0,y0,x1,y1,st){const g=c.createLinearGradient(x0,y0,x1,y1);st.forEach(s=>g.addColorStop(s[0],s[1]));return g;}
function rg(c,x0,y0,r0,x1,y1,r1,st){const g=c.createRadialGradient(x0,y0,r0,x1,y1,r1);st.forEach(s=>g.addColorStop(s[0],s[1]));return g;}
function seeded(s){return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296;};}
function contact(c,s,w,y){c.fillStyle=rg(c,0,y*s,0,0,y*s,w*s,[[0,'rgba(0,0,0,.55)'],[1,'rgba(0,0,0,0)']]);c.save();c.scale(1,0.28);c.beginPath();c.arc(0,y*s/0.28,w*s,0,TAU);c.fill();c.restore();}
function spec(c,x,y,w,h,a){c.fillStyle=lg(c,x,y,x,y+h,[[0,'rgba(255,255,255,'+(a||.55)+')'],[1,'rgba(255,255,255,0)']]);rr(c,x,y,w,h,h/2);c.fill();}

/* ---------- 6 storage items ---------- */
function tote(c,s){
  contact(c,s,.42,.4);
  // body
  c.beginPath();c.moveTo(-.4*s,-.16*s);c.lineTo(.4*s,-.16*s);c.lineTo(.33*s,.38*s);c.quadraticCurveTo(.32*s,.41*s,.28*s,.41*s);c.lineTo(-.28*s,.41*s);c.quadraticCurveTo(-.32*s,.41*s,-.33*s,.38*s);c.closePath();
  c.fillStyle=lg(c,-.4*s,0,.4*s,0,[[0,'#0a2f6e'],[.18,'#2a72d6'],[.42,'#5ea4f7'],[.7,'#2466c9'],[1,'#082a63']]);c.fill();
  // ribs
  c.strokeStyle='rgba(5,25,70,.45)';c.lineWidth=s*.018;
  for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(i*.14*s,-.1*s);c.lineTo(i*.12*s,.37*s);c.stroke();}
  c.strokeStyle='rgba(160,210,255,.35)';c.lineWidth=s*.01;
  for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(i*.14*s+s*.016,-.1*s);c.lineTo(i*.12*s+s*.016,.37*s);c.stroke();}
  // bottom shade
  c.fillStyle=lg(c,0,.2*s,0,.41*s,[[0,'rgba(0,0,0,0)'],[1,'rgba(0,10,40,.45)']]);c.fillRect(-.4*s,.2*s,.8*s,.21*s);
  // handle slot
  c.fillStyle='#061c45';rr(c,-.12*s,-.1*s,.24*s,.07*s,.035*s);c.fill();
  // lid
  c.fillStyle=lg(c,0,-.34*s,0,-.13*s,[[0,'#9fd0ff'],[.35,'#4b93ea'],[1,'#123f8c']]);rr(c,-.46*s,-.33*s,.92*s,.2*s,.05*s);c.fill();
  c.strokeStyle='rgba(4,20,60,.6)';c.lineWidth=s*.015;c.stroke();
  c.fillStyle=lg(c,0,-.3*s,0,-.2*s,[[0,'#7fc0ff'],[1,'#2c74d8']]);rr(c,-.38*s,-.3*s,.76*s,.1*s,.03*s);c.fill();
  spec(c,-.36*s,-.315*s,.5*s,.05*s,.75);
  c.fillStyle='rgba(255,255,255,.18)';c.fillRect(-.33*s,-.12*s,.07*s,.46*s);
}
function box(c,s){
  contact(c,s,.44,.4);
  const fx=-.4*s,fy=-.1*s,fw=.6*s,fh=.5*s,dx=.2*s,dy=-.17*s;
  // top
  c.beginPath();c.moveTo(fx,fy);c.lineTo(fx+dx,fy+dy);c.lineTo(fx+fw+dx,fy+dy);c.lineTo(fx+fw,fy);c.closePath();
  c.fillStyle=lg(c,0,fy+dy,0,fy,[[0,'#f0c98e'],[1,'#d6a466']]);c.fill();
  // side
  c.beginPath();c.moveTo(fx+fw,fy);c.lineTo(fx+fw+dx,fy+dy);c.lineTo(fx+fw+dx,fy+fh+dy);c.lineTo(fx+fw,fy+fh);c.closePath();
  c.fillStyle=lg(c,fx+fw,0,fx+fw+dx,0,[[0,'#8d5a2b'],[1,'#6c431e']]);c.fill();
  // front
  c.fillStyle=lg(c,fx,fy,fx+fw,fy+fh,[[0,'#d9a56a'],[.5,'#c48a4c'],[1,'#9e6a35']]);c.fillRect(fx,fy,fw,fh);
  // cardboard flutes texture
  c.strokeStyle='rgba(110,70,30,.12)';c.lineWidth=s*.008;
  for(let i=1;i<12;i++){c.beginPath();c.moveTo(fx+i*fw/12,fy);c.lineTo(fx+i*fw/12,fy+fh);c.stroke();}
  // tape
  c.fillStyle='rgba(225,190,120,.95)';
  c.beginPath();c.moveTo(fx+fw*.42,fy);c.lineTo(fx+fw*.42+dx,fy+dy);c.lineTo(fx+fw*.58+dx,fy+dy);c.lineTo(fx+fw*.58,fy);c.closePath();c.fill();
  c.fillStyle=lg(c,0,fy,0,fy+fh*.45,[[0,'rgba(235,200,130,.95)'],[1,'rgba(220,180,110,.9)']]);c.fillRect(fx+fw*.42,fy,fw*.16,fh*.42);
  c.fillStyle='rgba(255,255,255,.35)';c.fillRect(fx+fw*.44,fy,fw*.03,fh*.42);
  // marker scribble
  c.strokeStyle='rgba(30,20,15,.75)';c.lineWidth=s*.022;c.lineCap='round';
  c.beginPath();c.moveTo(fx+fw*.12,fy+fh*.66);c.quadraticCurveTo(fx+fw*.25,fy+fh*.55,fx+fw*.36,fy+fh*.68);c.quadraticCurveTo(fx+fw*.5,fy+fh*.78,fx+fw*.68,fy+fh*.62);c.stroke();
  // edges
  c.strokeStyle='rgba(70,40,15,.6)';c.lineWidth=s*.014;c.strokeRect(fx,fy,fw,fh);
  c.strokeStyle='rgba(255,235,200,.6)';c.beginPath();c.moveTo(fx,fy);c.lineTo(fx+dx,fy+dy);c.lineTo(fx+fw+dx,fy+dy);c.stroke();
}
function crate(c,s){
  contact(c,s,.44,.42);
  const x=-.42*s,y=-.38*s,w=.84*s,h=.78*s;
  c.fillStyle='#3b2410';c.fillRect(x,y,w,h);
  const r=seeded(7);
  for(let i=0;i<4;i++){
    const py=y+s*.04+i*(h-s*.08)/4, ph=(h-s*.08)/4-s*.025;
    c.fillStyle=lg(c,0,py,0,py+ph,[[0,'#e0b277'],[.5,'#c08a4a'],[1,'#8c5d2b']]);c.fillRect(x+s*.05,py,w-s*.1,ph);
    c.strokeStyle='rgba(90,55,20,.35)';c.lineWidth=s*.008;
    for(let k=0;k<3;k++){const gy=py+ph*(.25+k*.25)+ (r()-.5)*ph*.1;c.beginPath();c.moveTo(x+s*.05,gy);c.bezierCurveTo(x+w*.3,gy+(r()-.5)*ph*.4,x+w*.6,gy+(r()-.5)*ph*.4,x+w-s*.05,gy);c.stroke();}
  }
  // frame boards
  const frame=(fx,fy,fw,fh,vert)=>{c.fillStyle=lg(c,fx,fy,vert?fx+fw:fx,vert?fy:fy+fh,[[0,'#d9a463'],[.5,'#a9733a'],[1,'#6e451c']]);c.fillRect(fx,fy,fw,fh);c.strokeStyle='rgba(40,20,5,.6)';c.lineWidth=s*.012;c.strokeRect(fx,fy,fw,fh);};
  frame(x,y,s*.1,h,true);frame(x+w-s*.1,y,s*.1,h,true);frame(x,y,w,s*.1,false);frame(x,y+h-s*.1,w,s*.1,false);
  // diagonal brace
  c.save();c.beginPath();c.rect(x+s*.1,y+s*.1,w-s*.2,h-s*.2);c.clip();
  c.translate(0,0);c.rotate(-Math.atan2(h,w));
  c.fillStyle=lg(c,0,-s*.06,0,s*.06,[[0,'#dcaa6a'],[.5,'#b07a3e'],[1,'#704619']]);c.fillRect(-s*.7,-s*.055,s*1.4,s*.11);
  c.strokeStyle='rgba(40,20,5,.5)';c.strokeRect(-s*.7,-s*.055,s*1.4,s*.11);c.restore();
  // nails
  [[x+s*.05,y+s*.05],[x+w-s*.05,y+s*.05],[x+s*.05,y+h-s*.05],[x+w-s*.05,y+h-s*.05]].forEach(p=>{c.fillStyle=rg(c,p[0]-s*.008,p[1]-s*.008,0,p[0],p[1],s*.02,[[0,'#eee'],[1,'#444']]);c.beginPath();c.arc(p[0],p[1],s*.02,0,TAU);c.fill();});
  // bevel light
  c.strokeStyle='rgba(255,230,180,.55)';c.lineWidth=s*.016;c.beginPath();c.moveTo(x+1,y+h);c.lineTo(x+1,y+1);c.lineTo(x+w,y+1);c.stroke();
}
function toolbox(c,s){
  contact(c,s,.44,.4);
  // handle
  c.strokeStyle=lg(c,0,-.42*s,0,-.2*s,[[0,'#f2f4f7'],[.5,'#8c939c'],[1,'#3f454c']]);c.lineWidth=s*.07;c.lineCap='round';
  c.beginPath();c.moveTo(-.22*s,-.16*s);c.lineTo(-.22*s,-.32*s);c.quadraticCurveTo(-.22*s,-.38*s,-.16*s,-.38*s);c.lineTo(.16*s,-.38*s);c.quadraticCurveTo(.22*s,-.38*s,.22*s,-.32*s);c.lineTo(.22*s,-.16*s);c.stroke();
  // body
  c.fillStyle=lg(c,0,-.2*s,0,.4*s,[[0,'#ff7b6b'],[.18,'#f0372a'],[.6,'#b5150c'],[1,'#6e0904']]);rr(c,-.44*s,-.2*s,.88*s,.6*s,.06*s);c.fill();
  // lid seam
  c.fillStyle='rgba(60,0,0,.65)';c.fillRect(-.44*s,-.02*s,.88*s,.025*s);
  c.fillStyle='rgba(255,170,160,.45)';c.fillRect(-.44*s,.005*s,.88*s,.012*s);
  // latches
  [-.25,.25].forEach(lx=>{c.fillStyle=lg(c,lx*s-.06*s,0,lx*s+.06*s,0,[[0,'#5b6168'],[.5,'#f4f6f8'],[1,'#5b6168']]);rr(c,lx*s-.06*s,-.06*s,.12*s,.13*s,.02*s);c.fill();c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=s*.008;c.stroke();});
  // specular
  spec(c,-.38*s,-.18*s,.6*s,.07*s,.6);
  c.fillStyle=lg(c,0,.2*s,0,.4*s,[[0,'rgba(0,0,0,0)'],[1,'rgba(30,0,0,.4)']]);rr(c,-.44*s,.2*s,.88*s,.2*s,.06*s);c.fill();
  c.strokeStyle='rgba(60,0,0,.7)';c.lineWidth=s*.014;rr(c,-.44*s,-.2*s,.88*s,.6*s,.06*s);c.stroke();
}
function paint(c,s){
  contact(c,s,.38,.4);
  const w=.62*s,x=-w/2,top=-.26*s,bot=.33*s,ry=.1*s;
  c.fillStyle=lg(c,x,0,x+w,0,[[0,'#4a4f56'],[.2,'#c9ced5'],[.38,'#ffffff'],[.6,'#aeb4bc'],[1,'#3d4249']]);
  c.beginPath();c.moveTo(x,top);c.lineTo(x,bot);c.ellipse(0,bot,w/2,ry,0,Math.PI,0,true);c.lineTo(x+w,top);c.closePath();c.fill();
  // label
  c.save();c.beginPath();c.moveTo(x,top+.12*s);c.lineTo(x,bot-.06*s);c.ellipse(0,bot-.06*s,w/2,ry,0,Math.PI,0,true);c.lineTo(x+w,top+.12*s);c.ellipse(0,top+.12*s,w/2,ry,0,0,Math.PI,false);c.closePath();c.clip();
  c.fillStyle=lg(c,x,0,x+w,0,[[0,'#0b4d2a'],[.25,'#22a35b'],[.4,'#5fe39a'],[.65,'#1d8a4c'],[1,'#063d1f']]);c.fillRect(x,top,w,bot-top+ry);
  c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.arc(-.02*s,.08*s,.09*s,0,TAU);c.fill();
  c.fillStyle='#e8402f';c.beginPath();c.arc(-.02*s,.08*s,.055*s,0,TAU);c.fill();
  c.restore();
  // top
  c.fillStyle=lg(c,x,top,x+w,top,[[0,'#7d838b'],[.4,'#f5f7f9'],[1,'#6b7179']]);c.beginPath();c.ellipse(0,top,w/2,ry,0,0,TAU);c.fill();
  c.fillStyle=rg(c,-.05*s,top-.02*s,0,0,top,w*.45,[[0,'#d9dde2'],[1,'#8a9098']]);c.beginPath();c.ellipse(0,top,w*.42,ry*.78,0,0,TAU);c.fill();
  c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=s*.012;c.beginPath();c.ellipse(0,top,w/2,ry,0,0,TAU);c.stroke();
  // drip
  c.fillStyle='#2bb466';c.beginPath();c.moveTo(.12*s,top+ry*.6);c.lineTo(.12*s,top+.12*s);c.arc(.145*s,top+.12*s,.025*s,Math.PI,0,true);c.lineTo(.17*s,top+ry*.5);c.fill();
  // bail
  c.strokeStyle='#bfc4ca';c.lineWidth=s*.022;c.beginPath();c.moveTo(x+.01*s,top+.04*s);c.quadraticCurveTo(0,top-.36*s,x+w-.01*s,top+.04*s);c.stroke();
}
function tire(c,s){
  contact(c,s,.42,.42);
  const R=.42*s;
  c.fillStyle=rg(c,-.12*s,-.14*s,R*.1,0,0,R,[[0,'#4a4a4a'],[.6,'#262626'],[1,'#080808']]);c.beginPath();c.arc(0,0,R,0,TAU);c.fill();
  // tread
  c.strokeStyle='rgba(0,0,0,.8)';c.lineWidth=s*.035;
  for(let i=0;i<22;i++){const a=i/22*TAU;c.beginPath();c.moveTo(Math.cos(a)*R*.86,Math.sin(a)*R*.86);c.lineTo(Math.cos(a+.08)*R,Math.sin(a+.08)*R);c.stroke();}
  c.strokeStyle='rgba(120,120,120,.35)';c.lineWidth=s*.012;
  for(let i=0;i<22;i++){const a=i/22*TAU+.06;c.beginPath();c.moveTo(Math.cos(a)*R*.88,Math.sin(a)*R*.88);c.lineTo(Math.cos(a+.08)*R*.99,Math.sin(a+.08)*R*.99);c.stroke();}
  // sidewall
  c.fillStyle=rg(c,0,0,R*.45,0,0,R*.78,[[0,'#151515'],[.6,'#2f2f2f'],[1,'#181818']]);c.beginPath();c.arc(0,0,R*.78,0,TAU);c.fill();
  // rim
  c.fillStyle=rg(c,-.08*s,-.1*s,0,0,0,R*.5,[[0,'#ffffff'],[.4,'#c7ccd2'],[.85,'#6b7178'],[1,'#3a3f45']]);c.beginPath();c.arc(0,0,R*.5,0,TAU);c.fill();
  c.fillStyle='#4a4f55';for(let i=0;i<5;i++){const a=i/5*TAU-Math.PI/2;c.beginPath();c.ellipse(Math.cos(a)*R*.3,Math.sin(a)*R*.3,R*.07,R*.1,a+Math.PI/2,0,TAU);c.fill();}
  c.fillStyle=rg(c,-.02*s,-.02*s,0,0,0,R*.13,[[0,'#fff'],[1,'#777']]);c.beginPath();c.arc(0,0,R*.12,0,TAU);c.fill();
  // highlight
  c.strokeStyle='rgba(255,255,255,.22)';c.lineWidth=s*.03;c.beginPath();c.arc(0,0,R*.93,Math.PI*1.05,Math.PI*1.55);c.stroke();
}
const ITEMS=[tote,box,crate,toolbox,paint,tire];
const ITEM_NAMES=['tote','box','crate','toolbox','paint','tire'];

/* ---------- buried-junk blocker (dusty tarp) ---------- */
function junk(c,s,layers,glint){
  c.fillStyle=lg(c,0,-.5*s,0,.5*s,[[0,'#2b2620'],[1,'#17130f']]);rr(c,-.47*s,-.47*s,.94*s,.94*s,.1*s);c.fill();
  contact(c,s,.46,.38);
  c.beginPath();c.moveTo(-.46*s,.4*s);c.bezierCurveTo(-.5*s,.05*s,-.35*s,-.18*s,-.2*s,-.3*s);c.bezierCurveTo(-.08*s,-.42*s,.12*s,-.44*s,.22*s,-.3*s);c.bezierCurveTo(.36*s,-.2*s,.5*s,.0,.46*s,.4*s);c.closePath();
  c.fillStyle=lg(c,-.3*s,-.4*s,.3*s,.4*s,[[0,'#a99c86'],[.45,'#7a6e5c'],[1,'#3e362b']]);c.fill();
  // folds
  c.strokeStyle='rgba(30,24,16,.55)';c.lineWidth=s*.03;c.lineCap='round';
  c.beginPath();c.moveTo(-.25*s,-.18*s);c.quadraticCurveTo(-.15*s,.1*s,-.28*s,.36*s);c.stroke();
  c.beginPath();c.moveTo(.1*s,-.35*s);c.quadraticCurveTo(.02*s,0,.16*s,.36*s);c.stroke();
  c.strokeStyle='rgba(220,210,190,.35)';c.lineWidth=s*.018;
  c.beginPath();c.moveTo(-.22*s,-.2*s);c.quadraticCurveTo(-.12*s,.08*s,-.24*s,.34*s);c.stroke();
  c.beginPath();c.moveTo(.13*s,-.34*s);c.quadraticCurveTo(.05*s,0,.19*s,.34*s);c.stroke();
  // dust speckle
  const r=seeded(11);c.fillStyle='rgba(230,220,200,.25)';for(let i=0;i<30;i++){c.fillRect((r()-.5)*.8*s,(r()-.6)*.7*s,s*.012,s*.012);}
  // strap
  c.strokeStyle=lg(c,-.45*s,0,.45*s,0,[[0,'#6b1a10'],[.5,'#c33b22'],[1,'#5a140c']]);c.lineWidth=s*.07;c.lineCap='butt';
  c.beginPath();c.moveTo(-.46*s,.08*s);c.quadraticCurveTo(0,-.05*s,.46*s,.1*s);c.stroke();
  if(glint){ // gold peeking out
    c.fillStyle=rg(c,.26*s,.24*s,0,.26*s,.24*s,.16*s,[[0,'rgba(255,240,150,.95)'],[.4,'rgba(255,200,40,.6)'],[1,'rgba(255,200,40,0)']]);c.beginPath();c.arc(.26*s,.24*s,.16*s,0,TAU);c.fill();
    star(c,.26*s,.24*s,.09*s,'#fff8d0');
  }
  if(layers>=2){ // chain + lock
    c.strokeStyle='#9aa1a8';c.lineWidth=s*.035;
    for(let i=0;i<7;i++){const t=i/6,x=-.46*s+t*.92*s,y=-.32*s+t*.64*s;c.beginPath();c.ellipse(x,y,s*.05,s*.03,Math.PI/4+(i%2)*Math.PI/2,0,TAU);c.stroke();}
    c.strokeStyle='rgba(255,255,255,.4)';c.lineWidth=s*.012;
    for(let i=0;i<7;i++){const t=i/6,x=-.46*s+t*.92*s,y=-.32*s+t*.64*s;c.beginPath();c.ellipse(x-1,y-1,s*.05,s*.03,Math.PI/4+(i%2)*Math.PI/2,Math.PI,TAU);c.stroke();}
    if(layers>=3){c.strokeStyle='#9aa1a8';c.lineWidth=s*.035;
      for(let i=0;i<7;i++){const t=i/6,x=.46*s-t*.92*s,y=-.32*s+t*.64*s;c.beginPath();c.ellipse(x,y,s*.05,s*.03,-Math.PI/4+(i%2)*Math.PI/2,0,TAU);c.stroke();}}
    padlock(c,-.02*s,-.04*s,.26*s,false);
    if(layers>=3){c.fillStyle='#d8261a';c.beginPath();c.arc(.3*s,-.3*s,.12*s,0,TAU);c.fill();c.fillStyle='#fff';c.font='900 '+Math.round(s*.17)+'px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText('3',.3*s,-.29*s);}
  }
  c.strokeStyle='rgba(0,0,0,.6)';c.lineWidth=s*.02;rr(c,-.47*s,-.47*s,.94*s,.94*s,.1*s);c.stroke();
}
function star(c,x,y,r,col){c.fillStyle=col;c.beginPath();for(let i=0;i<8;i++){const a=i/8*TAU,rr2=i%2?r*.28:r;c.lineTo(x+Math.cos(a)*rr2,y+Math.sin(a)*rr2);}c.closePath();c.fill();}

/* ---------- valuable finds ---------- */
function guitar(c,s){
  contact(c,s,.36,.42);
  c.save();c.rotate(-.55);
  // neck
  c.fillStyle=lg(c,-.04*s,0,.04*s,0,[[0,'#3a1d0b'],[.5,'#7a4520'],[1,'#2c1407']]);c.fillRect(-.045*s,-.62*s,.09*s,.5*s);
  c.strokeStyle='rgba(230,230,230,.7)';c.lineWidth=s*.006;for(let i=0;i<4;i++){c.beginPath();c.moveTo(-.025*s,-.6*s+i*.12*s);c.lineTo(.025*s,-.6*s+i*.12*s);c.stroke();}
  c.fillStyle=lg(c,-.07*s,0,.07*s,0,[[0,'#1d0d04'],[.5,'#4a2410'],[1,'#1d0d04']]);rr(c,-.07*s,-.72*s,.14*s,.14*s,.03*s);c.fill();
  c.fillStyle='#e8e8e8';for(let i=0;i<3;i++){c.beginPath();c.arc(-.085*s,-.69*s+i*.045*s,.015*s,0,TAU);c.fill();c.beginPath();c.arc(.085*s,-.69*s+i*.045*s,.015*s,0,TAU);c.fill();}
  // body
  c.beginPath();c.arc(0,-.02*s,.18*s,0,TAU);c.arc(0,.2*s,.24*s,0,TAU);
  c.fillStyle=rg(c,-.05*s,.1*s,.02*s,0,.12*s,.36*s,[[0,'#ffd98a'],[.35,'#e5952f'],[.75,'#9c4a12'],[1,'#3c1805']]);c.fill();
  c.strokeStyle='#f5e2c0';c.lineWidth=s*.014;c.beginPath();c.arc(0,-.02*s,.18*s,Math.PI*1.15,Math.PI*1.85);c.stroke();c.beginPath();c.arc(0,.2*s,.24*s,-.2,Math.PI+.2);c.stroke();
  c.fillStyle='#1b0c03';c.beginPath();c.arc(0,.07*s,.07*s,0,TAU);c.fill();
  c.strokeStyle='#b47b2e';c.lineWidth=s*.01;c.beginPath();c.arc(0,.07*s,.085*s,0,TAU);c.stroke();
  c.fillStyle='#2a1406';c.fillRect(-.09*s,.28*s,.18*s,.035*s);
  c.strokeStyle='rgba(240,240,240,.75)';c.lineWidth=s*.005;for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(i*.012*s,-.6*s);c.lineTo(i*.012*s,.29*s);c.stroke();}
  c.fillStyle='rgba(255,255,255,.3)';c.beginPath();c.ellipse(-.1*s,.12*s,.05*s,.12*s,.3,0,TAU);c.fill();
  c.restore();
}
function jewelry(c,s){
  contact(c,s,.42,.4);
  const fx=-.38*s,fy=-.04*s,fw=.66*s,fh=.4*s,dx=.12*s,dy=-.12*s;
  // lid top
  c.beginPath();c.moveTo(fx,fy-.12*s);c.lineTo(fx+dx,fy+dy-.12*s);c.lineTo(fx+fw+dx,fy+dy-.12*s);c.lineTo(fx+fw,fy-.12*s);c.closePath();
  c.fillStyle=lg(c,0,fy+dy-.12*s,0,fy-.12*s,[[0,'#e0607a'],[1,'#9c1430']]);c.fill();
  // side
  c.beginPath();c.moveTo(fx+fw,fy-.12*s);c.lineTo(fx+fw+dx,fy+dy-.12*s);c.lineTo(fx+fw+dx,fy+fh+dy);c.lineTo(fx+fw,fy+fh);c.closePath();c.fillStyle='#5c0a1c';c.fill();
  // front (lid + base)
  c.fillStyle=lg(c,fx,0,fx+fw,0,[[0,'#7a0e26'],[.4,'#c8264a'],[1,'#6a0a1f']]);c.fillRect(fx,fy-.12*s,fw,fh+.12*s);
  // gold trim
  c.fillStyle=lg(c,0,fy,0,fy+.04*s,[[0,'#fff2b0'],[.5,'#e0a922'],[1,'#8a5b00']]);c.fillRect(fx,fy,fw,.04*s);c.fillRect(fx,fy+fh-.035*s,fw,.035*s);c.fillRect(fx,fy-.12*s,fw,.025*s);
  // clasp
  c.fillStyle=lg(c,0,fy-.03*s,0,fy+.1*s,[[0,'#fff6c8'],[.5,'#f0b92a'],[1,'#8a5b00']]);rr(c,fx+fw/2-.05*s,fy-.03*s,.1*s,.13*s,.02*s);c.fill();
  // gems
  [[fx+fw*.2,fy+fh*.55,'#3fb6ff'],[fx+fw*.5,fy+fh*.6,'#ffffff'],[fx+fw*.8,fy+fh*.55,'#4cff9a']].forEach(g=>{c.fillStyle=rg(c,g[0]-.01*s,g[1]-.01*s,0,g[0],g[1],.04*s,[[0,'#fff'],[.4,g[2]],[1,'rgba(0,0,0,.6)']]);c.beginPath();c.arc(g[0],g[1],.035*s,0,TAU);c.fill();});
  // pearls hanging
  c.fillStyle='#fff';for(let i=0;i<6;i++){const px=fx+fw*.1+i*.035*s,py=fy+fh+.02*s+Math.sin(i/5*Math.PI)*.05*s;c.fillStyle=rg(c,px-.006*s,py-.006*s,0,px,py,.02*s,[[0,'#fff'],[1,'#c9c2b8']]);c.beginPath();c.arc(px,py,.018*s,0,TAU);c.fill();}
  spec(c,fx+.03*s,fy-.115*s,fw*.6,.03*s,.5);
}
function safe(c,s){
  contact(c,s,.44,.42);
  const fx=-.4*s,fy=-.32*s,fw=.68*s,fh=.7*s,dx=.12*s,dy=-.1*s;
  c.beginPath();c.moveTo(fx,fy);c.lineTo(fx+dx,fy+dy);c.lineTo(fx+fw+dx,fy+dy);c.lineTo(fx+fw,fy);c.closePath();c.fillStyle=lg(c,0,fy+dy,0,fy,[[0,'#9aa2ab'],[1,'#5b636c']]);c.fill();
  c.beginPath();c.moveTo(fx+fw,fy);c.lineTo(fx+fw+dx,fy+dy);c.lineTo(fx+fw+dx,fy+fh+dy);c.lineTo(fx+fw,fy+fh);c.closePath();c.fillStyle='#252a30';c.fill();
  c.fillStyle=lg(c,fx,fy,fx+fw,fy+fh,[[0,'#7d8690'],[.45,'#4a525b'],[1,'#1e2328']]);c.fillRect(fx,fy,fw,fh);
  // door inset
  c.strokeStyle='rgba(0,0,0,.55)';c.lineWidth=s*.016;c.strokeRect(fx+.05*s,fy+.05*s,fw-.1*s,fh-.1*s);
  c.strokeStyle='rgba(255,255,255,.25)';c.strokeRect(fx+.065*s,fy+.065*s,fw-.13*s,fh-.13*s);
  // dial
  const cx=fx+fw*.42,cy=fy+fh*.45;
  c.fillStyle=rg(c,cx-.04*s,cy-.04*s,0,cx,cy,.14*s,[[0,'#ffffff'],[.35,'#c9ced4'],[.8,'#5f666e'],[1,'#2b3036']]);c.beginPath();c.arc(cx,cy,.13*s,0,TAU);c.fill();
  c.strokeStyle='#22272c';c.lineWidth=s*.008;for(let i=0;i<20;i++){const a=i/20*TAU;c.beginPath();c.moveTo(cx+Math.cos(a)*.1*s,cy+Math.sin(a)*.1*s);c.lineTo(cx+Math.cos(a)*.125*s,cy+Math.sin(a)*.125*s);c.stroke();}
  c.fillStyle=rg(c,cx-.01*s,cy-.01*s,0,cx,cy,.05*s,[[0,'#fff'],[1,'#555']]);c.beginPath();c.arc(cx,cy,.045*s,0,TAU);c.fill();
  // handle
  c.strokeStyle=lg(c,0,cy-.1*s,0,cy+.1*s,[[0,'#f0f0f0'],[1,'#555']]);c.lineWidth=s*.035;c.lineCap='round';
  const hx=fx+fw*.8;c.beginPath();c.moveTo(hx,cy-.1*s);c.lineTo(hx,cy+.1*s);c.stroke();
  // hinges + gold stripe
  c.fillStyle='#1a1d21';c.fillRect(fx-.015*s,fy+.12*s,.035*s,.1*s);c.fillRect(fx-.015*s,fy+fh-.22*s,.035*s,.1*s);
  c.fillStyle=lg(c,0,fy+fh-.1*s,0,fy+fh-.07*s,[[0,'#ffe89a'],[1,'#a77a10']]);c.fillRect(fx+.08*s,fy+fh-.1*s,fw-.16*s,.025*s);
  spec(c,fx+.02*s,fy+.01*s,fw*.7,.035*s,.35);
}
function camera(c,s){
  contact(c,s,.42,.36);
  c.fillStyle=lg(c,0,-.2*s,0,.3*s,[[0,'#3a3a3a'],[1,'#0e0e0e']]);rr(c,-.42*s,-.18*s,.84*s,.5*s,.07*s);c.fill();
  c.fillStyle=lg(c,0,-.3*s,0,-.12*s,[[0,'#f3f3f3'],[1,'#8d8d8d']]);rr(c,-.42*s,-.2*s,.84*s,.12*s,.04*s);c.fill();
  c.fillStyle=lg(c,0,-.36*s,0,-.2*s,[[0,'#eee'],[1,'#777']]);rr(c,-.14*s,-.34*s,.28*s,.16*s,.03*s);c.fill();
  c.fillStyle='#1a1a1a';c.fillRect(-.36*s,-.08*s,.72*s,.36*s);
  c.fillStyle='rgba(255,255,255,.07)';for(let i=0;i<9;i++)c.fillRect(-.36*s,-.06*s+i*.04*s,.72*s,.01*s);
  c.fillStyle=rg(c,0,.08*s,.02*s,0,.08*s,.22*s,[[0,'#cfd3d8'],[.6,'#6c7279'],[1,'#202326']]);c.beginPath();c.arc(0,.08*s,.21*s,0,TAU);c.fill();
  c.fillStyle=rg(c,-.04*s,.04*s,0,0,.08*s,.14*s,[[0,'#7fb3ff'],[.3,'#1f3c6a'],[1,'#05080d']]);c.beginPath();c.arc(0,.08*s,.14*s,0,TAU);c.fill();
  c.fillStyle='rgba(255,255,255,.75)';c.beginPath();c.ellipse(-.05*s,.03*s,.035*s,.02*s,-.6,0,TAU);c.fill();
  c.fillStyle='#d23';c.beginPath();c.arc(.3*s,-.27*s,.035*s,0,TAU);c.fill();
}
const FINDS={guitar:{draw:guitar,name:'Guitar',price:350},jewelry:{draw:jewelry,name:'Jewelry Box',price:240},safe:{draw:safe,name:'Safe',price:900},camera:{draw:camera,name:'Vintage Camera',price:180}};

function padlock(c,x,y,s,open,shOff){
  shOff=shOff||0;
  c.save();c.translate(x,y);
  c.strokeStyle=lg(c,-.2*s,0,.2*s,0,[[0,'#5d636a'],[.5,'#f4f6f8'],[1,'#4a5056']]);c.lineWidth=s*.13;c.lineCap='butt';
  c.beginPath();c.moveTo(-.22*s,-.05*s-shOff);c.lineTo(-.22*s,-.3*s-shOff);c.arc(0,-.3*s-shOff,.22*s,Math.PI,0);c.lineTo(.22*s,open?-.25*s-shOff:-.05*s-shOff);c.stroke();
  c.fillStyle=lg(c,0,-.1*s,0,.45*s,[[0,'#fff1a8'],[.25,'#f2c23a'],[.7,'#b8840c'],[1,'#6d4a00']]);rr(c,-.36*s,-.1*s,.72*s,.56*s,.08*s);c.fill();
  c.strokeStyle='rgba(80,50,0,.7)';c.lineWidth=s*.03;c.stroke();
  spec(c,-.3*s,-.08*s,.45*s,.08*s,.7);
  c.fillStyle='#2a1c00';c.beginPath();c.arc(0,.12*s,.06*s,0,TAU);c.fill();c.fillRect(-.022*s,.12*s,.044*s,.15*s);
  c.restore();
}

/* ---------- orange roll-up door ---------- */
function rollDoor(c,x,y,w,h,openFrac,opts){
  opts=opts||{};
  // frame & dark opening
  c.fillStyle='#14110d';c.fillRect(x,y,w,h);
  const vis=h*(1-openFrac);
  if(vis>0){
    c.save();c.beginPath();c.rect(x,y,w,vis);c.clip();
    const slat=Math.max(10,h/14);
    const off=(h-vis)%slat;
    for(let sy=y-off;sy<y+vis;sy+=slat){
      c.fillStyle=lg(c,0,sy,0,sy+slat,[[0,'#ffb366'],[.12,'#ff8f2e'],[.55,'#e8691a'],[.9,'#b94b0c'],[1,'#6e2a03']]);c.fillRect(x,sy,w,slat);
      c.fillStyle='rgba(255,230,190,.35)';c.fillRect(x,sy+1,w,Math.max(1,slat*.06));
    }
    // light falloff across the door
    c.fillStyle=lg(c,x,0,x+w,0,[[0,'rgba(0,0,0,.35)'],[.3,'rgba(0,0,0,0)'],[.7,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,.4)']]);c.fillRect(x,y,w,vis);
    c.fillStyle=lg(c,0,y,0,y+h,[[0,'rgba(255,255,255,.08)'],[1,'rgba(0,0,0,.25)']]);c.fillRect(x,y,w,vis);
    // bottom bar + handle
    const by=y+vis;
    c.fillStyle=lg(c,0,by-h*.05,0,by,[[0,'#d9dde1'],[.5,'#8a9097'],[1,'#3a3f44']]);c.fillRect(x,by-h*.045,w,h*.045);
    c.fillStyle=lg(c,0,by-h*.11,0,by-h*.05,[[0,'#e4e7ea'],[1,'#5c6268']]);rr(c,x+w/2-w*.09,by-h*.105,w*.18,h*.05,h*.012);c.fill();
    c.restore();
  }
  // steel frame
  const fw=Math.max(6,w*.035);
  c.fillStyle=lg(c,x-fw,0,x,0,[[0,'#3c4146'],[.5,'#9aa1a8'],[1,'#50565c']]);c.fillRect(x-fw,y-fw,fw,h+fw);
  c.fillStyle=lg(c,x+w,0,x+w+fw,0,[[0,'#50565c'],[.5,'#9aa1a8'],[1,'#3c4146']]);c.fillRect(x+w,y-fw,fw,h+fw);
  c.fillStyle=lg(c,0,y-fw*1.6,0,y,[[0,'#b6bcc2'],[1,'#454b51']]);c.fillRect(x-fw,y-fw*1.6,w+fw*2,fw*1.6);
  if(opts.label){c.fillStyle='#fff';c.font='900 '+Math.round(fw*1.2)+'px system-ui,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(opts.label,x+w/2,y-fw*.8);}
}

/* ---------- scenes ---------- */
function noiseDots(c,x,y,w,h,n,col,seed,sz){const r=seeded(seed||3);c.fillStyle=col;for(let i=0;i<n;i++){const s2=(sz||1.5)*(.5+r());c.fillRect(x+r()*w,y+r()*h,s2,s2);}}
function sky(c,W,H,h){c.fillStyle=lg(c,0,0,0,h,[[0,'#2f7fd6'],[.6,'#8cc6f2'],[1,'#f4e3c0']]);c.fillRect(0,0,W,h);
  c.fillStyle=rg(c,W*.82,h*.25,0,W*.82,h*.25,h*.6,[[0,'rgba(255,250,220,1)'],[.08,'rgba(255,240,190,.9)'],[.3,'rgba(255,220,150,.25)'],[1,'rgba(255,220,150,0)']]);c.fillRect(0,0,W,h);}
function asphalt(c,x,y,w,h,seed){c.fillStyle=lg(c,0,y,0,y+h,[[0,'#6d6a66'],[1,'#3a3835']]);c.fillRect(x,y,w,h);noiseDots(c,x,y,w,h,Math.floor(w*h/40),'rgba(255,255,255,.08)',seed||5,1.6);noiseDots(c,x,y,w,h,Math.floor(w*h/50),'rgba(0,0,0,.15)',(seed||5)+1,1.8);}
function lockerRow(c,x,y,w,h,n,sc){ // building with roll-up doors
  c.fillStyle=lg(c,0,y-h*.18,0,y,[[0,'#cfd3d6'],[1,'#8f959a']]);c.fillRect(x,y-h*.18,w,h*.18);
  c.fillStyle=lg(c,0,y-h*.22,0,y-h*.18,[[0,'#6b7176'],[1,'#3d4246']]);c.fillRect(x-4,y-h*.22,w+8,h*.04);
  c.fillStyle=lg(c,0,y,0,y+h,[[0,'#d7d2c8'],[1,'#a9a397']]);c.fillRect(x,y,w,h);
  const dw=w/n;
  for(let i=0;i<n;i++){const dx=x+i*dw+dw*.12;rollDoor(c,dx,y+h*.12,dw*.76,h*.88,0);}
  c.fillStyle=lg(c,0,y+h,0,y+h+h*.08,[[0,'rgba(0,0,0,.45)'],[1,'rgba(0,0,0,0)']]);c.fillRect(x,y+h,w,h*.08);
}
function fence(c,x,y,w,h){
  c.save();c.strokeStyle='rgba(190,195,200,.55)';c.lineWidth=1.2;const g=Math.max(9,h/9);
  c.beginPath();c.rect(x,y,w,h);c.clip();
  for(let i=-h;i<w+h;i+=g){c.beginPath();c.moveTo(x+i,y);c.lineTo(x+i+h,y+h);c.stroke();c.beginPath();c.moveTo(x+i+h,y);c.lineTo(x+i,y+h);c.stroke();}
  c.restore();
  c.fillStyle=lg(c,0,y-3,0,y+3,[[0,'#eef0f2'],[1,'#6c7278']]);c.fillRect(x,y-3,w,5);
  for(let px=x;px<=x+w;px+=w/4){c.fillStyle=lg(c,px-3,0,px+3,0,[[0,'#6c7278'],[.5,'#e6e9ec'],[1,'#5a6066']]);c.fillRect(px-3,y-6,6,h+6);}
}
function woodSign(c,x,y,w,h,lines,fontPx){
  // posts shadow
  c.fillStyle='rgba(0,0,0,.35)';rr(c,x+4,y+6,w,h,8);c.fill();
  c.fillStyle=lg(c,0,y,0,y+h,[[0,'#f3e3c0'],[1,'#d8c194']]);rr(c,x,y,w,h,8);c.fill();
  c.strokeStyle='#6b4a22';c.lineWidth=Math.max(3,w*.012);rr(c,x,y,w,h,8);c.stroke();
  c.strokeStyle='rgba(120,90,50,.18)';c.lineWidth=1;for(let i=1;i<5;i++){c.beginPath();c.moveTo(x+6,y+i*h/5);c.lineTo(x+w-6,y+i*h/5);c.stroke();}
  [[x+10,y+10],[x+w-10,y+10],[x+10,y+h-10],[x+w-10,y+h-10]].forEach(p=>{c.fillStyle=rg(c,p[0]-1,p[1]-1,0,p[0],p[1],4,[[0,'#fff'],[1,'#555']]);c.beginPath();c.arc(p[0],p[1],3.5,0,TAU);c.fill();});
  c.fillStyle='#2a1a0b';c.textAlign='center';c.textBaseline='middle';c.font='900 '+fontPx+'px "Arial Black","Helvetica Neue",system-ui,sans-serif';
  const lh=fontPx*1.18, y0=y+h/2-(lines.length-1)*lh/2;
  lines.forEach((l,i)=>c.fillText(l,x+w/2,y0+i*lh));
}
function wrapText(c,text,maxW){const words=text.split(' ');const lines=[];let cur='';words.forEach(w=>{const t=cur?cur+' '+w:w;if(c.measureText(t).width>maxW&&cur){lines.push(cur);cur=w;}else cur=t;});if(cur)lines.push(cur);return lines;}

function vignette(c,W,H,a){c.fillStyle=rg(c,W/2,H*.45,Math.min(W,H)*.3,W/2,H*.5,Math.max(W,H)*.75,[[0,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,'+(a||.55)+')']]);c.fillRect(0,0,W,H);}

function bgIndoor(c,W,H){
  // corrugated wall
  for(let x=0;x<W;x+=14){c.fillStyle=lg(c,x,0,x+14,0,[[0,'#8e98a3'],[.35,'#d5dbe1'],[.6,'#aab3bc'],[1,'#7c8691']]);c.fillRect(x,0,14,H*.7);}
  c.fillStyle=lg(c,0,0,0,H*.7,[[0,'rgba(255,255,255,.25)'],[.5,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,.25)']]);c.fillRect(0,0,W,H*.7);
  // fluorescent light
  c.fillStyle=rg(c,W/2,0,0,W/2,0,H*.6,[[0,'rgba(240,250,255,.85)'],[.4,'rgba(220,235,255,.25)'],[1,'rgba(220,235,255,0)']]);c.fillRect(0,0,W,H*.7);
  c.fillStyle=lg(c,0,4,0,14,[[0,'#fff'],[1,'#cfe6ff']]);rr(c,W*.3,6,W*.4,8,4);c.fill();
  // concrete floor
  c.fillStyle=lg(c,0,H*.7,0,H,[[0,'#9b9893'],[1,'#c9c5bd']]);c.fillRect(0,H*.7,W,H*.3);
  noiseDots(c,0,H*.7,W,H*.3,600,'rgba(60,55,50,.18)',21,2);
  c.strokeStyle='rgba(60,55,50,.25)';c.lineWidth=1;for(let i=-3;i<=3;i++){c.beginPath();c.moveTo(W/2+i*W*.12,H*.7);c.lineTo(W/2+i*W*.5,H);c.stroke();}
  c.fillStyle='rgba(0,0,0,.3)';c.fillRect(0,H*.7-3,W,4);
  // background stacked boxes (soft)
  c.save();c.globalAlpha=.55;c.translate(W*.1,H*.62);box(c,H*.13);c.translate(0,-H*.1);box(c,H*.12);c.restore();
  c.save();c.globalAlpha=.55;c.translate(W*.9,H*.63);tote(c,H*.13);c.translate(0,-H*.1);tote(c,H*.12);c.restore();
  vignette(c,W,H,.5);
}
function bgGarage(c,W,H){
  // cinder block wall
  c.fillStyle='#4e4a44';c.fillRect(0,0,W,H*.72);
  const bh=Math.max(18,H/30), bw=bh*2.1;
  for(let r=0;r*bh<H*.72;r++){for(let x=-(r%2)*bw/2;x<W;x+=bw){c.fillStyle=lg(c,0,r*bh,0,r*bh+bh,[[0,'#7b756c'],[1,'#57524b']]);c.fillRect(x+1.5,r*bh+1.5,bw-3,bh-3);}}
  noiseDots(c,0,0,W,H*.72,900,'rgba(0,0,0,.15)',31,2);
  // grease stains on wall
  [[.2,.5,.12],[.75,.35,.09]].forEach(s=>{c.fillStyle=rg(c,W*s[0],H*s[1],0,W*s[0],H*s[1],W*s[2],[[0,'rgba(20,15,5,.45)'],[1,'rgba(20,15,5,0)']]);c.fillRect(0,0,W,H);});
  // pegboard
  c.fillStyle=lg(c,0,H*.08,0,H*.3,[[0,'#a37b4b'],[1,'#7e5c34']]);c.fillRect(W*.06,H*.07,W*.38,H*.2);
  c.fillStyle='rgba(40,25,10,.6)';for(let x=W*.08;x<W*.43;x+=9)for(let y=H*.085;y<H*.26;y+=9){c.beginPath();c.arc(x,y,1.2,0,TAU);c.fill();}
  c.strokeStyle='#30343a';c.lineWidth=4;c.lineCap='round';c.beginPath();c.moveTo(W*.12,H*.1);c.lineTo(W*.12,H*.22);c.stroke();c.beginPath();c.arc(W*.2,H*.12,10,0,TAU);c.stroke();c.beginPath();c.moveTo(W*.3,H*.1);c.lineTo(W*.36,H*.22);c.stroke();
  // daylight from the driveway (right)
  c.fillStyle=lg(c,W,0,W*.35,0,[[0,'rgba(255,236,190,.85)'],[.35,'rgba(255,220,160,.25)'],[1,'rgba(255,220,160,0)']]);c.fillRect(0,0,W,H);
  c.fillStyle=lg(c,0,0,0,H*.72,[[0,'#ffe9b8'],[1,'#fff6dc']]);c.fillRect(W*.86,H*.05,W*.14,H*.67);
  // floor
  c.fillStyle=lg(c,0,H*.72,0,H,[[0,'#5d5953'],[1,'#86817a']]);c.fillRect(0,H*.72,W,H*.28);
  noiseDots(c,0,H*.72,W,H*.28,700,'rgba(0,0,0,.2)',41,2);
  [[.3,.85,.16],[.7,.92,.1],[.15,.95,.07]].forEach(s=>{c.fillStyle=rg(c,W*s[0],H*s[1],0,W*s[0],H*s[1],W*s[2],[[0,'rgba(10,8,4,.6)'],[.7,'rgba(30,20,10,.3)'],[1,'rgba(30,20,10,0)']]);c.save();c.translate(W*s[0],H*s[1]);c.scale(1,.35);c.beginPath();c.arc(0,0,W*s[2],0,TAU);c.restore();c.fill();});
  c.fillStyle=lg(c,W,0,W*.4,0,[[0,'rgba(255,230,170,.35)'],[1,'rgba(255,230,170,0)']]);c.fillRect(0,H*.72,W,H*.28);
  c.save();c.globalAlpha=.6;c.translate(W*.1,H*.68);tire(c,H*.12);c.translate(0,-H*.07);tire(c,H*.12);c.restore();
  vignette(c,W,H,.6);
}
function bgYard(c,W,H){
  sky(c,W,H,H*.45);
  // distant locker rows
  lockerRow(c,-10,H*.3,W*.62,H*.13,4);lockerRow(c,W*.5,H*.32,W*.6,H*.12,4);
  // heat haze ground
  asphalt(c,0,H*.44,W,H*.56,9);
  c.fillStyle=lg(c,0,H*.44,0,H*.6,[[0,'rgba(255,230,180,.45)'],[1,'rgba(255,230,180,0)']]);c.fillRect(0,H*.44,W,H*.16);
  c.strokeStyle='rgba(255,215,60,.75)';c.lineWidth=4;c.setLineDash([24,18]);c.beginPath();c.moveTo(W*.5,H*.46);c.lineTo(W*.5,H);c.stroke();c.setLineDash([]);
  fence(c,0,H*.38,W,H*.06);
  c.fillStyle=lg(c,0,0,W,H,[[0,'rgba(255,200,120,.12)'],[1,'rgba(255,140,40,.12)']]);c.fillRect(0,0,W,H);
  vignette(c,W,H,.45);
}
const THEMES={indoor:bgIndoor,garage:bgGarage,yard:bgYard};

function yardScene(c,W,H,opts){ // title yard
  sky(c,W,H,H*.42);
  lockerRow(c,W*.04,H*.3,W*.92,H*.2,4);
  asphalt(c,0,H*.5,W,H*.5,13);
  c.fillStyle=lg(c,0,H*.5,0,H*.62,[[0,'rgba(0,0,0,.35)'],[1,'rgba(0,0,0,0)']]);c.fillRect(0,H*.5,W,H*.12);
  fence(c,0,H*.6,W,H*.1);
  vignette(c,W,H,.4);
}

/* ---------- life-ladder buildings (origin = ground centre, u = size) ---------- */
function bTent(c,u){ // No Home
  c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(0,0,u*.55,u*.12,0,0,TAU);c.fill();
  c.fillStyle=lg(c,-u*.45,0,u*.45,0,[[0,'#123e7a'],[.5,'#2f7fd6'],[1,'#0f3366']]);c.beginPath();c.moveTo(-u*.45,0);c.lineTo(0,-u*.5);c.lineTo(u*.45,0);c.closePath();c.fill();
  c.fillStyle='#071a33';c.beginPath();c.moveTo(-u*.1,0);c.lineTo(0,-u*.3);c.lineTo(u*.1,0);c.closePath();c.fill();
  c.save();c.translate(u*.42,-u*.1);box(c,u*.3);c.restore();
}
function bUnit(c,u){ // Storage Rental
  c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(0,0,u*.6,u*.13,0,0,TAU);c.fill();
  c.fillStyle=lg(c,0,-u*.6,0,0,[[0,'#e7e3da'],[1,'#a9a397']]);c.fillRect(-u*.45,-u*.6,u*.9,u*.6);
  c.fillStyle=lg(c,0,-u*.7,0,-u*.6,[[0,'#9aa0a6'],[1,'#4c5258']]);c.fillRect(-u*.5,-u*.68,u*1,u*.09);
  rollDoor(c,-u*.3,-u*.5,u*.6,u*.5,0);
}
function bApt(c,u){
  c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(0,0,u*.6,u*.13,0,0,TAU);c.fill();
  c.fillStyle=lg(c,-u*.4,0,u*.4,0,[[0,'#7a3322'],[.5,'#b5533a'],[1,'#6a2a1b']]);c.fillRect(-u*.4,-u*1.05,u*.8,u*1.05);
  c.fillStyle='rgba(60,20,10,.25)';for(let y=-u*1.05;y<0;y+=u*.06)c.fillRect(-u*.4,y,u*.8,1);
  c.fillStyle='#5a5f66';c.fillRect(-u*.44,-u*1.1,u*.88,u*.06);
  for(let r=0;r<4;r++)for(let k=0;k<3;k++){const wx=-u*.3+k*u*.22,wy=-u*.98+r*u*.22;c.fillStyle=lg(c,0,wy,0,wy+u*.13,[[0,'#ffe9a8'],[1,'#d99a3a']]);c.fillRect(wx,wy,u*.15,u*.13);c.strokeStyle='#eee';c.lineWidth=1;c.strokeRect(wx,wy,u*.15,u*.13);}
  c.fillStyle='#3a2516';c.fillRect(-u*.08,-u*.14,u*.16,u*.14);
}
function bHouse(c,u){
  c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(0,0,u*.65,u*.14,0,0,TAU);c.fill();
  c.fillStyle=lg(c,-u*.45,0,u*.45,0,[[0,'#d9d2c2'],[.5,'#f6f1e6'],[1,'#bfb6a3']]);c.fillRect(-u*.45,-u*.5,u*.9,u*.5);
  c.fillStyle=lg(c,0,-u*.95,0,-u*.45,[[0,'#7a2d20'],[1,'#4a1710']]);c.beginPath();c.moveTo(-u*.56,-u*.48);c.lineTo(0,-u*.95);c.lineTo(u*.56,-u*.48);c.closePath();c.fill();
  c.fillStyle='#6a5a4a';c.fillRect(u*.22,-u*.9,u*.1,u*.25);
  c.fillStyle='#3e6b3a';c.fillRect(-u*.08,-u*.3,u*.16,u*.3);
  [-u*.3,u*.16].forEach(wx=>{c.fillStyle=lg(c,0,-u*.38,0,-u*.22,[[0,'#ffeeb0'],[1,'#e0a040']]);c.fillRect(wx,-u*.38,u*.14,u*.14);});
  c.fillStyle='#2f8a3a';[[-.55,.0],[.55,.0]].forEach(p=>{c.beginPath();c.arc(p[0]*u,-u*.08,u*.12,0,TAU);c.fill();});
}
function bWarehouse(c,u){
  c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(0,0,u*.75,u*.15,0,0,TAU);c.fill();
  for(let x=-u*.65;x<u*.65;x+=u*.06){c.fillStyle=lg(c,x,0,x+u*.06,0,[[0,'#7c8691'],[.5,'#c9d0d7'],[1,'#7c8691']]);c.fillRect(x,-u*.55,u*.06,u*.55);}
  c.fillStyle=lg(c,0,-u*.8,0,-u*.55,[[0,'#d0d6dc'],[1,'#6a737c']]);c.beginPath();c.moveTo(-u*.68,-u*.55);c.quadraticCurveTo(0,-u*.85,u*.68,-u*.55);c.closePath();c.fill();
  rollDoor(c,-u*.5,-u*.38,u*.3,u*.38,0);rollDoor(c,u*.2,-u*.38,u*.3,u*.38,0);
}
function bFacility(c,u){
  c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(0,0,u*.85,u*.16,0,0,TAU);c.fill();
  lockerRow(c,-u*.8,-u*.42,u*1.6,u*.42,5);
  c.fillStyle=lg(c,0,-u*1.05,0,-u*.75,[[0,'#ffb84d'],[1,'#d0601e']]);rr(c,-u*.5,-u*1.05,u*1,u*.3,u*.05);c.fill();
  c.fillStyle='#4b5157';c.fillRect(-u*.03,-u*.75,u*.06,u*.2);
  c.fillStyle='#fff';c.font='900 '+Math.round(u*.15)+'px system-ui,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('MY STORAGE',0,-u*.9);
}
function bCastle(c,u){
  c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(0,0,u*.85,u*.16,0,0,TAU);c.fill();
  const stone=(x,y,w,h)=>{c.fillStyle=lg(c,x,0,x+w,0,[[0,'#8d8a84'],[.5,'#d8d3c8'],[1,'#7a776f']]);c.fillRect(x,y,w,h);c.fillStyle='rgba(0,0,0,.12)';for(let yy=y;yy<y+h;yy+=u*.07)c.fillRect(x,yy,w,1);};
  stone(-u*.5,-u*.6,u*1,u*.6);
  for(let i=0;i<6;i++)stone(-u*.5+i*u*.18,-u*.68,u*.1,u*.08);
  [[-.7,1.0],[.5,1.0],[-.12,1.25]].forEach(t=>{const x=t[0]*u,h=t[1]*u;stone(x,-h,u*.22,h);c.fillStyle=lg(c,0,-h-u*.3,0,-h,[[0,'#2b4fa6'],[1,'#162c66']]);c.beginPath();c.moveTo(x-u*.03,-h);c.lineTo(x+u*.11,-h-u*.3);c.lineTo(x+u*.25,-h);c.closePath();c.fill();
    c.fillStyle='#ffd23f';c.fillRect(x+u*.1,-h-u*.42,u*.015,u*.13);c.beginPath();c.moveTo(x+u*.115,-h-u*.42);c.lineTo(x+u*.2,-h-u*.38);c.lineTo(x+u*.115,-h-u*.34);c.fill();
    c.fillStyle='#ffe9a8';c.fillRect(x+u*.07,-h*.7,u*.08,u*.1);});
  c.fillStyle='#3a2516';c.beginPath();c.moveTo(-u*.1,0);c.lineTo(-u*.1,-u*.2);c.arc(0,-u*.2,u*.1,Math.PI,0);c.lineTo(u*.1,0);c.fill();
}
const BUILDINGS=[bTent,bUnit,bApt,bHouse,bWarehouse,bFacility,bCastle];
const LADDER=['No Home','Storage Rental','Apartment','Home','Warehouse','Own Facilities','Castles & Mansions'];

window.ART={rr,lg,rg,star,ITEMS,ITEM_NAMES,junk,FINDS,padlock,rollDoor,THEMES,yardScene,woodSign,wrapText,vignette,BUILDINGS,LADDER,box,tote,crate,tire,asphalt,sky,lockerRow,fence,seeded};
})();
