import {test} from 'node:test';
import assert from 'node:assert/strict';
test('Paired rehearsal UI works with storage blocked and reveals the exact result',async()=>{
 const elements=new Map(),listeners=new Map(),intervals=[];
 globalThis.location={search:'?demo=1',origin:'http://localhost',pathname:'/',hash:''};
 globalThis.localStorage=globalThis.sessionStorage={getItem(){throw Error('Blocked');},setItem(){throw Error('QuotaExceeded');},removeItem(){}};
 globalThis.history={replaceState(){}};
 globalThis.document={querySelector:s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',textContent:''});return elements.get(s)},querySelectorAll:()=>[],addEventListener:(k,v)=>listeners.set(k,v)};
 const interval=globalThis.setInterval;globalThis.setInterval=f=>intervals.push(f);
 const Form=globalThis.FormData;
 try{
  await import('../docs/pairs.js');await new Promise(r=>setTimeout(r,10));
  const transport=await import('../docs/pairs-transport.js?v=autoflow1');
  const teacher=()=>transport.api('teacher',undefined,transport.demoToken('teacher'));
  const html=()=>elements.get('#app').innerHTML;
  const click=async action=>listeners.get('click')({target:{closest:()=>({dataset:{action,round:(html().match(/data-round="([^"]+)"/)||[])[1]}})}});
  assert.match(html(),/Start timed round/);assert.match(elements.get('#demo-tools').innerHTML,/Temporary/);
  await click('open');await click('demoStudent');assert.match(html(),/Student 13/);assert.match(html(),/Lock my choice/);
  globalThis.FormData=class{constructor(){return new Map([['choice','contribute']]);}};
  await listeners.get('submit')({preventDefault(){},target:{getAttribute:()=> 'choice',dataset:{round:(await teacher()).roundId}}});
  assert.match(html(),/Your choice is locked/);await click('simulate');assert.equal((await teacher()).submitted,12);
  assert.equal((await teacher()).history.length,0);await click('demoTeacher');await click('reveal');
  assert.equal((await teacher()).history.length,1);await click('demoStudent');assert.match(html(),/5 points/);assert.match(html(),/\+5/);assert.match(html(),/Next round starts in/);
  await click('demoTeacher');await click('advance');assert.equal((await teacher()).round,2);assert.equal((await teacher()).status,'open');await click('demoStudent');assert.match(html(),/You sit out/);
  await click('demoReset');assert.equal((await teacher()).round,1);assert.equal((await teacher()).history.length,0);
 }finally{globalThis.setInterval=interval;globalThis.FormData=Form;}
});
