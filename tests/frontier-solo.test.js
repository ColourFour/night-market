import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSolo,soloView,saveSoloPlan,playSoloRound,nextSoloRound,finishSolo,soloExport,saveSolo,loadSolo,SOLO_KEY} from '../docs/frontier-solo-core.js';
import {robotPlan} from '../docs/frontier-bots.js';
import {checkedPlan,actionLimit,adjacent} from '../docs/frontier-core.js';
import {frontierView} from '../docs/frontier-ui.js?v=solo1';
const hold={actions:[],ally:null};
test('Solo creates one human and fourteen equal-resource robots; mixed levels are visible and class data is not required',()=>{
 const s=createSolo('Founder','mixed'),g=s.frontier;
 assert.equal(g.round,1);assert.equal(g.status,'open');assert.equal(g.players.filter(p=>p.bot).length,14);
 assert.deepEqual(['easy','standard','strategic'].map(level=>g.players.filter(p=>p.botLevel===level).length),[5,5,4]);
 for(const p of g.players){assert.deepEqual(p.resources,{food:12,ore:12,gold:12});assert.equal(g.tiles.filter(t=>t.owner===p.id).length,5);}
 const v=soloView(s);assert.ok(v.fog);assert.ok(v.tiles.length<105);assert.equal(v.orders,undefined);assert.equal(v.victoryTargets,undefined);
 const html=frontierView(v,'student');assert.match(html,/No timer/);assert.match(html,/Save & resolve round/);assert.doesNotMatch(html,/Saved on the server|At zero|Automatic at zero|Bots cannot win|weak caretaker/);
 assert.throws(()=>createSolo('','mixed'));assert.throws(()=>createSolo('Founder','unknown'));
});
test('Robots vary capability but obey budgets, source use, action caps and visible-map boundaries; pending orders cannot influence them',()=>{
 const s=createSolo('Founder','mixed'),g=s.frontier;
 for(const round of [1,4,5,8]){
  g.round=round;
  for(const p of g.players.filter(p=>p.bot)){
   p.resources={food:40,ore:40,gold:40};
   const plan=robotPlan(g,p.id);assert.deepEqual(checkedPlan(g,p.id,plan).actions,plan.actions);
   assert.ok(plan.actions.length<=actionLimit(g));if(p.botLevel==='easy')assert.ok(plan.actions.length<=1);
   for(const o of plan.actions)if(o.action==='move'){assert.ok(p.explored.includes(o.to));assert.ok(adjacent(o.from,o.to,g));}
   const altered=structuredClone(g);altered.orders={0:{actions:[{action:'move',from:0,to:5,units:999}],ally:p.id},1:{actions:[{action:'hold'}],ally:0}};
   assert.deepEqual(robotPlan(altered,p.id),plan);
  }
 }
 const rich=createSolo('Founder','strategic').frontier;rich.players.forEach(p=>p.resources={food:40,ore:40,gold:40});
 assert.ok(rich.players.filter(p=>p.bot).some(p=>robotPlan(rich,p.id).actions.some(o=>o.action==='research')));
 const average=createSolo('Founder','standard').frontier;assert.ok(robotPlan(average,1).actions.length>1);
 const unseen=structuredClone(rich);unseen.victoryTargets={wealth:2,army:2};assert.deepEqual(robotPlan(unseen,1),robotPlan(rich,1),'Exact unrevealed targets cannot guide early bot decisions');
});
test('Each difficulty completes a full game with legal plans and round reports, and robots can win',()=>{
 for(const level of ['easy','standard','strategic','mixed']){
  let s=createSolo('Founder',level);
  for(let round=1;round<=25&&s.frontier.status!=='complete';round++){
   const before=structuredClone(s.frontier);s=playSoloRound(s,hold);const g=s.frontier,h=g.history.at(-1);
   assert.equal(h.round,round);assert.deepEqual(h.orders[0].actions,[]);
   for(const p of before.players.filter(p=>!p.eliminated))assert.doesNotThrow(()=>checkedPlan(before,p.id,h.orders[p.id]));
   for(const p of g.players)for(const v of Object.values(p.resources))assert.ok(v>=0&&v<=99);
   assert.ok(g.tiles.every(t=>Number.isInteger(t.troops)&&t.troops>=0));
   const view=soloView(s);assert.equal(view.status,g.status);assert.equal(view.victory.revealed,round>=5||g.status==='complete');
   if(g.status!=='complete'){assert.equal(g.nextRoundAt,null);assert.equal(g.held,true);s=nextSoloRound(s);}
  }
  assert.equal(s.frontier.status,'complete',level);assert.ok(s.frontier.winners.some(p=>p.id!==0),level);
  const exported=soloExport(s);assert.equal(exported.history.length,s.frontier.round);assert.equal(exported.orders,undefined);assert.doesNotMatch(JSON.stringify(exported),new RegExp(s.teacherKey));assert.match(soloExport(s,'roundsCsv'),/student.*control.*action/);
  assert.match(frontierView(soloView(s),'student'),/Final game report/);
 }
});
test('Save/resume is untimed, compact and isolated; invalid revisions preserve saved plans; blocked/full storage stays playable',()=>{
 const data=new Map([['pairs-student','CLASS-TOKEN'],['class-game','KEEP']]);const storage={setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k)};
 let s=createSolo('Founder','easy');s=saveSoloPlan(s,{actions:[{action:'develop',tile:0}],ally:1});const before=JSON.stringify(s);
 assert.throws(()=>saveSoloPlan(s,{actions:[{action:'recruit',tile:0,units:999}],ally:1}));assert.equal(JSON.stringify(s),before);
 assert.equal(saveSolo(storage,s),true);let recovered=loadSolo(storage);assert.deepEqual(soloView(recovered).me.order,soloView(s).me.order);
 const clock=Date.now;try{Date.now=()=>s.clock+864000000;assert.equal(soloView(recovered).status,'open');assert.equal(soloView(recovered).round,1);}finally{Date.now=clock;}
 s=playSoloRound(recovered,soloView(recovered).me.order);assert.equal(s.frontier.players[0].ally,1);assert.equal(saveSolo(storage,s),true);recovered=loadSolo(storage);
 assert.equal(recovered.frontier.history[0].beforeTiles,undefined);assert.equal(recovered.frontier.history[0].orders[0].actions.length,1);
 assert.equal(soloView(recovered).status,'revealed');s=nextSoloRound(recovered);assert.equal(s.frontier.round,2);
 assert.equal(data.get('pairs-student'),'CLASS-TOKEN');assert.equal(data.get('class-game'),'KEEP');
 assert.equal(saveSolo({setItem(){throw Error('full');}},s),false);assert.equal(loadSolo({getItem(){throw Error('blocked');}}),null);
 assert.equal(playSoloRound(s,hold).frontier.history.length,2);data.set(SOLO_KEY,'broken');assert.equal(loadSolo(storage),null);
 const ended=finishSolo(s);assert.equal(ended.frontier.status,'complete');assert.equal(ended.frontier.history.length,1);assert.deepEqual(ended.frontier.orders,{});
});
