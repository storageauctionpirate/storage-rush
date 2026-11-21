/* Storage Rush — every sound and the music bed are synthesized live with Web Audio. No audio files, no network. */
(function(){
  'use strict';
  let ac=null, master=null, on=true, musicBus=null, mode='off', timer=null, nextT=0, step=0;
  function ctx(){
    if(!ac){
      const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return null;
      ac=new AC(); master=ac.createGain(); master.gain.value=0.75;
      const comp=ac.createDynamicsCompressor(); master.connect(comp); comp.connect(ac.destination);
      musicBus=ac.createGain(); musicBus.gain.value=0.32; musicBus.connect(master);
    }
    if(ac.state==='suspended') ac.resume();
    return ac;
  }
  function tone(f,t0,dur,o){
    o=o||{}; const c=ctx(); if(!c||!on) return;
    const osc=c.createOscillator(), g=c.createGain();
    osc.type=o.type||'sine'; osc.frequency.setValueAtTime(f,t0);
    if(o.to) osc.frequency.exponentialRampToValueAtTime(o.to,t0+(o.glide||dur));
    const v=o.vol==null?0.25:o.vol, a=o.a||0.005;
    g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(v,t0+a);
    g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
    let node=osc;
    if(o.filter){const fl=c.createBiquadFilter(); fl.type=o.filter; fl.frequency.value=o.ff||1200; fl.Q.value=o.q||1; node.connect(fl); node=fl;}
    node.connect(g); g.connect(o.bus||master); osc.start(t0); osc.stop(t0+dur+0.05);
  }
  function noise(t0,dur,o){
    o=o||{}; const c=ctx(); if(!c||!on) return;
    const n=Math.max(1,Math.floor(c.sampleRate*dur)), b=c.createBuffer(1,n,c.sampleRate), d=b.getChannelData(0);
    const am=o.am||0;
    for(let i=0;i<n;i++){let v=Math.random()*2-1; if(am) v*= (Math.sin(i/c.sampleRate*am*Math.PI*2)>0?1:0.25); d[i]=v;}
    const s=c.createBufferSource(); s.buffer=b; const fl=c.createBiquadFilter(); fl.type=o.filter||'bandpass';
    fl.frequency.setValueAtTime(o.ff||2000,t0); if(o.ffTo) fl.frequency.exponentialRampToValueAtTime(o.ffTo,t0+dur); fl.Q.value=o.q||1;
    const g=c.createGain(); g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(o.vol||0.2,t0+(o.a||0.004)); g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
    s.connect(fl); fl.connect(g); g.connect(o.bus||master); s.start(t0); s.stop(t0+dur+0.02);
  }
  const T=()=>{const c=ctx(); return c?c.currentTime+0.02:0;};
  const S={
    unlock(){ctx();},
    setOn(v){on=!!v;},
    isOn(){return on;},
    tap(){const t=T(); tone(660,t,0.06,{type:'triangle',vol:0.15});},
    swap(){const t=T(); noise(t,0.12,{ff:900,ffTo:2400,q:0.8,vol:0.16});},
    bump(){const t=T(); tone(180,t,0.12,{type:'square',vol:0.08,filter:'lowpass',ff:600}); tone(140,t+0.08,0.12,{type:'square',vol:0.07,filter:'lowpass',ff:500});},
    match(n){const t=T(); const f=420*Math.pow(1.122,Math.min(n||0,8));
      noise(t,0.08,{ff:1800,q:2,vol:0.12}); tone(f,t,0.16,{type:'triangle',vol:0.2}); tone(f*1.5,t+0.05,0.16,{type:'sine',vol:0.12});},
    crunch(){const t=T(); noise(t,0.22,{filter:'lowpass',ff:1400,ffTo:300,vol:0.3}); tone(90,t,0.18,{type:'square',vol:0.06,filter:'lowpass',ff:300});},
    reveal(){const t=T(); [1046,1318,1568,2093].forEach((f,i)=>tone(f,t+i*0.07,0.35,{type:'sine',vol:0.13}));},
    collect(){const t=T(); tone(1568,t,0.12,{type:'square',vol:0.06,filter:'lowpass',ff:3000}); tone(2093,t+0.09,0.4,{type:'triangle',vol:0.16}); noise(t+0.02,0.25,{ff:6000,q:0.7,vol:0.08});},
    scrapperWarn(){const t=T(); tone(330,t,0.12,{type:'sawtooth',vol:0.06,filter:'lowpass',ff:900}); tone(262,t+0.14,0.16,{type:'sawtooth',vol:0.06,filter:'lowpass',ff:900});},
    snatch(){const t=T(); noise(t,0.3,{ff:700,ffTo:3000,q:1.2,vol:0.18}); tone(392,t,0.15,{type:'square',vol:0.06,filter:'lowpass',ff:1200}); tone(330,t+0.15,0.15,{type:'square',vol:0.06,filter:'lowpass',ff:1200}); tone(262,t+0.3,0.3,{type:'square',vol:0.06,filter:'lowpass',ff:1200});},
    snap(){const t=T(); noise(t,0.05,{ff:4000,q:3,vol:0.5}); tone(1900,t,0.05,{type:'square',vol:0.08}); noise(t+0.06,0.1,{ff:1800,q:4,vol:0.2}); tone(260,t+0.12,0.12,{type:'triangle',vol:0.12});},
    rattle(d){const t=T(); d=d||1.1; noise(t,d,{ff:900,q:0.9,vol:0.28,am:26,a:0.05}); noise(t,d,{filter:'lowpass',ff:220,vol:0.2,a:0.05}); noise(t+d-0.05,0.18,{filter:'lowpass',ff:500,vol:0.35});},
    till(){const t=T(); tone(2637,t,0.08,{type:'square',vol:0.05}); tone(3136,t+0.06,0.5,{type:'sine',vol:0.18}); noise(t+0.1,0.12,{filter:'lowpass',ff:800,vol:0.15});},
    coin(){const t=T(); tone(1976,t,0.05,{type:'square',vol:0.04}); tone(2637,t+0.05,0.12,{type:'square',vol:0.04});},
    hop(){const t=T(); tone(300,t,0.14,{type:'sine',to:620,vol:0.16}); noise(t+0.12,0.06,{filter:'lowpass',ff:400,vol:0.12});},
    hammer(){const t=T(); for(let i=0;i<4;i++){noise(t+i*0.17,0.06,{ff:2600,q:3,vol:0.25}); tone(540,t+i*0.17,0.06,{type:'square',vol:0.05});}},
    built(){const t=T(); [523,659,784,1046].forEach((f,i)=>tone(f,t+i*0.09,0.3,{type:'triangle',vol:0.15})); tone(1046,t+0.4,0.7,{type:'sine',vol:0.12}); tone(1318,t+0.4,0.7,{type:'sine',vol:0.1});},
    win(){const t=T(); const n=[392,523,659,784,659,784,1046]; n.forEach((f,i)=>tone(f,t+i*0.1,0.25,{type:'square',vol:0.06,filter:'lowpass',ff:2600})); tone(1046,t+0.7,0.8,{type:'triangle',vol:0.16}); tone(784,t+0.7,0.8,{type:'triangle',vol:0.1});},
    fail(){const t=T(); [392,370,349,311].forEach((f,i)=>tone(f,t+i*0.18,0.3,{type:'triangle',vol:0.13}));},
    shot(){const t=T(); noise(t,0.35,{ff:600,ffTo:5000,q:0.6,vol:0.25}); tone(880,t,0.25,{type:'sawtooth',to:220,vol:0.06,filter:'lowpass',ff:3000});},
    boom(){const t=T(); tone(160,t,0.4,{type:'sine',to:40,vol:0.4}); noise(t,0.45,{filter:'lowpass',ff:1600,ffTo:200,vol:0.35});},
    gavel(){const t=T(); noise(t,0.05,{ff:3000,q:2,vol:0.4}); tone(300,t,0.08,{type:'square',vol:0.1}); [523,659,784,1046,1318].forEach((f,i)=>tone(f,t+0.08+i*0.06,0.3,{type:'triangle',vol:0.12}));},
    special(){const t=T(); [660,880,1320].forEach((f,i)=>tone(f,t+i*0.05,0.2,{type:'square',vol:0.05,filter:'lowpass',ff:3000}));},
    rip(){const t=T(); noise(t,0.18,{ff:2500,ffTo:900,q:1.5,vol:0.3});},
    jiggle(){const t=T(); [0,0.07,0.14].forEach(d=>noise(t+d,0.04,{ff:3000,q:4,vol:0.2}));},
    locked(){const t=T(); noise(t,0.08,{ff:1200,q:3,vol:0.3}); tone(160,t,0.2,{type:'square',vol:0.06,filter:'lowpass',ff:500}); noise(t+0.1,0.08,{ff:1000,q:3,vol:0.25});},
    dialClick(){const t=T(); noise(t,0.04,{ff:2400,q:4,vol:0.22}); tone(880,t,0.05,{type:'square',vol:0.05,filter:'lowpass',ff:2200});},
    dialStop(){const t=T(); noise(t,0.06,{ff:1800,q:5,vol:0.3}); tone(520,t,0.1,{type:'triangle',vol:0.1}); tone(780,t+0.06,0.12,{type:'triangle',vol:0.08});},
    safeOpen(){const t=T(); tone(180,t,0.4,{type:'sine',to:90,vol:0.2}); noise(t,0.5,{filter:'lowpass',ff:900,ffTo:200,vol:0.28}); [523,659,784,1046].forEach((f,i)=>tone(f,t+0.25+i*0.08,0.4,{type:'sine',vol:0.1}));},
    cashPop(){const t=T(); tone(1318,t,0.08,{type:'square',vol:0.06}); tone(1760,t+0.06,0.2,{type:'triangle',vol:0.14}); noise(t+0.02,0.15,{ff:4000,q:1,vol:0.1});},
    walk(){const t=T(); noise(t,0.06,{filter:'lowpass',ff:400,vol:0.12}); tone(180,t,0.08,{type:'sine',vol:0.05});}
  };

  /* ---- music bed: 'yard' (title / ladder), 'unit' (light beat in a unit), 'off' ---- */
  const CH=[[48,55,64,71],[45,52,60,67],[41,48,57,64],[43,50,59,65]]; // Cmaj7 Am7 Fmaj7 G7
  const MEL=[76,null,74,72,null,74,76,null,79,null,76,null,74,null,72,null];
  const mtof=m=>440*Math.pow(2,(m-69)/12);
  function sched(){const c=ac;if(!c||mode==='off')return;const spb=60/(mode==='unit'?104:84)/2;
    while(nextT<c.currentTime+0.25){const bar=Math.floor(step/16)%4,i=step%16,t=nextT;
      if(on&&mode==='safe'){const B=musicBus;if(i%8===0||i%8===2)tone(i%8===0?62:55,t,0.22,{type:'sine',to:40,vol:0.34,bus:B});if(i%4===0)tone(mtof(CH[0][0]-12),t,spb*3.5,{type:'triangle',vol:0.03,bus:B,filter:'lowpass',ff:600});}
      else if(on){const B=musicBus;
        if(i===0)CH[bar].forEach(m=>tone(mtof(m),t,spb*15,{type:'triangle',vol:0.045,a:0.08,bus:B,filter:'lowpass',ff:1400}));
        if(mode==='unit'){if(i%4===0)tone(110,t,0.18,{type:'sine',to:45,vol:0.32,bus:B});
          if(i%2===1)noise(t,0.04,{ff:8000,q:0.8,vol:0.05,bus:B});
          if(i%4===2)tone(mtof(CH[bar][0]-12),t,spb*1.6,{type:'square',vol:0.05,bus:B,filter:'lowpass',ff:500});
          if(i===4||i===12)noise(t,0.12,{ff:1800,q:0.7,vol:0.06,bus:B});}
        const m=MEL[(i+bar*3)%16];if(m&&(mode==='unit'||i%2===0))tone(mtof(m+(mode==='yard'?-12:0)),t,spb*1.8,{type:'triangle',vol:0.05,bus:B});}
      nextT+=spb;step++;}}
  S.music=function(m){if(m===mode)return;mode=m;const c=ctx();if(!c)return;
    if(m==='off'){if(timer){clearInterval(timer);timer=null;}return;}
    nextT=c.currentTime+0.1;step=0;if(!timer)timer=setInterval(sched,90);};
  S.musicMode=()=>mode;
  window.SFX=S;
})();
