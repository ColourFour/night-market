import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.env.NIGHT_MARKET_API,key=process.env.NIGHT_MARKET_TEACHER_KEY;
if(!base||!key)throw Error('Load private live.env');
let requests=0;
async function call(path,body,token=key,status=200){const r=await fetch(base+'/api/pairs/'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token,Origin:'https://colourfour.github.io'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(60000)});const d=r.headers.get('content-type')?.includes('json')?await r.json():await r.text();requests++;assert.equal(r.status,status,path+': '+JSON.stringify(d));return d;}
const before=await call('teacher');assert.equal(before.empty,true,'Do not overwrite an existing paired class.');
await call('admin/create',{names:Array.from({length:13},(_,i)=>'Pair test '+i),rounds:2,seconds:30,rotation:'rotate',missing:'take'});
let state=await call('teacher');const code=state.code;
const tokens=await Promise.all(state.seats.map(p=>call('join',{code,id:p.id,pin:p.pin},'').then(x=>x.token)));
async function admin(action,body={}){await call('admin/'+action,{roundId:state.roundId,...body});state=await call('teacher');}
await Promise.all(tokens.map(token=>call('practice',{choice:'contribute'},token)));await admin('unlock');
const totals=Array(13).fill(0);
for(let round=1;round<=2;round++){
 if(round===1)await admin('open');
 else {await new Promise(r=>setTimeout(r,Math.max(0,state.nextRoundAt-Date.now()+100)));state=await call('teacher');assert.equal(state.round,round);assert.equal(state.status,'open');}
 const {roundId,deadline}=state;
 const active=state.pairs.flatMap(([a,b])=>a===null||b===null?[]:[a,b]);
 await Promise.all(active.map(id=>call('choice',{roundId,choice:id%2?'take':'contribute'},tokens[id])));
 const student=await call('state',undefined,tokens[active[0]]);assert.equal(student.status,'open');assert.equal(student.history.length,round-1);assert.ok(!('choices' in student));assert.ok(!('seats' in student));assert.ok(student.opponent.name.startsWith('Pair test'));
 const publicTeacher=await call('teacher');assert.ok(publicTeacher.seats.every(p=>!('choice' in p)));assert.equal(publicTeacher.submitted,12);
 console.log('Round '+round+': 12 concurrent choices accepted, still hidden before timer.');
 await new Promise(r=>setTimeout(r,Math.max(0,deadline-Date.now()+100)));
 const results=await Promise.all(tokens.map(token=>call('state',undefined,token)));
 assert.ok(results.every(s=>s.status===(round===2?'complete':'revealed')&&s.history.length===round));state=await call('teacher');
 for(const x of state.history.at(-1).results){if(!x.bye){totals[x.a]+=x.scoreA;totals[x.b]+=x.scoreB;}}
 state.standings.forEach(p=>assert.equal(p.total,totals[p.id]));
 console.log('Round '+round+': automatic timer reveal and running totals passed.');
}
assert.equal(state.status,'complete');assert.equal((await call('export?type=csv')).split('\r\n').length,27);
const backup=await call('export?type=recovery');await admin('reset',{confirm:code});assert.equal(state.stage,'practice');assert.ok(state.seats.every(p=>!p.joined));
await call('admin/restore',{backup});state=await call('teacher');assert.equal(state.history.length,2);await admin('reset',{confirm:code});
fs.writeFileSync('.private/pairs-live-acceptance.json',JSON.stringify({passed:true,requests,players:13,rounds:2,automaticReveal:true,automaticAdvance:true,checkedAt:new Date().toISOString()},null,2));
console.log('Hosted paired game passed; test class archived and reset.');
