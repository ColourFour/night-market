import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handlePairs,pairSecret} from '../docs/pairs-core.js';
test('Public UI goes straight from name selection to the robot introduction',async()=>{
 let game={teacherKey:pairSecret(),pairs:null};
 game=handlePairs(game,{url:'/api/pairs/admin/create',method:'POST',headers:{authorization:'Bearer '+game.teacherKey},body:{names:['Student A','Student B'],rounds:1,seconds:30}}).state;
 const elements=new Map(),listeners=new Map(),data=new Map();
 globalThis.location={search:'',origin:'http://localhost',pathname:'/',hash:''};globalThis.history={replaceState(){}};
 globalThis.localStorage=globalThis.sessionStorage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 globalThis.document={querySelector:s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',textContent:''});return elements.get(s)},querySelectorAll:()=>[],addEventListener:(k,v)=>listeners.set(k,v)};
 const fetch=globalThis.fetch,interval=globalThis.setInterval,Form=globalThis.FormData;
 globalThis.setInterval=()=>{};
 globalThis.fetch=async(url,options)=>{const r=handlePairs(game,{url:new URL(url).pathname.replace(/^.*(?=\/api\/pairs\/)/,''),method:options.method,headers:{authorization:options.headers.Authorization||''},body:options.body?JSON.parse(options.body):undefined});if(r.changed)game=r.state;return {ok:r.status<400,status:r.status,headers:{get:()=> 'application/json'},json:async()=>r.body};};
 try{
  await import('../docs/pairs.js');await new Promise(r=>setTimeout(r,20));const html=()=>elements.get('#app').innerHTML;
  assert.match(html(),/Choose yourself/);assert.match(html(),/Student A/);assert.doesNotMatch(html(),/Teacher access|teacher-login|rehearsal|Room code|Private seat code/);
  globalThis.FormData=class{constructor(){return new Map([['id','0']]);}};
  await listeners.get('submit')({preventDefault(){},target:{getAttribute:()=> 'join-form'}});
  assert.match(html(),/Two choices/);assert.match(html(),/Welcome, Student A/);assert.match(html(),/Reveal my practice result/);assert.doesNotMatch(html(),/Start timed round/);
  assert.ok(data.get('pairs-student'));
 }finally{globalThis.fetch=fetch;globalThis.setInterval=interval;globalThis.FormData=Form;}
});
