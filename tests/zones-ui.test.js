import {test} from 'node:test';
import assert from 'node:assert/strict';
test('Economic Zones rehearsal UI: open, allocate, 13 submissions, lock, reveal, tournament, inspect, homework and reset',async()=>{
 const elements=new Map(),listeners=new Map();
 globalThis.location={search:'?demo=1',origin:'http://localhost',pathname:'/',hash:''};globalThis.history={replaceState(){}};
 globalThis.localStorage=globalThis.sessionStorage={getItem(){return null},setItem(){},removeItem(){}};
 globalThis.document={querySelector:s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',textContent:''});return elements.get(s)},querySelectorAll:()=>[],addEventListener:(k,v)=>listeners.set(k,v)};
 const interval=globalThis.setInterval,Form=globalThis.FormData;globalThis.setInterval=()=>{};
 try{
  await import('../docs/pairs.js');await new Promise(r=>setTimeout(r,15));
  const html=()=>elements.get('#app').innerHTML;
  const click=async(action,data={})=>listeners.get('click')({target:{closest:()=>({dataset:{action,...data}})}});
  const submit=async(id,data)=>{globalThis.FormData=class{constructor(){return new Map(Object.entries(data))}};await listeners.get('submit')({preventDefault(){},target:{getAttribute:()=>id}})};
  assert.match(html(),/Choose your experiment/);await click('modeZones');assert.match(html(),/Open Economic Zones/);await click('zone-open');assert.match(html(),/0\/13/);
  await click('demoStudent');assert.match(html(),/Build your strategy/);assert.doesNotMatch(html(),/Teacher controls/);await submit('zones-allocation',Object.fromEntries([20,20,20,20,20].map((v,i)=>['allocation'+i,''+v])));assert.match(html(),/Allocation saved/);assert.doesNotMatch(html(),/Tournament rankings/);
  await click('simulate');await click('demoTeacher');assert.match(html(),/13\/13/);await click('zone-lock');assert.match(html(),/Reveal class data/);assert.doesNotMatch(html(),/Where did the advertisements go/);await click('zone-reveal');assert.match(html(),/Where did the advertisements go/);await click('zone-run');assert.match(html(),/78 matches/);assert.match(html(),/1170 points/);
  await click('zone-inspect',{id:1});await click('zone-match',{match:'0:1'});assert.match(html(),/Match score/);await click('zone-best');assert.match(html(),/hypothetical result/);
  await click('demoStudent');await submit('zones-homework',Object.fromEntries(['overvalued','easier','core','strongest'].map(k=>[k,'The revealed matchups support this explanation with evidence.'])));assert.match(html(),/holiday answers are saved/);
  await click('chooseGame');assert.match(html(),/Choose your experiment/);await click('modePairs');assert.match(html(),/Reveal my practice result/);await click('chooseGame');await click('modeZones');assert.match(html(),/78 matches/);
  await click('demoTeacher');await submit('zones-reset',{confirm:'RESET'});assert.match(html(),/0\/13/);assert.doesNotMatch(html(),/Tournament rankings/);
 }finally{globalThis.setInterval=interval;globalThis.FormData=Form;}
});
