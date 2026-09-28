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
 return {call,tokens,key,get:()=>structuredClone(state),now:n=>{now=n;},admin:(action,b={},status=200)=>call('admin/'+action,{roundId:state.pairs.roundId,...b},key,status),version:()=>version};
}
test('13-player full cycle: timer privacy, simultaneous reveal, scores and history',()=>{
 const a=app(),expected=Array(13).fill(0),played=Array(13).fill(0);
 for(let round=1;round<=13;round++){
  a.now(round*100000);a.admin('open');const state=a.get(),r=state.pairs;
  for(const [x,y] of pairings(13,round)){
   if(x===null||y===null){a.call('choice',{roundId:r.roundId,choice:'take'},a.tokens[x??y],409);continue;}
   const left=round%2?'contribute':'take',right=(x+round)%3?'take':'contribute';
   a.call('choice',{roundId:r.roundId,choice:left},a.tokens[x]);a.call('choice',{roundId:r.roundId,choice:right},a.tokens[y]);
   const score=pairPayoff(left,right);expected[x]+=score[0];expected[y]+=score[1];played[x]++;played[y]++;
  }
  const before=a.call('teacher').body;assert.equal(before.status,'open');assert.equal(before.history.length,round-1);assert.equal(before.submitted,12);assert.ok(!('choices' in before));assert.ok(before.seats.every(s=>!('choice' in s)));
  for(const token of a.tokens){const s=a.call('state',undefined,token).body;assert.ok(!('choices' in s));assert.ok(!('seats' in s));assert.ok(!('token' in s));assert.equal(s.history.length,round-1);assert.ok(s.opponent===null||typeof s.opponent.name==='string');}
  a.now(r.deadline-1);assert.equal(a.call('teacher').body.status,'open');a.now(r.deadline);
  const after=a.call('teacher').body;assert.equal(after.status,'revealed');assert.equal(after.history.length,round);after.standings.forEach(s=>{assert.equal(s.total,expected[s.id]);assert.equal(s.played,played[s.id]);});
  a.call('teacher');assert.equal(a.get().pairs.history.length,round);a.admin('advance');
 }
 assert.equal(a.get().pairs.status,'complete');assert.deepEqual(a.get().room,{preserve:'Night Market record'});
 const csv=a.call('export?type=csv').body;assert.equal(csv.split('\r\n').length,170);
 const backup=a.call('export?type=recovery').body;const reset=a.admin('reset',{confirm:a.get().pairs.code});assert.ok(reset.archive);assert.equal(a.get().pairs,null);assert.deepEqual(a.get().room,{preserve:'Night Market record'});
 a.call('admin/restore',{backup});assert.equal(a.get().pairs.history.length,13);a.admin('recoverSeat',{id:0});a.call('state',undefined,a.tokens[0],401);
});
test('Deadline pause, extend, stale/duplicate rejection and automatic Take are explicit',()=>{
 const a=app(2,{rounds:2});a.admin('open');let r=a.get().pairs;
 a.call('choice',{roundId:'old',choice:'take'},a.tokens[0],409);
 a.call('choice',{roundId:r.roundId,choice:'contribute'},a.tokens[0]);a.call('choice',{roundId:r.roundId,choice:'take'},a.tokens[0],409);
 a.now(r.deadline);a.call('choice',{roundId:r.roundId,choice:'take'},a.tokens[1],409);
 assert.equal(a.get().pairs.status,'paused');assert.equal(a.get().pairs.history.length,0);a.admin('reveal',{},400);a.admin('extend');
 a.call('choice',{roundId:r.roundId,choice:'take'},a.tokens[1]);a.admin('reveal');assert.equal(a.get().pairs.history[0].results[0].scoreB,6);
 a.admin('reveal',{},400);
 const automatic=app(2,{rounds:1,missing:'take'});automatic.admin('open');r=automatic.get().pairs;
 automatic.call('choice',{roundId:r.roundId,choice:'contribute'},automatic.tokens[0]);automatic.now(r.deadline);const final=automatic.call('teacher').body;
 assert.equal(final.status,'revealed');assert.equal(final.history[0].results[0].automaticB,true);assert.equal(final.standings.find(p=>p.id===1).total,6);
 automatic.call('teacher',undefined,'wrong',401);automatic.call('choice',{roundId:r.roundId,choice:'take'},automatic.tokens[1],409);
});
test('Concurrent clock polls commit the reveal only once',async()=>{
 const base=app(13);base.admin('open');let state=base.get(),version=0;const r=state.pairs;
 for(const [a,b] of pairings(13,1)){if(a===null||b===null)continue;for(const id of [a,b])base.call('choice',{roundId:r.roundId,choice:'contribute'},base.tokens[id]);}
 state=base.get();const now=r.deadline;
 await Promise.all(base.tokens.map(async token=>{for(let i=0;i<30;i++){const v=version;const response=handlePairs(state,{url:'/api/pairs/state',method:'GET',headers:{authorization:'Bearer '+token}},{now});await new Promise(r=>setTimeout(r,Math.random()*3));if(response.changed){if(v!==version)continue;state=response.state;version++;}assert.equal(response.status,200);return;}assert.fail('Retry limit');}));
 assert.equal(state.pairs.history.length,1);assert.equal(version,1);
});
test('Public name selection exposes only roster and protects claimed seats',()=>{
 let state={teacherKey:pairSecret(),pairs:null};const teacher=state.teacherKey;
 function call(path,body,token='',status=200){const r=handlePairs(state,{url:'/api/pairs/'+path,method:body===undefined?'GET':'POST',headers:{authorization:'Bearer '+token},body});assert.equal(r.status,status,JSON.stringify(r.body));if(r.changed)state=r.state;return r.body;}
 assert.deepEqual(call('lobby'),{empty:true,players:[]});
 call('admin/create',{names:['A','B','C'],rounds:3,seconds:30},teacher);
 const initial=call('lobby');assert.equal(initial.players.length,3);assert.deepEqual(Object.keys(initial).sort(),['code','players']);assert.deepEqual(Object.keys(initial.players[0]).sort(),['id','joined','name']);
 const a=call('join',{code:initial.code,id:0}).token;
 assert.ok(a);assert.equal(call('lobby').players[0].joined,true);
 call('join',{code:initial.code,id:0},'',409);assert.equal(call('state',undefined,a).me.name,'A');
 call('teacher',undefined,'',401);call('admin/open',{roundId:state.pairs.roundId},'',401);
 call('join',{code:'WRONG',id:1},'',404);
 call('admin/recoverSeat',{roundId:state.pairs.roundId,id:0},teacher);call('state',undefined,a,401);
 assert.equal(call('lobby').players[0].joined,false);assert.ok(call('join',{code:initial.code,id:0}).token);
 const b=call('join',{code:initial.code,id:1}).token;call('join',{code:initial.code,id:2});
 const lobby=call('state',undefined,b);assert.equal(lobby.players.filter(p=>p.joined).length,3);assert.equal(lobby.status,'waiting');
});
