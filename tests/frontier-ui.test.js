import {test} from 'node:test';
import assert from 'node:assert/strict';
test('rehearsal: create 15, student saves, simulate, reveal, pause, finish, switch modes, reset',async()=>{
 const elements=new Map(),listeners=new Map();globalThis.location={search:'?demo=1',origin:'http://localhost',pathname:'/',hash:''};globalThis.history={replaceState(){}};globalThis.localStorage=globalThis.sessionStorage={getItem(){return null},setItem(){throw Error('Quota exceeded');},removeItem(){}};
 globalThis.document={querySelector:s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',textContent:''});return elements.get(s)},querySelectorAll:()=>[],addEventListener:(k,v)=>listeners.set(k,v)};
 const interval=globalThis.setInterval,Form=globalThis.FormData;globalThis.setInterval=()=>{};
 try{await import('../docs/pairs.js');await new Promise(r=>setTimeout(r,15));const html=()=>elements.get('#app').innerHTML;
 const click=async(action,data={})=>listeners.get('click')({target:{closest:()=>({dataset:{action,...data}})}});
 const submit=async(id,data)=>{globalThis.FormData=class{constructor(){return new Map(Object.entries(data))}};await listeners.get('submit')({preventDefault(){},target:{getAttribute:()=>id}});};
 await click('modeFrontier');assert.match(html(),/Gather your city founders/);await submit('frontier-addSeats',{names:'Student 14\nStudent 15'});assert.match(html(),/Student 15/);
 await submit('frontier-create',{...Object.fromEntries(Array.from({length:15},(_,i)=>['player-'+i,'on'])),seconds:'180',rounds:'10'});assert.match(html(),/15 founders/);await click('frontier-start');await click('demoStudent');assert.match(html(),/Start the 3-round introduction/);await click('frontier-tutorial-start');const {tutorialAction,tutorialClock}=await import('../docs/frontier-tutorial.js?v=tutorial1');for(let n=0;n<3;n++){await click('frontier-tutorial-choice',{choice:['expand','develop','trade'][n]});await click('frontier-tutorial-reveal');tutorialClock(Date.now()+21000);}await click('frontier-tutorial-finish');assert.match(html(),/Save my secret order/);assert.doesNotMatch(html(),/Resolve round now|Reset Frontier Cities/);
 await submit('frontier-order',{action:'move',from:'0',to:'1',units:'2',ally:''});assert.match(html(),/Order saved/);await click('simulate');await click('demoTeacher');assert.match(html(),/15 \/ 15/);await click('frontier-resolve');await click('frontier-pause');assert.match(html(),/claimed Outer 1/);assert.match(html(),/Resume timer/);
 await click('demoStudent');assert.match(html(),/Read the results/);await click('chooseGame');await click('modeZones');assert.match(html(),/teacher/);await click('chooseGame');await click('modeFrontier');assert.match(html(),/Round 1/);
 await click('demoTeacher');await click('frontier-end');assert.match(html(),/Final prosperity/);await click('frontier-showReset');assert.match(html(),/Confirm reset/);await submit('frontier-reset',{confirm:'RESET'});assert.match(html(),/Gather your city founders/);
 }finally{globalThis.setInterval=interval;globalThis.FormData=Form;}
});
