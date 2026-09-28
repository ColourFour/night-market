import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pairings,pairPayoff,handlePairs,pairSecret} from '../docs/pairs-core.js';
test('Exact Contribute / Take matrix',()=>{
 assert.deepEqual(pairPayoff('contribute','contribute'),[5,5]);assert.deepEqual(pairPayoff('contribute','take'),[0,6]);assert.deepEqual(pairPayoff('take','contribute'),[6,0]);assert.deepEqual(pairPayoff('take','take'),[2,2]);assert.throws(()=>pairPayoff('invalid','take'));
});
test('Round robin pairs everyone once, with one bye each for odd classes',()=>{
 for(const n of [2,3,12,13,14,39,40]){
  const cycle=n%2?n:n-1,seen=new Set(),byes=Array(n).fill(0),matches=Array(n).fill(0);
  for(let round=1;round<=cycle;round++)for(const [a,b] of pairings(n,round)){
   if(a===null||b===null){byes[a??b]++;continue;}assert.notEqual(a,b);const key=[a,b].sort((a,b)=>a-b).join(':');assert.ok(!seen.has(key),key);seen.add(key);matches[a]++;matches[b]++;
  }
  assert.equal(seen.size,n*(n-1)/2);assert.ok(matches.every(m=>m===n-1));assert.ok(byes.every(m=>m===(n%2?1:0)));assert.deepEqual(pairings(n,1),pairings(n,cycle+1));
 }
 assert.deepEqual(pairings(13,1,'fixed'),pairings(13,9,'fixed'));
});
function app(count=13,options={}){
 let state={schema:1,teacherKey:pairSecret(),room:{preserve:'Night Market record'},pairs:null},now=1000,version=0;
 const key=state.teacherKey;
 function call(path,body,token=key,status=200){const r=handlePairs(state,{url:'/api/pairs/'+path,method:body===undefined?'GET':'POST',headers:{authorization:'Bearer '+token},body},{now,siteUrl:'https://example.test/'});assert.equal(r.status,status,JSON.stringify(r.body));if(r.changed){state=r.state;version++;}return r;}
 call('admin/create',{names:Array.from({length:count},(_,i)=>'Player '+i),rounds:count%2?count:count-1,seconds:10,rotation:'rotate',missing:'pause',...options});
 const tokens=state.pairs.players.map(p=>call('join',{code:state.pairs.code,id:p.id,pin:p.pin},'').body.token);
 tokens.forEach(token=>call('practice',{choice:'contribute'},token));
 call('admin/unlock',{roundId:state.pairs.roundId});
 return {call,tokens,key,get:()=>structuredClone(state),now:n=>{now=n;},admin:(action,b={},status=200)=>call('admin/'+action,{roundId:state.pairs.roundId,...b},key,status),version:()=>version};
}
test('13-player full cycle: timer privacy, simultaneous reveal, scores and history',()=>{
 const a=app(),expected=Array(13).fill(0),played=Array(13).fill(0);
 for(let round=1;round<=13;round++){
  if(round===1){a.now(100000);a.admin('open');}else{a.now(a.get().pairs.nextRoundAt);a.call('teacher');}
  const state=a.get(),r=state.pairs;assert.equal(r.status,'open');
  for(const [x,y] of pairings(13,round)){
   if(x===null||y===null){a.call('choice',{roundId:r.roundId,choice:'take'},a.tokens[x??y],409);continue;}
   const left=round%2?'contribute':'take',right=(x+round)%3?'take':'contribute';
   a.call('choice',{roundId:r.roundId,choice:left},a.tokens[x]);a.call('choice',{roundId:r.roundId,choice:right},a.tokens[y]);
   const score=pairPayoff(left,right);expected[x]+=score[0];expected[y]+=score[1];played[x]++;played[y]++;
  }
  const before=a.call('teacher').body;assert.equal(before.status,'open');assert.equal(before.history.length,round-1);assert.equal(before.submitted,12);assert.ok(!('choices' in before));assert.ok(before.seats.every(s=>!('choice' in s)));
  for(const token of a.tokens){const s=a.call('state',undefined,token).body;assert.ok(!('choices' in s));assert.ok(!('seats' in s));assert.ok(!('token' in s));assert.equal(s.history.length,round-1);assert.ok(s.opponent===null||typeof s.opponent.name==='string');}
  a.now(r.deadline-1);assert.equal(a.call('teacher').body.status,'open');a.now(r.deadline);
  const after=a.call('teacher').body;assert.equal(after.status,round===13?'complete':'revealed');assert.equal(after.history.length,round);after.standings.forEach(s=>{assert.equal(s.total,expected[s.id]);assert.equal(s.played,played[s.id]);});
  a.call('teacher');assert.equal(a.get().pairs.history.length,round);
 }
 assert.equal(a.get().pairs.status,'complete');assert.deepEqual(a.get().room,{preserve:'Night Market record'});
 const csv=a.call('export?type=csv').body;assert.equal(csv.split('\r\n').length,170);
 const backup=a.call('export?type=recovery').body;const reset=a.admin('reset',{confirm:a.get().pairs.code});assert.ok(reset.archive);assert.equal(a.get().pairs.stage,'practice');assert.ok(a.get().pairs.players.every(p=>!p.token&&!p.practice));assert.deepEqual(a.get().room,{preserve:'Night Market record'});
 a.call('admin/restore',{backup});assert.equal(a.get().pairs.history.length,13);a.admin('recoverSeat',{id:0});a.call('state',undefined,a.tokens[0],401);
});
test('Deadline reveals absent choices as Take, waits 30 seconds and opens the next round',()=>{
 const a=app(2,{rounds:2});a.admin('open');const r=a.get().pairs;
 a.call('choice',{roundId:'old',choice:'take'},a.tokens[0],409);
 a.call('choice',{roundId:r.roundId,choice:'contribute'},a.tokens[0]);a.call('choice',{roundId:r.roundId,choice:'take'},a.tokens[0],409);
 a.now(r.deadline-1);assert.equal(a.call('teacher').body.history.length,0);
 a.now(r.deadline);a.call('choice',{roundId:r.roundId,choice:'take'},a.tokens[1],409);
 const result=a.call('teacher').body;assert.equal(result.status,'revealed');assert.equal(result.nextRoundAt,r.deadline+30000);
 assert.equal(result.history[0].results[0].automaticB,true);assert.equal(result.history[0].results[0].scoreA,0);assert.equal(result.history[0].results[0].scoreB,6);
 a.admin('extend',{},400);a.admin('reveal',{},400);
 a.now(result.nextRoundAt-1);assert.equal(a.call('teacher').body.round,1);
 a.now(result.nextRoundAt);const next=a.call('teacher').body;assert.equal(next.round,2);assert.equal(next.status,'open');assert.equal(next.deadline,result.nextRoundAt+10000);assert.equal(next.submitted,0);
 a.call('choice',{roundId:r.roundId,choice:'take'},a.tokens[0],409);
 a.now(next.deadline);const final=a.call('teacher').body;assert.equal(final.status,'complete');assert.equal(final.history.length,2);assert.equal(final.nextRoundAt,null);
 assert.deepEqual(final.history[1].results.map(x=>[x.scoreA,x.scoreB]),[[2,2]]);
 a.now(next.deadline+100000);assert.equal(a.call('teacher').body.history.length,2);
});
test('Extra 30 seconds wins before reveal; result pause/resume and recovery are safe',()=>{
 const a=app(2,{rounds:3,seconds:60});a.admin('open');let r=a.get().pairs;
 a.now(r.deadline);a.admin('extend');assert.equal(a.get().pairs.deadline,r.deadline+30000);assert.equal(a.get().pairs.history.length,0);
 a.call('choice',{roundId:r.roundId,choice:'contribute'},a.tokens[0]);a.now(a.get().pairs.deadline);a.call('teacher');
 a.admin('hold');assert.equal(a.get().pairs.nextRoundAt,null);a.now(r.deadline+200000);assert.equal(a.call('teacher').body.round,1);
 a.admin('resume');const resume=a.get().pairs.nextRoundAt;assert.equal(resume,r.deadline+230000);
 a.now(resume);assert.equal(a.call('teacher').body.round,2);
 const backup=a.call('export?type=recovery').body;a.call('admin/restore',{backup});a.now(resume+1000000);assert.equal(a.call('teacher').body.status,'paused');
 a.admin('extend');assert.equal(a.get().pairs.status,'open');assert.equal(a.get().pairs.history.length,1);
 a.admin('reveal');const revealed=a.call('export?type=recovery').body;a.call('admin/restore',{backup:revealed});a.now(resume+2000000);assert.equal(a.call('teacher').body.status,'revealed');assert.equal(a.get().pairs.clockHeld,true);
 a.admin('resume');assert.ok(a.get().pairs.nextRoundAt>resume+2000000);
});
test('An existing class paused for absences upgrades without losing earlier history',()=>{
 const a=app(2,{rounds:2});a.admin('open');let state=a.get();state.pairs.status='paused';state.pairs.settings.missing='pause';delete state.pairs.flowVersion;
 const r=handlePairs(state,{url:'/api/pairs/teacher',method:'GET',headers:{authorization:'Bearer '+a.key}},{now:20000});
 assert.equal(r.body.status,'revealed');assert.equal(r.body.history.length,1);assert.equal(r.body.nextRoundAt,50000);assert.deepEqual(r.state.room,state.room);
 assert.equal(r.body.history[0].results[0].scoreA,2);
 const late=handlePairs(r.state,{url:'/api/pairs/teacher',method:'GET',headers:{authorization:'Bearer '+a.key}},{now:1000000});
 assert.equal(late.body.status,'open');assert.equal(late.body.round,2);assert.equal(late.body.deadline,1010000);assert.equal(late.body.history.length,1);
});
test('Concurrent clock polls commit the reveal only once',async()=>{
 const base=app(13);base.admin('open');let state=base.get(),version=0;const r=state.pairs;
 for(const [a,b] of pairings(13,1)){if(a===null||b===null)continue;for(const id of [a,b])base.call('choice',{roundId:r.roundId,choice:'contribute'},base.tokens[id]);}
 state=base.get();const now=r.deadline;
 await Promise.all(base.tokens.map(async token=>{for(let i=0;i<30;i++){const v=version;const response=handlePairs(state,{url:'/api/pairs/state',method:'GET',headers:{authorization:'Bearer '+token}},{now});await new Promise(r=>setTimeout(r,Math.random()*3));if(response.changed){if(v!==version)continue;state=response.state;version++;}assert.equal(response.status,200);return;}assert.fail('Retry limit');}));
 assert.equal(state.pairs.history.length,1);assert.equal(version,1);
});
test('Public name selection exposes only roster and rotates sessions when rejoining',()=>{
 let state={teacherKey:pairSecret(),pairs:null};const teacher=state.teacherKey;
 function call(path,body,token='',status=200){const r=handlePairs(state,{url:'/api/pairs/'+path,method:body===undefined?'GET':'POST',headers:{authorization:'Bearer '+token},body});assert.equal(r.status,status,JSON.stringify(r.body));if(r.changed)state=r.state;return r.body;}
 assert.deepEqual(call('lobby'),{empty:true,players:[]});
 call('admin/create',{names:['A','B','C'],rounds:3,seconds:30},teacher);
 const initial=call('lobby');assert.equal(initial.players.length,3);assert.deepEqual(Object.keys(initial).sort(),['code','players']);assert.deepEqual(Object.keys(initial.players[0]).sort(),['id','joined','name']);
 let a=call('join',{code:initial.code,id:0}).token;
 assert.ok(a);assert.equal(call('lobby').players[0].joined,true);
 const old=a;call('join',{code:initial.code,id:0},'',409);a=call('join',{code:initial.code,id:0},old).token;call('state',undefined,old,401);assert.equal(call('state',undefined,a).me.name,'A');
 call('teacher',undefined,'',401);call('admin/open',{roundId:state.pairs.roundId},'',401);
 call('join',{code:'WRONG',id:1},'',404);
 call('admin/recoverSeat',{roundId:state.pairs.roundId,id:0},teacher);call('state',undefined,a,401);
 assert.equal(call('lobby').players[0].joined,false);assert.ok(call('join',{code:initial.code,id:0}).token);
 const b=call('join',{code:initial.code,id:1}).token;call('join',{code:initial.code,id:2});
 const lobby=call('state',undefined,b);assert.equal(lobby.players.filter(p=>p.joined).length,3);assert.equal(lobby.status,'waiting');
});
test('Thirteen simultaneous polls open exactly one next round after 30 seconds',async()=>{
 const a=app(13);a.admin('open');a.now(a.get().pairs.deadline);a.call('teacher');let state=a.get(),version=0;const now=state.pairs.nextRoundAt;
 await Promise.all(a.tokens.map(async token=>{for(let retry=0;retry<30;retry++){const expected=version;const r=handlePairs(state,{url:'/api/pairs/state',method:'GET',headers:{authorization:'Bearer '+token}},{now});await new Promise(resolve=>setTimeout(resolve,Math.random()*3));if(r.changed){if(expected!==version)continue;state=r.state;version++;}assert.equal(r.body.round,2);assert.equal(r.body.status,'open');return;}assert.fail('Retry limit');}));
 assert.equal(version,1);assert.equal(state.pairs.history.length,1);assert.equal(state.pairs.round,2);assert.equal(state.pairs.deadline,now+10000);assert.deepEqual(state.pairs.choices,{});
});
