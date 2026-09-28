// Contribute / Take: one simultaneous two-player decision per timed class round.
export const pairSecret=()=>Array.from(crypto.getRandomValues(new Uint8Array(24)),n=>n.toString(16).padStart(2,'0')).join('');
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
export function pairPayoff(a,b){
 if(!['contribute','take'].includes(a)||!['contribute','take'].includes(b))fail('Choose Contribute or Take.');
 return a==='contribute'?(b==='contribute'?[5,5]:[0,6]):(b==='contribute'?[6,0]:[2,2]);
}
export function pairings(count,round,mode='rotate'){
 if(!Number.isInteger(count)||count<2||count>40||!Number.isInteger(round)||round<1)fail('Invalid pairing schedule.');
 const ring=Array.from({length:count},(_,i)=>i);if(count%2)ring.splice(count-1,0,null);
 const turns=mode==='fixed'?0:(round-1)%(ring.length-1);
 for(let k=0;k<turns;k++)ring.splice(1,0,ring.pop());
 return Array.from({length:ring.length/2},(_,i)=>[ring[i],ring[ring.length-1-i]]);
}
function settings(b){
 const rounds=Number(b.rounds),seconds=Number(b.seconds),rotation=b.rotation||'rotate',missing=b.missing||'pause';
 if(!Number.isInteger(rounds)||rounds<1||rounds>100)fail('Choose 1–100 rounds.');
 if(!Number.isInteger(seconds)||seconds<5||seconds>600)fail('Choose a timer from 5 to 600 seconds.');
 if(!['rotate','fixed'].includes(rotation)||!['pause','take'].includes(missing))fail('Choose valid round settings.');
 return {rounds,seconds,rotation,missing};
}
const rosterNames=names=>{
 if(!Array.isArray(names)||names.length<2||names.length>40||names.some(n=>typeof n!=='string'||!n.trim()||n.length>60)||new Set(names.map(n=>n.trim())).size!==names.length)fail('Enter 2–40 distinct student names, one per line.');
 return names.map(n=>n.trim());
};
const pin=()=>String(100000+crypto.getRandomValues(new Uint32Array(1))[0]%900000);
export function handlePairs(input,req,{now=Date.now(),siteUrl=''}={}){
 let state=structuredClone(input),changed=false,archive=null,checkpoint=state,clockChanged=false;
 const url=new URL(req.url,'https://pairs.invalid'),b=req.body||{},route=req.method+' '+url.pathname;
 const token=(req.headers.authorization||'').replace(/^Bearer /,'');
 const teacher=()=>{if(token!==state.teacherKey)fail('Teacher access required.',401);};
 const room=()=>state.pairs||fail('Your teacher has not opened a paired game yet.',404);
 const player=()=>room().players.find(p=>p.token&&p.token===token)||fail('Please join again with your name and seat code.',401);
 const guard=r=>{if(b.roundId!==r.roundId)fail('The round has changed. Refresh and try again.',409);};
 const pairs=r=>pairings(r.players.length,r.round,r.settings.rotation);
 const active=r=>pairs(r).flatMap(pair=>pair.includes(null)?[]:pair);
 const complete=r=>active(r).every(id=>r.choices[id]);
 const publicChoice=d=>d?{choice:d.choice,automatic:!!d.automatic}:null;
 function reveal(r){
  if(!complete(r))fail('Wait for the missing choices before revealing.');
  const results=pairs(r).map(([a,b])=>{
   if(a===null||b===null)return {a:a??b,b:null,bye:true,scoreA:0,scoreB:0};
   const [scoreA,scoreB]=pairPayoff(r.choices[a].choice,r.choices[b].choice);
   return {a,b,choiceA:r.choices[a].choice,choiceB:r.choices[b].choice,automaticA:!!r.choices[a].automatic,automaticB:!!r.choices[b].automatic,scoreA,scoreB};
  });
  r.history.push({round:r.round,id:r.roundId,revealedAt:now,results});r.status='revealed';changed=true;
 }
 function expire(r){
  if(r.status!=='open'||now<r.deadline)return;
  if(r.settings.missing==='take')for(const id of active(r))if(!r.choices[id])r.choices[id]={choice:'take',automatic:true,at:now};
  if(complete(r))reveal(r);else {r.status='paused';changed=true;}
 }
 function standings(r){
  const rows=r.players.map(p=>({id:p.id,name:p.name,total:0,played:0,byes:0}));
  for(const h of r.history)for(const x of h.results){if(x.bye){rows[x.a].byes++;continue;}rows[x.a].total+=x.scoreA;rows[x.b].total+=x.scoreB;rows[x.a].played++;rows[x.b].played++;}
  rows.sort((a,b)=>b.total-a.total||a.id-b.id);
  return rows.map(x=>({...x,rank:1+rows.filter(y=>y.total>x.total).length}));
 }
 function view(r,p=null,isTeacher=false){
  const standingsRows=standings(r),out={code:r.code,round:r.round,roundId:r.roundId,status:r.status,settings:r.settings,deadline:r.deadline,serverNow:now,players:r.players.map(p=>({id:p.id,name:p.name,joined:!!p.token})),pairs:pairs(r),submitted:active(r).filter(id=>r.choices[id]).length,expected:active(r).length,history:r.history,standings:standingsRows};
  if(p){const pair=pairs(r).find(x=>x.includes(p.id)),other=pair.find(id=>id!==p.id);out.me={id:p.id,name:p.name,...standingsRows.find(x=>x.id===p.id)};out.opponent=other===null?null:{id:other,name:r.players[other].name};out.myChoice=publicChoice(r.choices[p.id]);}
  if(isTeacher){out.seats=r.players.map(p=>({id:p.id,name:p.name,pin:p.pin,joined:!!p.token,submitted:!!r.choices[p.id],bye:!active(r).includes(p.id)}));out.siteUrl=siteUrl;}
  return out;
 }
 const response=(body,status=200)=>({status,body,type:'application/json',state,changed,archive});
 try{
  // Check authorization before a request can advance the server clock or reveal data.
  if(url.pathname.startsWith('/api/pairs/admin/')||url.pathname==='/api/pairs/teacher'||url.pathname==='/api/pairs/export')teacher();
  else if(['/api/pairs/state','/api/pairs/choice'].includes(url.pathname))player();
  else if(!['/api/pairs/lookup','/api/pairs/join','/api/pairs/lobby'].includes(url.pathname))fail('Not found.',404);
  if(route==='GET /api/pairs/lobby')return response(state.pairs?{code:state.pairs.code,players:state.pairs.players.map(p=>({id:p.id,name:p.name,joined:!!p.token}))}:{empty:true,players:[]});
  if(state.pairs)expire(state.pairs);
  clockChanged=changed;checkpoint=structuredClone(state);
  if(route==='GET /api/pairs/teacher')return response(state.pairs?view(room(),null,true):{empty:true,serverNow:now,defaultRoster:state.room?.players.map(p=>p.name)||Array.from({length:13},(_,i)=>`Student ${i+1}`)});
  if(route==='POST /api/pairs/lookup'){
   const r=room();if(b.code!==r.code)fail('Room code not found.',404);
   return response({players:r.players.map(p=>({id:p.id,name:p.name}))});
  }
  if(route==='POST /api/pairs/join'){
   const r=room();if(b.code!==r.code)fail('Room code not found.',404);
   const p=r.players.find(p=>p.id===b.id);if(!p)fail('Choose your name from the list.');
   if(b.pin!==undefined){if(p.pin!==b.pin)fail('Check your private seat code with your teacher.',401);}
   else if(p.token)fail('This name has already joined. Ask your teacher to free the seat if it is yours.',409);
   p.token=pairSecret();changed=true;return response({token:p.token});
  }
  if(route==='GET /api/pairs/state')return response(view(room(),player()));
  if(route==='POST /api/pairs/choice'){
   const r=room(),p=player();guard(r);
   if(r.status!=='open'||now>=r.deadline)fail('Time is up. Your teacher can give extra time for missing choices.',409);
   if(!active(r).includes(p.id))fail('You are sitting out this round.',409);
   if(r.choices[p.id])fail('Your choice is already locked.',409);
   if(!['contribute','take'].includes(b.choice))fail('Choose Contribute or Take.');
   r.choices[p.id]={choice:b.choice,at:now,automatic:false};changed=true;return response({ok:true});
  }
  if(route==='GET /api/pairs/export'){
   const r=room(),type=url.searchParams.get('type');
   if(type==='recovery')return response({kind:'pairs-recovery',version:1,room:r});
   if(type==='csv'){
    const rows=[['round','student','opponent','choice','opponent_choice','points','running_total','automatic','bye']],totals={};
    for(const h of r.history)for(const x of h.results){
     if(x.bye){rows.push([h.round,r.players[x.a].name,'','','',0,totals[x.a]||0,false,true]);continue;}
     for(const side of ['A','B']){const id=side==='A'?x.a:x.b,other=side==='A'?x.b:x.a,opposite=side==='A'?'B':'A';totals[id]=(totals[id]||0)+x['score'+side];rows.push([h.round,r.players[id].name,r.players[other].name,x['choice'+side],x['choice'+opposite],x['score'+side],totals[id],x['automatic'+side],false]);}
    }
    const csv=rows.map(row=>row.map(value=>{let s=String(value);if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}).join(',')).join('\r\n');
    return {...response('\ufeff'+csv),type:'text/csv'};
   }
   return response({game:'Contribute / Take',matrix:[[5,5],[0,6],[6,0],[2,2]],...view(r)});
  }
  if(req.method==='POST'&&url.pathname.startsWith('/api/pairs/admin/')){
   const action=url.pathname.split('/').at(-1);
   if(action==='create'){
    if(state.pairs)fail('Reset the existing paired game before creating another.');
    const names=rosterNames(b.names),config=settings(b);
    state.pairs={code:Array.from(crypto.getRandomValues(new Uint8Array(5)),n=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n%31]).join(''),settings:config,status:'waiting',round:1,roundId:pairSecret(),deadline:null,choices:{},history:[],players:names.map((name,id)=>({id,name,pin:pin(),token:null}))};changed=true;return response({ok:true});
   }
   if(action==='restore'){
    const recovered=structuredClone(b.backup);
    if(recovered?.kind!=='pairs-recovery'||recovered.version!==1)fail('Choose a paired-game recovery file.');
    const r=recovered.room;if(!r||!Array.isArray(r.players)||!Array.isArray(r.history)||r.history.length>100||!r.choices||typeof r.roundId!=='string'||!Number.isInteger(r.round)||r.round<1)fail('Invalid recovery file.');
    rosterNames(r.players.map(p=>p.name));settings(r.settings);
    if(r.round>r.settings.rounds||!['waiting','open','paused','revealed','complete'].includes(r.status)||!(/^[A-Z2-9]{5}$/).test(r.code))fail('Invalid recovery state.');
    r.players.forEach((p,i)=>{if(p.id!==i||!/^\d{6}$/.test(p.pin)||(p.token!==null&&!/^[a-f0-9]{48}$/.test(p.token)))fail('Invalid recovery roster.');});
    for(const [id,c] of Object.entries(r.choices)){if(!r.players[Number(id)]||!['contribute','take'].includes(c.choice))fail('Invalid recovered choice.');}
    r.history.forEach((h,i)=>{
     if(h.round!==i+1||!Array.isArray(h.results))fail('Invalid recovery history.');
     const expected=pairings(r.players.length,h.round,r.settings.rotation);if(h.results.length!==expected.length)fail('Invalid recovery pairings.');
     h.results.forEach((x,j)=>{const [a,b]=expected[j];if(a===null||b===null){if(!x.bye||x.a!==(a??b)||x.b!==null)fail('Invalid bye.');x.scoreA=0;x.scoreB=0;}else{if(x.a!==a||x.b!==b||x.bye)fail('Invalid opponents.');[x.scoreA,x.scoreB]=pairPayoff(x.choiceA,x.choiceB);}});
    });
    if(r.history.length!==r.round-(r.status==='revealed'||r.status==='complete'?0:1))fail('Recovery round does not match history.');
    // Recovery never resumes an expired timer without the teacher deciding what to do.
    if(r.status==='open'){r.status='paused';r.deadline=null;}
    archive=structuredClone(state);state.pairs=r;changed=true;return response({ok:true});
   }
   const r=room();guard(r);
   if(action==='configure'){
    if(r.status!=='waiting'||r.history.length)fail('Set rounds and timer before the first round.');r.settings=settings(b);
   }else if(action==='open'){
    if(r.status!=='waiting')fail('Advance to a new round first.');r.status='open';r.deadline=now+r.settings.seconds*1000;
   }else if(action==='extend'){
    if(!['paused','open'].includes(r.status))fail('Only an unfinished round can get extra time.');r.status='open';r.deadline=now+r.settings.seconds*1000;
   }else if(action==='reveal'){
    if(!['paused','open'].includes(r.status))fail('This round cannot be revealed again.');reveal(r);
   }else if(action==='advance'){
    if(r.status!=='revealed')fail('Reveal this round first.');
    if(r.round===r.settings.rounds)r.status='complete';else {r.round++;r.status='waiting';r.choices={};r.deadline=null;r.roundId=pairSecret();}
   }else if(action==='recoverSeat'){
    const p=r.players.find(p=>p.id===b.id);if(!p)fail('Choose a student.');p.token=null;p.pin=pin();
   }else if(action==='reset'){
    if(b.confirm!==r.code)fail('Type the room code to confirm.');archive=structuredClone(state);state.pairs=null;
   }else fail('Unknown action.',404);
   changed=true;return response({ok:true});
  }
  fail('Not found.',404);
 }catch(e){state=checkpoint;changed=clockChanged;archive=null;return response({error:e.message},e.status||400);}
}
