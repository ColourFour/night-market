import {handleZones} from './zones-core.js?v=zones1';
import {handlePairs,pairSecret} from './pairs-core.js?v=unlimited1';
import {API_BASE} from './config.js';
export const demo=new URLSearchParams(location.search).get('demo')==='1';
const KEY='contribute-take-rehearsal-v1';
let state;export let saved=true;
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));saved=true;}catch{saved=false;}}
function request(path,body,token){const zones=path.startsWith('zones/');const r=(zones?handleZones:handlePairs)(get(),{url:zones?'/api/zones/'+path.slice(6):'/api/pairs/'+path,method:body===undefined?'GET':'POST',body,headers:{authorization:'Bearer '+token}});if(r.changed){state=r.state;persist();}if(r.status>=400)throw Error(r.body.error);return r;}
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
 const response=await fetch(API_BASE+(path.startsWith('zones/')?'/api/zones/'+path.slice(6):'/api/pairs/'+path),{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(30000)});
 const value=response.headers.get('content-type')?.includes('json')?await response.json():await response.text();
 if(!response.ok)throw Object.assign(Error(value.error||'Connection interrupted. Please retry.'),{status:response.status});return value;
}

export async function simulateZones(){
 const s=get();if(!s.zones||s.zones.status!=='open')throw Error('Open Economic Zones submissions first.');
 for(const p of s.pairs.players){if(p.id===0)continue;const allocation=[0,0,0,0,0];for(let unit=0;unit<100;unit++)allocation[(unit*(p.id%4+1)+Math.floor(unit/7)+p.id)%5]++;
 request('zones/submit',{id:s.zones.id,allocation,reflection:{why:'Rehearsal example: distribute attention across the city.'}},p.token);}
}
