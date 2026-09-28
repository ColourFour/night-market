import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateAllocation,scoreMatch,tournament,bestResponse,handleZones} from '../docs/zones-core.js';
import {zonesView,zonesLocal,zonesPayload,updateZonesTotals} from '../docs/zones-ui.js';
const profiles=Array.from({length:13},(_,i)=>{const a=[0,0,0,0,0];for(let u=0;u<100;u++)a[(u*(i%4+1)+Math.floor(u/7)+i)%5]++;return a;});
const oracle=(a,b)=>a.reduce((s,x,i)=>s+(x>b[i]?i+1:x===b[i]?(i+1)/2:0),0);
test('Zones validation, exact tie splits and independent 13-player round robin audit',()=>{
 for(const a of [[20,20,20,20,19],[-1,1,0,0,100],[.5,19.5,20,20,40],['20',20,20,20,20],[],[0,0,0,0,101]])assert.throws(()=>validateAllocation(a));
 assert.deepEqual(validateAllocation([0,0,0,0,100]),[0,0,0,0,100]);
 assert.equal(scoreMatch([20,20,20,20,20],[20,20,20,20,20]).scoreA,7.5);
 const t=tournament(profiles.map((allocation,id)=>({id,name:'Student '+id,allocation})));
 assert.equal(t.matchCount,78);assert.equal(t.totalPoints,1170);assert.equal(new Set(t.matches.map(m=>m.a+':'+m.b)).size,78);
 t.matches.forEach(m=>{assert.equal(m.scoreA+m.scoreB,15);assert.equal(m.scoreA,oracle(profiles[m.a],profiles[m.b]));});
 t.rows.forEach(r=>{assert.equal(r.played,12);assert.equal(r.wins+r.ties+r.losses,12);assert.equal(r.total,profiles.reduce((sum,b,j)=>sum+(j===r.id?0:oracle(profiles[r.id],b)),0));assert.equal(r.average,r.total/12);});
 const ties=tournament([0,1,2].map(id=>({id,name:''+id,allocation:[20,20,20,20,20]})));assert.ok(ties.rows.every(r=>r.rank===1&&r.ties===2));
});
test('Exact best response agrees with brute-force enumeration, including half points',()=>{
 const field=[[0,1,2,1,2],[3,0,0,1,2],[1,1,1,2,1]],budget=6;
 let max=-1;function enumerate(a,left){if(a.length===4){const x=[...a,left];max=Math.max(max,field.reduce((s,b)=>s+oracle(x,b),0));return;}for(let k=0;k<=left;k++)enumerate([...a,k],left-k);}enumerate([],budget);
 const r=bestResponse(field,budget);assert.equal(r.total,max);assert.equal(r.allocation.reduce((a,b)=>a+b),6);assert.equal(r.total,field.reduce((s,b)=>s+oracle(r.allocation,b),0));
});
function app(){let state={teacherKey:'teacher',room:{old:'preserved'},pairs:{players:profiles.map((_,id)=>({id,name:'Student '+id,token:'student-'+id})),history:[{round:1}]}};
 const call=(path,body,token='teacher',status=200)=>{const r=handleZones(state,{url:'/api/zones/'+path,method:body===undefined?'GET':'POST',body,headers:{authorization:'Bearer '+token}});assert.equal(r.status,status,JSON.stringify(r.body));if(r.changed)state=r.state;return r;};
 return {call,get:()=>structuredClone(state),admin:(action,b={},status=200)=>call('admin/'+action,{id:state.zones?.id,...b},'teacher',status),submit:(i,a=profiles[i],status=200)=>call('submit',{id:state.zones.id,allocation:a,reflection:{why:'My private reasoning'},prediction:[20,20,20,20,20]},'student-'+i,status)};
}
test('13 students: hidden allocations, lock/reveal/tournament, homework privacy, exports, revisions and isolated reset',()=>{
 const a=app();a.call('teacher',undefined,'student-0',401);a.call('state',undefined,'wrong',401);assert.equal(a.call('state',undefined,'student-0').body.empty,true);
 a.admin('open');const before=a.get();a.admin('lock',{},400);a.submit(0);a.admin('lock',{},400);for(let i=1;i<13;i++)a.submit(i);
 assert.equal(a.call('teacher').body.submitted,13);assert.ok(a.call('teacher').body.seats.every(x=>x.sum===100));
 for(const token of ['teacher',...profiles.map((_,i)=>'student-'+i)]){const v=a.call(token==='teacher'?'teacher':'state',undefined,token).body;assert.equal(v.analysis,undefined);assert.equal(v.tournament,undefined);assert.equal(v.written,undefined);assert.doesNotMatch(JSON.stringify(v),/teacherKey|student-\d/);}
 a.call('export',undefined,'teacher',409);a.call('export',undefined,'student-0',401);a.admin('run',{},409);a.admin('lock');a.submit(0,profiles[0],409);a.admin('reveal');
 const revealed=a.call('state',undefined,'student-0').body;assert.equal(revealed.analysis.entries.length,13);assert.equal(revealed.analysis.totals.reduce((a,b)=>a+b),1300);assert.equal(revealed.written,undefined);
 a.admin('run');const t=a.call('teacher').body;assert.equal(t.tournament.matchCount,78);assert.match(zonesView(t,'teacher'),/1170 points/);assert.match(zonesView(revealed,'student'),/Holiday homework/);
 const answers=Object.fromEntries(['overvalued','easier','core','strongest'].map(k=>[k,'Evidence from two matchups supports my explanation of this strategy.']));
 a.call('homework',{id:t.id,answers},'student-0');assert.equal(a.call('state',undefined,'student-1').body.me.homework,null);assert.ok(a.call('teacher').body.written[0].homework);
 assert.equal(a.call('export?type=csv').body.split('\r\n').length,14);assert.equal(a.call('export').body.tournament.matchCount,78);
 const epoch=a.get().zones.id;a.admin('reopen');assert.notEqual(a.get().zones.id,epoch);assert.equal(a.get().zones.tournament,null);assert.deepEqual(a.get().zones.homework,{});assert.equal(Object.keys(a.get().zones.submissions).length,13);a.call('submit',{id:epoch,allocation:profiles[0]},'student-0',409);
 a.admin('lock');a.admin('reveal');a.admin('run');a.admin('reset',{confirm:'no'},400);const reset=a.admin('reset',{confirm:'RESET'});assert.ok(reset.archive.zones.tournament);assert.equal(Object.keys(a.get().zones.submissions).length,0);assert.deepEqual(a.get().pairs,before.pairs);assert.deepEqual(a.get().room,before.room);
});
test('Absent students are excluded; two entrants can finish; old seat tokens and roster changes rejected',()=>{
 const a=app();a.admin('open');a.submit(0);a.submit(3);a.admin('lock');a.admin('reveal');a.admin('run');assert.equal(a.call('teacher').body.tournament.matchCount,1);
 const state=a.get();state.pairs.players[0].token='replacement';const request={url:'/api/zones/state',method:'GET',headers:{authorization:'Bearer student-0'}};assert.equal(handleZones(state,request).status,401);
 state.pairs.players[0].token='student-0';state.pairs.players[0].name='Different student';assert.equal(handleZones(state,request).status,409);
});
test('Student form budget and payload, saved confirmation and analysis controls',()=>{
 const values=[20,20,20,20,20],button={},total={},remaining={};const doc={querySelector:s=>s==='#zones-allocation'?{elements:{namedItem:name=>({value:String(values[Number(name.slice(-1))])})}}:s==='#zones-save'?button:s==='#zones-total'?total:remaining};
 updateZonesTotals(doc);assert.equal(button.disabled,false);values[0]=19;updateZonesTotals(doc);assert.equal(button.disabled,true);values[0]=20.5;updateZonesTotals(doc);assert.equal(button.disabled,true);
 const b=Object.fromEntries(profiles[0].map((v,i)=>['allocation'+i,''+v]));const p=zonesPayload('zones-allocation',b);assert.deepEqual(p.body.allocation,profiles[0]);assert.equal(p.body.prediction,null);
 const a=app();a.admin('open');a.submit(0);a.submit(1);assert.match(zonesView(a.call('state',undefined,'student-0').body,'student'),/Allocation saved/);a.admin('lock');assert.doesNotMatch(zonesView(a.call('state',undefined,'student-0').body,'student'),/Where did/);a.admin('reveal');a.admin('run');const s=a.call('teacher').body;zonesLocal('zone-inspect',{id:0},s);zonesLocal('zone-match',{match:'0:1'},s);zonesLocal('zone-best',{},s);const html=zonesView(s,'teacher');assert.match(html,/Match score/);assert.match(html,/hypothetical result/);assert.match(html,/Economic-Zones-Holiday-Homework.pdf/);
});
