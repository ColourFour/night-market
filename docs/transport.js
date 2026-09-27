import {handle,secret} from './core.js';
import {VENUES,analyze} from './rules.js';
import {API_BASE} from './config.js';
export const demo=new URLSearchParams(location.search).get('demo')==='1';
export const configured=!!API_BASE;
const STORE='night-market-rehearsal-v1';
let cached,initializing=false;
export let rehearsalSaved=true;
const responses=new Map();
window.addEventListener('storage',e=>{if(e.key===STORE&&rehearsalSaved)cached=null;});
function save(s){
  cached=s;
  if(initializing)return;
  // Counterfactual tables are derived from decisions; do not duplicate them in storage.
  const compact={...s,room:s.room?{...s.room,history:s.room.history.map(({result,...h})=>h)}:null};
  try{localStorage.setItem(STORE,JSON.stringify(compact));rehearsalSaved=true;}
  catch{rehearsalSaved=false;} // A full/blocked store must never reject a game action.
}
function get(){
  if(!cached){
    try{
      const saved=JSON.parse(localStorage.getItem(STORE));
      // Earlier versions could leave a half-initialized class when a write failed.
      if(saved?.schema===1&&saved.room?.players?.length===13&&saved.room.players.every(p=>p.policies?.practice)){
        saved.room.history.forEach(h=>{h.result=analyze(h.decisions,h.round);});cached=saved;
      }
    }catch{}
    if(!cached)startDemo();
  }
  return cached;
}
function call(path,body,token){const s=get(),r=handle(s,{method:body===undefined?'GET':'POST',url:path,headers:{authorization:'Bearer '+token},body},{siteUrl:location.origin+location.pathname+'?demo=1'});if(r.changed)save(r.state);if(r.status>=400)throw new Error(r.body.error);return r;}
export function startDemo(){
  initializing=true;
  try {
  cached={schema:1,teacherKey:secret(),room:null};
  call('/api/admin/create',{names:Array.from({length:13},(_,i)=>`Founder ${String(i+1).padStart(2,'0')}`)},cached.teacherKey);
  for(let id=0;id<13;id++){
    const p=cached.room.players[id];
    const token=call('/api/join',{code:cached.room.code,id,pin:p.pin}).body.token;
    call('/api/policy',{roundId:cached.room.roundId,policy:`Rehearsal policy: round 1 ${VENUES[id<6?0:id<10?1:2]}, round 2 ${VENUES[(id+2)%3]}, round 3 ${VENUES[id%3]}; contribute 2. No ties to break.`,prediction:'I predict venue counts of 6 / 4 / 3 and a lantern fund of 26 in round 1.',fallback:'Use the venue rule above and contribute 2.'},token);
  }
  } finally {initializing=false;}
  save(cached);
}
export const demoSession=mode=>mode==='teacher'?get().teacherKey:get().room.players[0].token;
export async function demoControl(action){
  if(action==='demoReset'){startDemo();return;}
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
  const cacheKey=path+'|'+(options.headers?.Authorization||'');
  const old=responses.get(cacheKey),isGet=!options.method||options.method==='GET';
  const response=await fetch(API_BASE+path,{...options,headers:{...options.headers,...(isGet&&old?{'If-None-Match':old.etag}:{})},signal:AbortSignal.timeout(30000)});
  if(response.status===304&&old)return new Response(old.body,{status:200,headers:{'Content-Type':old.type}});
  if(isGet&&response.ok&&response.headers.get('etag'))responses.set(cacheKey,{etag:response.headers.get('etag'),body:await response.clone().text(),type:response.headers.get('content-type')});
  return response;
}
