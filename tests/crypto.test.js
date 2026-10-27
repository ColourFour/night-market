import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handleCrypto,plaintextMatches,cryptoResults,cryptoCsv,softFeedback} from '../docs/crypto-core.js';
import {handleClassroom,classDate,savedDayReport,savedDaysCsv} from '../docs/classroom-core.js';
import {pairSecret} from '../docs/pairs-core.js';
const now=Date.parse('2026-10-23T03:00:00Z');
function app(count=3){
 let state={teacherKey:pairSecret(),classDay:classDate(now),pairs:{players:Array.from({length:count},(_,id)=>({id,name:'Agent '+id,token:pairSecret(),pin:'123456'}))},zones:{keep:'zones'},frontier:{keep:'frontier'},room:{keep:'original'}};
 function call(path,body,who='teacher',expected=200){const token=who==='teacher'?state.teacherKey:Number.isInteger(who)?state.pairs.players[who].token:who;const r=handleCrypto(state,{url:'/api/crypto/'+path,method:body===undefined?'GET':'POST',body,headers:{authorization:'Bearer '+token}},{now});assert.equal(r.status,expected,JSON.stringify(r.body));if(r.changed)state=r.state;return r;}
 call('admin/open',{});
 const send=(who,data={})=>call('submit',{id:state.crypto.id,rule:'Shift letters forward by one. Secret rule '+who,ciphertext:'FODPEFE '+who,plaintext:'ACTUAL SECRET '+who,...data},who);
 return {call,send,get:()=>state,post:(path,body={},who='teacher',expected=200)=>call(path,{id:state.crypto.id,...body},who,expected)};
}
test('Students must submit first; peer answers/rules and verdicts stay server-side before reveal',()=>{
 const a=app();a.send(1);
 assert.deepEqual(a.call('state',undefined,0).body.messages,[]);
 a.post('guess',{targetId:1,guess:'ACTUAL SECRET 1'},0,403);
 a.send(0);a.post('guess',{targetId:1,guess:'My guessed message'},0);
 const v=a.call('state',undefined,0).body;
 assert.equal(v.me.entry.plaintext,'ACTUAL SECRET 0');assert.equal(v.messages.length,1);assert.deepEqual(Object.keys(v.messages[0]).sort(),['ciphertext','myGuess','name','studentId','submittedAt','checks','hint'].sort());
 assert.doesNotMatch(JSON.stringify(v.messages),/Secret rule|ACTUAL SECRET|correct|teacher|passed/);
 assert.equal(v.messages[0].myGuess,'My guessed message');
 const other=a.call('state',undefined,1).body;assert.doesNotMatch(JSON.stringify(other),/My guessed message/);
 const t=a.call('teacher').body;assert.equal(t.entries[1].rule,'Shift letters forward by one. Secret rule 1');assert.ok(t.entries.every(e=>!('plaintext' in e)));assert.doesNotMatch(JSON.stringify(t),/ACTUAL SECRET/);
 const r=a.post('admin/decode',{targetId:0,guess:'Wrong answer'});assert.deepEqual(r.body,{ok:true});assert.ok(!('correct' in r.body));
 a.call('export?type=json',undefined,'teacher',409);a.call('teacher',undefined,0,401);a.post('admin/reveal',{entryIds:[0,1]},0,401);
});
test('Every teacher attempt is required; reveal publishes all four requested facts and closes writes',()=>{
 const a=app();a.send(0);a.send(1);a.send(2);
 a.post('guess',{targetId:1,guess:'actual secret 1!'},0);a.post('guess',{targetId:1,guess:'Not the message'},2);
 a.post('admin/reveal',{entryIds:[0,1,2]},'teacher',409);
 a.post('admin/decode',{targetId:0,guess:'actualsecret0'});a.post('admin/decode',{targetId:1,guess:'Wrong'});a.post('admin/decode',{targetId:2,passed:true});
 assert.equal(a.call('teacher').body.reviewed,3);assert.doesNotMatch(JSON.stringify(a.call('teacher').body),/ACTUAL SECRET/);
 a.post('admin/reveal',{entryIds:[0,1]},'teacher',409);
 a.post('admin/reveal',{entryIds:[0,1,2]});
 const results=a.call('state',undefined,0).body.results;
 assert.equal(results[0].teacher.correct,true);assert.equal(results[1].teacher.correct,false);assert.equal(results[2].teacher.passed,true);
 assert.equal(results[1].rule,'Shift letters forward by one. Secret rule 1');assert.equal(results[1].plaintext,'ACTUAL SECRET 1');assert.deepEqual(results[1].peers.map(p=>p.correct),[true,false]);assert.equal(results[1].decodedByPeers,1);
 a.post('guess',{targetId:1,guess:'changed'},0,409);a.post('submit',{rule:'x',ciphertext:'x',plaintext:'x'},0,409);a.post('admin/decode',{targetId:0,guess:'changed'},'teacher',409);
 a.post('admin/reveal',{entryIds:[0,1,2]});assert.equal(a.call('export?type=csv').type,'text/csv');assert.equal(a.call('export').body.results.length,3);
});
test('Close messages still permits peer guesses; submissions are immutable and guarded by mission ID',()=>{
 const a=app();a.send(0);a.send(1);a.post('submit',{rule:'New',ciphertext:'New',plaintext:'New'},0,409);
 a.post('guess',{targetId:0,guess:'self'},0,400);a.post('guess',{targetId:'1',guess:'other'},0,400);a.post('guess',{targetId:99,guess:'other'},0,400);
 a.call('guess',{id:'stale',targetId:1,guess:'a'},0,409);
 a.post('admin/lock');a.post('submit',{rule:'x',ciphertext:'x',plaintext:'x'},2,409);
 a.post('guess',{targetId:1,guess:'first'},0);a.post('guess',{targetId:1,guess:'second'},0);
 assert.equal(a.call('state',undefined,0).body.messages[0].myGuess,'second');assert.equal(a.get().crypto.guesses['0:1'].guess,'second');
});
test('Reset archives only this mission and stale clients cannot overwrite it; revoked seats cannot read',()=>{
 const a=app();a.send(0);const old=a.get().crypto.id,keep=structuredClone(a.get());
 a.post('admin/reset',{confirm:'WRONG'},'teacher',400);assert.equal(a.get().crypto.id,old);
 const r=a.post('admin/reset',{confirm:'RESET'});assert.equal(r.archive.crypto.entries[0].plaintext,'ACTUAL SECRET 0');assert.notEqual(a.get().crypto.id,old);assert.deepEqual(a.get().crypto.entries,{});
 for(const k of ['pairs','zones','frontier','room'])assert.deepEqual(a.get()[k],keep[k]);
 a.call('submit',{id:old,rule:'r',ciphertext:'c',plaintext:'p'},0,409);
 const stolen=keep.pairs.players[0].token;a.get().pairs.players[0].token=null;a.call('state',undefined,stolen,401);a.call('state',undefined,'invalid',401);a.call('teacher',undefined,'',401);
});
test('Plaintext normalization supports multilingual messages and deterministic grading',()=>{
 assert.ok(plaintextMatches('ｍｅｅｔ ＡＴ NOON!','Meet at noon'));assert.ok(plaintextMatches('你 好，世 界！','你好世界'));
 assert.ok(!plaintextMatches('12','21'));assert.ok(!plaintextMatches('!!!','!!!'));assert.ok(!plaintextMatches('a+b','ab'));
 const a=app();a.post('submit',{rule:' ',ciphertext:'x',plaintext:'x'},0,400);a.post('submit',{rule:'x',ciphertext:'x',plaintext:'!!!'},0,400);a.post('submit',{rule:'x',ciphertext:'x'.repeat(1201),plaintext:'x'},0,400);assert.deepEqual(a.get().crypto.entries,{});
 a.send(0);a.post('admin/decode',{targetId:0,passed:'false'},'teacher',400);a.post('admin/decode',{targetId:0,guess:''},'teacher',400);
});
test('Daily reset archives Cryptology, expires sessions, and saved-day reports omit credentials',()=>{
 const a=app();a.send(0);const before=structuredClone(a.get()),token=before.pairs.players[0].token;
 const r=handleClassroom(before,{url:'/api/crypto/state',method:'GET',headers:{authorization:'Bearer '+token}},{now:now+86400000,dailyReset:true});
 assert.equal(r.status,401);assert.ok(r.changed);assert.equal(r.state.crypto,null);assert.deepEqual(r.archive.crypto,before.crypto);
 const report=savedDayReport({game:before,saved_at:'now'});assert.equal(report.cryptology.entries[0].plaintext,'ACTUAL SECRET 0');assert.doesNotMatch(JSON.stringify(report),new RegExp(before.teacherKey+'|'+token+'|123456'));
 const g=before.crypto;g.status='revealed';g.teacherAttempts[0]={guess:'ACTUAL SECRET 0',passed:false};
 const csv=savedDaysCsv([savedDayReport({game:before,saved_at:'now'})]);assert.match(csv,/Cryptology/);
});
test('Concurrent submissions and guesses survive compare-and-swap retries',async()=>{
 const a=app(16);let state=a.get(),version=0;
 async function apply(path,body,token){for(let i=0;i<80;i++){const expected=version,r=handleCrypto(state,{url:'/api/crypto/'+path,method:'POST',body,headers:{authorization:'Bearer '+token}},{now});await new Promise(resolve=>setTimeout(resolve,i%3));if(version!==expected)continue;if(r.changed){state=r.state;version++;}return r;}throw Error('Commit retries exhausted');}
 const id=state.crypto.id;
 const submissions=await Promise.all(state.pairs.players.map(p=>apply('submit',{id,rule:'Reverse',ciphertext:'!OLLEH',plaintext:'HELLO!'},p.token)));
 assert.ok(submissions.every(r=>r.status===200));assert.equal(Object.keys(state.crypto.entries).length,16);
 const guesses=await Promise.all(state.pairs.players.map(p=>apply('guess',{id,targetId:(p.id+1)%16,guess:'Hello'},p.token)));
 assert.ok(guesses.every(r=>r.status===200));assert.equal(Object.keys(state.crypto.guesses).length,16);
 const originalVersion=version;const duplicates=await Promise.all([apply('submit',{id,rule:'New',ciphertext:'x',plaintext:'x'},state.pairs.players[0].token),apply('submit',{id,rule:'New',ciphertext:'y',plaintext:'y'},state.pairs.players[0].token)]);
 assert.ok(duplicates.every(r=>r.status===409));assert.equal(version,originalVersion);assert.equal(state.crypto.entries[0].plaintext,'HELLO!');
});
test('CSV export protects formula cells and contains no session credentials',()=>{
 const a=app();a.send(0,{ciphertext:'=1+1',rule:'@code',plaintext:'Message'});a.post('admin/decode',{targetId:0,guess:'Message'});a.post('admin/reveal',{entryIds:[0]});
 const csv=cryptoCsv(cryptoResults(a.get().crypto));assert.match(csv,/'=1\+1/);assert.match(csv,/'@code/);assert.doesNotMatch(csv,new RegExp(a.get().teacherKey));
 const padded=cryptoCsv([{...cryptoResults(a.get().crypto)[0],ciphertext:'  =1+1'}]);assert.match(padded,/"'  =1\+1"/);
});
test('Cipher grids retain exact whitespace across submission, peer and teacher views, reveal and exports',()=>{
 const a=app();const ciphertext='\n    A  B  C  D\tE  \n    F  G  H  I\tJ  \n    K  L  M  N\tO  \n    P  Q  R  S\tT  \n    U  V  W  X\tY  \n';
 a.send(0,{ciphertext});a.send(1);
 assert.equal(a.get().crypto.entries[0].ciphertext,ciphertext);
 assert.equal(a.call('state',undefined,1).body.messages.find(e=>e.studentId===0).ciphertext,ciphertext);
 assert.equal(a.call('teacher',undefined,'teacher').body.entries[0].ciphertext,ciphertext);
 a.post('admin/decode',{targetId:0,guess:'ACTUAL SECRET 0'});a.post('admin/decode',{targetId:1,guess:'ACTUAL SECRET 1'});a.post('admin/reveal',{entryIds:[0,1]});
 assert.equal(a.call('state',undefined,1).body.results[0].ciphertext,ciphertext);
 assert.equal(a.call('export?type=json',undefined,'teacher').body.results[0].ciphertext,ciphertext);
 assert.ok(a.call('export?type=csv',undefined,'teacher').body.includes(ciphertext));
});
test('Teacher hints require a request, record viewing separately, and never expose the rule or answer',()=>{
 const a=app();a.send(0);a.send(1);a.send(2);
 assert.deepEqual(a.post('hint',{targetId:1},0).body,{ok:true,hint:null,waiting:true});
 assert.equal(a.get().crypto.hintRequests['0:1'].viewedAt,null);
 const t=a.call('teacher').body;assert.equal(t.entries[1].hintRequests,1);assert.equal(t.hintRequestCount,1);
 a.post('admin/hint',{targetId:1,hint:'Try reading from right to left.'},0,401);
 a.post('admin/hint',{targetId:1,hint:'  Look for a repeating pattern.  '});
 let v=a.call('state',undefined,0).body.messages.find(e=>e.studentId===1);
 assert.deepEqual(v.hint,{requested:true,available:true,text:null});assert.doesNotMatch(JSON.stringify(v),/Secret rule|ACTUAL SECRET|Look for/);
 assert.equal(a.post('hint',{targetId:1},0).body.hint,'Look for a repeating pattern.');
 v=a.call('state',undefined,0).body.messages.find(e=>e.studentId===1);assert.equal(v.hint.text,'Look for a repeating pattern.');assert.ok(a.get().crypto.hintRequests['0:1'].viewedAt);
 assert.equal(a.call('state',undefined,2).body.messages.find(e=>e.studentId===1).hint.text,null);
 a.post('hint',{targetId:1},0);assert.equal(Object.keys(a.get().crypto.hintRequests).length,1);assert.equal(a.get().crypto.checks['0:1'],undefined);
 a.post('admin/hint',{targetId:1,hint:'Updated teacher clue.'});assert.equal(a.call('state',undefined,0).body.messages.find(e=>e.studentId===1).hint.text,'Updated teacher clue.');
});
test('Soft feedback gives only broad closeness bands; exact and near-exact answers share a band',()=>{
 assert.equal(softFeedback('MEET AT NOON!','meetatnoon'),'Very close');assert.equal(softFeedback('MEET AT NOOM','MEET AT NOON'),'Very close');
 assert.equal(softFeedback('MEET','MEETAT'),'Partly close');assert.equal(softFeedback('ZZZZ','HELLO'),'Try a different approach');
 assert.equal(softFeedback('你好世界','你好世界'),'Very close');
 const a=app();a.send(0);a.send(1);let r=a.post('check',{targetId:1,kind:'soft',guess:'ACTUAL SECRET 1'},0).body;
 assert.equal(r.result.feedback,'Very close');assert.ok(!('correct' in r.result));assert.ok(!('correct' in r.checks.history[0]));assert.ok(!('distance' in r.result));assert.ok(!('similarity' in r.result));
 assert.equal(r.checks.softRemaining,1);assert.equal(r.checks.definitiveRemaining,1);assert.equal(r.checks.solved,false);
 assert.doesNotMatch(JSON.stringify(a.call('teacher').body),/ACTUAL SECRET|Very close/);
 assert.deepEqual(a.call('state',undefined,1).body.messages[0].checks.history,[]);
});
test('Each student gets two soft and one definitive check per message; saves and duplicate retries do not use extra checks',()=>{
 const a=app();a.send(0);a.send(1);a.send(2);
 a.post('check',{targetId:1,kind:'soft',guess:'aaaa'},0);a.post('check',{targetId:1,kind:'soft',guess:'AAAA!'},0);
 assert.equal(a.get().crypto.checks['0:1'].length,1);
 a.post('check',{targetId:1,kind:'soft',guess:'bbbb'},0);
 a.post('check',{targetId:1,kind:'soft',guess:'cccc',limit:99},0,409);
 a.post('check',{targetId:1,kind:'definitive',guess:'wrong'},0);
 a.post('check',{targetId:1,kind:'definitive',guess:'ACTUAL SECRET 1'},0,409);
 a.post('guess',{targetId:1,guess:'new unchecked final guess'},0);
 const v=a.call('state',undefined,0).body.messages.find(e=>e.studentId===1);
 assert.equal(v.checks.softRemaining,0);assert.equal(v.checks.definitiveRemaining,0);assert.equal(v.myGuess,'new unchecked final guess');assert.equal(v.checks.history.length,3);
 assert.equal(a.post('check',{targetId:2,kind:'soft',guess:'another'},0).body.checks.softRemaining,1);
 assert.equal(a.post('check',{targetId:1,kind:'soft',guess:'another'},2).body.checks.softRemaining,1);
 const state=a.get(),token=state.pairs.players[0].token;
 const resumed=handleClassroom(state,{url:'/api/crypto/state',method:'GET',headers:{authorization:'Bearer '+token}},{now:now+14*86400000});
 assert.equal(resumed.status,200);assert.equal(resumed.body.messages.find(e=>e.studentId===1).checks.softRemaining,0);assert.equal(resumed.archive,null);
});
test('Definitive success is clear, saves and protects the correct answer; hints and checks appear in results and exports',()=>{
 const a=app();a.send(0);a.send(1);a.post('admin/hint',{targetId:1,hint:'Teacher clue'});a.post('hint',{targetId:1},0);
 a.post('check',{targetId:1,kind:'soft',guess:'Near actual secret'},0);
 const r=a.post('check',{targetId:1,kind:'definitive',guess:'actual secret 1!'},0).body;assert.equal(r.result.correct,true);assert.equal(r.checks.solved,true);
 a.post('guess',{targetId:1,guess:'wrong overwrite'},0,409);a.post('check',{targetId:1,kind:'definitive',guess:'ACTUALSECRET1'},0);assert.equal(a.get().crypto.checks['0:1'].length,2);
 a.post('admin/decode',{targetId:0,passed:true});a.post('admin/decode',{targetId:1,passed:true});a.post('admin/reveal',{entryIds:[0,1]});
 const e=a.call('state',undefined,0).body.results[1];assert.equal(e.hint,'Teacher clue');assert.equal(e.hintRequests.length,1);assert.equal(e.peers[0].hintUsed,true);assert.equal(e.peers[0].checksUsed,2);assert.equal(e.peers[0].correct,true);
 const csv=a.call('export?type=csv').body;assert.match(csv,/hint_requested/);assert.match(csv,/soft_checks/);
 for(const path of ['hint','check'])a.post(path,{targetId:1,kind:'soft',guess:'x'},0,409);a.post('admin/hint',{targetId:1,hint:'late'},'teacher',409);
});
test('Legacy missions gain features without reset; stale, invalid and unauthorized checks do not spend allowances',()=>{
 const a=app();a.send(0);a.send(1);delete a.get().crypto.hints;delete a.get().crypto.checks;delete a.get().crypto.hintRequests;
 a.post('check',{targetId:1,kind:'invalid',guess:'x'},0,400);a.post('check',{targetId:0,kind:'soft',guess:'x'},0,400);a.post('check',{targetId:1,kind:'soft',guess:'!!!'},0,400);
 a.call('check',{id:'old',targetId:1,kind:'soft',guess:'x'},0,409);a.post('check',{targetId:1,kind:'soft',guess:'x'},2,403);
 a.post('check',{targetId:1,kind:'soft',guess:'x'},'teacher',401);assert.equal(a.get().crypto.checks,undefined);
 a.post('admin/lock');assert.equal(a.post('check',{targetId:1,kind:'soft',guess:'x'},0).body.checks.softRemaining,1);a.post('hint',{targetId:1},0);
 const old=a.get().crypto.id;a.post('admin/reset',{confirm:'RESET'});assert.notEqual(a.get().crypto.id,old);assert.deepEqual(a.get().crypto.checks,{});assert.deepEqual(a.get().crypto.hintRequests,{});
});
test('Concurrent unique check requests cannot exceed either server-side allowance',async()=>{
 const a=app();a.send(0);a.send(1);let state=a.get(),version=0;const id=state.crypto.id,token=state.pairs.players[0].token;
 async function check(kind,guess){for(let attempt=0;attempt<30;attempt++){
  const expected=version,r=handleCrypto(state,{url:'/api/crypto/check',method:'POST',body:{id,targetId:1,kind,guess},headers:{authorization:'Bearer '+token}},{now});
  await new Promise(resolve=>setTimeout(resolve,attempt%3));if(version!==expected)continue;if(r.changed){state=r.state;version++;}return r;
 }throw Error('Commit retries exhausted');}
 const responses=await Promise.all([check('soft','one'),check('soft','two'),check('soft','three'),check('definitive','four'),check('definitive','five')]);
 assert.equal(responses.filter(r=>r.status===200).length,3);assert.equal(state.crypto.checks['0:1'].filter(c=>c.kind==='soft').length,2);assert.equal(state.crypto.checks['0:1'].filter(c=>c.kind==='definitive').length,1);
});
