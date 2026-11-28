// Physical die for the play test: cannon-es (MIT, vendored) rigid body. The value is READ from the face that ends up on top;
// nothing picks the number in advance and nothing tweens the die onto a face.
import * as THREE from './vendor/three.module.min.js';
import * as CANNON from './vendor/cannon-es.js';
const H=.55;                         // half size (die is 1.1 units)
// BoxGeometry material order: +X,-X,+Y,-Y,+Z,-Z
export const FACE_VALUES=[1,6,2,5,3,4];
const NORMALS=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].map(a=>new THREE.Vector3(...a));
let world,body,walls,mesh,run=null,onHit=null,gm;
const tmpQ=new THREE.Quaternion(),tmpV=new THREE.Vector3(),UP=new THREE.Vector3(0,1,0);
export const stats={throws:0,nudges:0,forced:0,lastSteps:0,lastMs:0,last:null};
export function initDice(dieMesh,hit){mesh=dieMesh;onHit=hit;
  world=new CANNON.World({gravity:new CANNON.Vec3(0,-32,0)});world.allowSleep=true;world.broadphase=new CANNON.NaiveBroadphase();world.solver.iterations=12;
  gm=new CANNON.Material('ground');const dm=new CANNON.Material('die');
  world.addContactMaterial(new CANNON.ContactMaterial(gm,dm,{friction:.32,restitution:.42}));
  const ground=new CANNON.Body({mass:0,material:gm,shape:new CANNON.Plane()});ground.quaternion.setFromEuler(-Math.PI/2,0,0);ground.position.y=.01;world.addBody(ground);
  // a low invisible corral, moved to wherever the die is thrown, keeps it on screen
  walls=new CANNON.Body({mass:0,material:gm});const R=3.6,T=.3,WH=1.6;
  [[R,0,T,WH,R+T],[-R,0,T,WH,R+T],[0,R,R+T,WH,T],[0,-R,R+T,WH,T]].forEach(([x,z,hx,hy,hz])=>walls.addShape(new CANNON.Box(new CANNON.Vec3(hx,hy,hz)),new CANNON.Vec3(x,hy,z)));
  world.addBody(walls);
  body=new CANNON.Body({mass:1,material:dm,shape:new CANNON.Box(new CANNON.Vec3(H,H,H)),linearDamping:.08,angularDamping:.12,allowSleep:true,sleepSpeedLimit:.12,sleepTimeLimit:.35});
  body.addEventListener('collide',e=>{const v=Math.abs(e.contact.getImpactVelocityAlongNormal());if(v>2.2&&onHit)onHit(Math.min(1,v/14),body.position);});
  world.addBody(body);body.sleep();}
export function addTile(x,z,r,h){const b=new CANNON.Body({mass:0,material:gm,shape:new CANNON.Cylinder(r,r,h,16)});b.position.set(x,h/2,z);world.addBody(b);}
export function topFace(){tmpQ.set(body.quaternion.x,body.quaternion.y,body.quaternion.z,body.quaternion.w);let best=-2,bi=0;
  NORMALS.forEach((n,i)=>{const d=tmpV.copy(n).applyQuaternion(tmpQ).dot(UP);if(d>best){best=d;bi=i;}});return {value:FACE_VALUES[bi],dot:best};}
// throw from `from` toward `to` (THREE.Vector3s on the ground plane). Resolves with the face value once the die is truly at rest.
export function throwDie(from,to,rand=Math.random){stats.throws++;
  walls.position.set(to.x,0,to.z);walls.aabbNeedsUpdate=true;
  body.wakeUp();body.position.set(from.x,from.y,from.z);
  const q=new CANNON.Quaternion();q.setFromEuler(rand()*6.28,rand()*6.28,rand()*6.28);body.quaternion.copy(q);
  const dx=to.x-from.x,dz=to.z-from.z,d=Math.hypot(dx,dz)||1,sp=6.5+rand()*3.5;
  body.velocity.set(dx/d*sp,2+rand()*2.5,dz/d*sp);
  body.angularVelocity.set((rand()-.5)*34,(rand()-.5)*22,(rand()-.5)*34);
  mesh.visible=true;sync();
  return new Promise(res=>{run={res,t:0,still:0,nudges:0,steps:0};});}
function sync(){mesh.position.set(body.position.x,body.position.y,body.position.z);mesh.quaternion.set(body.quaternion.x,body.quaternion.y,body.quaternion.z,body.quaternion.w);}
export function stepDice(dt){if(!run)return;const t0=performance.now();const n0=world.stepnumber;world.step(1/120,Math.min(dt,.05),12);run.steps+=world.stepnumber-n0;run.t+=dt;sync();
  const v=body.velocity.length(),w=body.angularVelocity.length();
  if(v<.08&&w<.12)run.still+=dt;else run.still=0;
  if(run.still>.3||body.sleepState===CANNON.Body.SLEEPING){const f=topFace();
    if(f.dot<.92&&run.nudges<3){run.nudges++;stats.nudges++;run.still=0;body.wakeUp();body.velocity.set((Math.random()-.5)*2,3.2,(Math.random()-.5)*2);body.angularVelocity.set((Math.random()-.5)*10,0,(Math.random()-.5)*10);}
    else finish(f,false);}
  else if(run.t>7){finish(topFace(),true);}   // safety: never hang the turn (reads whatever face is up)
  stats.lastMs+=performance.now()-t0;}
function finish(f,forced){if(forced)stats.forced++;stats.last={value:f.value,dot:+f.dot.toFixed(3),t:+run.t.toFixed(2),steps:run.steps,nudges:run.nudges,forced};const r=run;run=null;body.sleep();r.res(f.value);}
export function diceBusy(){return !!run;}
export function hideDie(){if(mesh)mesh.visible=false;}
