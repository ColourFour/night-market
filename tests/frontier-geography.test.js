import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newFrontier,handleFrontier,adjacent,resolveFrontier} from '../docs/frontier-core.js';
import {hexDistance,tilePosition} from '../docs/frontier-geography.js';
import {renderHexMap,mapControl} from '../docs/frontier-map-ui.js';
const roster=n=>Array.from({length:n},(_,id)=>({id,name:'Founder '+id,token:'seat-'+id}));
function client(n=13){let state={teacherKey:'teacher',pairs:{players:roster(n)},frontier:newFrontier(roster(n))};let now=1000;return {get state(){return state;},set now(v){now=v;},call(path,body,who=0){const g=state.frontier,r=handleFrontier(state,{method:body?'POST':'GET',url:'/api/frontier/'+path,headers:{authorization:'Bearer '+(who==='teacher'?'teacher':'seat-'+who)},body:body?{id:g.id,roundId:g.roundId,...body}:undefined},{now});if(r.changed)state=r.state;return r;}};}
test('2–15 players get connected hex land, distinct interior homes and one-edge movement',()=>{
 for(let n=2;n<=15;n++){
  const g=newFrontier(roster(n));assert.equal(g.mapVersion,2);assert.equal(new Set(g.tiles.map(t=>`${t.q},${t.r}`)).size,g.tiles.length);
  const seen=new Set([0]),queue=[g.tiles[0]];for(const a of queue)for(const b of g.tiles)if(!seen.has(b.id)&&adjacent(a.id,b.id,g)){seen.add(b.id);queue.push(b);}assert.equal(seen.size,g.tiles.length);
  for(const p of g.players){const h=g.tiles.find(t=>t.capital&&t.owner===p.id);assert.ok(h);assert.equal(g.tiles.filter(t=>adjacent(h.id,t.id,g)).length,6);assert.equal(p.explored.length,7);assert.equal(g.tiles[h.id+1].kind,'food');assert.equal(g.tiles[h.id+2].kind,'ore');assert.ok(adjacent(h.id,h.id+1,g));}
  for(const a of g.tiles)for(const b of g.tiles){assert.equal(adjacent(a.id,b.id,g),hexDistance(a,b)===1);if(adjacent(a.id,b.id,g)){const x=tilePosition(a),y=tilePosition(b);assert.ok(Math.abs(Math.hypot(x.x-y.x,x.y-y.y)-54*Math.sqrt(3))<.001);}}
 }
});
test('Exploration is server-owned, hidden geography is omitted, and captured land reveals new neighbours on reconnect',()=>{
 const c=client(),all=c.state.frontier.tiles.length;
 const before=c.call('state').body;assert.equal(before.tiles.length,7);assert.equal(before.fog,true);assert.equal(before.players[1].explored,undefined);assert.equal(c.call('teacher',undefined,'teacher').body.tiles.length,all);
 c.call('admin/start',{},'teacher');
 const far=c.state.frontier.tiles.find(t=>t.id!==0&&!adjacent(0,t.id,c.state.frontier));assert.equal(c.call('order',{action:'move',from:0,to:far.id,units:2}).status,400);
 assert.equal(c.call('order',{action:'move',from:0,to:1,units:3,explored:[far.id]}).status,200);assert.equal(c.call('state').body.tiles.length,7);
 c.now=c.state.frontier.deadline;c.call('state');
 const after=c.call('state').body;assert.ok(after.tiles.length>7);assert.ok(after.tiles.length<all);assert.equal(after.tiles.find(t=>t.id===1).owner,0);assert.deepEqual(c.call('state').body.tiles,after.tiles);
 assert.equal(c.call('export',undefined,0).status,401);
 c.call('admin/end',{},'teacher');assert.equal(c.call('state').body.tiles.length,all);
});
test('New map zoom controls preserve hidden land and show only real one-edge neighbours',()=>{
 const c=client(3),v=c.call('state').body,html=renderHexMap(v,0,{action:'hold'}),hidden=c.state.frontier.tiles.find(t=>!v.tiles.some(k=>k.id===t.id));
 assert.match(html,/Mist = unexplored/);assert.match(html,/7 regions discovered/);assert.match(html,/Move \/ Attack crosses one shared edge/);assert.doesNotMatch(html,new RegExp('data-tile="'+hidden.id+'"'));
 assert.equal(mapControl('frontier-map-out'),true);const zoomed=renderHexMap(v,0,{});assert.notEqual(html.match(/viewBox="([^"]+)"/)[1],zoomed.match(/viewBox="([^"]+)"/)[1]);assert.doesNotMatch(zoomed,new RegExp('data-tile="'+hidden.id+'"'));assert.ok(mapControl('frontier-map-home'));
});
test('Existing saved ring worlds keep their legal routes and pending orders',()=>{
 const g=newFrontier(roster(3),{layout:'training'});delete g.mapVersion;g.status='open';g.round=3;g.orders={0:{action:'move',from:0,to:1,units:2,ally:null}};
 assert.ok(adjacent(1,7,g));assert.equal(adjacent(0,3,g),false);resolveFrontier(g);assert.equal(g.tiles[1].owner,0);assert.equal(g.tiles.length,9);assert.equal(g.players[0].explored,undefined);
});
