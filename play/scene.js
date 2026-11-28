// Storage Auction Rush — Board Adventure 3D scene (isolated prototype). Original procedural art, Three.js (MIT, vendored).
import * as THREE from './vendor/three.module.min.js';
import * as DICE from './dice.js';
import * as MOD from './models.js';
const KN='assets/kenney/';

const TAU=Math.PI*2, ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2, back=t=>{const c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);};
const COL={sand:0xd9b77d,dust:0xc89a62,asphalt:0x5a5450,teal:0x1f6a66,deepTeal:0x14474a,coral:0xe0674a,cream:0xfff1d2,brass:0xd9a441,
  rust:0xa4532f,orange:0xe9792f,purple:0x6a3c8c,skin:0xd99a74,beard:0x3b2a20,black:0x23201f,red:0xb8332c,white:0xf4ead6};
export const SPACE_STYLE={payday:{c:0xf1b740,label:'PAYDAY',icon:'$'},auction:{c:0xe9792f,label:'AUCTION',icon:'🔨'},pawn:{c:0x3f9a8a,label:'PAWN',icon:'💰'},
  flea:{c:0xd9584a,label:'FLEA',icon:'🏷️'},upgrade:{c:0x5c7fd1,label:'UPGRADE',icon:'⬆'},rival:{c:0x7a4aa0,label:'RIVAL',icon:'🤠'},bonus:{c:0xe0b23a,label:'CASES',icon:'🧳'},slot:{c:0xc2417a,label:'LUCKY',icon:'🎰'},off:{c:0x8fa58f,label:'DAY OFF',icon:'☕'}};

let renderer,scene,camera,clock,canvas,W=1,H=1,quality='high';
const anims=[];               // {t0,dur,fn,res}
const parts=[];               // particles
let pirate,earl,truck,dice,flea,fleaLevel=0,locker,spaces=[],curve,ring;
const camState={pos:new THREE.Vector3(0,30,26),look:new THREE.Vector3(0,0,0),tPos:new THREE.Vector3(0,30,26),tLook:new THREE.Vector3(),mode:'overview',k:2.2};
export const perf={frames:new Float32Array(600),cpu:new Float32Array(600),fi:0,n:0,last:0};
let onFrame=null,onHit=null;const mixers=[];export function setHitHook(f){onHit=f;}

function mat(c,o={}){return new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.78,metalness:0},o));}
function box(w,h,d,m,x=0,y=0,z=0,p){const g=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);g.position.set(x,y,z);g.castShadow=g.receiveShadow=true;if(p)p.add(g);return g;}
function cyl(rt,rb,h,m,x=0,y=0,z=0,p,seg=14){const g=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),m);g.position.set(x,y,z);g.castShadow=g.receiveShadow=true;if(p)p.add(g);return g;}
function sph(r,m,x=0,y=0,z=0,p,s=16){const g=new THREE.Mesh(new THREE.SphereGeometry(r,s,Math.max(8,s*.6|0)),m);g.position.set(x,y,z);g.castShadow=true;if(p)p.add(g);return g;}
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');draw(x,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
function noiseTex(base,spots,n=900,size=256){return canvasTex(size,size,(x,w,h)=>{x.fillStyle=base;x.fillRect(0,0,w,h);for(let i=0;i<n;i++){x.fillStyle=spots[i%spots.length];x.globalAlpha=.05+Math.random()*.12;const r=1+Math.random()*5;x.beginPath();x.arc(Math.random()*w,Math.random()*h,r,0,TAU);x.fill();}x.globalAlpha=1;});}
function drop(parent,o){parent.remove(o);o.traverse(x=>{if(x.geometry&&x.geometry!==coinGeo&&x.geometry!==dustGeo&&!x.geometry.userData.keep)x.geometry.dispose();});}
function tween(dur,fn){return new Promise(res=>anims.push({t0:performance.now(),dur,fn,res}));}

export function init(cv,opts={}){
  canvas=cv;const dpr=Math.min(window.devicePixelRatio||1,opts.maxDpr||2);
  renderer=new THREE.WebGLRenderer({canvas,antialias:dpr<2,powerPreference:'high-performance'});
  renderer.setPixelRatio(dpr);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  scene=new THREE.Scene();
  scene.background=canvasTex(8,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#2c6f78');g.addColorStop(.45,'#7fb3a6');g.addColorStop(.7,'#f3c98d');g.addColorStop(1,'#e59a62');x.fillStyle=g;x.fillRect(0,0,w,h);});
  scene.fog=new THREE.Fog(0xd8b98d,42,95);
  camera=new THREE.PerspectiveCamera(42,1,.1,260);clock=new THREE.Clock();
  scene.add(new THREE.HemisphereLight(0xfff0d6,0x5d4632,1.15));
  const sun=new THREE.DirectionalLight(0xffdcae,2.4);sun.position.set(-14,26,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
  Object.assign(sun.shadow.camera,{left:-22,right:22,top:22,bottom:-22,near:5,far:70});sun.shadow.bias=-.0005;sun.shadow.normalBias=.02;scene.add(sun);
  const fill=new THREE.DirectionalLight(0x87c7d0,.55);fill.position.set(16,9,-18);scene.add(fill);
  buildGround();buildBoard(opts.spaces||[]);buildFacility();buildFlea();pirate=buildPirate();earl=buildEarl();truck=buildTruck();dice=buildDice();buildLocker();
  scene.add(pirate,earl,truck,dice);dice.userData.m.visible=false;
  DICE.initDice(dice.userData.m,(k,p)=>{if(onHit)onHit(k);if(k>.35)dust(new THREE.Vector3(p.x,.1,p.z),3,.4);});spaces.forEach(sp=>DICE.addTile(sp.p.x,sp.p.z,1.42,.35));
  loadModels();
  resize();addEventListener('resize',resize);
  perf.last=performance.now();renderer.setAnimationLoop(loop);
  return {THREE,scene,camera,renderer};
}
export function setQuality(q){quality=q;if(q==='low'){renderer.setPixelRatio(1);renderer.shadowMap.enabled=false;scene.traverse(o=>{if(o.material)o.material.needsUpdate=true;});}resize();}
export function getQuality(){return quality;}
export function setFrameHook(f){onFrame=f;}
export function resize(){W=innerWidth;H=innerHeight;renderer.setSize(W,H,false);camera.aspect=W/H;camera.fov=W<H?52:40;camera.updateProjectionMatrix();}

function buildGround(){
  const g=new THREE.Mesh(new THREE.PlaneGeometry(200,200),mat(0xc9a06c,{map:noiseTex('#c9a06c',['#a9784a','#e3c08a','#8f6a48'],1600)}));
  g.material.map.wrapS=g.material.map.wrapT=THREE.RepeatWrapping;g.material.map.repeat.set(10,10);g.rotation.x=-Math.PI/2;g.receiveShadow=true;scene.add(g);
  const lot=new THREE.Mesh(new THREE.PlaneGeometry(46,40),mat(0x77716a,{map:noiseTex('#77716a',['#5d5853','#8e8880','#4b4743'],2200)}));lot.rotation.x=-Math.PI/2;lot.position.y=.01;lot.receiveShadow=true;scene.add(lot);
  // distant mesas for depth
  const mm=mat(0xc77a4e,{flatShading:true});for(let i=0;i<14;i++){const a=i/14*TAU,r=70+(i%3)*9;const m=cyl(4+Math.random()*7,9+Math.random()*8,5+Math.random()*9,mm,Math.cos(a)*r,2,Math.sin(a)*r,scene,7);m.castShadow=false;}
}
function buildBoard(types){
  const pts=[[0,9],[5.5,8.5],[9.5,5],[11,0],[9,-4.5],[4.5,-6.5],[0,-5],[-3.5,-8.5],[-8.5,-8],[-11,-3.5],[-9.5,1.5],[-5.5,3],[-3.5,6.5]].map(p=>new THREE.Vector3(p[0],0,p[1]));
  curve=new THREE.CatmullRomCurve3(pts,true,'catmullrom',.5);
  // road ribbon
  const N=260,pos=[],uv=[],idx=[];for(let i=0;i<=N;i++){const u=i/N,p=curve.getPointAt(u%1),t=curve.getTangentAt(u%1),n=new THREE.Vector3(-t.z,0,t.x).normalize();
    [-1.45,1.45].forEach((s,j)=>{pos.push(p.x+n.x*s,.04,p.z+n.z*s);uv.push(j,u*40);});if(i<N){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}}
  const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));rg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));rg.setIndex(idx);rg.computeVertexNormals();
  const rt=canvasTex(64,128,(x,w,h)=>{x.fillStyle='#e7c891';x.fillRect(0,0,w,h);x.fillStyle='#b98955';x.fillRect(0,0,5,h);x.fillRect(w-5,0,5,h);x.fillStyle='#fff3d4';x.globalAlpha=.6;x.fillRect(w/2-2,10,4,50);x.globalAlpha=.12;x.fillStyle='#7a5633';for(let i=0;i<120;i++)x.fillRect(Math.random()*w,Math.random()*h,2,2);});
  rt.wrapS=rt.wrapT=THREE.RepeatWrapping;const road=new THREE.Mesh(rg,mat(0xffffff,{map:rt,roughness:.95}));road.receiveShadow=true;scene.add(road);
  setSpaces(types);
}
const tileTex={};
function iconTex(type){if(tileTex[type])return tileTex[type];const s=SPACE_STYLE[type];
  return tileTex[type]=canvasTex(256,256,(x,w,h)=>{x.fillStyle='#fff6df';x.beginPath();x.arc(128,128,122,0,TAU);x.fill();x.fillStyle='#'+s.c.toString(16).padStart(6,'0');x.beginPath();x.arc(128,128,106,0,TAU);x.fill();
    x.fillStyle='#fff7e3';x.font='900 92px system-ui,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(s.icon,128,108);x.font='900 30px system-ui,sans-serif';x.fillText(s.label,128,192);});}
export function setSpaces(types){spaces.forEach(s=>scene.remove(s.g));spaces=[];
  types.forEach((ty,i)=>{const u=i/types.length,p=curve.getPointAt(u),g=new THREE.Group();g.position.copy(p);const s=SPACE_STYLE[ty];
    const base=cyl(1.32,1.42,.26,mat(0x6b4b32),0,.13,0,g,28);base.castShadow=false;
    const top=cyl(1.18,1.18,.08,mat(s.c,{roughness:.55}),0,.3,0,g,28);top.castShadow=false;
    const face=new THREE.Mesh(new THREE.CircleGeometry(1.08,32),new THREE.MeshStandardMaterial({map:iconTex(ty),roughness:.6}));face.rotation.x=-Math.PI/2;face.position.y=.345;g.add(face);
    const glow=new THREE.Mesh(new THREE.RingGeometry(1.22,1.5,32),new THREE.MeshBasicMaterial({color:0xfff0a8,transparent:true,opacity:0,depthWrite:false}));glow.rotation.x=-Math.PI/2;glow.position.y=.36;g.add(glow);
    scene.add(g);spaces.push({g,type:ty,p:p.clone(),glow});});}
export function spacePos(i){return spaces[(i+spaces.length)%spaces.length].p;}
export function highlight(i){spaces.forEach((s,j)=>{s.hl=j===i;});}

function storageRow(x,z,rot,n,label){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;
  const wall=mat(0xd8cbb4,{map:noiseTex('#d8cbb4',['#b9a88f','#efe4cc'],500)}),roof=mat(0xe0674a,{roughness:.6}),trim=mat(0x2e5554);
  box(n*3.1+.4,3.1,3.2,wall,0,1.55,0,g);box(n*3.1+.9,.32,3.9,roof,0,3.25,.15,g);
  const door=canvasTex(128,128,(c,w,h)=>{c.fillStyle='#e97a32';c.fillRect(0,0,w,h);for(let y=0;y<h;y+=9){c.fillStyle='#c35f24';c.fillRect(0,y,w,2);c.fillStyle='#ff9d55';c.fillRect(0,y+2,w,1);}c.fillStyle='#ece3cc';c.fillRect(w/2-8,h-18,16,6);});
  for(let i=0;i<n;i++){const d=new THREE.Mesh(new THREE.PlaneGeometry(2.45,2.45),mat(0xffffff,{map:door,roughness:.5,metalness:.15}));d.position.set((i-(n-1)/2)*3.1,1.3,1.61);g.add(d);
    const num=new THREE.Mesh(new THREE.PlaneGeometry(.7,.35),new THREE.MeshBasicMaterial({map:canvasTex(64,32,(c)=>{c.fillStyle='#fff3d5';c.fillRect(0,0,64,32);c.fillStyle='#244';c.font='900 22px system-ui';c.textAlign='center';c.fillText(label+(i+1),32,24);})}));num.position.set(d.position.x,2.75,1.62);g.add(num);}
  box(n*3.1+.4,.18,.12,trim,0,2.62,1.62,g);scene.add(g);return g;}
function buildFacility(){
  storageRow(0,-15.5,0,6,'A');storageRow(-17,1,Math.PI/2,5,'B');storageRow(17,-2,-Math.PI/2,5,'C');
  // office + sign
  const office=new THREE.Group();office.position.set(-12.5,0,12);office.rotation.y=.5;box(5,3.4,4,mat(0xe9d7b5),0,1.7,0,office);box(5.6,.4,4.6,mat(COL.teal),0,3.6,0,office);
  box(1.2,2.2,.1,mat(0x2a3d3d),.8,1.1,2.02,office);box(1.6,1,.08,mat(0x9fd5e0,{emissive:0x335d63,roughness:.2}),-1.2,1.8,2.02,office);scene.add(office);
  const sign=new THREE.Group();sign.position.set(13,0,10.5);sign.rotation.y=-.5;cyl(.15,.15,5,mat(0x40312a),-1.8,2.5,0,sign);cyl(.15,.15,5,mat(0x40312a),1.8,2.5,0,sign);
  const sp=new THREE.Mesh(new THREE.BoxGeometry(4.6,1.9,.25),[mat(0x3b2e28),mat(0x3b2e28),mat(0x3b2e28),mat(0x3b2e28),new THREE.MeshStandardMaterial({map:canvasTex(512,212,(x,w,h)=>{x.fillStyle='#173f3e';x.fillRect(0,0,w,h);x.strokeStyle='#f0b648';x.lineWidth=10;x.strokeRect(10,10,w-20,h-20);x.fillStyle='#ffe2a1';x.textAlign='center';x.font='900 40px system-ui';x.fillText('SUNNYVALE',w/2,80);x.font='900 64px system-ui';x.fillStyle='#ff8a43';x.fillText('STORAGE',w/2,150);x.font='700 22px system-ui';x.fillStyle='#e9e1c8';x.fillText('AUCTIONS EVERY DAY',w/2,190);}),emissive:0x111111}),mat(0x3b2e28)]);
  sp.position.y=4.3;sp.castShadow=true;sign.add(sp);scene.add(sign);
  // fence, lamps, props
  const post=mat(0x6b6560,{metalness:.5,roughness:.4});for(let i=0;i<34;i++){const a=i/34*TAU;cyl(.06,.06,1.6,post,Math.cos(a)*23,.8,Math.sin(a)*21,scene,6).castShadow=false;}
  const lampM=mat(0x2b3a3a,{metalness:.6,roughness:.35}),bulb=new THREE.MeshStandardMaterial({color:0xfff3c1,emissive:0xffd27a,emissiveIntensity:2.4});
  [[-6.8,6.2],[7.2,-9.4],[13.5,4],[-14,-6]].forEach(([x,z])=>{cyl(.09,.13,4.2,lampM,x,2.1,z,scene,8);box(.9,.1,.12,lampM,x+.4,4.2,z,scene);sph(.18,bulb,x+.8,4.05,z,scene,10);});
  const crate=mat(0xa8703e,{map:noiseTex('#a8703e',['#7b4f2c','#c58e56'],400)}),barrel=mat(0x2f6d6a,{metalness:.3,roughness:.5});
  [[3,3.3],[-1.5,1.8],[6.8,-1.5],[-6.5,-1.2],[2.5,-11],[-12.5,-11.5],[15,-9]].forEach(([x,z],i)=>{box(.9,.9,.9,crate,x,.45,z,scene).rotation.y=i;if(i%2)cyl(.4,.4,1.1,barrel,x+1.1,.55,z+.3,scene,12);});
  const cactus=mat(0x5b8a4f,{flatShading:true});[[19,14],[-20,15],[22,-14],[-21,-16],[5,19]].forEach(([x,z])=>{cyl(.35,.42,3,cactus,x,1.5,z,scene,8);cyl(.22,.22,1.2,cactus,x+.5,2,z,scene,8).rotation.z=-.9;});
}
function buildFlea(){flea=new THREE.Group();const p=curve.getPointAt(7/16);const t=curve.getTangentAt(7/16);const n=new THREE.Vector3(-t.z,0,t.x).normalize();
  flea.position.copy(p).addScaledVector(n,-4.1);flea.rotation.y=Math.atan2(n.x,n.z)+Math.PI;scene.add(flea);setFleaStage(0,true);}
function fleaStage(level){const g=new THREE.Group();const wood=mat(0x9a6438,{map:noiseTex('#9a6438',['#744627','#bd8550'],300)}),cloth=mat(0x2c8c86),stripe=canvasTex(64,64,(x)=>{for(let i=0;i<8;i++){x.fillStyle=i%2?'#fff0d0':'#df5b45';x.fillRect(i*8,0,8,64);}});
  if(level===0){box(2.6,.12,1.3,wood,0,.9,0,g);[[-1.15,-.5],[1.15,-.5],[-1.15,.5],[1.15,.5]].forEach(([x,z])=>cyl(.05,.05,.9,wood,x,.45,z,g,6));
    box(.6,.45,.5,mat(0xbb8a55),-.7,1.18,0,g);box(.45,.32,.4,mat(0xc79a62),.4,1.12,.1,g);const tarp=box(1.2,.06,1,mat(0x4a6f8f),1.6,.05,.8,g);tarp.rotation.y=.4;
    const sg=new THREE.Mesh(new THREE.PlaneGeometry(1.1,.45),new THREE.MeshBasicMaterial({map:canvasTex(128,52,(x,w,h)=>{x.fillStyle='#e9dcc0';x.fillRect(0,0,w,h);x.fillStyle='#4b3420';x.font='900 24px system-ui';x.textAlign='center';x.fillText('YARD SALE',w/2,34);})}));sg.position.set(-.3,.55,.67);g.add(sg);}
  if(level>=1){const wd=level===1?3.6:5.2,dp=level===1?2.3:3.4,ht=level===1?2.5:3.7;
    [[-wd/2,-dp/2],[wd/2,-dp/2],[-wd/2,dp/2],[wd/2,dp/2]].forEach(([x,z])=>box(.18,ht,.18,wood,x,ht/2,z,g));
    const aw=new THREE.Mesh(new THREE.BoxGeometry(wd+.6,.12,dp+.8),mat(0xffffff,{map:stripe}));aw.position.y=ht;aw.rotation.x=-.12;aw.castShadow=true;g.add(aw);
    box(wd-.3,.85,.8,wood,0,.43,dp/2-.4,g);box(wd-.1,.1,.95,cloth,0,.88,dp/2-.4,g);
    const goods=[0xd8b066,0x5e8fbf,0xc5523e,0x8bbf6a,0xe6c06a];for(let i=0;i<(level===1?5:9);i++)box(.32+Math.random()*.3,.3+Math.random()*.35,.3,mat(goods[i%5]),-wd/2+.6+i*(wd-1)/(level===1?4:8),1.1,dp/2-.45,g);
    if(level===2){box(wd,.12,dp,wood,0,ht+.55,0,g);const neon=new THREE.Mesh(new THREE.BoxGeometry(3.6,.9,.12),new THREE.MeshStandardMaterial({map:canvasTex(512,128,(x,w,h)=>{x.fillStyle='#1d2f36';x.fillRect(0,0,w,h);x.fillStyle='#ffd36b';x.shadowColor='#ff8f3c';x.shadowBlur=18;x.font='900 58px system-ui';x.textAlign='center';x.fillText('PIRATE FLEA',w/2,84);}),emissive:0xffffff,emissiveMap:null,emissiveIntensity:.35}));
      neon.position.set(0,ht+1.25,dp/2);g.add(neon);const bulb=new THREE.MeshStandardMaterial({color:0xfff1b8,emissive:0xffc95c,emissiveIntensity:2});for(let i=0;i<9;i++)sph(.07,bulb,-wd/2+i*wd/8,ht-.15-Math.sin(i/8*Math.PI)*.25,dp/2+.35,g,8);
      box(1.2,1.6,1,mat(0x2f7b74),-wd/2-.9,.8,.3,g);cyl(.34,.34,1,mat(0x2f6d6a),wd/2+.7,.5,.6,g,12);}
    else{const sg=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.5),new THREE.MeshBasicMaterial({map:canvasTex(160,52,(x,w,h)=>{x.fillStyle='#173f3e';x.fillRect(0,0,w,h);x.fillStyle='#ffd27a';x.font='900 30px system-ui';x.textAlign='center';x.fillText('FLEA',w/2,37);})}));sg.position.set(0,ht-.45,dp/2+.42);g.add(sg);}}
  return g;}
function setFleaStage(level,instant){const old=flea.children[0],ng=fleaStage(level);flea.add(ng);fleaLevel=level;
  if(instant){if(old)drop(flea,old);return Promise.resolve();}
  ng.scale.setScalar(.01);const wp=flea.getWorldPosition(new THREE.Vector3());dust(wp,26,1.8);
  return tween(380,t=>{if(old)old.scale.setScalar(1-ease(t));}).then(()=>{if(old)drop(flea,old);coinBurst(wp.clone().add(new THREE.Vector3(0,2.5,0)),24);
    return tween(720,t=>{ng.scale.setScalar(Math.max(.01,back(t)));});});}
export function upgradeFlea(level){const p=flea.getWorldPosition(new THREE.Vector3());p.y+=1.4;const port=innerWidth<innerHeight;focus(p,{dist:port?15:11,h:port?8:6.5});return setFleaStage(level,false);}
export function fleaPos(){return flea.getWorldPosition(new THREE.Vector3());}

function buildPirate(){const g=new THREE.Group(),coat=mat(0x1d5f60,{roughness:.6}),coatTrim=mat(COL.brass,{metalness:.6,roughness:.3}),skin=mat(COL.skin),boot=mat(0x2a1e18),hat=mat(0x1e1a1b,{roughness:.55});
  const body=new THREE.Group();g.add(body);g.userData.body=body;
  box(.22,.35,.32,boot,-.14,.18,.05,body);box(.22,.35,.32,boot,.14,.18,.05,body);cyl(.1,.1,.35,mat(0x3e3a4a),-.14,.5,0,body,8);cyl(.1,.1,.35,mat(0x3e3a4a),.14,.5,0,body,8);
  cyl(.3,.44,.95,coat,0,1.05,0,body,16);box(.6,.08,.42,mat(0x3a2418),0,.9,0,body);box(.14,.1,.06,coatTrim,0,.9,.22,body);
  const lapel=box(.1,.6,.04,mat(0x0f3c3d),-.08,1.18,.29,body);lapel.rotation.z=.15;const l2=box(.1,.6,.04,mat(0x0f3c3d),.08,1.18,.29,body);l2.rotation.z=-.15;
  [-1,1].forEach(s=>{const a=cyl(.09,.11,.62,coat,s*.38,1.15,0,body,10);a.rotation.z=s*.35;sph(.1,skin,s*.5,.86,.02,body,10);});
  sph(.27,skin,0,1.78,0,body,18);const beard=sph(.24,mat(COL.beard),0,1.64,.1,body,14);beard.scale.set(1,.85,.75);sph(.05,mat(0x6b3c2a),0,1.78,.27,body,8);
  [-.09,.09].forEach(x=>sph(.035,mat(0x111111),x,1.86,.24,body,8));const band=cyl(.285,.285,.1,mat(COL.red),0,1.95,0,body,16);band.rotation.x=.08;
  const brim=cyl(.56,.56,.05,hat,0,2.04,0,body,20);brim.scale.set(1,1,.78);const crown=cyl(.3,.34,.32,hat,0,2.2,0,body,16);
  box(.22,.04,.02,coatTrim,0,2.06,.44,body).visible=true;const skull=sph(.06,mat(COL.white),0,2.22,.33,body,8);skull.scale.set(1,1,.4);
  const feather=box(.05,.5,.03,mat(0xd9a441),.25,2.4,-.1,body);feather.rotation.z=-.6;
  const sh=new THREE.Mesh(new THREE.CircleGeometry(.5,24),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.25,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=.06;g.add(sh);
  g.scale.setScalar(1.15);g.position.copy(curve.getPointAt(0));return g;}
function buildEarl(){const g=new THREE.Group(),suit=mat(COL.purple,{roughness:.5}),skin=mat(0xe2a682);
  cyl(.34,.48,1,suit,0,.85,0,g,14);sph(.4,suit,0,1.05,.12,g,14).scale.set(1,.9,.9);sph(.25,skin,0,1.7,0,g,14);
  const st=box(.34,.06,.04,mat(0x4a2f22),0,1.6,.23,g);st.scale.x=1.3;const brim=cyl(.6,.6,.05,mat(0xe9d7ad),0,1.9,0,g,18);brim.scale.set(1,1,.7);cyl(.26,.32,.34,mat(0xe9d7ad),0,2.08,0,g,14);
  box(.15,.2,.4,mat(0x24170f),-.15,.12,.05,g);box(.15,.2,.4,mat(0x24170f),.15,.12,.05,g);box(.3,.5,.05,mat(0xffffff),0,1.25,.36,g);box(.08,.36,.06,mat(0xd9a441),0,1.25,.4,g);
  const p=curve.getPointAt(8/16),t=curve.getTangentAt(8/16),n=new THREE.Vector3(-t.z,0,t.x).normalize();g.position.copy(p).addScaledVector(n,2.2);g.lookAt(p);g.scale.setScalar(1.2);return g;}
function buildTruck(){const g=new THREE.Group(),rust=mat(0xb35f36,{map:noiseTex('#b35f36',['#7d3c22','#d28456','#5a3b2c'],600),roughness:.75,metalness:.2}),dark=mat(0x2a2523),tire=mat(0x1b1918),chrome=mat(0xcfc6b6,{metalness:.8,roughness:.25});
  box(3.1,.5,1.5,rust,0,.75,0,g);box(1.3,.9,1.42,rust,.75,1.4,0,g);box(1.1,.5,1.46,mat(0x9bc6c4,{roughness:.1,metalness:.3}),.82,1.5,0,g);box(1.6,.5,.08,rust,-.7,1.2,.71,g);box(1.6,.5,.08,rust,-.7,1.2,-.71,g);box(.08,.5,1.5,rust,-1.5,1.2,0,g);
  [[1.05,.75],[-1,.75],[1.05,-.75],[-1,-.75]].forEach(([x,z])=>{const w=cyl(.36,.36,.25,tire,x,.36,z,g,14);w.rotation.x=Math.PI/2;});box(.12,.25,1.55,chrome,1.58,.7,0,g);
  const cargo=new THREE.Group();cargo.position.set(-.7,1.05,0);g.add(cargo);g.userData.cargo=cargo;
  const p=curve.getPointAt(.995),t=curve.getTangentAt(.995),n=new THREE.Vector3(-t.z,0,t.x).normalize();g.position.copy(p).addScaledVector(n,-3);g.rotation.y=Math.atan2(t.x,t.z)-Math.PI/2;return g;}
export function setTruckLoad(n,cap){const c=truck.userData.cargo;if(c.userData.key===n+'/'+cap)return;c.userData.key=n+'/'+cap;while(c.children.length)drop(c,c.children[0]);const cols=[0xc79a62,0xb68350,0xd8b37a,0x5e8fbf,0xc5523e];
  for(let i=0;i<n;i++){const x=(i%3)*.5-.5,z=(Math.floor(i/3)%2)*.6-.3,y=Math.floor(i/6)*.42;box(.42,.38,.48,mat(cols[i%5]),x,y+.19,z,c);} }
function buildDice(){const g=new THREE.Group();const faces=[1,6,2,5,3,4].map(v=>new THREE.MeshStandardMaterial({roughness:.35,map:canvasTex(128,128,(x,w,h)=>{x.fillStyle='#fff6dc';x.fillRect(0,0,w,h);x.strokeStyle='#e9b85a';x.lineWidth=10;x.strokeRect(5,5,w-10,h-10);x.fillStyle='#2a4b45';
    const P={1:[[64,64]],2:[[34,34],[94,94]],3:[[30,30],[64,64],[98,98]],4:[[34,34],[94,34],[34,94],[94,94]],5:[[32,32],[96,32],[64,64],[32,96],[96,96]],6:[[34,28],[94,28],[34,64],[94,64],[34,100],[94,100]]}[v];P.forEach(([a,b])=>{x.beginPath();x.arc(a,b,v===1?15:11,0,TAU);x.fill();});})}));
  const m=new THREE.Mesh(new THREE.BoxGeometry(1.1,1.1,1.1,1,1,1),faces);m.castShadow=true;g.add(m);g.userData.m=m;return g;}
// the roll: a real rigid-body throw (dice.js). The number is whatever face lands on top.
export async function rollDice(rand=Math.random){const p=pirate.position,port=W<H;
  const from=new THREE.Vector3(p.x-2.3,3.4,p.z+1.1),to=new THREE.Vector3(p.x+.7+(rand()-.5)*.8,0,p.z+(port?2.3:2.1));
  const v=await DICE.throwDie(from,to,rand);const m=dice.userData.m;coinBurst(m.position.clone().add(new THREE.Vector3(0,.6,0)),10,0xfff3c1);
  await tween(650,()=>{});const s0=m.scale.x;await tween(220,t=>{m.scale.setScalar(s0*(1-t*.9));});m.visible=false;m.scale.setScalar(1);return v;}
export function diceInfo(){return {...DICE.stats,busy:DICE.diceBusy()};}

// pirate travel: hop one space at a time
export function movePirate(from,steps,onStep){let i=0;const n=spaces.length;
  const hop=()=>{if(i>=steps)return Promise.resolve();const a=from+i,b=a+1;i++;const pa=curve.getPointAt((a%n)/n),pb=curve.getPointAt((b%n)/n);
    const dir=pb.clone().sub(pa);pirate.rotation.y=Math.atan2(dir.x,dir.z);
    return tween(230,t=>{const e=ease(t);pirate.position.lerpVectors(pa,pb,e);pirate.position.y=Math.sin(t*Math.PI)*.7;const b=pirate.userData.body;b.scale.set(1+Math.sin(t*Math.PI)*-.08,1+Math.sin(t*Math.PI)*.12,1);})
      .then(()=>{dust(pb,6,.6);pirate.userData.body.scale.set(1.08,.9,1);if(onStep)onStep(b%n);return tween(60,t=>{pirate.userData.body.scale.set(1.08-.08*t,.9+.1*t,1);});}).then(hop);};
  camState.mode='follow';playAnim(pirate,'walk',.1);return hop().then(()=>playAnim(pirate,'idle'));}
export function placePirate(i){pirate.position.copy(spacePos(i));}

// ---------- the locker interior (empties as you match) ----------
const LP=new THREE.Vector3(60,0,60);let lockerProps=[],lockerRemoved=0,lockerDoor,lockerBeam;
function propMesh(kind,c){const g=new THREE.Group(),cb=mat(c,{map:noiseTex('#'+c.toString(16).padStart(6,'0'),['#5f3e22','#e4c08b'],120,64)});
  if(kind==='box'){box(.95,.75,.8,cb,0,.38,0,g);box(.98,.06,.12,mat(0xd9c49b),0,.76,0,g);}
  else if(kind==='crate'){box(.9,.9,.9,mat(0x9b6435),0,.45,0,g);[-.3,0,.3].forEach(y=>box(.94,.08,.94,mat(0x7a4b28),0,.45+y,0,g));}
  else if(kind==='tote'){box(.9,.6,.65,mat(c,{roughness:.4}),0,.3,0,g);box(.95,.08,.7,mat(0x26404a,{roughness:.4}),0,.63,0,g);}
  else if(kind==='lamp'){cyl(.25,.34,.08,mat(0x4a3b30),0,.04,0,g,10);cyl(.04,.04,1.1,mat(0xb8913f,{metalness:.6}),0,.6,0,g,6);cyl(.2,.38,.4,mat(0xe9d3a2),0,1.2,0,g,12);}
  else if(kind==='chair'){box(.7,.08,.7,mat(0x8c5a34),0,.5,0,g);box(.7,.7,.08,mat(0x8c5a34),0,.9,-.31,g);[[-.3,-.3],[.3,-.3],[-.3,.3],[.3,.3]].forEach(([x,z])=>box(.07,.5,.07,mat(0x6a4126),x,.25,z,g));}
  else if(kind==='tv'){box(.9,.7,.6,mat(0x3a3330),0,.35,0,g);box(.7,.5,.02,mat(0x2c4f57,{roughness:.15,metalness:.3}),0,.38,.31,g);}
  else if(kind==='rug'){const r=cyl(.22,.22,1.6,mat(0xa6493c),0,.22,0,g,12);r.rotation.z=Math.PI/2;}
  else if(kind==='bike'){[-.45,.45].forEach(x=>{const w=new THREE.Mesh(new THREE.TorusGeometry(.32,.04,6,16),mat(0x262626));w.position.set(x,.34,0);g.add(w);});box(.9,.05,.05,mat(0xc0392b),0,.55,0,g);box(.05,.4,.05,mat(0xc0392b),.2,.7,0,g);}
  return g;}
function buildLocker(){locker=new THREE.Group();locker.position.copy(LP);scene.add(locker);
  const wallT=canvasTex(256,256,(x,w,h)=>{x.fillStyle='#a8a39a';x.fillRect(0,0,w,h);for(let i=0;i<w;i+=16){x.fillStyle='#8d8981';x.fillRect(i,0,6,h);x.fillStyle='#bdb8ae';x.fillRect(i+6,0,2,h);}x.globalAlpha=.15;x.fillStyle='#5b3b23';for(let i=0;i<400;i++)x.fillRect(Math.random()*w,Math.random()*h,3,3);});
  wallT.wrapS=wallT.wrapT=THREE.RepeatWrapping;wallT.repeat.set(2,1);const wm=new THREE.MeshStandardMaterial({map:wallT,roughness:.7,metalness:.25,side:THREE.DoubleSide});
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(6,6),mat(0x6e675e,{map:noiseTex('#6e675e',['#4a4540','#88827a'],700)}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;locker.add(floor);
  const back=new THREE.Mesh(new THREE.PlaneGeometry(6,4),wm);back.position.set(0,2,-3);locker.add(back);
  [-3,3].forEach(x=>{const s=new THREE.Mesh(new THREE.PlaneGeometry(6,4),wm);s.position.set(x,2,0);s.rotation.y=Math.PI/2;locker.add(s);});
  const ceil=new THREE.Mesh(new THREE.PlaneGeometry(6,6),mat(0x58534d));ceil.rotation.x=Math.PI/2;ceil.position.y=4;locker.add(ceil);
  const frame=mat(0xe9792f,{metalness:.3,roughness:.5});box(6.4,.4,.3,frame,0,4,3,locker);box(.3,4,.3,frame,-3.1,2,3,locker);box(.3,4,.3,frame,3.1,2,3,locker);
  const dt=canvasTex(128,128,(c,w,h)=>{c.fillStyle='#e97a32';c.fillRect(0,0,w,h);for(let y=0;y<h;y+=9){c.fillStyle='#c35f24';c.fillRect(0,y,w,2);c.fillStyle='#ff9d55';c.fillRect(0,y+2,w,1);}});
  lockerDoor=new THREE.Mesh(new THREE.PlaneGeometry(6,4),mat(0xffffff,{map:dt,metalness:.2,roughness:.5,side:THREE.DoubleSide}));lockerDoor.position.set(0,2,3.05);locker.add(lockerDoor);
  const bulbL=new THREE.PointLight(0xffc77a,26,12,1.6);bulbL.position.set(0,3.6,0);locker.add(bulbL);sph(.12,new THREE.MeshStandardMaterial({color:0xfff2c0,emissive:0xffd27a,emissiveIntensity:3}),0,3.75,0,locker,10);
  lockerBeam=new THREE.Mesh(new THREE.ConeGeometry(2.2,4,24,1,true),new THREE.MeshBasicMaterial({color:0xffe6b0,transparent:true,opacity:.08,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));lockerBeam.position.set(0,1.9,0);locker.add(lockerBeam);
}
export function fillLocker(seed=1){lockerProps.forEach(p=>{if(p.parent)drop(p.parent,p);});lockerProps=[];lockerRemoved=0;let s=seed>>>0||1;const r=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
  const kinds=['box','box','crate','tote','box','lamp','chair','tv','rug','bike','box','tote'],cols=[0xc79a62,0xb68350,0xd8b37a,0x5e8fbf,0x7fae6a,0xc5523e];
  const out=[];for(let row=0;row<4;row++){const z=-2.3+row*1.15;for(let col=0;col<5;col++){const x=-2.2+col*1.1+(r()-.5)*.2;const stack=row===3?1:1+Math.floor(r()*2.4);
    let y=0;for(let k=0;k<stack;k++){const kind=k>0?(r()<.6?'box':'tote'):kinds[Math.floor(r()*kinds.length)];const P=lockerProp(kind,cols[Math.floor(r()*cols.length)]),m=P.m;m.position.set(x,y,z+(r()-.5)*.2);m.rotation.y=(r()-.5)*.5;locker.add(m);out.push({m,z,k});y+=P.h;if(y>2.2)break;}}}
  // remove from the front first, top of each stack first
  lockerProps=out.sort((a,b)=>(b.z-a.z)||(b.k-a.k)).map(o=>o.m);lockerDoor.position.y=2;return lockerProps.length;}
export function enterLocker(){camState.mode='locker';const portrait=W<H;camState.tPos.copy(LP).add(new THREE.Vector3(0,portrait?2.7:2.8,portrait?10.5:8.4));camState.tLook.copy(LP).add(new THREE.Vector3(0,portrait?.1:1.5,-1));camState.k=4.5;
  return tween(700,()=>{}).then(()=>tween(900,t=>{lockerDoor.position.y=2+ease(t)*3.9;})).then(()=>dust(LP.clone().add(new THREE.Vector3(0,1,2.5)),24,2.5));}
export function setLockerProgress(p){const target=Math.round(Math.min(1,p)*lockerProps.length);while(lockerRemoved<target){const m=lockerProps[lockerRemoved++];flyOut(m,lockerRemoved);} }
function flyOut(m,i){const s=m.position.clone(),side=i%2?1:-1,e=new THREE.Vector3(side*3.5,2.5,6.5);tween(520,t=>{const k=ease(t);m.position.lerpVectors(s,e,k);m.position.y+=Math.sin(t*Math.PI)*1.2;m.rotation.x=t*2.5*side;m.scale.setScalar(1-k*.7);})
  .then(()=>{m.visible=false;});if(i%3===0){const wp=locker.localToWorld(s.clone());dust(wp,4,.5);}}
export function lockerDone(){const wp=LP.clone().add(new THREE.Vector3(0,1.4,-1));coinBurst(wp,34);setLockerProgress(1);}
export function exitLocker(){return tween(500,t=>{lockerDoor.position.y=5.9-ease(t)*3.9;});}

// ---------- particles ----------
const coinGeo=new THREE.CylinderGeometry(.13,.13,.04,12),coinMat=new THREE.MeshStandardMaterial({color:0xffcc4d,metalness:.85,roughness:.25,emissive:0x5a3c00});
const dustMat=new THREE.MeshBasicMaterial({color:0xe7cfa2,transparent:true,opacity:.6,depthWrite:false}),dustGeo=new THREE.SphereGeometry(.18,6,5);
export function coinBurst(at,n=20,col){for(let i=0;i<n;i++){const m=new THREE.Mesh(coinGeo,col?new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:.4}):coinMat);m.position.copy(at);scene.add(m);
  parts.push({m,v:new THREE.Vector3((Math.random()-.5)*6,4+Math.random()*5,(Math.random()-.5)*6),r:new THREE.Vector3(Math.random()*9,Math.random()*9,0),life:1.2+Math.random()*.4,g:12});}}
export function dust(at,n=10,spread=1){for(let i=0;i<n;i++){const m=new THREE.Mesh(dustGeo,dustMat.clone());m.position.copy(at).add(new THREE.Vector3((Math.random()-.5)*spread,.2,(Math.random()-.5)*spread));scene.add(m);
  parts.push({m,v:new THREE.Vector3((Math.random()-.5)*1.5,.8+Math.random(),(Math.random()-.5)*1.5),life:.9,g:.5,dust:true});}}
export function pirateBurst(){coinBurst(pirate.position.clone().add(new THREE.Vector3(0,2,0)),18);}
export function cheer(){const b=pirate.userData.body;return tween(500,t=>{b.position.y=Math.sin(t*Math.PI*2)*.25*(1-t);b.rotation.y=t*TAU;}).then(()=>{b.rotation.y=0;b.position.y=0;});}

// ---------- camera ----------
export function focus(p,o={}){camState.mode='point';const d=o.dist||10,h=o.h||7.5;camState.tLook.copy(p).add(new THREE.Vector3(0,.6,0));camState.tPos.copy(p).add(new THREE.Vector3(0,h,d));camState.k=o.k||3;}
export function followPirate(){camState.mode='follow';camState.k=3;}
export function overview(){camState.mode='overview';camState.tPos.set(0,W<H?36:26,W<H?27:24);camState.tLook.set(0,0,0);camState.k=1.6;}
export function earlFocus(){focus(earl.position,{dist:6.5,h:3.8});}
export function worldToScreen(v){const p=v.clone().project(camera);return {x:(p.x+1)/2*W,y:(1-p.y)/2*H};}
export function pirateScreen(){return worldToScreen(pirate.position.clone().add(new THREE.Vector3(0,2.6,0)));}
function updateCam(dt){if(camState.mode==='follow'){const p=pirate.position,portrait=W<H;camState.tLook.set(p.x,0,p.z+(portrait?.7:0));camState.tPos.set(p.x,portrait?13.5:10,p.z+(portrait?13.5:12));}
  const k=1-Math.exp(-camState.k*dt);camState.pos.lerp(camState.tPos,k);camState.look.lerp(camState.tLook,k);camera.position.copy(camState.pos);camera.lookAt(camState.look);}
export function snapCam(){camState.pos.copy(camState.tPos);camState.look.copy(camState.tLook);}

function loop(){const now=performance.now(),dtMs=now-perf.last;perf.last=now;perf.frames[perf.fi]=dtMs;perf.fi=(perf.fi+1)%perf.frames.length;perf.n++;const dt=Math.min(.05,dtMs/1000),time=clock.getElapsedTime();DICE.stepDice(dt);for(const mx of mixers)mx.update(dt);
  for(let i=anims.length-1;i>=0;i--){const a=anims[i],t=Math.min(1,(now-a.t0)/a.dur);a.fn(t);if(t>=1){anims.splice(i,1);a.res();}}
  for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.life-=dt;p.v.y-=p.g*dt;p.m.position.addScaledVector(p.v,dt);if(p.r){p.m.rotation.x+=p.r.x*dt;p.m.rotation.y+=p.r.y*dt;}
    if(p.dust){p.m.scale.multiplyScalar(1+dt*1.4);p.m.material.opacity=Math.max(0,p.life*.6);}if(p.m.position.y<.05&&!p.dust){p.m.position.y=.05;p.v.multiplyScalar(.4);}
    if(p.life<=0){scene.remove(p.m);if(p.dust)p.m.material.dispose();parts.splice(i,1);}}
  spaces.forEach((s,i)=>{s.glow.material.opacity=s.hl?.55+.35*Math.sin(time*6):Math.max(0,s.glow.material.opacity-dt*2);});
  if(!anims.length||camState.mode!=='follow'){const b=pirate.userData.body;if(Math.abs(b.scale.y-1)<.01)b.position.y=Math.sin(time*3)*.03;}
  earl.rotation.z=Math.sin(time*1.7)*.03;lockerBeam.material.opacity=.06+.03*Math.sin(time*2);
  updateCam(dt);if(onFrame)onFrame(dt);if(renderer.shadowMap.enabled&&(perf.n%3===0||anims.length||DICE.diceBusy()))renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera);perf.cpu[(perf.fi+599)%600]=performance.now()-now;}
export function info(){return {calls:renderer.info.render.calls,tris:renderer.info.render.triangles,geos:renderer.info.memory.geometries,tex:renderer.info.memory.textures,quality};}

// ---------- CC0 visual lift (Kenney kits, see ASSETS-LICENSES.md) ----------
// Procedural art stays as the fallback, so a failed download never breaks the board.
const TRUCKS=[{f:'truck',name:'Rusty pickup',cargo:[-.95,.66,0],tint:0xc9774a},{f:'truck-flat',name:'Flatbed hauler',cargo:[-.75,.66,0],tint:0x7fb6c9},{f:'delivery',name:'Box truck',cargo:[-2.75,.02,0]}];
let truckLv=0,truckHolder=null;const truckTpl=[];const furnTpl={};export const modelState={pirate:false,earl:false,trucks:0,furniture:0,buildings:0};
function playAnim(who,name,fade=.18){const A=who.userData.A;if(!A||!A[name])return;const cur=who.userData.cur;if(cur===A[name])return;A[name].reset().fadeIn(fade).play();if(cur)cur.fadeOut(fade);who.userData.cur=A[name];}
export function pirateAnim(n){playAnim(pirate,n);}
function hatMesh(kind){const g=new THREE.Group(),hm=mat(kind==='pirate'?0x1c1718:0xe9d7ad,{roughness:.55}),trim=mat(COL.brass,{metalness:.6,roughness:.3});
  if(kind==='pirate'){const brim=cyl(.5,.52,.05,hm,0,0,0,g,24);brim.scale.set(1,1,.82);cyl(.27,.32,.3,hm,0,.17,0,g,18);
    [-1,1].forEach(sd=>{const w=box(.5,.22,.05,hm,sd*.26,.12,-.08,g);w.rotation.y=sd*.9;w.rotation.x=-.3;});const f=box(.62,.2,.05,hm,0,.12,.4,g);f.rotation.x=-.35;
    box(.64,.035,.06,trim,0,.04,.42,g);const sk=sph(.07,mat(COL.white),0,.15,.44,g,10);sk.scale.set(1,1,.4);const fe=box(.05,.55,.03,mat(0xe0674a),.28,.38,-.12,g);fe.rotation.z=-.55;}
  else{const brim=cyl(.56,.56,.04,hm,0,0,0,g,22);brim.scale.set(1.15,1,.85);cyl(.26,.31,.3,hm,0,.16,0,g,16);cyl(.315,.315,.06,mat(0x4a2f22),0,.05,0,g,16);}
  return g;}
// attach a hat to the model's head bone; offset is in world units, converted to bone space
function putHat(model,hat,lift){model.updateMatrixWorld(true);const head=model.getObjectByName('head')||model;const ws=new THREE.Vector3();head.getWorldScale(ws);
  hat.scale.setScalar(1/ws.x);const box3=new THREE.Box3().setFromObject(model);const top=new THREE.Vector3(0,box3.max.y,0);
  const hp=new THREE.Vector3();head.getWorldPosition(hp);hat.position.set(0,(box3.max.y-hp.y-lift)/ws.y,0);head.add(hat);}
function skinIn(group,r,scale,hide){if(hide)hide.children.forEach(c=>c.visible=false);const o=r.obj;o.scale.setScalar(scale);(hide||group).add(o);
  const mx=new THREE.AnimationMixer(o);mixers.push(mx);const A={};r.anims.forEach(a=>A[a.name]=mx.clipAction(a));group.userData.A=A;group.userData.model=o;return o;}
async function loadModels(){
  MOD.inst(KN+'chars/character-raider.glb',{skinned:true}).then(r=>{if(!r)return;const o=skinIn(pirate,r,2.15,pirate.userData.body);putHat(o,hatMesh('pirate'),.14);playAnim(pirate,'idle');modelState.pirate=true;});
  MOD.inst(KN+'chars/character-male-d.glb',{skinned:true,tint:0xc9a0ff}).then(r=>{if(!r)return;const o=skinIn(earl,r,2.0,earl);putHat(o,hatMesh('earl'),.12);playAnim(earl,'idle');modelState.earl=true;});
  Promise.all(TRUCKS.map(t=>MOD.inst(KN+'cars/'+t.f+'.glb',{tint:t.tint}))).then(rs=>{rs.forEach((r,i)=>{if(r){const o=r.obj;o.rotation.y=Math.PI/2;o.scale.setScalar(1.25);truckTpl[i]=MOD.grounded(o);modelState.trucks++;}});setTruckLevel(truckLv,false);});
  const F=['loungeSofa','televisionVintage','lampRoundFloor','chair','bookcaseClosed','dryer','kitchenFridge','pottedPlant','speaker','tableCoffee','bench','cardboardBoxClosed','cardboardBoxOpen'];
  Promise.all(F.map(f=>MOD.inst(KN+'furniture/'+f+'.glb'))).then(rs=>{rs.forEach((r,i)=>{if(r){const g=MOD.grounded(r.obj),sz=g.userData.size,k=Math.min(2.6,1.05/Math.max(sz.x,sz.z));r.obj.parent.scale.setScalar(k);g.userData.h=sz.y*k;furnTpl[F[i]]=g;modelState.furniture++;}});});
  MOD.inst(KN+'cars/box.glb').then(r=>{if(r){const g=MOD.grounded(r.obj);g.scale.setScalar(1.25);furnTpl.box=g;g.userData.h=.89;}});
  buildTown();}
export function setTruckLevel(lv,animate=true){truckLv=lv;const tpl=truckTpl[lv];if(!tpl)return Promise.resolve();
  truck.children.forEach(c=>{if(c!==truck.userData.cargo&&c!==truckHolder)c.visible=false;});
  const old=truckHolder,ng=tpl.clone(true);truckHolder=ng;truck.add(ng);const T=TRUCKS[lv];truck.userData.cargo.position.set(...T.cargo);
  const doorN=ng.getObjectByName('door');if(doorN)doorN.rotation.y=-1.9;
  if(!animate){if(old)truck.remove(old);return Promise.resolve();}
  const wp=truck.getWorldPosition(new THREE.Vector3());const port=W<H;focus(wp,{dist:port?12:9,h:port?7:5.5});ng.scale.setScalar(.01);
  return tween(700,()=>{}).then(()=>{dust(wp,26,2.2);return tween(380,t=>{if(old)old.scale.setScalar(1-ease(t));});}).then(()=>{if(old)truck.remove(old);coinBurst(wp.clone().add(new THREE.Vector3(0,2.4,0)),26);
    return tween(760,t=>{ng.scale.setScalar(Math.max(.01,back(t)));ng.position.y=Math.sin(t*Math.PI)*.5;});}).then(()=>tween(700,()=>{}));}
export function truckName(lv){return TRUCKS[lv].name;}
export function truckPos(){return truck.getWorldPosition(new THREE.Vector3());}
function signTex(text,bg,fg){return canvasTex(512,128,(x,w,h)=>{x.fillStyle=bg;x.fillRect(0,0,w,h);x.strokeStyle=fg;x.lineWidth=8;x.strokeRect(8,8,w-16,h-16);x.fillStyle=fg;x.font='900 74px system-ui';x.textAlign='center';x.textBaseline='middle';x.fillText(text,w/2,h/2+4);});}
function buildTown(){
  // pawn shops sit right behind the two PAWN spaces so the right shop is obvious
  spaces.forEach((sp,i)=>{if(sp.type!=='pawn')return;const u=i/spaces.length,t=curve.getTangentAt(u),n=new THREE.Vector3(-t.z,0,t.x).normalize();
    MOD.inst(KN+'city/building-e.glb').then(r=>{if(!r)return;const g=MOD.grounded(r.obj);g.scale.setScalar(2.6);const out=sp.p.clone().addScaledVector(n,-4.6);if(out.length()<sp.p.length())out.copy(sp.p).addScaledVector(n,4.6);out.addScaledVector(t,i>8?-2.2:0);
      g.position.copy(out);g.lookAt(sp.p.x,0,sp.p.z);scene.add(g);const sg=new THREE.Mesh(new THREE.PlaneGeometry(.9,.22),new THREE.MeshStandardMaterial({map:signTex('PAWN','#173f3e','#ffd36b'),emissive:0x333333}));
      sg.position.set(0,.62,.53);g.add(sg);g.traverse(m=>{if(m.isMesh)m.castShadow=true;});modelState.buildings++;});});
  // a little Sunnyvale skyline past the fence
  const B=['building-a','building-c','building-g','building-k','low-detail-building-a','low-detail-building-d','low-detail-building-g'];
  [[-30,-20,0],[-26,-27,1],[-12,-31,2],[2,-33,3],[16,-31,0],[28,-24,2],[33,-10,1],[-34,-6,3],[34,6,4],[-36,8,5],[-20,-36,6],[22,-38,4],[8,-42,5],[-4,-44,6]].forEach(([x,z,k],i)=>{
    MOD.inst(KN+'city/'+B[k]+'.glb').then(r=>{if(!r)return;const g=MOD.grounded(r.obj);g.scale.setScalar(k>=4?5:4.2);g.position.set(x,0,z);g.lookAt(0,0,0);scene.add(g);if(renderer)renderer.shadowMap.needsUpdate=true;modelState.buildings++;});});}
export function furnitureFor(kind){const map={box:['cardboardBoxClosed','box','cardboardBoxOpen'],crate:['box'],tote:['cardboardBoxOpen','cardboardBoxClosed'],lamp:['lampRoundFloor','pottedPlant'],chair:['chair','loungeSofa','bench'],tv:['televisionVintage','speaker','dryer'],rug:['tableCoffee','bookcaseClosed'],bike:['kitchenFridge','bookcaseClosed']}[kind]||['box'];
  const got=map.filter(k=>furnTpl[k]);return got.length?furnTpl[got[Math.floor(Math.random()*got.length)]]:null;}
function lockerProp(kind,c){const t=furnitureFor(kind);if(!t)return {m:propMesh(kind,c),h:.78};const m=new THREE.Group();m.add(t.clone(true));return {m,h:t.userData.h||.7};}
