import {newFrontier,handleFrontier} from './frontier-core.js?v=solo1';
import {pairSecret} from './pairs-core.js';
import {victoryProgress} from './frontier-strategy.js';
import {robotPlan,BOT_LEVELS} from './frontier-bots.js';
export {BOT_LEVELS};
const names=['Mira','Sol','Nova','Atlas','Iris','Orion','Echo','Vega','Juno','Kite','Lumen','Sage','Rook','Aster'];
// This session never uses class credentials or calls the online API. Its clock stays fixed
// so closing the tab cannot resolve or advance a round before the player returns.
function request(session,path,body,teacher=false){
 const g=session.frontier;
 const result=handleFrontier(session,{method:body===undefined?'GET':'POST',url:'/api/frontier/'+path,headers:{authorization:'Bearer '+(teacher?session.teacherKey:session.pairs.players[0].token)},body:body===undefined?undefined:{...body,id:g.id,roundId:g.roundId}},{now:session.clock});
 if(result.status>=400)throw Error(result.body.error);
 return {session:result.changed?result.state:session,body:result.body};
}
export function createSolo(name,difficulty='mixed'){
 name=String(name||'').trim();if(!name||name.length>60)throw Error('Enter a name of 1–60 characters.');
 if(!BOT_LEVELS[difficulty])throw Error('Choose a bot difficulty.');
 const human={id:0,name,token:pairSecret()},g=newFrontier([human]);
 for(const p of g.players.filter(p=>p.bot)){p.botLevel=difficulty==='mixed'?['easy','standard','strategic'][(p.id-1)%3]:difficulty;p.botStyle=['builder','commander','merchant'][Math.floor((p.id-1)/3)%3];p.name=names[p.id-1]+' · '+BOT_LEVELS[p.botLevel].name;const home=g.tiles.find(t=>t.owner===p.id&&t.capital);home.name=p.name+' · Home';}
 return request({soloSchema:1,difficulty,clock:Date.now(),teacherKey:pairSecret(),pairs:{players:[human]},frontier:g},'admin/start',{},true).session;
}
export const soloView=s=>({...request(s,'state').body,solo:true,difficulty:s.difficulty});
export const saveSoloPlan=(s,plan)=>request(s,'order',plan).session;
export function playSoloRound(s,plan){
 let next=saveSoloPlan(s,plan),g=next.frontier;
 // Each bot gets the same snapshot. The planner discards all pending orders.
 const plans=g.players.filter(p=>p.bot&&!p.eliminated).map(p=>[p.id,robotPlan(g,p.id)]);
 for(const [id,order]of plans)g.orders[id]=order;
 next=request(next,'admin/resolve',{},true).session;g=next.frontier;
 g.history.at(-1).at=Date.now();
 // In solo play robots can win too, using exactly the same thresholds as the player.
 const winners=g.round<6?[]:g.players.filter(p=>!p.eliminated).flatMap(p=>{const routes=victoryProgress(g,p).filter(r=>r.ratio>=1&&r.qualifies!==false).map(r=>r.key);return routes.length?[{id:p.id,name:p.name,routes}]:[];});
 if(winners.length){g.winners=winners;g.endReason='Victory threshold reached';g.status='complete';}
 else if(g.players[0].eliminated){g.winners=[];g.endReason='Your city was conquered';g.status='complete';}
 if(g.status==='revealed'){g.held=true;g.nextRoundAt=null;}
 if(g.status==='complete'){g.held=false;g.nextRoundAt=null;}
 return next;
}
export const nextSoloRound=s=>request(s,'admin/next',{},true).session;
export function finishSolo(s){const next=structuredClone(s);next.frontier.status='complete';next.frontier.endReason='Solo game ended by player';next.frontier.deadline=null;next.frontier.nextRoundAt=null;next.frontier.orders={};next.frontier.held=false;return next;}
export const soloExport=(s,type='json')=>request(s,'export?type='+type,undefined,true).body;
export const SOLO_KEY='frontier-cities-solo-v1';
export function saveSolo(storage,s){
 try{const compact=structuredClone(s);compact.frontier.history=compact.frontier.history.map(({beforeTiles,afterTiles,...h})=>h);storage.setItem(SOLO_KEY,JSON.stringify(compact));return true;}catch{return false;}
}
export function loadSolo(storage){try{const s=JSON.parse(storage.getItem(SOLO_KEY));if(s?.soloSchema!==1||!BOT_LEVELS[s.difficulty]||!s.frontier?.players?.length||!Number.isFinite(s.clock)||!Array.isArray(s.frontier.history))return null;soloView(s);return s;}catch{return null;}}
