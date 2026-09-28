import {test} from 'node:test';
import assert from 'node:assert/strict';
test('Full or blocked storage: start, six rounds, reset, recovery and compact save/reload',async()=>{
 const elements=new Map(),listeners=new Map(),windowListeners=new Map(),saved=new Map([['unrelated-app','keep me']]);
 let writes=0,allowStorage=false,reloads=0;
 globalThis.location={search:'?demo=1',origin:'http://localhost',pathname:'/',hash:'',reload(){reloads++;}};
 globalThis.localStorage={getItem(k){if(!allowStorage)throw new DOMException('Blocked','SecurityError');return saved.get(k)||null;},setItem(k,v){writes++;if(!allowStorage)throw new DOMException('Full','QuotaExceededError');saved.set(k,v);}};
 globalThis.sessionStorage={getItem(){throw new DOMException('Blocked','SecurityError');},setItem(){throw new DOMException('Full','QuotaExceededError');},removeItem(){throw new DOMException('Blocked','SecurityError');}};
 globalThis.history={replaceState:()=>{}};
 globalThis.window={addEventListener:(k,v)=>windowListeners.set(k,v)};
 globalThis.document={querySelector:s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',textContent:''});return elements.get(s)},querySelectorAll:()=>[],addEventListener:(k,v)=>listeners.set(k,v),body:{classList:{add(){}}}};
 const interval=globalThis.setInterval;globalThis.setInterval=()=>{};
 try{
  await import('../docs/client.js');await new Promise(r=>setTimeout(r,20));
  const game=await import('../docs/transport.js?v=20260928-storage');
  async function call(path,body,mode='teacher'){
   const response=await game.transport(path,{method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+game.demoSession(mode)},...(body===undefined?{}:{body:JSON.stringify(body)})});
   const result=await response.json();assert.equal(response.status,200,JSON.stringify(result));return result;
  }
  const teacher=()=>call('/api/teacher');
  async function click(action){const state=await teacher();await listeners.get('click')({target:{closest:()=>({dataset:{action,round:state.roundId}})}});}
  assert.equal(writes,1,'Initialize once, not a partial save for each synthetic player');
  assert.equal(game.rehearsalSaved,false);assert.match(elements.get('#demo-tools').innerHTML,/keep this tab open/);
  assert.doesNotMatch(elements.get('#app').innerHTML,/href=.*#board=/);
  let state=await teacher();assert.equal(state.players.filter(p=>p.policies.practice).length,13);
  // A storage event from another tab cannot discard this unsaved rehearsal.
  windowListeners.get('storage')({key:'night-market-rehearsal-v1'});assert.equal((await teacher()).code,state.code);
  for(const season of ['practice','scored']){
   if(season==='scored'){
    await click('demoFill');state=await teacher();
    await call('/api/policy',{roundId:state.roundId,policy:'Choose Neon; contribute 2.',prediction:'6/4/3',fallback:'Neon / 2',rationale:'Revise using practice evidence.'},'student');
    await click('startScored');
   }
   for(let round=1;round<=3;round++){
    await click('open');await click('demoStudent');state=await teacher();
    await call('/api/decision',{roundId:state.roundId,venue:0,contribution:2},'student');
    await click('demoFill');await click('demoTeacher');await click('lock');await click('reveal');
    state=await teacher();assert.equal(state.submitted,13);assert.equal(state.history.at(-1).result.rows.length,13);
    await click('advance');
   }
  }
  state=await teacher();assert.equal(state.phase,'complete');assert.equal(state.history.length,6);
  const recovery=await call('/api/export?type=recovery');assert.equal(recovery.room.history.length,6);
  await click('demoStudent');await click('demoReset');assert.equal(reloads,0,'Reset must keep the in-memory game in this tab');
  state=await teacher();assert.equal(state.history.length,0);assert.equal(state.status,'waiting');assert.match(elements.get('#app').innerHTML,/Open round/);
  // Existing exports can restore in memory, even when browser writes still fail.
  await call('/api/admin/restore',{backup:recovery});assert.equal((await teacher()).history.length,6);
  allowStorage=true;
  await call('/api/admin/restore',{backup:recovery});assert.equal(game.rehearsalSaved,true);
  const compact=JSON.parse(saved.get('night-market-rehearsal-v1'));
  assert.ok(compact.room.history.every(h=>!('result' in h)));
  assert.equal(saved.get('unrelated-app'),'keep me');
  const reloaded=await import('../docs/transport.js?reload-test');
  const res=await reloaded.transport('/api/teacher',{headers:{Authorization:'Bearer '+reloaded.demoSession('teacher')}});
  const restored=await res.json();assert.equal(restored.history.length,6);assert.equal(restored.history[0].result.rows[0].payoff,19.2);assert.equal(restored.history[0].result.rows[0].alternatives.length,15);
  // Older quota failures could persist an incomplete initialization: rebuild it.
  compact.room.players[12].policies={};saved.set('night-market-rehearsal-v1',JSON.stringify(compact));
  const repaired=await import('../docs/transport.js?partial-test');
  const repairResult=await repaired.transport('/api/teacher',{headers:{Authorization:'Bearer '+repaired.demoSession('teacher')}});
  assert.equal((await repairResult.json()).players.filter(p=>p.policies.practice).length,13);
  allowStorage=false;const previousWrites=writes;await click('startDemo');assert.equal(location.href,'./market.html?demo=1');assert.equal(writes,previousWrites,'Entering rehearsal does not require a storage write');
 }finally{globalThis.setInterval=interval;}
});
