// Operation Cipher: the server owns secrets, attempt records, and the reveal boundary.
import {pairSecret} from './pairs-core.js';
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
export const normalizePlaintext=value=>String(value??'').normalize('NFKC').toLowerCase().replace(/[\p{P}\p{Z}\s]/gu,'');
export const plaintextMatches=(guess,answer)=>!!normalizePlaintext(guess)&&normalizePlaintext(guess)===normalizePlaintext(answer);
const field=(value,label,max)=>{if(typeof value!=='string'||!value.trim()||value.length>max)fail(`${label} must contain 1–${max} characters.`);return value.trim();};
const records=g=>Object.values(g.entries).sort((a,b)=>a.studentId-b.studentId);
const snapshot=(entry,g)=>({studentId:entry.studentId,name:entry.name,ciphertext:entry.ciphertext,submittedAt:entry.submittedAt});
export function cryptoResults(g){
 return records(g).map(e=>{
  const teacher=g.teacherAttempts[e.studentId],peers=Object.values(g.guesses).filter(a=>a.targetId===e.studentId).sort((a,b)=>a.studentId-b.studentId).map(a=>({...a,correct:plaintextMatches(a.guess,e.plaintext)}));
  return {...snapshot(e,g),rule:e.rule,plaintext:e.plaintext,teacher:{guess:teacher?.guess||'',passed:!!teacher?.passed,correct:!teacher?.passed&&!!teacher&&plaintextMatches(teacher.guess,e.plaintext)},peers,decodedByPeers:peers.filter(a=>a.correct).length};
 });
}
export function cryptoCsv(results){
 const rows=[['author','ciphertext','rule','actual_plaintext','decoder','guess','correct','passed']];
 for(const e of results){rows.push([e.name,e.ciphertext,e.rule,e.plaintext,'Teacher',e.teacher.guess,e.teacher.correct,e.teacher.passed]);for(const p of e.peers)rows.push([e.name,e.ciphertext,e.rule,e.plaintext,p.name,p.guess,p.correct,false]);}
 const safe=v=>{let s=String(v);if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
 return '\ufeff'+rows.map(row=>row.map(safe).join(',')).join('\r\n');
}
export function handleCrypto(input,req,{now=Date.now()}={}){
 let state=structuredClone(input),changed=false,archive=null;
 const url=new URL(req.url,'https://crypto.invalid'),route=req.method+' '+url.pathname,b=req.body||{},token=(req.headers.authorization||'').replace(/^Bearer /,'');
 const response=(body,status=200,type='application/json')=>({body,status,type,state,changed,archive});
 const teacher=()=>{if(!token||token!==state.teacherKey)fail('Teacher access required.',401);};
 const student=()=>state.pairs?.players.find(p=>p.token&&p.token===token)||fail('Please choose your name again.',401);
 const game=()=>state.crypto||fail('Your teacher has not opened this mission yet.',409);
 const guard=g=>{if(b.id!==g.id)fail('This mission has changed. Reopen Cryptology before submitting.',409);};
 const fresh=()=>({id:pairSecret(),status:'open',openedAt:now,revealedAt:null,entries:{},guesses:{},teacherAttempts:{}});
 const owner=(g,p)=>{const entry=g.entries[p.id];if(entry&&entry.name!==p.name)fail('The class roster changed. Ask your teacher to start a new mission.',409);return entry;};
 function view(g,p=null,isTeacher=false){
  const entries=records(g),out={id:g.id,status:g.status,submitted:entries.length,total:state.pairs?.players.length||0,openedAt:g.openedAt,revealedAt:g.revealedAt,serverNow:now};
  if(p){const entry=owner(g,p);out.me={id:p.id,name:p.name,entry:entry?{...snapshot(entry,g),rule:entry.rule,plaintext:entry.plaintext}:null};
   if(entry||g.status==='revealed')out.messages=entries.filter(e=>e.studentId!==p.id).map(e=>({...snapshot(e,g),myGuess:g.guesses[`${p.id}:${e.studentId}`]?.guess??null}));
   else out.messages=[];
   out.myGuessCount=Object.values(g.guesses).filter(a=>a.studentId===p.id&&a.name===p.name).length;
  }
  if(isTeacher){out.reviewed=entries.filter(e=>g.teacherAttempts[e.studentId]).length;
   out.entries=entries.map(e=>({...snapshot(e,g),rule:e.rule,attempt:g.teacherAttempts[e.studentId]||null}));
   out.guessCount=Object.keys(g.guesses).length;
   out.seats=(state.pairs?.players||[]).map(p=>({id:p.id,name:p.name,submitted:!!g.entries[p.id]&&g.entries[p.id].name===p.name}));
  }
  if(g.status==='revealed')out.results=cryptoResults(g);
  return out;
 }
 try{
  const privileged=url.pathname.startsWith('/api/crypto/admin/')||['/api/crypto/teacher','/api/crypto/export'].includes(url.pathname);
  if(privileged)teacher();else student();
  if(route==='GET /api/crypto/teacher')return response(state.crypto?view(game(),null,true):{empty:true,serverNow:now});
  if(route==='GET /api/crypto/state'){const p=student();return response(state.crypto?view(game(),p):{empty:true,me:{id:p.id,name:p.name},serverNow:now});}
  if(route==='POST /api/crypto/submit'){
   const p=student(),g=game();guard(g);if(g.status!=='open')fail('Message submission is closed for this mission.',409);
   if(owner(g,p))fail('Your message is already sealed. You can now decode your classmates’ messages.',409);
   const rule=field(b.rule,'Your rule',2000),ciphertext=field(b.ciphertext,'Your encoded message',1200),plaintext=field(b.plaintext,'The true message',1200);
   if(!normalizePlaintext(plaintext))fail('The true message must contain more than spaces or punctuation.');
   g.entries[p.id]={studentId:p.id,name:p.name,rule,ciphertext,plaintext,submittedAt:now};changed=true;return response({ok:true});
  }
  if(route==='POST /api/crypto/guess'){
   const p=student(),g=game();guard(g);if(!['open','locked'].includes(g.status))fail('The reveal has begun. Guesses are now closed.',409);
   if(!owner(g,p))fail('Submit your own rule and message before decoding other messages.',403);
   if(!Number.isInteger(b.targetId)||!g.entries[b.targetId])fail('Choose a submitted message.');
   if(b.targetId===p.id)fail('Choose a classmate’s message, not your own.');
   const guess=field(b.guess,'Your guess',1200);
   g.guesses[`${p.id}:${b.targetId}`]={studentId:p.id,name:p.name,targetId:b.targetId,guess,savedAt:now};changed=true;return response({ok:true});
  }
  if(route==='GET /api/crypto/export'){
   const g=game();if(g.status!=='revealed')fail('Declassify the mission before exporting its answers.',409);
   const results=cryptoResults(g);return url.searchParams.get('type')==='csv'?response(cryptoCsv(results),200,'text/csv'):response({game:'Cryptology / Operation Cipher',id:g.id,revealedAt:g.revealedAt,matching:'Case, whitespace and punctuation ignored; symbols and letters retained.',results});
  }
  if(req.method==='POST'&&url.pathname.startsWith('/api/crypto/admin/')){
   const action=url.pathname.split('/').at(-1);
   if(action==='open'){if(state.crypto)fail('A mission already exists. Start a new mission to replace it.',409);state.crypto=fresh();changed=true;return response({ok:true});}
   const g=game();guard(g);
   if(action==='decode'){
    if(g.status==='revealed')fail('Decoding is closed after the reveal.',409);
    if(!Number.isInteger(b.targetId)||!g.entries[b.targetId])fail('Choose a submitted message.');
    if(b.passed!==undefined&&typeof b.passed!=='boolean')fail('Choose a valid decoding status.');
    const guess=b.passed?'':field(b.guess,'Your plaintext attempt',1200);
    g.teacherAttempts[b.targetId]={guess,passed:!!b.passed,savedAt:now};
   }else if(action==='lock'){
    if(g.status!=='open')fail('Message submission is already closed.',409);g.status='locked';
   }else if(action==='reveal'){
    if(g.status==='revealed')return response({ok:true});
    const entries=records(g);if(!entries.length)fail('Wait for at least one message before revealing.',409);
    const ids=entries.map(e=>e.studentId);
    if(!Array.isArray(b.entryIds)||JSON.stringify([...b.entryIds].sort((a,b)=>a-b))!==JSON.stringify(ids))fail('A new message arrived. Review every current message before declassifying.',409);
    if(entries.some(e=>!g.teacherAttempts[e.studentId]))fail('Enter a plaintext attempt or choose “Could not decode” for every message first.',409);
    g.status='revealed';g.revealedAt=now;
   }else if(action==='reset'){
    if(b.confirm!=='RESET')fail('Type RESET to archive this mission and start another.');
    archive={...structuredClone(state),archiveReason:'cryptology-reset'};state.crypto=fresh();
   }else fail('Unknown mission action.',404);
   changed=true;return response({ok:true});
  }
  fail('Not found.',404);
 }catch(e){state=structuredClone(input);changed=false;archive=null;return response({error:e.message},e.status||400);}
}
