// CC0 model loader (Kenney kits, see ASSETS-LICENSES.md). Everything degrades to the old procedural art if a file fails.
import * as THREE from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {clone as skClone} from './vendor/SkeletonUtils.js';
const loader=new GLTFLoader(),cache={};
export const loaded={ok:[],fail:[]};
export function load(path){return cache[path]||(cache[path]=new Promise(res=>loader.load(path,g=>{loaded.ok.push(path);res(g);},undefined,e=>{loaded.fail.push(path);res(null);})));}
export async function inst(path,o={}){const g=await load(path);if(!g)return null;const obj=o.skinned?skClone(g.scene):g.scene.clone(true);
  obj.traverse(m=>{if(m.isMesh){m.geometry.userData.keep=true;m.castShadow=o.shadow!==false;m.receiveShadow=true;if(o.tint&&m.material){m.material=m.material.clone();m.material.color.multiply(new THREE.Color(o.tint));}}});
  if(o.scale)obj.scale.setScalar(o.scale);return {obj,anims:g.animations||[]};}
// center a model on x/z and sit it on y=0, inside a wrapper group
export function grounded(obj){const b=new THREE.Box3().setFromObject(obj),c=b.getCenter(new THREE.Vector3());obj.position.x-=c.x;obj.position.z-=c.z;obj.position.y-=b.min.y;const g=new THREE.Group();g.add(obj);g.userData.size=b.getSize(new THREE.Vector3());return g;}
