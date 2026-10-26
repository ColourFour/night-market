import {handleFrontier,adjacent} from './frontier-core.js?v=solo1';
import {handleZones} from './zones-core.js?v=open-entry1';
import {handlePairs,pairSecret} from './pairs-core.js?v=open-entry1';
import {handleCrypto} from './crypto-core.js?v=layout1';
import {API_BASE} from './config.js';
export const demo=new URLSearchParams(location.search).get('demo')==='1';
const KEY='contribute-take-rehearsal-v1';
let state;export let saved=true;
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));saved=true;}catch{saved=false;}}
function apiPath(path){return path.startsWith('crypto/')?'/api/crypto/'+path.slice(7):path.startsWith('frontier/')?'/api/frontier/'+path.slice(9):path.startsWith('zones/')?'/api/zones/'+path.slice(6):'/api/pairs/'+path;}
function request(path,body,token){if(path.startsWith('archives')){if(token!==get().teacherKey)throw Error('Teacher access required.');return {body:path.includes('csv')?'day,game,student,points':[]};}const r=(path.startsWith('crypto/')?handleCrypto:path.startsWith('frontier/')?handleFrontier:path.startsWith('zones/')?handleZones:handlePairs)(get(),{url:apiPath(path),method:body===undefined?'GET':'POST',body,headers:{authorization:'Bearer '+token}});if(r.changed){state=r.state;persist();}if(r.status>=400)throw Object.assign(Error(r.body.error),{status:r.status});return r;}
function get(){if(!state){try{state=JSON.parse(localStorage.getItem(KEY));}catch{}if(!state?.pairs)resetDemo();}return state;}
export function resetDemo(){
 state={schema:1,teacherKey:pairSecret(),room:null,pairs:null};
 const setup=handlePairs(state,{url:'/api/pairs/admin/create',method:'POST',headers:{authorization:'Bearer '+state.teacherKey},body:{names:Array.from({length:13},(_,i)=>`Student ${i+1}`),seconds:30,rotation:'rotate',missing:'take'}});
 state=setup.state;state.pairs.players.forEach(p=>{p.token=pairSecret();});persist();
}
export const demoToken=role=>role==='teacher'?get().teacherKey:get().pairs.players[0].token;
export async function simulate(){
 const r=get().pairs;
 if(r.status!=='open'||Date.now()>=r.deadline)throw Error('Start or extend the timer first.');
 for(const p of r.players){if(p.id===0)continue;const v=request('state',undefined,p.token).body;if(!v.me.practice)request('practice',{choice:'contribute'},p.token);if(v.opponent&&!v.myChoice&&v.status==='open')request('choice',{roundId:v.roundId,choice:(p.id+r.round)%3?'contribute':'take'},p.token);}
}
export async function api(path,body,token){
 if(demo)return request(path,body,token).body;
 const response=await fetch(API_BASE+apiPath(path),{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(30000)});
 const value=response.headers.get('content-type')?.includes('json')?await response.json():await response.text();
 if(!response.ok)throw Object.assign(Error(value.error||'Connection interrupted. Please retry.'),{status:response.status});return value;
}

export async function simulateZones(){
 const s=get();if(!s.zones||s.zones.status!=='open')throw Error('Open Economic Zones submissions first.');
 for(const p of s.pairs.players){if(p.id===0)continue;const allocation=[0,0,0,0,0];for(let unit=0;unit<100;unit++)allocation[(unit*(p.id%4+1)+Math.floor(unit/7)+p.id)%5]++;
 if(!get().zones.practice?.[p.id]?.attempts)request('zones/practice',{id:s.zones.id,allocation},p.token);
 request('zones/submit',{id:s.zones.id,allocation,reflection:{why:'Rehearsal example: distribute attention across the city.'}},p.token);}
}

export async function simulateFrontier(){
 const g=get().frontier;if(!g||g.status!=='open')throw Error('Begin a Frontier Cities round first.');
 for(const p of g.players){if(p.id===0||p.eliminated||p.bot)continue;
  const seat=get().pairs.players.find(q=>q.id===p.id),owned=g.tiles.filter(t=>t.owner===p.id);
  let order={action:'hold',ally:null};
  const from=owned.find(t=>t.troops>=4),target=from&&g.tiles.find(t=>adjacent(from.id,t.id,g)&&t.owner!==p.id&&(!t.capital||g.round>2)&&from.troops-1>t.troops+t.level);
  if(target)order={action:'move',from:from.id,to:target.id,units:from.troops-1,ally:null};
  else if(p.resources.food>=4&&p.resources.ore>=4)order={action:'recruit',tile:owned[0].id,units:4,ally:null};
  else if(p.resources.ore>=4&&p.resources.gold>=3&&owned.some(t=>t.level<3))order={action:'develop',tile:owned.find(t=>t.level<3).id,ally:null};
  if(!seat.token)request('join',{code:get().pairs.code,id:p.id});
  request('frontier/order',{...order,id:g.id,roundId:g.roundId},get().pairs.players.find(q=>q.id===p.id).token);
 }
}

export async function simulateCrypto(){
 const g=get().crypto;if(!g||g.status!=='open')throw Error('Open a Cryptology mission first.');
 const samples=[['Shift each letter forward by one. Keep spaces.','NFFU BU OPPO','MEET AT NOON'],['Reverse the whole message.','EGDIRB EHT DLOH','HOLD THE BRIDGE'],['Replace A with 1, B with 2, and so on.','19-5-3-18-5-20','SECRET']];
 for(const p of get().pairs.players){if(p.id===0)continue;const [rule,ciphertext,plaintext]=samples[(p.id-1)%samples.length];if(!get().crypto.entries[p.id])request('crypto/submit',{id:g.id,rule,ciphertext,plaintext},p.token);}
 for(const p of get().pairs.players){if(p.id===0||!get().crypto.entries[p.id])continue;for(const e of Object.values(get().crypto.entries)){if(e.studentId===p.id)continue;request('crypto/guess',{id:g.id,targetId:e.studentId,guess:p.id%3?e.plaintext:'A DIFFERENT MESSAGE'},p.token);}}
}
