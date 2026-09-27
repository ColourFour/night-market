import {test} from 'node:test';
import assert from 'node:assert/strict';
test('Rehearsal UI handlers: teacher opens, founder submits, 12 classmates, lock and reveal',async()=>{
 const data=new Map(),elements=new Map(),listeners=new Map();
 globalThis.location={search:'?demo=1',origin:'http://localhost',pathname:'/',hash:''};
 globalThis.localStorage=globalThis.sessionStorage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 globalThis.history={replaceState:()=>{}};
 globalThis.window={addEventListener:()=>{}};
 globalThis.document={querySelector:s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',textContent:''});return elements.get(s)},querySelectorAll:()=>[],addEventListener:(k,v)=>listeners.set(k,v),body:{classList:{add:()=>{}}}};
 const interval=globalThis.setInterval;globalThis.setInterval=()=>{};
 try{
  await import('../docs/client.js');await new Promise(r=>setTimeout(r,20));
  const html=()=>elements.get('#app').innerHTML;
  const saved=()=>JSON.parse(data.get('night-market-rehearsal-v1'));
  const click=async action=>listeners.get('click')({target:{closest:()=>({dataset:{action,round:saved().room.roundId}})}});
  assert.match(html(),/Open round/);await click('open');assert.equal(saved().room.status,'open');
  await click('demoStudent');assert.match(html(),/Lock my decision/);
  const Form=globalThis.FormData;globalThis.FormData=class{constructor(){return new Map([['venue','0'],['contribution','2']]);}};
  try{await listeners.get('submit')({preventDefault(){},target:{getAttribute:()=> 'decision',dataset:{round:saved().room.roundId},querySelector:()=>({disabled:false}),reset(){}}});}finally{globalThis.FormData=Form;}
  assert.equal(saved().room.submissions[0].contribution,2);assert.match(html(),/Decision locked/);
  await click('demoFill');assert.equal(Object.keys(saved().room.submissions).length,13);
  await click('demoTeacher');await click('lock');await click('reveal');
  assert.equal(saved().room.status,'revealed');assert.match(html(),/The market is revealed/);
  await click('demoStudent');assert.match(html(),/19\.2/);assert.match(html(),/Regret: 1\.6/);
  assert.match(html(),/Mechanism-design sandbox/);
 }finally{globalThis.setInterval=interval;}
});
