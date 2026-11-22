// Long-term economy check, Worlds 1-50 (Units 1-1000), from the design Page formulas:
//   M(w)=1.25^(w-1)   P(L)=M(w)*R*(450+45u)   B(w)=K*1.3*sum(P over world)   step k cost = B*1.08^k/sum(1.08^j), 24 steps
// A player banks f*P per unit (f = bonus factor: safes, Mystery Box, Rush) and buys town steps in order when affordable.
// Worlds open after Unit 20 even if the town is unfinished (cash and unbuilt steps carry over).
// Run: node test/econ-world.js            (prints the plan as written, then the proposed fix)
const wOf=L=>Math.floor((L-1)/20)+1,uOf=L=>((L-1)%20)+1;
function rooms(L){const w=wOf(L),u=uOf(L);if(w===1)return u<=2?1:u<=5?2:3;if(u===20&&w>=5)return 5;return u===10||u===20?4:3;}
function run({K=0.85,G=w=>Math.pow(1.25,w-1),f=1.3,sink=0,V=0,worlds=50,steps=24,r=1.08}){
  const P=L=>G(wOf(L))*rooms(L)*(450+45*uOf(L));
  const geo=Array.from({length:steps},(_,k)=>Math.pow(r,k)),gs=geo.reduce((a,b)=>a+b,0);
  let bank=0;const queue=[];const out=[];
  for(let w=1;w<=worlds;w++){let S=0;for(let u=1;u<=20;u++)S+=P((w-1)*20+u);const B=K*1.3*S;
    geo.forEach((g,k)=>queue.push({w,k,c:B*g/gs}));const veh=V?[1,1.3,1.7,2.2].map(x=>V*S*x/6.2):[];let vBought=0;
    let doneAt=null,arrive=bank,maxWait=0,since=0;
    for(let u=1;u<=20;u++){const L=(w-1)*20+u;bank+=f*P(L)*(1-sink);since++;
      while(queue.length&&bank>=queue[0].c){bank-=queue[0].c;queue.shift();since=0;}
      // optional vehicle / decor ladder: only after this world's town is paid off, never needed to progress
      while(veh.length&&!queue.length&&bank>=veh[0]){bank-=veh.shift();vBought++;}
      maxWait=Math.max(maxWait,since);
      if(doneAt==null&&!queue.some(q=>q.w===w))doneAt=u;}
    const left=queue.filter(q=>q.w===w).length;
    out.push({w,S,B,arrive,arrivePct:arrive/B,doneAt,left,bank,unitPay:P(w*20),maxWait,vBought});}
  return out;}
const fmt=n=>n>=1e9?'$'+(n/1e9).toFixed(1)+'B':n>=1e6?'$'+(n/1e6).toFixed(1)+'M':n>=1e3?'$'+(n/1e3).toFixed(1)+'K':'$'+Math.round(n);
function table(title,o){console.log('\n== '+title+' ==');console.log('world  world pay   build budget  cash on arrival(% of budget)  town done at  steps left  idle units max  vehicle');
  o.filter(r=>[1,2,3,5,10,11,15,20,25,30,40,50].includes(r.w)).forEach(r=>console.log(String(r.w).padStart(5),fmt(r.S).padStart(10),fmt(r.B).padStart(13),(fmt(r.arrive)+' ('+Math.round(r.arrivePct*100)+'%)').padStart(28),String(r.doneAt||'-').padStart(13),String(r.left).padStart(11),String(r.maxWait).padStart(14),String(r.vBought+'/4').padStart(8)));}
const only=process.argv[2];
const cases=[
  ['PLAN AS WRITTEN, average free player (f=1.30)',{}],
  ['PLAN AS WRITTEN, weak free player, few bonuses (f=1.10)',{f:1.10}],
  ['PLAN AS WRITTEN, strong player, many Rushes (f=1.60)',{f:1.60}],
  ['PROPOSED: keep K=0.85, add optional per-world vehicle ladder (40% of world pay), average (f=1.30)',{V:.40}],
  ['PROPOSED: weak (f=1.10)',{V:.40,f:1.10}],
  ['PROPOSED: strong (f=1.60)',{V:.40,f:1.60}],
  ['PROPOSED: no bonuses at all (f=1.00)',{V:.40,f:1.00}],
];
cases.forEach(([t,o])=>{if(!only||t.includes(only))table(t,run(o));});
// readable numbers: unit payout at level 1000 with 1.25 forever vs soft cap (1.25 to World 10, then 1.10)
const soft=w=>w<=10?Math.pow(1.25,w-1):Math.pow(1.25,9)*Math.pow(1.10,w-10);
[1,100,250,500,1000].forEach(L=>{const w=wOf(L),u=uOf(L),R=rooms(L),b=R*(450+45*u);console.log('L'+L+'  unit pay 1.25^(w-1): '+fmt(Math.pow(1.25,w-1)*b)+'   soft cap: '+fmt(soft(w)*b));});
if(typeof module!=='undefined')module.exports={run};
