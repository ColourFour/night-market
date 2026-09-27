// Run explicitly against the newly provisioned empty backend; never in npm test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.env.NIGHT_MARKET_API,key=process.env.NIGHT_MARKET_TEACHER_KEY;
if(!base||!key)throw Error('Load the private live.env first.');
let requests=0;
async function call(path,body,token=key,expected=200){
 const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token,Origin:'https://colourfour.github.io'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(60000)});
 const data=r.headers.get('content-type')?.includes('json')?await r.json():await r.text();requests++;
 assert.equal(r.status,expected,path+': '+JSON.stringify(data));return data;
}
const before=await call('/api/teacher');assert.equal(before.empty,true,'Live test requires an empty teacher room.');
await call('/api/admin/create',{names:Array.from({length:13},(_,i)=>'Acceptance test '+(i+1))});
let state=await call('/api/teacher');const code=state.code;
const tokens=await Promise.all(state.players.map(p=>call('/api/join',{code,id:p.id,pin:p.pin},'').then(x=>x.token)));
assert.equal(new Set(tokens).size,13);
async function admin(action,body={},expected=200){const r=await call('/api/admin/'+action,{roundId:state.roundId,...body},key,expected);state=await call('/api/teacher');return r;}
async function policies(revised){await Promise.all(tokens.map(t=>call('/api/policy',{roundId:state.roundId,policy:'Test policy: follow round calendar, contribute 2.',prediction:'6/4/3, total26',fallback:'Neon contribution2',...(revised?{rationale:'Revise based on practice evidence'}:{})},t)));}
await call('/api/teacher',undefined,'wrong',401);await admin('open',{},400);await policies(false);
for(const season of ['practice','scored']){
 if(season==='scored'){assert.equal(state.phase,'revision');await policies(true);await admin('startScored');}
 for(let round=1;round<=3;round++){
  await admin('open');const roundId=state.roundId;
  await call('/api/decision',{roundId:'stale',venue:0,contribution:2},tokens[0],409);
  await Promise.all(tokens.map((t,i)=>call('/api/decision',{roundId,venue:i<6?0:i<10?1:2,contribution:2},t)));
  const student=await call('/api/state',undefined,tokens[0]);state=await call('/api/teacher');
  assert.equal(student.submitted,13);assert.ok(!('submissions' in student));assert.equal(student.myDecision.id,0);assert.ok(!('myDecision' in state));assert.ok(state.players.every(p=>!('venue' in p)));assert.equal(student.history.length,(season==='practice'?0:3)+round-1);
  const board=await call('/api/board?code='+code,undefined,'');assert.ok(!JSON.stringify(board).includes('Acceptance test'));
  await call('/api/decision',{roundId,venue:0,contribution:0},tokens[0],409);
  await admin('lock');await admin('reveal');assert.equal(state.history.at(-1).result.rows.length,13);
  if(round===1)assert.ok(Math.abs(state.history.at(-1).result.rows[0].payoff-19.2)<1e-8);
  await call('/api/reflection',{historyId:roundId,text:'Synthetic test reflection'},tokens[0]);
  await call('/api/sandbox',{season,rule:{type:'externalReward',value:1}},tokens[0]);
  await admin('advance');console.log(season+' round '+round+' passed');
 }
}
assert.equal(state.phase,'complete');const csv=await call('/api/export?type=csv');assert.equal(csv.split('\r\n').length,79);
const recovery=await call('/api/export?type=recovery');await admin('reset',{confirm:code});assert.equal(state.empty,true);
await call('/api/admin/restore',{backup:recovery});state=await call('/api/teacher');assert.equal(state.history.length,6);
await admin('reset',{confirm:code});assert.equal(state.empty,true);
const badOrigin=await fetch(base+'/api/health',{headers:{Origin:'https://unrelated.example'}});assert.equal(badOrigin.status,403);
const report={passed:true,checkedAt:new Date().toISOString(),players:13,rounds:6,requests,emptyRoomAfter:true};
fs.writeFileSync('.private/live-acceptance.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
