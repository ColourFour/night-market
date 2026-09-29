import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ZONES,validateAllocation,scoreMatch,tournament,bestResponse,handleZones,drawMarket,robotAllocation} from '../docs/zones-core.js';
import {zonesView,zonesLocal,zonesPayload,updateZonesTotals,clearZones} from '../docs/zones-ui.js';
const profiles=Array.from({length:13},(_,i)=>{const a=[0,0,0,0,0];for(let u=0;u<100;u++)a[(u*(i%4+1)+Math.floor(u/7)+i)%5]++;return a;});
const means=ZONES.map(z=>z.value);
const oracle=(a,b,w=means)=>a.reduce((s,x,i)=>s+(x>b[i]?w[i]:x===b[i]?w[i]/2:0),0);
function random(seed=42){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return(seed+.5)/4294967296;};}
test('Allocation validation; 78 matches; means, ties, actual returns and negative returns accounted for',()=>{
 for(const a of [[20,20,20,20,19],[-1,1,0,0,100],[.5,19.5,20,20,40],['20',20,20,20,20],[],[0,0,0,0,101]])assert.throws(()=>validateAllocation(a));
 assert.equal(scoreMatch(profiles[0],profiles[0]).scoreA,44.5);
 const values=[4.32,9.8,17.06,21.5,-2.2],t=tournament(profiles.map((allocation,id)=>({id,name:'Student '+id,allocation})),values);
 assert.equal(t.matchCount,78);assert.equal(new Set(t.matches.map(m=>m.a+':'+m.b)).size,78);
 t.matches.forEach(m=>{assert.ok(Math.abs(m.scoreA+m.scoreB-values.reduce((a,b)=>a+b))<1e-9);assert.ok(Math.abs(m.scoreA-oracle(profiles[m.a],profiles[m.b],values))<1e-9);});
 t.rows.forEach(r=>{assert.equal(r.played,12);assert.equal(r.wins+r.ties+r.losses,12);assert.ok(Math.abs(r.total-profiles.reduce((sum,b,j)=>sum+(j===r.id?0:oracle(profiles[r.id],b,values)),0))<1e-8);});
 const loss=scoreMatch([0,0,0,0,100],[25,25,25,25,0],[5,10,16,24,-6]);assert.equal(loss.scoreA,-6);assert.equal(loss.zones[4].winner,'A');
});
test('Normal sampling has specified means and variances, retains tails and divides ties into cents',()=>{
 const rng=random(),count=30000,sum=Array(5).fill(0),sq=Array(5).fill(0);let negative=false;
 for(let j=0;j<count;j++)drawMarket(rng).forEach((x,i)=>{sum[i]+=x;sq[i]+=x*x;if(x<0)negative=true;assert.ok(Math.abs(x*50-Math.round(x*50))<1e-9);});
 ZONES.forEach((z,i)=>{const mean=sum[i]/count,sd=Math.sqrt(sq[i]/count-mean*mean);assert.ok(Math.abs(mean-z.value)<z.sd*.035);assert.ok(Math.abs(sd-z.sd)<z.sd*.035);});assert.equal(negative,true);
});
test('Robot allocates exactly 100 independently, varies strategies and has exploitable weaknesses',()=>{
 const rng=random(),seen=new Set();for(let i=0;i<100;i++){const bot=robotAllocation(rng);validateAllocation(bot);seen.add(bot.join());const best=bestResponse([bot]);assert.ok(best.total>44.5);}assert.ok(seen.size>80);
});
test('Expected best response agrees with brute-force enumeration',()=>{
 const field=[[0,1,2,1,2],[3,0,0,1,2],[1,1,1,2,1]];let max=-1;
 function enumerate(a,left){if(a.length===4){const x=[...a,left];max=Math.max(max,field.reduce((s,b)=>s+oracle(x,b),0));return;}for(let k=0;k<=left;k++)enumerate([...a,k],left-k);}enumerate([],6);
 const r=bestResponse(field,6);assert.equal(r.total,max);assert.equal(r.allocation.reduce((a,b)=>a+b),6);
});
function app(){let state={teacherKey:'teacher',room:{old:'preserved'},pairs:{players:profiles.map((_,id)=>({id,name:'Student '+id,token:'student-'+id})),history:[{round:1}]}};const rng=random();
 const call=(path,body,token='teacher',status=200)=>{const r=handleZones(state,{url:'/api/zones/'+path,method:body===undefined?'GET':'POST',body,headers:{authorization:'Bearer '+token}},{random:rng});assert.equal(r.status,status,JSON.stringify(r.body));if(r.changed)state=r.state;return r;};
 return {call,get:()=>structuredClone(state),admin:(action,b={},status=200)=>call('admin/'+action,{id:state.zones?.id,...b},'teacher',status),play:i=>call('practice',{id:state.zones.id,allocation:profiles[i]},'student-'+i),submit:(i,status=200)=>call('submit',{id:state.zones.id,allocation:profiles[i]},'student-'+i,status)};
}
test('13 students: repeatable practice, teacher unlock, hidden submissions, saved random tournament, export and reset',()=>{
 const a=app();a.call('teacher',undefined,'student-0',401);a.call('state',undefined,'wrong',401);a.admin('open');const before=a.get();assert.equal(before.zones.status,'practice');a.submit(0,409);a.play(0);a.play(0);assert.equal(a.get().zones.practice[0].attempts,2);assert.equal(Object.keys(a.get().zones.submissions).length,0);
 a.admin('unlock');a.submit(1,409);a.submit(0);for(let i=1;i<13;i++){a.play(i);a.submit(i);}const privateView=a.call('teacher').body;assert.equal(privateView.submitted,13);assert.ok(privateView.seats.every(x=>x.sum===100));
 for(const token of ['teacher',...profiles.map((_,i)=>'student-'+i)]){const v=a.call(token==='teacher'?'teacher':'state',undefined,token).body;assert.equal(v.analysis,undefined);assert.equal(v.market,undefined);assert.equal(v.tournament,undefined);assert.doesNotMatch(JSON.stringify(v),/teacherKey|student-\d/);}
 a.call('export',undefined,'teacher',409);a.admin('run',{},409);a.admin('lock');a.submit(0,409);a.call('practice',{id:a.get().zones.id,allocation:profiles[0]},'student-0',409);a.admin('reveal');a.admin('run');const t=a.call('teacher').body;assert.equal(t.tournament.matchCount,78);assert.deepEqual(t.market,t.tournament.values);
 a.admin('run');assert.deepEqual(a.call('teacher').body.tournament,t.tournament);assert.equal(a.call('export?type=csv').body.split('\r\n').length,14);
 const html=zonesView(a.call('state',undefined,'student-0').body,'student');assert.match(html,/Your class earnings/);assert.doesNotMatch(html,/homework|\.pdf|textarea|reasoning|best.response/i);
 const epoch=a.get().zones.id;a.admin('reopen');assert.notEqual(a.get().zones.id,epoch);assert.equal(a.get().zones.market,null);assert.equal(a.get().zones.tournament,null);assert.equal(Object.keys(a.get().zones.submissions).length,13);a.call('submit',{id:epoch,allocation:profiles[0]},'student-0',409);
 a.admin('lock');a.admin('reveal');a.admin('run');assert.notDeepEqual(a.get().zones.market,t.market);a.admin('reset',{confirm:'RESET'});assert.equal(a.get().zones.status,'practice');assert.deepEqual(a.get().zones.practice,{});assert.deepEqual(a.get().pairs,before.pairs);assert.deepEqual(a.get().room,before.room);
});
test('Absences, session recovery and legacy records keep their correct behavior',()=>{
 const a=app();a.admin('open');a.play(0);a.play(3);a.admin('unlock');a.submit(0);a.submit(3);a.admin('lock');a.admin('reveal');a.admin('run');assert.equal(a.call('teacher').body.tournament.matchCount,1);
 const state=a.get();state.pairs.players[0].token='replacement';const req={url:'/api/zones/state',method:'GET',headers:{authorization:'Bearer student-0'}};assert.equal(handleZones(state,req).status,401);
 const legacy=a.get();delete legacy.zones.edition;legacy.zones.tournament=tournament([{id:0,name:'A',allocation:profiles[0]},{id:3,name:'B',allocation:profiles[3]}],[1,2,3,4,5]);const r=handleZones(legacy,{url:'/api/zones/teacher',method:'GET',headers:{authorization:'Bearer teacher'}});assert.equal(r.body.edition,1);assert.equal(r.body.tournament.totalPoints,15);assert.equal(r.changed,false);
 const empty=a.get();empty.zones={...empty.zones,edition:undefined,submissions:{},tournament:null};const upgraded=handleZones(empty,{url:'/api/zones/teacher',method:'GET',headers:{authorization:'Bearer teacher'}});assert.equal(upgraded.body.status,'practice');assert.equal(upgraded.body.edition,2);assert.ok(upgraded.archive);
});
test('Budget controls, focused district panels, practice gating and no student writing sections',()=>{
 const values=[20,20,20,20,20],button={},total={},remaining={};const doc={querySelector:s=>s==='form[data-zone-allocation]'?{elements:{namedItem:name=>({value:String(values[Number(name.slice(-1))])})}}:s==='#zones-save'?button:s==='#zones-total'?total:remaining};
 updateZonesTotals(doc);assert.equal(button.disabled,false);values[0]=19;updateZonesTotals(doc);assert.equal(button.disabled,true);values[0]=20.5;updateZonesTotals(doc);assert.equal(button.disabled,true);
 const a=app();a.admin('open');clearZones();let s=a.call('state',undefined,'student-0').body;let html=zonesView(s,'student');assert.match(html,/Meet the city/);zonesLocal('zone-details',{zone:4},s);html=zonesView(s,'student');assert.match(html,/<dialog/);assert.match(html,/Standard deviation/);assert.match(html,/The people who live here/);assert.match(html,/skyline-core.jpg/);zonesLocal('zone-close',{},s);assert.doesNotMatch(zonesView(s,'student'),/<dialog/);
 a.play(0);a.admin('unlock');s=a.call('state',undefined,'student-0').body;zonesLocal('zone-class',{},s);html=zonesView(s,'student');assert.match(html,/Submit my class allocation/);assert.doesNotMatch(html,/homework|\.pdf|textarea|reasoning/i);
 const b=Object.fromEntries(profiles[0].map((v,i)=>['allocation'+i,''+v]));assert.equal(zonesPayload('zones-practice',b).path,'practice');assert.deepEqual(zonesPayload('zones-allocation',b).body,{allocation:profiles[0]});
});
