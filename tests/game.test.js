import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handle,secret} from '../docs/core.js';
// Simulate the durable Edge Function compare-and-swap store, including collisions.
function store(){let version=0,state={schema:1,teacherKey:secret(),room:null},archives=[];
  const key=state.teacherKey;
  async function request(path,body,token=key,expected=200){
    for(let attempt=0;attempt<30;attempt++){
      const v=version,s=structuredClone(state);
      const r=handle(s,{url:path,method:body===undefined?'GET':'POST',headers:{authorization:'Bearer '+token},body},{siteUrl:'https://example.test/night-market/'});
      await new Promise(resolve=>setTimeout(resolve,Math.random()*3));
      if(r.changed){if(v!==version)continue;state=r.state;version++;if(r.archive)archives.push(r.archive);}
      assert.equal(r.status,expected,path+': '+JSON.stringify(r.body));return r.body;
    }throw Error('Retry exhaustion');
  }
  return {key,request,get:()=>structuredClone(state),restart:()=>{state=JSON.parse(JSON.stringify(state));},archives};
}
test('13 concurrent clients complete all six rounds, privacy, exports, recovery and revision',async()=>{
 const s=store(),call=s.request,key=s.key,room=()=>s.get().room;
 const admin=(action,b={},status=200)=>call('/api/admin/'+action,{roundId:room()?.roundId,...b},key,status);
 await call('/api/teacher',undefined,'wrong',401);
 await admin('create',{names:Array.from({length:13},(_,i)=>'Private name '+i)});
 const code=room().code;
 const lookup=await call('/api/lookup',{code},'');assert.ok(lookup.players.every(p=>p.name.startsWith('Founder')));
 const tokens=await Promise.all(room().players.map(p=>call('/api/join',{code,id:p.id,pin:p.pin},'').then(x=>x.token)));
 assert.equal(new Set(tokens).size,13);
 await call('/api/join',{code,id:0,pin:'bad'},'',401);
 await admin('open',{},400);
 const policy=(token,revision=false)=>call('/api/policy',{roundId:room().roundId,policy:'Choose Neon; contribute 2.',prediction:'6/4/3; C26',fallback:'Neon / 2',...(revision?{rationale:'Revise using practice evidence'}:{})},token);
 await Promise.all(tokens.map(t=>policy(t)));
 for(const season of ['practice','scored']){
   if(season==='scored'){
     assert.equal(room().phase,'revision');await admin('startScored',{},400);
     await Promise.all(tokens.map(t=>policy(t,true)));await admin('startScored');
   }
   for(let round=1;round<=3;round++){
     await admin('open');const id=room().roundId;
     await call('/api/decision',{roundId:'old',venue:0,contribution:0},tokens[0],409);
     await call('/api/decision',{roundId:id,venue:0,contribution:5},tokens[0],400);
     const submit=(i)=>call('/api/decision',{roundId:id,venue:i<6?0:i<10?1:2,contribution:2,override:i===0&&round===1,overrideReason:'Documented experiment'},tokens[i]);
     await Promise.all(tokens.slice(0,12).map((_,i)=>submit(i)));
     assert.equal(Object.keys(room().submissions).length,12);
     const student=await call('/api/state',undefined,tokens[0]);const teacher=await call('/api/teacher');
     const board=await call('/api/board?code='+code,undefined,'');
     assert.equal(student.submitted,12);assert.equal(student.myDecision.id,0);assert.ok(!('submissions' in student));assert.ok(!JSON.stringify(student).includes('Private name 1'));assert.ok(!('myDecision' in teacher));assert.ok(teacher.players.every(p=>!('venue' in p)));assert.ok(!('me' in board));assert.ok(!JSON.stringify(board).includes('Private name'));
     assert.equal(student.history.length,(season==='practice'?0:3)+round-1);
     await call('/api/decision',{roundId:id,venue:0,contribution:0},tokens[0],409);
     await admin('lock');await admin('reveal',{},400);await submit(12).then(()=>assert.fail('Locked submit accepted'),e=>assert.ok(e.message.includes('409')));
     await admin('reopen');await submit(12);s.restart();assert.equal(Object.keys(room().submissions).length,13);
     await admin('lock');await admin('reveal');await admin('reveal',{},400);
     const result=(await call('/api/state',undefined,tokens[0])).history.at(-1).result;
     assert.equal(result.rows.length,13);assert.ok(result.rows.every(r=>r.alternatives.length===15));
     assert.ok(Math.abs(result.auditTotal-result.playerTotal)<1e-8);
     await call('/api/reflection',{historyId:id,text:'Evidence recorded'},tokens[0]);
     const before=JSON.stringify(room().history);await call('/api/sandbox',{season,rule:{type:'equalFundReward',value:1}},tokens[0]);assert.equal(JSON.stringify(room().history),before);
     await admin('advance');
   }
 }
 assert.equal(room().phase,'complete');assert.equal(room().history.length,6);
 const csv=await call('/api/export?type=csv');assert.equal(csv.split('\r\n').length,79);
 const evidence=await call('/api/export?type=json');assert.ok(!JSON.stringify(evidence).includes('teacherKey'));assert.ok(!JSON.stringify(evidence).includes('pin'));
 const backup=await call('/api/export?type=recovery');await admin('reset',{confirm:code});assert.equal(room(),null);assert.equal(s.archives.length,1);
 await admin('restore',{backup});assert.equal(room().history.length,6);await admin('recoverSeat',{id:0});await call('/api/state',undefined,tokens[0],401);
});
