import {test} from 'node:test';
import assert from 'node:assert/strict';
test('Cryptology rehearsal connects student submissions, peer guesses, teacher review and reveal through the game menu',async()=>{
 const elements=new Map(),listeners=new Map();
 globalThis.location={search:'?demo=1',origin:'http://localhost',pathname:'/',hash:''};
 globalThis.localStorage=globalThis.sessionStorage={getItem(){throw Error('Blocked');},setItem(){throw Error('QuotaExceeded');},removeItem(){}};
 globalThis.history={replaceState(){}};
 globalThis.document={querySelector:s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',textContent:''});return elements.get(s)},querySelectorAll:()=>[],addEventListener:(k,v)=>listeners.set(k,v)};
 const interval=globalThis.setInterval,Form=globalThis.FormData;globalThis.setInterval=()=>0;
 try{
  await import('../docs/pairs.js');await new Promise(r=>setTimeout(r,10));
  const transport=await import('../docs/pairs-transport.js?v=cipher1');
  const teacher=()=>transport.api('crypto/teacher',undefined,transport.demoToken('teacher'));
  const html=()=>elements.get('#app').innerHTML;
  const click=async(action,extra={})=>listeners.get('click')({target:{closest:()=>({dataset:{action,...extra}})}});
  const submit=async(id,data)=>{globalThis.FormData=class{constructor(){return new Map(Object.entries(data));}};await listeners.get('submit')({preventDefault(){},target:{getAttribute:()=>id}});};
  assert.match(html(),/Cryptology/);await click('modeCrypto');assert.match(html(),/Open Cryptology mission/);
  await click('crypto-open');await click('demoStudent');assert.match(html(),/name="rule"/);assert.doesNotMatch(html(),/crypto-guess-/);
  await submit('crypto-submit',{rule:'Reverse it.',ciphertext:'NOON TA TEEM',plaintext:'MEET AT NOON'});
  assert.match(html(),/Your dispatch is sealed/);await click('simulate');assert.match(html(),/crypto-guess-1/);assert.doesNotMatch(html(),/Shift each letter/);
  await submit('crypto-guess-1',{targetId:'1',guess:'MEET AT NOON'});assert.match(html(),/Guess saved · verdict sealed/);
  await click('demoTeacher');let s=await teacher();assert.equal(s.submitted,13);assert.ok(s.entries.every(e=>!('plaintext' in e)));assert.match(html(),/RULE \/ READ THIS FIRST/);
  await submit('crypto-decode-0',{targetId:'0',guess:'MEET AT NOON'});
  for(const e of s.entries.slice(1))await click('crypto-pass',{id:String(e.studentId)});
  s=await teacher();assert.equal(s.reviewed,13);await click('crypto-lock');await click('crypto-reveal');assert.match(html(),/The truth is out/);assert.match(html(),/Teacher decoded it/);
  await click('demoStudent');assert.match(html(),/THE ACTUAL MESSAGE/);assert.match(html(),/Reverse it/);assert.doesNotMatch(html(),/crypto-guess-|crypto-submit/);
  await click('chooseGame');assert.match(html(),/Contribute \/ Take/);assert.match(html(),/Frontier Cities/);
 }finally{globalThis.setInterval=interval;globalThis.FormData=Form;}
});
