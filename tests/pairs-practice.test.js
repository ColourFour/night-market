import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handlePairs,pairSecret,pairPayoff} from '../docs/pairs-core.js';
import {outcome} from '../docs/pairs-feedback.js';
test('All four outcomes have the requested score, reaction and explanation',()=>{
 for(const [a,b,score,emoji] of [['contribute','take',0,'😢'],['take','take',2,'☹️'],['contribute','contribute',5,'👍'],['take','contribute',6,'👍']]){
  const result=outcome(a,b,'the robot');assert.equal(result.score,score);assert.equal(result.emoji,emoji);assert.match(result.explanation,/the robot/);assert.ok(result.explanation.includes(String(score)));
 }
});
test('13 students: one robot attempt, teacher unlock, zero class totals, rejoin and reusable reset',()=>{
 let state={teacherKey:pairSecret(),room:{preserved:true}},now=1000;const key=state.teacherKey;
 function call(path,body,token=key,status=200){const r=handlePairs(state,{url:'/api/pairs/'+path,method:body===undefined?'GET':'POST',body,headers:{authorization:'Bearer '+token}},{now});assert.equal(r.status,status,JSON.stringify(r.body));if(r.changed)state=r.state;return r;}
 const names=Array.from({length:13},(_,i)=>'Practice student '+i);
 call('admin/create',{names,rounds:13,seconds:30});const code=state.pairs.code;
 let tokens=names.map((_,id)=>call('join',{code,id},'').body.token);
 call('admin/open',{roundId:state.pairs.roundId},key,409);
 call('admin/unlock',{roundId:state.pairs.roundId},tokens[0],401);
 for(const [id,token] of tokens.entries()){
  const choice=id%2?'take':'contribute',p=call('practice',{choice},token).body;
  assert.ok(['contribute','take'].includes(p.bot));assert.deepEqual([p.score,p.botScore],pairPayoff(choice,p.bot));
  assert.deepEqual(call('practice',{choice:choice==='take'?'contribute':'take'},token).body,p);
 }
 assert.equal(call('teacher').body.seats.filter(p=>p.practiced).length,13);
 assert.equal(call('teacher').body.standings.reduce((sum,p)=>sum+p.total,0),state.pairs.players.reduce((sum,p)=>sum+p.practice.score,0));
 const old=tokens[0],oldPractice=structuredClone(state.pairs.players[0].practice);call('join',{code,id:0},'',409);tokens[0]=call('join',{code,id:0},old).body.token;
 call('state',undefined,old,401);assert.deepEqual(call('state',undefined,tokens[0]).body.me.practice,oldPractice);
 call('admin/unlock',{roundId:state.pairs.roundId});assert.ok(call('teacher').body.standings.every(p=>p.total===0));assert.equal(state.pairs.stage,'class');
 call('admin/unlock',{roundId:state.pairs.roundId},key,409);
 call('admin/open',{roundId:state.pairs.roundId});for(const id of state.pairs.players.map(p=>p.id)){const v=call('state',undefined,tokens[id]).body;if(v.opponent)call('choice',{roundId:state.pairs.roundId,choice:'contribute'},tokens[id]);}
 now=state.pairs.deadline;const revealed=call('teacher').body;assert.equal(revealed.status,'revealed');assert.equal(revealed.standings.find(p=>p.id===0).total,5);
 call('leave',{},tokens[0]);tokens[0]=call('join',{code,id:0},'').body.token;assert.equal(call('state',undefined,tokens[0]).body.me.total,5);
 const reset=call('admin/reset',{roundId:state.pairs.roundId,confirm:code});assert.ok(reset.archive);assert.equal(state.pairs.stage,'practice');assert.deepEqual(state.pairs.players.map(p=>p.name),names);
 assert.ok(state.pairs.players.every(p=>!p.token&&!p.practice));assert.equal(state.pairs.history.length,0);assert.deepEqual(state.room,{preserved:true});
 for(const token of tokens)call('state',undefined,token,401);
 assert.ok(call('lobby',undefined,'').body.players.every(p=>!p.joined));
 for(let id=0;id<13;id++)assert.ok(call('join',{code,id},'').body.token);
 assert.ok(call('teacher').body.standings.every(p=>p.total===0));
});
