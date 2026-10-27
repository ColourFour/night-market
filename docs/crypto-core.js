// Operation Cipher: the server owns secrets, attempt records, and the reveal boundary.
import {pairSecret} from './pairs-core.js';
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
export const normalizePlaintext=value=>String(value??'').normalize('NFKC').toLowerCase().replace(/[\p{P}\p{Z}\s]/gu,'');
export const plaintextMatches=(guess,answer)=>!!normalizePlaintext(guess)&&normalizePlaintext(guess)===normalizePlaintext(answer);
const field=(value,label,max,preserveLayout=false)=>{if(typeof value!=='string'||!value.trim()||value.length>max)fail(`${label} must contain 1–${max} characters.`);return preserveLayout?value:value.trim();};
export const CRYPTO_CHECK_LIMITS=Object.freeze({soft:2,definitive:1});
// Broad edit-distance bands give direction without revealing letters, positions, percentages or an exact verdict.
export function softFeedback(guess,answer){
 const a=Array.from(normalizePlaintext(guess)),b=Array.from(normalizePlaintext(answer));
 let previous=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){const row=[i];for(let j=1;j<=b.length;j++)row[j]=Math.min(row[j-1]+1,previous[j]+1,previous[j-1]+(a[i-1]===b[j-1]?0:1));previous=row;}
 const closeness=1-previous[b.length]/Math.max(a.length,b.length,1);
 return closeness>=.8?'Very close':closeness>=.5?'Partly close':'Try a different approach';
}
const checkHistory=(g,key)=>g.checks?.[key]||[];
function checkView(g,key){const history=checkHistory(g,key);return {softRemaining:CRYPTO_CHECK_LIMITS.soft-history.filter(c=>c.kind==='soft').length,definitiveRemaining:CRYPTO_CHECK_LIMITS.definitive-history.filter(c=>c.kind==='definitive').length,solved:history.some(c=>c.kind==='definitive'&&c.correct),history};}
const records=g=>Object.values(g.entries).sort((a,b)=>a.studentId-b.studentId);
const snapshot=(entry,g)=>({studentId:entry.studentId,name:entry.name,ciphertext:entry.ciphertext,submittedAt:entry.submittedAt});
export function cryptoResults(g){
 return records(g).map(e=>{
  const teacher=g.teacherAttempts[e.studentId],peers=Object.values(g.guesses).filter(a=>a.targetId===e.studentId).sort((a,b)=>a.studentId-b.studentId).map(a=>{const key=`${a.studentId}:${e.studentId}`,history=checkHistory(g,key);return {...a,correct:plaintextMatches(a.guess,e.plaintext),hintRequested:!!g.hintRequests?.[key],hintUsed:!!g.hintRequests?.[key]?.viewedAt,checksUsed:history.length,checks:history.map(c=>({...c,correct:plaintextMatches(c.guess,e.plaintext)}))};});
  return {...snapshot(e,g),rule:e.rule,plaintext:e.plaintext,hint:g.hints?.[e.studentId]?.text||null,hintRequests:Object.values(g.hintRequests||{}).filter(r=>r.targetId===e.studentId).map(r=>({...r})),teacher:{reviewed:!!teacher,guess:teacher?.guess||'',passed:!!teacher?.passed,correct:!teacher?.passed&&!!teacher&&plaintextMatches(teacher.guess,e.plaintext)},peers,decodedByPeers:peers.filter(a=>a.correct).length};
 });
}
export function cryptoSummary(g,players=[]){
 const results=cryptoResults(g),people=new Map(players.map(p=>[p.id,{studentId:p.id,name:p.name}]));
 for(const e of records(g))people.set(e.studentId,{studentId:e.studentId,name:e.name});
 for(const guess of Object.values(g.guesses))if(!people.has(guess.studentId))people.set(guess.studentId,{studentId:guess.studentId,name:guess.name});
 const rows=[...people.values()].sort((a,b)=>a.studentId-b.studentId).map(p=>{
  const entry=results.find(e=>e.studentId===p.studentId),attempts=results.flatMap(e=>e.peers.filter(a=>a.studentId===p.studentId)),checks=Object.entries(g.checks||{}).filter(([key])=>key.startsWith(p.studentId+':')).flatMap(([,list])=>list),requests=Object.values(g.hintRequests||{}).filter(r=>r.studentId===p.studentId);
  return {...p,submitted:!!entry,teacherStatus:!entry?'not_submitted':!entry.teacher.reviewed?'not_reviewed':entry.teacher.passed?'passed':entry.teacher.correct?'matched':'not_matched',peerGuessesReceived:entry?.peers.length||0,peersDecodedMessage:entry?.decodedByPeers||0,othersAttempted:attempts.length,othersSolved:attempts.filter(a=>a.correct).length,hintsRequested:requests.length,hintsViewed:requests.filter(r=>r.viewedAt).length,softChecks:checks.filter(c=>c.kind==='soft').length,definitiveChecks:checks.filter(c=>c.kind==='definitive').length};
 });
 return {students:rows,registered:rows.length,submitted:results.length,teacherReviewed:results.filter(e=>e.teacher.reviewed).length,teacherMatched:results.filter(e=>e.teacher.correct).length,peerGuesses:results.reduce((n,e)=>n+e.peers.length,0),peerCorrect:results.reduce((n,e)=>n+e.decodedByPeers,0)};
}
export function cryptoSummaryCsv(summary){
 const rows=[['student','cipher_submitted','teacher_result','classmates_correct','classmate_guesses','others_solved','others_attempted','hints_requested','hints_viewed','soft_checks','definitive_checks']];
 for(const p of summary.students)rows.push([p.name,p.submitted,p.teacherStatus,p.peersDecodedMessage,p.peerGuessesReceived,p.othersSolved,p.othersAttempted,p.hintsRequested,p.hintsViewed,p.softChecks,p.definitiveChecks]);
 const cell=v=>{let t=String(v);if(/^(?:\s*[=+@-]|[\t\r])/.test(t))t="'"+t;return '"'+t.replaceAll('"','""')+'"';};
 return '\ufeff'+rows.map(row=>row.map(cell).join(',')).join('\r\n');
}
export function cryptoArchiveReport(row){
 const g=row.game?.crypto;if(!g?.id)return null;
 return {archiveId:row.id,missionId:g.id,savedAt:row.saved_at,openedAt:g.openedAt,endedAt:g.endedAt||g.revealedAt||null,status:g.status==='revealed'?'finished':'archived_before_end',archiveReason:row.game.archiveReason,summary:g.finalSummary||cryptoSummary(g,row.game.pairs?.players||[]),results:cryptoResults(g)};
}
export function cryptoArchiveList(rows){
 const seen=new Set(),items=[];
 for(const row of rows){const report=cryptoArchiveReport(row);if(!report||seen.has(report.missionId))continue;seen.add(report.missionId);items.push({archiveId:report.archiveId,missionId:report.missionId,savedAt:report.savedAt,openedAt:report.openedAt,endedAt:report.endedAt,status:report.status,submitted:report.summary.submitted,teacherMatched:report.summary.teacherMatched,peerCorrect:report.summary.peerCorrect,peerGuesses:report.summary.peerGuesses});}
 return {items};
}
export function cryptoCsv(results){
 const rows=[['author','ciphertext','rule','actual_plaintext','decoder','guess','correct','passed','hint_requested','hint_used','soft_checks','definitive_checks']];
 for(const e of results){rows.push([e.name,e.ciphertext,e.rule,e.plaintext,'Teacher',e.teacher.guess,e.teacher.correct,e.teacher.passed,'','','','']);for(const p of e.peers)rows.push([e.name,e.ciphertext,e.rule,e.plaintext,p.name,p.guess,p.correct,false,p.hintRequested,p.hintUsed,p.checks.filter(c=>c.kind==='soft').length,p.checks.filter(c=>c.kind==='definitive').length]);}
 const safe=v=>{let s=String(v);if(/^(?:\s*[=+@-]|[\t\r])/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
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
 const fresh=()=>({id:pairSecret(),status:'open',openedAt:now,revealedAt:null,entries:{},guesses:{},teacherAttempts:{},hints:{},hintRequests:{},checks:{}});
 const owner=(g,p)=>{const entry=g.entries[p.id];if(entry&&entry.name!==p.name)fail('The class roster changed. Ask your teacher to start a new mission.',409);return entry;};
 function view(g,p=null,isTeacher=false){
  const entries=records(g),out={id:g.id,status:g.status,submitted:entries.length,total:state.pairs?.players.length||0,openedAt:g.openedAt,revealedAt:g.revealedAt,endedAt:g.endedAt||g.revealedAt||null,serverNow:now,checkLimits:CRYPTO_CHECK_LIMITS};
  if(p){const entry=owner(g,p);out.me={id:p.id,name:p.name,entry:entry?{...snapshot(entry,g),rule:entry.rule,plaintext:entry.plaintext}:null};
   if(entry||g.status==='revealed')out.messages=entries.filter(e=>e.studentId!==p.id).map(e=>{const key=`${p.id}:${e.studentId}`,request=g.hintRequests?.[key],hint=g.hints?.[e.studentId];return {...snapshot(e,g),myGuess:g.guesses[key]?.guess??null,hint:{requested:!!request,available:!!hint?.text,text:request?.viewedAt?hint?.text||null:null},checks:checkView(g,key)};});
   else out.messages=[];
   out.myGuessCount=Object.values(g.guesses).filter(a=>a.studentId===p.id&&a.name===p.name).length;
  }
  if(isTeacher){out.reviewed=entries.filter(e=>g.teacherAttempts[e.studentId]).length;
   out.entries=entries.map(e=>({...snapshot(e,g),rule:e.rule,attempt:g.teacherAttempts[e.studentId]||null,hint:g.hints?.[e.studentId]?.text||'',hintRequests:Object.values(g.hintRequests||{}).filter(r=>r.targetId===e.studentId).length}));
   out.guessCount=Object.keys(g.guesses).length;out.hintRequestCount=Object.keys(g.hintRequests||{}).length;out.checkCount=Object.values(g.checks||{}).reduce((n,list)=>n+list.length,0);
   out.seats=(state.pairs?.players||[]).map(p=>({id:p.id,name:p.name,submitted:!!g.entries[p.id]&&g.entries[p.id].name===p.name,reviewed:!!g.teacherAttempts[p.id],guesses:Object.values(g.guesses).filter(a=>a.studentId===p.id).length}));
  }
  if(g.status==='revealed'){out.results=cryptoResults(g);out.summary=g.finalSummary||cryptoSummary(g,state.pairs?.players||[]);}
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
   const rule=field(b.rule,'Your rule',2000),ciphertext=field(b.ciphertext,'Your encoded message',1200,true),plaintext=field(b.plaintext,'The true message',1200);
   if(!normalizePlaintext(plaintext))fail('The true message must contain more than spaces or punctuation.');
   g.entries[p.id]={studentId:p.id,name:p.name,rule,ciphertext,plaintext,submittedAt:now};changed=true;return response({ok:true});
  }
  if(['POST /api/crypto/guess','POST /api/crypto/check','POST /api/crypto/hint'].includes(route)){
   const p=student(),g=game();guard(g);if(!['open','locked'].includes(g.status))fail('The reveal has begun. Guesses, hints and checks are now closed.',409);
   if(!owner(g,p))fail('Submit your own rule and message before decoding other messages.',403);
   if(!Number.isInteger(b.targetId)||!g.entries[b.targetId])fail('Choose a submitted message.');
   if(b.targetId===p.id)fail('Choose a classmate’s message, not your own.');
   const key=`${p.id}:${b.targetId}`,entry=g.entries[b.targetId];
   if(route==='POST /api/crypto/hint'){
    const hint=g.hints?.[b.targetId]?.text||null;
    g.hintRequests??={};const request=g.hintRequests[key];
    if(!request){g.hintRequests[key]={studentId:p.id,name:p.name,targetId:b.targetId,requestedAt:now,viewedAt:hint?now:null};changed=true;}
    else if(hint&&!request.viewedAt){request.viewedAt=now;changed=true;}
    return response({ok:true,hint,waiting:!hint});
   }
   const guess=field(b.guess,'Your guess',1200);
   if(!normalizePlaintext(guess))fail('Enter a guess containing more than spaces or punctuation.');
   const history=checkHistory(g,key),solved=history.find(c=>c.kind==='definitive'&&c.correct);
   if(solved&&!plaintextMatches(guess,solved.guess))fail('You already decoded this message. Your correct answer is saved.',409);
   if(route==='POST /api/crypto/check'){
    if(!['soft','definitive'].includes(b.kind))fail('Choose a soft or definitive check.');
    const previous=history.find(c=>c.kind===b.kind&&normalizePlaintext(c.guess)===normalizePlaintext(guess));
    if(previous)return response({ok:true,result:previous,checks:checkView(g,key)});
    if(history.filter(c=>c.kind===b.kind).length>=CRYPTO_CHECK_LIMITS[b.kind])fail(`No ${b.kind} checks remain for this message. You can still save a final guess.`,409);
    if(solved)fail('You already decoded this message. Your correct answer is saved.',409);
    const result={kind:b.kind,guess,checkedAt:now,hintUsed:!!g.hintRequests?.[key]?.viewedAt,...(b.kind==='soft'?{feedback:softFeedback(guess,entry.plaintext)}:{correct:plaintextMatches(guess,entry.plaintext)})};
    g.checks??={};g.checks[key]=[...history,result];
    g.guesses[key]={studentId:p.id,name:p.name,targetId:b.targetId,guess,savedAt:now};changed=true;
    return response({ok:true,result,checks:checkView(g,key)});
   }
   g.guesses[key]={studentId:p.id,name:p.name,targetId:b.targetId,guess,savedAt:now};changed=true;return response({ok:true});
  }
  if(route==='GET /api/crypto/export'){
   const g=game();if(g.status!=='revealed')fail('Declassify the mission before exporting its answers.',409);
   const results=cryptoResults(g),summary=g.finalSummary||cryptoSummary(g,state.pairs?.players||[]);if(url.searchParams.get('type')==='summary')return response(cryptoSummaryCsv(summary),200,'text/csv');return url.searchParams.get('type')==='csv'?response(cryptoCsv(results),200,'text/csv'):response({summary,openedAt:g.openedAt,endedAt:g.endedAt||g.revealedAt,game:'Cryptology / Operation Cipher',id:g.id,revealedAt:g.revealedAt,matching:'Case, whitespace and punctuation ignored; symbols and letters retained.',results});
  }
  if(req.method==='POST'&&url.pathname.startsWith('/api/crypto/admin/')){
   const action=url.pathname.split('/').at(-1);
   if(action==='open'){if(state.crypto)fail('A mission already exists. Start a new mission to replace it.',409);state.crypto=fresh();changed=true;return response({ok:true});}
   const g=game();guard(g);
   if(action==='hint'){
    if(g.status==='revealed')fail('Hints are closed after the reveal.',409);
    if(!Number.isInteger(b.targetId)||!g.entries[b.targetId])fail('Choose a submitted message.');
    const text=field(b.hint,'Your hint',600);g.hints??={};g.hints[b.targetId]={text,updatedAt:now};
   }else if(action==='decode'){
    if(g.status==='revealed')fail('Decoding is closed after the reveal.',409);
    if(!Number.isInteger(b.targetId)||!g.entries[b.targetId])fail('Choose a submitted message.');
    if(b.passed!==undefined&&typeof b.passed!=='boolean')fail('Choose a valid decoding status.');
    const guess=b.passed?'':field(b.guess,'Your plaintext attempt',1200);
    g.teacherAttempts[b.targetId]={guess,passed:!!b.passed,savedAt:now};
   }else if(action==='lock'){
    if(g.status!=='open')fail('Message submission is already closed.',409);g.status='locked';
   }else if(action==='end'){
    if(g.status==='revealed')return response({ok:true});
    const ids=records(g).map(e=>e.studentId);
    if(!Array.isArray(b.entryIds)||JSON.stringify([...b.entryIds].sort((a,b)=>a-b))!==JSON.stringify(ids))fail('A new message arrived. Check the updated submission list and press End assessment again.',409);
    g.status='revealed';g.revealedAt=now;g.endedAt=now;g.finalSummary=cryptoSummary(g,state.pairs?.players||[]);
    archive={...structuredClone(state),archiveReason:'cryptology-ended'};
   }else if(action==='reveal'){
    if(g.status==='revealed')return response({ok:true});
    const entries=records(g);if(!entries.length)fail('Wait for at least one message before revealing.',409);
    const ids=entries.map(e=>e.studentId);
    if(!Array.isArray(b.entryIds)||JSON.stringify([...b.entryIds].sort((a,b)=>a-b))!==JSON.stringify(ids))fail('A new message arrived. Review every current message before declassifying.',409);
    if(entries.some(e=>!g.teacherAttempts[e.studentId]))fail('Enter a plaintext attempt or choose “Could not decode” for every message first.',409);
    g.status='revealed';g.revealedAt=now;g.finalSummary=cryptoSummary(g,state.pairs?.players||[]);
   }else if(action==='reset'){
    if(b.confirm!=='RESET')fail('Type RESET to archive this mission and start another.');
    archive={...structuredClone(state),archiveReason:'cryptology-reset'};state.crypto=fresh();
   }else fail('Unknown mission action.',404);
   changed=true;return response({ok:true});
  }
  fail('Not found.',404);
 }catch(e){state=structuredClone(input);changed=false;archive=null;return response({error:e.message},e.status||400);}
}
