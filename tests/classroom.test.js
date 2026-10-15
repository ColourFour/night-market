import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handleClassroom,classDate,savedDayReport,savedDaysCsv,normalizeJoinName} from '../docs/classroom-core.js';
import {pairSecret} from '../docs/pairs-core.js';
const start=Date.parse('2026-10-15T15:59:00Z');
function app(input={teacherKey:pairSecret(),pairs:null}){
 let state=input,now=start;const archives=[];
 function call(path,body,token='',status=200){const r=handleClassroom(state,{url:'/api/'+path,method:body===undefined?'GET':'POST',body,headers:{authorization:'Bearer '+token}},{now});assert.equal(r.status,status,JSON.stringify(r.body));if(r.changed){state=r.state;if(r.archive)archives.push(r.archive);}return r;}
 return {call,get:()=>state,time:n=>now=n,archives,admin:(action,body={})=>call('pairs/admin/'+action,{roundId:state.pairs.roundId,...body},state.teacherKey),join:name=>call('pairs/join',{name}).body.token};
}
test('Open names work from an empty class; matching and session ownership are server-side',()=>{
 const a=app();assert.deepEqual(a.call('pairs/lobby').body.players,[]);
 const token=a.join('  New   Student  ');assert.equal(a.get().pairs.players[0].name,'New Student');
 assert.equal(a.call('pairs/state',undefined,token).body.opponent,null);
 assert.equal(normalizeJoinName('ＮＥＷ  student'),'new student');
 a.call('pairs/join',{name:'NEW student'},'',409);assert.equal(a.get().pairs.players.length,1);
 a.call('pairs/join',{name:''},'',400);a.call('pairs/join',{name:'x'.repeat(61)},'',400);a.call('pairs/join',{name:9},'',400);
 const other=a.join('李同学');assert.equal(a.call('pairs/state',undefined,other).body.me.name,'李同学');
 a.call('pairs/leave',{},token);a.join('new STUDENT');assert.equal(a.get().pairs.players.length,2);
 a.call('pairs/state',undefined,token,401);
});
test('China midnight archives all modes exactly once and invalidates old sessions across modes',()=>{
 const a=app();a.call('pairs/lobby');const token=a.join('Ada');a.join('Bo');
 a.call('pairs/practice',{choice:'take'},token);
 a.call('zones/admin/open',{},a.get().teacherKey);a.call('frontier/admin/create',{players:[0,1],rounds:10,seconds:180},a.get().teacherKey);
 const before=structuredClone(a.get());a.time(Date.parse('2026-10-15T15:59:59.999Z'));
 assert.equal(a.call('pairs/state',undefined,token).body.me.name,'Ada');
 const archiveCount=a.archives.length;a.time(Date.parse('2026-10-15T16:00:00Z'));
 a.call('frontier/state',undefined,token,401);
 assert.equal(a.get().classDay,'2026-10-16');assert.equal(a.archives.length,archiveCount+1);
 assert.deepEqual(a.archives.at(-1).zones,before.zones);assert.deepEqual(a.archives.at(-1).frontier,before.frontier);
 assert.equal(a.get().zones,null);assert.equal(a.get().frontier,null);assert.equal(a.get().pairs.players.length,0);
 a.call('zones/state',undefined,token,401);a.call('pairs/lobby');assert.equal(a.archives.length,archiveCount+1);
 const fresh=a.join('Ada');assert.notEqual(fresh,token);assert.equal(a.call('pairs/state',undefined,fresh).body.me.total,0);
 assert.equal(a.call('pairs/state',undefined,fresh).body.me.practice,null);
 assert.equal(classDate(Date.parse('2026-12-31T16:00:00Z')),'2027-01-01');
});
test('Late arrivals preserve current opponents, reveal history, and join open Economic Zones',()=>{
 const a=app();a.call('pairs/lobby');const t=a.join('A');a.join('B');a.admin('unlock');a.admin('open');
 const pairs=a.call('pairs/state',undefined,t).body.pairs;
 a.call('zones/admin/open',{},a.get().teacherKey);
 const late=a.join('C');assert.deepEqual(a.call('pairs/state',undefined,t).body.pairs,pairs);
 assert.equal(a.call('pairs/state',undefined,late).body.me.participating,false);
 assert.equal(a.call('zones/state',undefined,late).body.me.name,'C');assert.equal(a.get().zones.roster.length,3);
 a.time(a.get().pairs.deadline);a.call('pairs/teacher',undefined,a.get().teacherKey);
 assert.equal(a.get().pairs.history[0].results.length,1);
 const backup=a.call('pairs/export?type=recovery',undefined,a.get().teacherKey).body;
 a.call('pairs/admin/restore',{backup},a.get().teacherKey);
 assert.equal(a.get().pairs.participantCount,2);
 a.admin('reset',{confirm:a.get().pairs.code});assert.equal(a.get().pairs.participantCount,undefined);
});
test('Simulated simultaneous registration retries preserve distinct seats and only one midnight archive',async()=>{
 let state={teacherKey:pairSecret()},version=0,archives=[];const now=start;
 async function join(name){for(let attempt=0;attempt<40;attempt++){
  const expected=version,r=handleClassroom(state,{url:'/api/pairs/join',method:'POST',body:{name},headers:{}},{now});
  await new Promise(resolve=>setTimeout(resolve,attempt%3));
  if(expected!==version)continue;
  if(r.changed){state=r.state;version++;if(r.archive)archives.push(r.archive);}
  return r;
 }throw Error('No successful commit');}
 const results=await Promise.all(Array.from({length:15},(_,i)=>join('Guest '+i)));
 assert.ok(results.every(r=>r.status===200));assert.equal(state.pairs.players.length,15);assert.equal(archives.length,1);
 const same=await Promise.all([join('Same Name'),join('same name')]);assert.deepEqual(same.map(r=>r.status).sort(),[200,409]);
 assert.equal(state.pairs.players.filter(p=>p.name.toLowerCase()==='same name').length,1);
});
test('Saved results preserve scores but never include access credentials; CSV names cannot be formulas',()=>{
 const report=savedDayReport({saved_at:'2026-10-16',game:{classDay:'2026-10-15',teacherKey:'SECRET',pairs:{players:[{id:0,name:'=SUM(A1)',token:'SEAT',pin:'123456'},{id:1,name:'B'}],history:[{round:1,results:[{a:0,b:1,choiceA:'take',choiceB:'contribute',scoreA:6,scoreB:0}]}]},zones:{tournament:{rows:[{name:'B',total:5,wins:1,ties:0,losses:0}]}},frontier:null}});
 assert.doesNotMatch(JSON.stringify(report),/SECRET|SEAT|123456/);assert.equal(report.contributeTake.history[0].results[0].scoreA,6);
 const csv=savedDaysCsv([report]);assert.match(csv,/'=SUM\(A1\)/);assert.match(csv,/Economic Zones/);
});
