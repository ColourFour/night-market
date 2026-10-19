import {test} from 'node:test';
import assert from 'node:assert/strict';
test('Solo entry runs without a class connection: setup, save, resolve, advance, end, replay and preserved class session',async()=>{
 const elements=new Map(),listeners=new Map(),data=new Map([['pairs-student','class-session'],['contribute-take-rehearsal-v1','untouched']]);
 const previous={fetch:globalThis.fetch,FormData:globalThis.FormData,document:globalThis.document,window:globalThis.window,location:globalThis.location,localStorage:globalThis.localStorage};let calls=0,fields={};
 globalThis.location={search:'?solo=1&demo=1',hash:'#teacher'};globalThis.window={scrollTo(){},print(){}};
 globalThis.fetch=()=>{calls++;throw Error('No network allowed');};
 globalThis.localStorage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 globalThis.document={querySelector:s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',textContent:''});return elements.get(s);},querySelectorAll:()=>[],addEventListener:(k,v)=>listeners.set(k,v)};
 globalThis.FormData=class{constructor(){return new Map(Object.entries(fields));}};
 try{
  await import('../docs/main.js');const html=()=>elements.get('#app').innerHTML;
  const click=action=>listeners.get('click')({target:{closest:()=>({dataset:{action}})}});
  const submit=(id,values)=>{fields=values;listeners.get('submit')({preventDefault(){},target:{id}});};
  assert.match(html(),/A world of your own/);assert.match(html(),/Strategic/);assert.doesNotMatch(html(),/Teacher access|Rehearsal/);
  submit('solo-create',{name:'Solo Founder',difficulty:'mixed'});assert.match(html(),/Round 1/);
  fields={action:'develop',tile:'0',ally:'1'};click('frontier-add-action');submit('frontier-order',fields);assert.match(html(),/Plan saved for this solo game/);
  click('solo-play');assert.match(html(),/Who did what/);assert.match(html(),/Begin next round/);assert.match(html(),/Bot action/);
  click('solo-next');assert.match(html(),/Round 2/);assert.match(html(),/Planned actions · 0/);
  click('solo-end');assert.match(html(),/End and show final report/);click('solo-cancel-end');assert.doesNotMatch(html(),/End and show final report/);
  click('solo-end');click('solo-confirm-end');assert.match(html(),/Final game report/);
  click('solo-setup');submit('solo-create',{name:'Solo Founder',difficulty:'strategic'});assert.match(html(),/Strategic robots/);assert.match(html(),/Round 1/);
  assert.equal(calls,0);assert.equal(data.get('pairs-student'),'class-session');assert.equal(data.get('contribute-take-rehearsal-v1'),'untouched');
 }finally{Object.assign(globalThis,previous);}
});
