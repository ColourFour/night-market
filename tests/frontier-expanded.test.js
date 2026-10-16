import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newFrontier,handleFrontier,resolveFrontier,checkedPlan,adjacent} from '../docs/frontier-core.js';
import {hexDistance} from '../docs/frontier-geography.js';
import {victoryProgress,checkVictory,TECHNOLOGIES} from '../docs/frontier-strategy.js';
import {frontierView} from '../docs/frontier-ui.js';
const roster=n=>Array.from({length:n},(_,id)=>({id,name:'Founder '+id,token:'seat-'+id}));
function client(n=15){let state={teacherKey:'teacher',pairs:{players:roster(n)},frontier:newFrontier(roster(n))},now=1000;return {get state(){return state;},get g(){return state.frontier;},get now(){return now;},set now(v){now=v;},call(path,body,who=0){const g=state.frontier,r=handleFrontier(state,{method:body===undefined?'GET':'POST',url:'/api/frontier/'+path,headers:{authorization:'Bearer '+(who==='teacher'?'teacher':'seat-'+who)},body:body===undefined?undefined:{id:g.id,roundId:g.roundId,...body}},{now});if(r.changed)state=r.state;return r;}};}
test('Compact 15-city worlds start with five regions each, two-step visibility and immediate neighbour contact',()=>{
 for(const n of [1,5,13,15]){const c=client(n),g=c.g;assert.equal(g.players.length,15);assert.equal(g.players.filter(p=>p.bot).length,15-n);assert.equal(g.tiles.length,105);assert.equal(new Set(g.tiles.map(t=>`${t.q},${t.r}`)).size,105);
 const reached=new Set([0]),queue=[g.tiles[0]];for(const a of queue)for(const b of g.tiles)if(!reached.has(b.id)&&adjacent(a.id,b.id,g)){reached.add(b.id);queue.push(b);}assert.equal(reached.size,105);
 for(const p of g.players){const own=g.tiles.filter(t=>t.owner===p.id),home=own.find(t=>t.capital);assert.equal(own.length,5);assert.ok(own.every(t=>hexDistance(t,home)<=1));assert.ok(g.tiles.some(t=>t.owner!==null&&t.owner!==p.id&&own.some(o=>adjacent(o.id,t.id,g))));const visible=g.tiles.filter(t=>own.some(o=>hexDistance(t,o)<=2)).map(t=>t.id).sort((a,b)=>a-b);assert.deepEqual(p.explored,visible);}
 const v=c.call('state').body;assert.ok(v.tiles.length<105);assert.equal(v.players[0].explored,undefined);assert.equal(v.victoryTargets,undefined);assert.ok(v.victory.rows.every(p=>p.routes.every(r=>r.target===undefined&&r.ratio===undefined)));assert.equal(c.call('teacher',undefined,'teacher').body.tiles.length,105);
 const html=frontierView(c.call('teacher',undefined,'teacher').body,'teacher');assert.match(html,/<title>Founder 0 · Home — Founder 0/);
 }
});
test('Three-action plans revise atomically, reserve cumulative costs and enforce source ownership and research prerequisites',()=>{
 const c=client();c.call('admin/start',{},'teacher');const good={actions:[{action:'develop',tile:0},{action:'recruit',tile:1,units:2},{action:'move',from:2,to:0,units:1}],ally:1};
 assert.equal(c.call('order',good).status,200);assert.equal(c.call('state').body.me.order.actions.length,3);
 const saved=structuredClone(c.g.orders[0]);for(const bad of [
 {actions:[{action:'develop',tile:0},{action:'recruit',tile:0,units:2}]},
 {actions:[{action:'research',tech:'irrigation'},{action:'develop',tile:0}]},
 {actions:[{action:'research',tech:'engineering'}]},
 {actions:[{action:'hold'},{action:'hold'},{action:'hold'},{action:'hold'}]},
 {actions:[{action:'move',from:0,to:100,units:2}]},
 {actions:[{action:'recruit',tile:5,units:2}]},
 {actions:[{action:'recruit',tile:1,units:1.5}]}
 ]){assert.equal(c.call('order',bad).status,400);assert.deepEqual(c.g.orders[0],saved);}
 assert.equal(c.call('order',{actions:[{action:'recruit',tile:0,units:3}],ally:null}).status,200);assert.equal(c.call('state',undefined,1).body.me.order,null);assert.equal(c.call('teacher',undefined,'teacher').body.orders,undefined);
 c.call('admin/resolve',{},'teacher');const h=c.g.history[0];assert.equal(h.orders[0].actions.length,1);assert.equal(c.g.players[0].stats.recruited,3);assert.equal(c.g.tiles[0].troops,9);assert.equal(c.g.tiles[0].level,0);assert.equal(c.call('state').body.history[0].beforeTiles,undefined);
});
test('No human plan gets one weak caretaker action; saved empty plan really holds; bots accept mutual offers',()=>{
 const c=client(2);c.call('admin/start',{},'teacher');const bot=c.g.players.find(p=>p.bot);c.call('order',{actions:[],ally:bot.id});c.call('admin/resolve',{},'teacher');assert.equal(c.g.history[0].orders[1].caretaker,true);assert.equal(c.g.history[0].orders[bot.id].bot,true);assert.deepEqual(c.g.history[0].orders[0].actions,[]);assert.equal(c.g.players[0].ally,bot.id);assert.equal(c.g.players.find(p=>p.id===bot.id).ally,0);assert.equal(c.g.players[0].stats.allianceRounds,1);
});
test('Timer declines 180/150/120/90/60 and stays there; exact thresholds reveal only after five completed rounds',()=>{
 const c=client(3);c.call('admin/start',{},'teacher');for(let round=1;round<=7;round++){assert.equal((c.g.deadline-c.now)/1000,Math.max(60,180-(round-1)*30));assert.equal(c.call('state').body.victory.revealed,round>5);c.now=c.g.deadline;c.call('state');assert.equal(c.g.history.length,round);assert.equal(c.call('state').body.victory.revealed,round>=5);assert.equal(c.g.status,'revealed');c.now=c.g.nextRoundAt;c.call('state');}
});
test('Technologies have real costs and effects; research cannot fund actions before it is learned',()=>{
 const c=client(2);c.call('admin/start',{},'teacher');c.call('order',{actions:[{action:'research',tech:'irrigation'}],ally:null});c.call('admin/resolve',{},'teacher');const p=c.g.players[0];assert.deepEqual(p.tech,['irrigation']);assert.equal(p.resources.gold,7);assert.equal(p.resources.ore,11);assert.equal(p.resources.food,16);assert.equal(c.g.history[0].harvest[0].gain.food,12);
 const g=c.g;g.players[0].tech=['workshops','engineering','irrigation','logistics'];g.players[0].resources={food:99,ore:99,gold:99};g.status='open';g.round=3;g.orders={0:checkedPlan(g,0,{actions:[{action:'develop',tile:0},{action:'research',tech:'markets'}],ally:null})};resolveFrontier(g);assert.equal(g.tiles[0].level,1);assert.ok(g.players[0].tech.includes('markets'));assert.equal(g.history.at(-1).harvest[0].upkeep,3);assert.equal(g.history.at(-1).orders[0].actions[0].cost.gold,2);
});
test('Multiple armies from the same player combine at a destination, and order arrival cannot change combat',()=>{
 const g=newFrontier(roster(15));g.round=3;g.status='open';const target=g.tiles[0];target.owner=1;target.troops=3;for(const id of [1,2])g.tiles[id].troops=4;
 g.orders={...Object.fromEntries(g.players.map(p=>[p.id,{action:'hold',ally:null}])),0:checkedPlan(g,0,{actions:[{action:'move',from:1,to:0,units:2},{action:'move',from:2,to:0,units:2}],ally:null})};const reversed=structuredClone(g);reversed.orders[0].actions.reverse();resolveFrontier(g);resolveFrontier(reversed);assert.equal(g.tiles[0].owner,0);assert.equal(g.tiles[0].troops,1);assert.deepEqual(g.tiles,reversed.tiles);assert.equal(g.players[0].stats.captures,1);
});
test('All five victory routes are reachable, shared wins are recognised, bots cannot win and targets do not move',()=>{
 for(const route of ['wealth','production','conquest','diplomacy','army']){const g=newFrontier(roster(2)),p=g.players[0];g.round=6;const target=g.victoryTargets[route];if(route==='wealth')p.resources.gold=target;if(route==='production')p.stats.production=target;if(route==='conquest'){g.tiles.slice(0,target).forEach(t=>t.owner=0);p.stats.captures=4;}if(route==='diplomacy'){p.stats.allianceRounds=target;p.stats.trades=4;}if(route==='army'){g.tiles[0].troops=target;p.stats.recruited=20;}assert.equal(checkVictory(g),true,route);assert.ok(g.winners[0].routes.includes(route));}
 const g=newFrontier(roster(2));g.round=5;g.players[0].resources.gold=99;assert.equal(checkVictory(g),false);g.round=6;g.players[1].resources.gold=99;g.players[2].resources.gold=99;assert.equal(checkVictory(g),true);assert.deepEqual(g.winners.map(p=>p.id),[0,1]);
});
test('Full 15-client game ends on a threshold with complete action report, replay maps, CSV and reset isolation',()=>{
 const c=client(15),targets={...c.g.victoryTargets};c.state.zones={preserve:true};c.call('admin/start',{},'teacher');
 for(let round=1;round<=30&&c.g.status!=='complete';round++){
  for(let id=0;id<15;id++)assert.equal(c.call('order',{actions:[],ally:null},id).status,200);
  c.now=c.g.deadline;c.call('state');assert.equal(c.g.history.length,round);const again=c.call('state');assert.equal(again.body.history.length,round);assert.deepEqual(c.g.victoryTargets,targets);
  if(c.g.status!=='complete'){c.now=c.g.nextRoundAt;c.call('state');}
 }
 assert.equal(c.g.status,'complete');assert.ok(c.g.round>=6&&c.g.round<30);assert.equal(c.g.winners.length,15);assert.equal(c.g.nextRoundAt,null);const report=c.call('export',undefined,'teacher').body;assert.equal(report.history.length,c.g.round);assert.ok(report.history.every(h=>Object.keys(h.orders).length===15&&h.beforeTiles.length===105&&h.afterTiles.length===105));assert.equal(report.orders,undefined);assert.match(c.call('export?type=roundsCsv',undefined,'teacher').body,/student.*control.*action/);const html=frontierView(c.call('teacher',undefined,'teacher').body,'teacher');assert.match(html,/Final game report/);assert.match(html,/Save report as PDF/);assert.equal(c.call('admin/reset',{confirm:'RESET'},'teacher').status,200);assert.deepEqual(c.state.zones,{preserve:true});
});
