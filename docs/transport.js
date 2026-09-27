import {handle,secret} from './core.js';
import {VENUES} from './rules.js';
import {API_BASE} from './config.js';
export const demo=new URLSearchParams(location.search).get('demo')==='1';
export const configured=!!API_BASE;
const STORE='night-market-rehearsal-v1';
let cached;
function save(s){cached=s;localStorage.setItem(STORE,JSON.stringify(s));}
function get(){if(!cached){try{cached=JSON.parse(localStorage.getItem(STORE));}catch{}if(!cached?.room)startDemo();}return cached;}
function call(path,body,token){const s=get(),r=handle(s,{method:body===undefined?'GET':'POST',url:path,headers:{authorization:'Bearer '+token},body},{siteUrl:location.origin+location.pathname+'?demo=1'});if(r.changed)save(r.state);if(r.status>=400)throw new Error(r.body.error);return r;}
export function startDemo(){
  cached={schema:1,teacherKey:secret(),room:null};
  call('/api/admin/create',{names:Array.from({length:13},(_,i)=>`Founder ${String(i+1).padStart(2,'0')}`)},cached.teacherKey);
  for(let id=0;id<13;id++){
    const p=cached.room.players[id];
    const token=call('/api/join',{code:cached.room.code,id,pin:p.pin}).body.token;
    call('/api/policy',{roundId:cached.room.roundId,policy:`Rehearsal policy: round 1 ${VENUES[id<6?0:id<10?1:2]}, round 2 ${VENUES[(id+2)%3]}, round 3 ${VENUES[id%3]}; contribute 2. No ties to break.`,prediction:'I predict venue counts of 6 / 4 / 3 and a lantern fund of 26 in round 1.',fallback:'Use the venue rule above and contribute 2.'},token);
  }
  save(cached);
}
export const demoSession=mode=>mode==='teacher'?get().teacherKey:get().room.players[0].token;
export async function demoControl(action){
  if(action==='demoReset'){startDemo();location.reload();return;}
  if(action!=='demoFill')return;
  const r=get().room;
  if(r.phase==='revision'){
    for(let id=1;id<13;id++){const p=get().room.players[id];if(!p.policies.scored)call('/api/policy',{roundId:r.roundId,policy:`Revised rehearsal policy: round 1 ${VENUES[id<6?0:id<10?1:2]}, round 2 ${VENUES[(id+2)%3]}, round 3 ${VENUES[id%3]}; contribute 1. No ties to break.`,prediction:'I predict the most attractive venue will also be most crowded.',fallback:'Use the highest base attraction, contribute 1.',rationale:'Practice showed crowding can erase a venue’s attraction advantage.'},p.token);}
    return;
  }
  if(r.status!=='open')throw new Error('Open the round in Teacher view first.');
  for(let id=1;id<13;id++){
    if(get().room.submissions[id])continue;
    const venue=r.round===1?(id<6?0:id<10?1:2):(id+r.round)%3;
    const contribution=r.phase==='practice'?2:1;
    call('/api/decision',{roundId:r.roundId,venue,contribution},get().room.players[id].token);
  }
}
export async function transport(path,options={}){
  if(demo){
    const token=(options.headers?.Authorization||'').replace(/^Bearer /,'');
    try{const r=call(path,options.body===undefined?undefined:JSON.parse(options.body),token);return new Response(r.type==='application/json'?JSON.stringify(r.body):r.body,{status:r.status,headers:{'Content-Type':r.type}});}catch(e){return Response.json({error:e.message},{status:400});}
  }
  if(!configured)return Response.json({error:'Live rooms are not connected yet. Please use Play a rehearsal.'},{status:503});
  return fetch(API_BASE+path,{...options,signal:AbortSignal.timeout(20000)});
}
