import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handleFrontier} from '../docs/frontier-core.js';
import {handlePairs,pairSecret} from '../docs/pairs-core.js';
test('Typed name and game share one page; direct entry preserves the existing student seat',async()=>{
 let game={teacherKey:pairSecret(),pairs:null};
 game=handlePairs(game,{url:'/api/pairs/admin/create',method:'POST',headers:{authorization:'Bearer '+game.teacherKey},body:{names:['Student A','Student B'],rounds:1,seconds:30}}).state;
 const elements=new Map(),listeners=new Map(),data=new Map();
 globalThis.location={search:'',origin:'http://localhost',pathname:'/',hash:''};globalThis.history={replaceState(){}};
 globalThis.localStorage=globalThis.sessionStorage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 globalThis.document={querySelector:s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',textContent:''});return elements.get(s)},querySelectorAll:()=>[],addEventListener:(k,v)=>listeners.set(k,v)};
 const fetch=globalThis.fetch,interval=globalThis.setInterval,Form=globalThis.FormData;
 globalThis.setInterval=()=>{};
 globalThis.fetch=async(url,options)=>{const route=new URL(url).pathname.replace(/^.*(?=\/api\/)/,'');const r=(route.startsWith('/api/frontier/')?handleFrontier:handlePairs)(game,{url:route,method:options.method,headers:{authorization:options.headers.Authorization||''},body:options.body?JSON.parse(options.body):undefined});if(r.changed)game=r.state;return {ok:r.status<400,status:r.status,headers:{get:()=> 'application/json'},json:async()=>r.body};};
 try{
  await import('../docs/pairs.js');await new Promise(r=>setTimeout(r,20));const html=()=>elements.get('#app').innerHTML;
  assert.match(html(),/Your name/);assert.match(html(),/name="name" type="text"/);assert.match(html(),/data-mode="frontier"/);assert.match(html(),/Economic Zones/);assert.doesNotMatch(html(),/Choose yourself|Join your class|<select|Teacher access|teacher-login|rehearsal|Room code|Private seat code/);
  const {matchRosterName}=await import('../docs/pairs-transport.js?v=name-entry1');
  assert.equal(matchRosterName(game.pairs.players,'  sTuDeNt   a ').id,0);
  assert.equal(matchRosterName(game.pairs.players,'Ｓｔｕｄｅｎｔ Ａ').id,0);
  assert.throws(()=>matchRosterName(game.pairs.players,'Unknown'),/not on the class list/);
  assert.throws(()=>matchRosterName(game.pairs.players,'   '),/Type your name/);
  assert.throws(()=>matchRosterName([{id:0,name:'Alex'},{id:1,name:'ALEX'}],'Alex'),/More than one/);
  globalThis.FormData=class{constructor(){return new Map([['name','  student   a  ']]);}};
  await listeners.get('submit')({preventDefault(){},submitter:{dataset:{mode:'frontier'}},target:{getAttribute:()=> 'join-form'}});
  assert.match(html(),/Frontier Cities/);assert.match(html(),/teacher is preparing the world/);assert.doesNotMatch(html(),/Choose your experiment/);
  await listeners.get('click')({target:{closest:()=>({dataset:{action:'chooseGame'}})}});
  assert.match(html(),/Welcome, Student A/);
  await listeners.get('click')({target:{closest:()=>({dataset:{action:'modePairs'}})}});
  assert.match(html(),/Two choices/);assert.match(html(),/Welcome, Student A/);assert.match(html(),/Reveal my practice result/);assert.doesNotMatch(html(),/Start timed round/);
  assert.ok(data.get('pairs-student'));
 }finally{globalThis.fetch=fetch;globalThis.setInterval=interval;globalThis.FormData=Form;}
});
