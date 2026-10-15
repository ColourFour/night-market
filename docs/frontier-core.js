// Frontier Cities: authoritative simultaneous orders, deterministic combat, no client-side trust.
import {connected,makeHexLand,revealExploration,exploredTiles} from './frontier-geography.js';
import {pairSecret} from './pairs-core.js';
export const RESOURCES=['food','ore','gold'];
export const COLORS=['#f6b75d','#62d7c1','#bc9af8','#f28d9f','#88befb','#d7da75','#ed9d61','#a3c8a5','#c29be0','#70d2e8','#f1bdc8','#98a5f6','#d6bc8e','#9ad7ef','#b8df89'];
const fail=(message,status=400)=>{throw Object.assign(Error(message),{status});};
const integer=(n,min,max,label)=>{if(!Number.isInteger(n)||n<min||n>max)fail(label);return n;};
const active=g=>g.players.filter(p=>!p.eliminated);
export const adjacent=connected;
export function frontierScore(g,p){
 if(p.eliminated)return 0;
 const owned=g.tiles.filter(t=>t.owner===p.id);
 return owned.length*5+owned.reduce((s,t)=>s+t.level*3,0)+Math.floor(RESOURCES.reduce((s,k)=>s+p.resources[k],0)/5);
}
export function frontierStandings(g){
 const rows=g.players.map(p=>({id:p.id,name:p.name,color:p.color,eliminated:p.eliminated,territories:g.tiles.filter(t=>t.owner===p.id).length,score:frontierScore(g,p)})).sort((a,b)=>b.score-a.score||a.id-b.id);
 return rows.map(p=>({...p,rank:1+rows.filter(q=>q.score>p.score).length}));
}
export function newFrontier(roster,settings={}){
 if(!Array.isArray(roster)||roster.length<2||roster.length>15)fail('Select 2–15 students.');
 const seconds=integer(settings.seconds??180,15,180,'Use a timer from 15 to 180 seconds.');
 const rounds=integer(settings.rounds??10,3,30,'Choose 3–30 rounds.');
 const players=roster.map((p,i)=>({id:p.id,name:p.name,color:COLORS[i],resources:{food:12,ore:12,gold:12},ally:null,eliminated:false}));
 const legacy=settings.layout==='training';
 const tiles=legacy?players.flatMap((p,i)=>Array.from({length:3},(_,r)=>({id:i*3+r,sector:i,ring:r,name:r===0?`${p.name} · Home`:r===1?`Outer ${i+1}`:`Inner ${i+1}`,kind:r===0?'capital':RESOURCES[(i+r-1)%3],owner:r===0?p.id:null,troops:r===0?6:1,level:0,capital:r===0}))):makeHexLand(players);
 const g={mapVersion:legacy?1:2,id:pairSecret(),roundId:pairSecret(),status:'waiting',round:0,settings:{seconds,rounds},players,tiles,orders:{},history:[],deadline:null,nextRoundAt:null,held:false,remaining:null};
 revealExploration(g);return g;
}
function checkedOrder(g,id,b){
 const p=g.players.find(p=>p.id===id&&!p.eliminated);if(!p)fail('You are watching this game.');
 const action=b.action;if(!['hold','develop','recruit','move','trade'].includes(action))fail('Choose an order.');
 const ally=b.ally===null||b.ally===undefined||b.ally===''?null:b.ally;
 if(ally!==null&&(!Number.isInteger(ally)||ally===id||!active(g).some(p=>p.id===ally)))fail('Choose an active classmate as your proposed partner.');
 const order={action,ally};
 const owned=tile=>{integer(tile,0,g.tiles.length-1,'Choose a territory.');if(g.tiles[tile].owner!==id)fail('Choose a territory you own.');return g.tiles[tile];};
 const afford=(resource,cost)=>{if(p.resources[resource]<cost)fail(`You need ${cost} ${resource}.`);};
 if(action==='develop'){const t=owned(b.tile);if(t.level>=3)fail('This territory is fully developed.');afford('ore',4);afford('gold',3);order.tile=t.id;}
 if(action==='recruit'){const t=owned(b.tile);integer(b.units,1,6,'Recruit 1–6 units.');afford('food',b.units);afford('ore',b.units);order.tile=t.id;order.units=b.units;}
 if(action==='move'){
  const from=owned(b.from);integer(b.to,0,g.tiles.length-1,'Choose a destination.');const to=g.tiles[b.to];
  if(!adjacent(from.id,to.id,g))fail('Move / Attack only into a region sharing an edge with your territory.');
  integer(b.units,1,from.troops-1,'Leave at least one unit behind.');
  if(to.capital&&to.owner!==id&&g.round<=2)fail('Home territories are protected during rounds 1 and 2.');
  order.from=from.id;order.to=to.id;order.units=b.units;
 }
 if(action==='trade'){if(ally===null)fail('Choose a partner for your trade convoy.');if(!RESOURCES.includes(b.resource))fail('Choose a resource to send.');afford(b.resource,3);order.resource=b.resource;}
 return order;
}
export function resolveFrontier(g,now=Date.now()){
 if(!['open','paused'].includes(g.status))return;
 const orders=Object.fromEntries(active(g).map(p=>[p.id,g.orders[p.id]||{action:'hold',ally:p.ally,automatic:true}]));
 const snapshot=p=>({resources:{...p.resources},territories:g.tiles.filter(t=>t.owner===p.id).map(t=>t.id),units:g.tiles.filter(t=>t.owner===p.id).reduce((n,t)=>n+t.troops,0),score:frontierScore(g,p),ally:p.ally,eliminated:p.eliminated,...(g.mapVersion===2?{discovered:p.explored?.length||0}:{})});
 const beforePlayers=Object.fromEntries(g.players.map(p=>[p.id,snapshot(p)]));
 const events=[],before=g.tiles.map(t=>t.owner),participants=active(g),names=id=>g.players.find(p=>p.id===id)?.name||'Unclaimed';
 const log=(text,type='economy')=>events.push({text,type});
 const attacks=(id,other)=>{const o=orders[id];return o?.action==='move'&&before[o.to]===other;};
 const oldAllies=Object.fromEntries(g.players.map(p=>[p.id,p.ally]));
 for(const p of participants){const o=orders[p.id],q=participants.find(q=>q.id===o.ally);p.ally=q&&orders[q.id]?.ally===p.id&&!attacks(p.id,q.id)&&!attacks(q.id,p.id)?q.id:null;}
 for(const p of participants){
  if(oldAllies[p.id]!==null&&p.ally!==oldAllies[p.id]&&(p.id<oldAllies[p.id]||g.players.find(q=>q.id===oldAllies[p.id])?.ally!==null))log(`${p.name}'s alliance with ${names(oldAllies[p.id])} ended.`, 'diplomacy');
  if(p.ally!==null&&p.id<p.ally&&oldAllies[p.id]!==p.ally)log(`${p.name} and ${names(p.ally)} formed an alliance.`, 'diplomacy');
 }
 // Infrastructure and recruitment finish before every army departs. No request-order advantage.
 for(const p of participants){const o=orders[p.id];
  if(o.automatic)log(`${p.name}: no order received; held position.`, 'hold');
  if(o.action==='develop'){p.resources.ore-=4;p.resources.gold-=3;g.tiles[o.tile].level++;log(`${p.name} developed ${g.tiles[o.tile].name}.`);}
  if(o.action==='recruit'){p.resources.food-=o.units;p.resources.ore-=o.units;g.tiles[o.tile].troops+=o.units;log(`${p.name} recruited ${o.units} units.`);}
 }
 const incoming=new Map();
 for(const p of participants){const o=orders[p.id];if(o.action==='move'){g.tiles[o.from].troops-=o.units;if(!incoming.has(o.to))incoming.set(o.to,[]);incoming.get(o.to).push({id:p.id,units:o.units});}}
 for(const [id,arrivals] of incoming){
  const t=g.tiles[id],friendly=arrivals.filter(a=>a.id===t.owner),hostile=arrivals.filter(a=>a.id!==t.owner);
  t.troops+=friendly.reduce((s,a)=>s+a.units,0);
  if(!hostile.length){log(`${names(t.owner)} reinforced ${t.name}.`);continue;}
  const defence=t.troops+t.level,forces=[{id:t.owner,units:defence},...hostile].sort((a,b)=>b.units-a.units),leader=forces[0],opposition=forces.slice(1).reduce((s,a)=>s+a.units,0);
  if(leader.id!==t.owner&&leader.units>opposition){
   const previous=t.owner;t.owner=leader.id;t.troops=leader.units-opposition;t.level=Math.max(0,t.level-1);
   log(`${names(leader.id)} ${previous===null?'claimed':'captured'} ${t.name} with ${t.troops} surviving units.`, 'battle');
  }else{
   t.troops=Math.max(0,t.troops-hostile.reduce((s,a)=>s+a.units,0));
   log(`${t.name} held. Attacking units were lost; ${t.troops} defenders remain.`, 'battle');
  }
 }
 for(const p of participants)if(!g.tiles.some(t=>t.owner===p.id)){p.eliminated=true;p.ally=null;log(`${p.name} lost their last territory and is now a spectator.`, 'elimination');}
 for(const p of active(g))if(p.ally!==null&&g.players.find(q=>q.id===p.ally)?.eliminated)p.ally=null;
 // Convoys require a reciprocal alliance that survived this round. Failed convoys cost nothing.
 for(const p of participants){const o=orders[p.id];if(o.action!=='trade')continue;const q=g.players.find(q=>q.id===p.ally);
  if(p.eliminated||!q||q.eliminated||q.id!==o.ally){log(`${p.name}'s convoy was cancelled: no surviving mutual alliance.`, 'diplomacy');continue;}
  p.resources[o.resource]-=3;q.resources[o.resource]+=5;p.resources.gold+=2;log(`${p.name} sent 3 ${o.resource}; ${q.name} received 5. ${p.name} earned 2 gold.`, 'diplomacy');
 }
 const harvest=[];
 for(const p of active(g)){
  const gain={food:0,ore:0,gold:0},owned=g.tiles.filter(t=>t.owner===p.id);
  for(const t of owned){if(t.kind==='capital')RESOURCES.forEach(k=>gain[k]+=2+t.level);else gain[t.kind]+=3+2*t.level;}
  if(p.ally!==null)gain.gold+=2;
  RESOURCES.forEach(k=>p.resources[k]+=gain[k]);
  const upkeep=Math.ceil(owned.reduce((s,t)=>s+t.troops,0)/4),shortfall=Math.max(0,upkeep-p.resources.food);p.resources.food=Math.max(0,p.resources.food-upkeep);
  if(shortfall){let losses=shortfall;for(const t of [...owned].sort((a,b)=>b.troops-a.troops||a.id-b.id)){const n=Math.min(losses,t.troops);t.troops-=n;losses-=n;}log(`${p.name} lacked food: ${shortfall-losses} units deserted.`, 'economy');}
  RESOURCES.forEach(k=>p.resources[k]=Math.min(99,p.resources[k]));
  harvest.push({id:p.id,gain,upkeep,shortfall});
 }
 revealExploration(g);
 g.history.push({round:g.round,at:now,orders,events,harvest,standings:frontierStandings(g),outcomes:g.players.map(p=>({id:p.id,before:beforePlayers[p.id],after:snapshot(p)}))});
 g.orders={};g.deadline=null;g.remaining=null;
 g.status=g.round>=g.settings.rounds||active(g).length<=1?'complete':'revealed';g.nextRoundAt=g.status==='revealed'?now+20000:null;g.held=false;
}
function startRound(g,now){g.round++;g.roundId=pairSecret();g.status='open';g.orders={};g.deadline=now+g.settings.seconds*1000;g.nextRoundAt=null;g.held=false;}
export function handleFrontier(input,req,{now=Date.now()}={}){
 let state=structuredClone(input),changed=false,archive=null,checkpoint=null,clockChanged=false;
 const url=new URL(req.url,'https://frontier.invalid'),route=req.method+' '+url.pathname,b=req.body||{},token=(req.headers.authorization||'').replace(/^Bearer /,'');
 const teacher=()=>{if(!token||token!==state.teacherKey)fail('Teacher access required.',401);};
 const student=()=>state.pairs?.players.find(p=>p.token&&p.token===token)||fail('Please choose your name again.',401);
 const game=()=>state.frontier||fail('Your teacher has not opened Frontier Cities yet.',404);
 const guard=g=>{if(b.id!==g.id||b.roundId!==g.roundId)fail('The round changed. Review the map and try again.',409);};
 const response=(body,status=200,type='application/json')=>({body,status,type,state,changed,archive});
 function view(g,p=null,isTeacher=false){
  const out={mapVersion:g.mapVersion||1,id:g.id,roundId:g.roundId,status:g.status,round:g.round,settings:g.settings,deadline:g.deadline,nextRoundAt:g.nextRoundAt,held:g.held,remaining:g.remaining,serverNow:now,players:g.players,tiles:g.tiles,history:g.history,standings:frontierStandings(g),submitted:Object.keys(g.orders).length,expected:active(g).length};
  if(p){const own=g.players.find(q=>q.id===p.id&&q.name===p.name);out.me={id:p.id,name:p.name,participating:!!own,eliminated:own?.eliminated||false,order:own?g.orders[p.id]||null:null};}
  if(g.mapVersion===2&&p&&out.me.participating&&!out.me.eliminated&&g.status!=='complete'){const known=new Set(exploredTiles(g,p.id));out.tiles=g.tiles.filter(t=>known.has(t.id));out.fog=true;}
  // Exploration lists are private; completed actions and standings remain public.
  out.players=g.players.map(({explored,...player})=>player);
  if(isTeacher)out.seats=g.players.map(p=>({id:p.id,name:p.name,eliminated:p.eliminated,submitted:!!g.orders[p.id]}));
  return out;
 }
 try{
  const isTeacher=url.pathname.startsWith('/api/frontier/admin/')||['/api/frontier/teacher','/api/frontier/export'].includes(url.pathname);
  let seat=null;if(isTeacher)teacher();else seat=student();
  const roster=()=>state.pairs?.players.map(p=>({id:p.id,name:p.name,joined:!!p.token}))||[];
  if(route==='GET /api/frontier/teacher'&&!state.frontier)return response({empty:true,roster:roster(),serverNow:now,canAddSeats:!!state.pairs&&state.pairs.stage==='practice'&&!state.pairs.history.length&&state.pairs.players.length<15});
  if(route==='GET /api/frontier/state'&&!state.frontier)return response({empty:true,me:{id:seat.id,name:seat.name},serverNow:now});
  if(route==='POST /api/frontier/admin/addSeats'){
   if(state.frontier||!state.pairs||state.pairs.stage!=='practice'||state.pairs.history.length)fail('Extra names can be added before creating Frontier Cities, while Contribute / Take is at fresh practice.');
   const names=b.names;if(!Array.isArray(names)||!names.length||state.pairs.players.length+names.length>15||names.some(n=>typeof n!=='string'||!n.trim()||n.trim().length>60))fail('Add names up to a maximum class size of 15.');
   if(new Set([...state.pairs.players.map(p=>p.name),...names.map(n=>n.trim())]).size!==state.pairs.players.length+names.length)fail('Names must be distinct.');
   names.forEach(name=>state.pairs.players.push({id:state.pairs.players.length,name:name.trim(),pin:String(100000+crypto.getRandomValues(new Uint32Array(1))[0]%900000),token:null,practice:null}));changed=true;return response({ok:true});
  }
  if(route==='POST /api/frontier/admin/create'){
   if(state.frontier)fail('Reset the existing Frontier Cities game first.',409);
   const ids=b.players;if(!Array.isArray(ids)||new Set(ids).size!==ids.length)fail('Select distinct students.');const selected=ids.map(id=>roster().find(p=>p.id===id)||fail('Choose a name from your class.'));
   state.frontier=newFrontier(selected,{seconds:b.seconds,rounds:b.rounds});changed=true;return response({ok:true});
  }
  const g=game();
  // An explicit end/pause cannot accidentally start another round. All other clocks are server-owned.
  const interrupt=['POST /api/frontier/admin/end','POST /api/frontier/admin/pause'].includes(route)&&b.id===g.id&&b.roundId===g.roundId;
  if(!interrupt){if(g.status==='open'&&now>=g.deadline){resolveFrontier(g,now);changed=true;}else if(g.status==='revealed'&&!g.held&&now>=g.nextRoundAt){startRound(g,now);changed=true;}}
  clockChanged=changed;checkpoint=structuredClone(state);
  if(route==='GET /api/frontier/teacher')return response(view(g,null,true));
  if(route==='GET /api/frontier/state')return response(view(g,seat));
  if(route==='POST /api/frontier/order'){
   guard(g);if(g.status!=='open'||now>=g.deadline)fail('Orders are closed for this round.',409);
   const member=g.players.find(p=>p.id===seat.id&&p.name===seat.name);if(!member||member.eliminated)fail('You are watching this game.',403);
   g.orders[seat.id]=checkedOrder(g,seat.id,b);changed=true;return response({ok:true});
  }
  if(route==='GET /api/frontier/export'){
   if(url.searchParams.get('type')==='csv'){
    const quote=v=>'"'+String(typeof v==='string'&&/^[=+@\-\t\r]/.test(v)?"'"+v:v).replaceAll('"','""')+'"';
    const rows=[['rank','student','score','territories','eliminated','food','ore','gold'],...frontierStandings(g).map(r=>[r.rank,r.name,r.score,r.territories,r.eliminated,...RESOURCES.map(k=>g.players.find(p=>p.id===r.id).resources[k])])];
    return response('\ufeff'+rows.map(r=>r.map(quote).join(',')).join('\r\n'),200,'text/csv');
   }
   // Pending orders are not exported; only completed round orders are public.
   return response({game:'Frontier Cities',exportedAt:now,...view(g,null,true)});
  }
  if(req.method==='POST'&&url.pathname.startsWith('/api/frontier/admin/')){
   guard(g);const action=url.pathname.split('/').at(-1);
   if(action==='start'){if(g.status!=='waiting')fail('The game has already started.',409);startRound(g,now);}
   else if(action==='resolve'){if(!['open','paused'].includes(g.status))fail('There is no active round.',409);resolveFrontier(g,now);}
   else if(action==='pause'){
    if(g.status==='open'){if(now>=g.deadline){resolveFrontier(g,now);g.held=g.status==='revealed';}else{g.remaining=g.deadline-now;g.deadline=null;g.status='paused';}}
    else if(g.status==='revealed'){g.held=true;}else fail('There is no running timer.',409);
   }
   else if(action==='resume'){if(g.status==='paused'){g.status='open';g.deadline=now+g.remaining;g.remaining=null;}else if(g.status==='revealed'&&g.held){g.held=false;g.nextRoundAt=now+20000;}else fail('The game is not paused.',409);}
   else if(action==='next'){if(g.status!=='revealed')fail('Reveal the current round first.',409);startRound(g,now);}
   else if(action==='end'){if(['open','paused'].includes(g.status))resolveFrontier(g,now);g.status='complete';g.deadline=null;g.nextRoundAt=null;g.held=false;}
   else if(action==='reset'){if(b.confirm!=='RESET')fail('Type RESET to clear Frontier Cities.');archive=structuredClone(state);state.frontier=null;}
   else fail('Unknown teacher control.',404);
   changed=true;return response({ok:true});
  }
  fail('Not found.',404);
 }catch(e){return {body:{error:e.message},status:e.status||400,type:'application/json',state:clockChanged?checkpoint:input,changed:clockChanged,archive:null};}
}
