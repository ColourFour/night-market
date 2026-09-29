import {test} from 'node:test';
import assert from 'node:assert/strict';
test('Future-city UI: repeat robot matches, unlock, submit 13, reveal saved earnings, inspect and reset',async()=>{
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
  const allocation=Object.fromEntries([20,20,20,20,20].map((v,i)=>['allocation'+i,''+v]));
  await click('modeZones');await click('zone-open');assert.match(html(),/Unlock class submissions/);
  await click('demoStudent');assert.match(html(),/Meet the city/);assert.doesNotMatch(html(),/Teacher controls|\.pdf|textarea/);await click('zone-details',{zone:0});assert.match(html(),/The people who live here/);await click('zone-close');assert.doesNotMatch(html(),/<dialog/);
  await submit('zones-practice',allocation);assert.match(html(),/Practice match 1/);await submit('zones-practice',allocation);assert.match(html(),/Practice match 2/);assert.match(html(),/teacher will unlock/);
  await click('demoTeacher');await click('zone-unlock');await click('demoStudent');assert.match(html(),/Ready for my classmates/);await click('zone-class');await submit('zones-allocation',allocation);assert.match(html(),/Class allocation saved/);
  await click('simulate');await click('demoTeacher');assert.match(html(),/13\/13/);await click('zone-lock');assert.doesNotMatch(html(),/Where did the advertisements go/);await click('zone-reveal');await click('zone-run');assert.match(html(),/78 matches/);assert.match(html(),/market returns/);
  await click('zone-inspect',{id:1});await click('zone-match',{match:'0:1'});assert.match(html(),/Match total/);await click('zone-best');assert.match(html(),/hypothetical result/);
  await click('demoStudent');assert.match(html(),/Your class earnings/);assert.doesNotMatch(html(),/homework|\.pdf|textarea|reasoning|best.response/i);
  await click('chooseGame');await click('modePairs');assert.match(html(),/Reveal my practice result/);await click('chooseGame');await click('modeZones');assert.match(html(),/78 matches/);
  await click('demoTeacher');await submit('zones-reset',{confirm:'RESET'});assert.match(html(),/Unlock class submissions/);await click('demoStudent');assert.match(html(),/Meet the city/);assert.doesNotMatch(html(),/Practice match 2/);
 }finally{globalThis.setInterval=interval;globalThis.FormData=Form;}
});
