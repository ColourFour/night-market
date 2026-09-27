// Shared authoritative game transitions. Browser imports this only for the labelled rehearsal.
import {ROSTER,VENUES,CALENDAR,validateChoice,validateRule,analyze} from './rules.js';
export const secret=()=>Array.from(crypto.getRandomValues(new Uint8Array(24)),n=>n.toString(16).padStart(2,'0')).join('');
const randomInt=(min,max)=>min+crypto.getRandomValues(new Uint32Array(1))[0]%(max-min);
const clone=x=>JSON.parse(JSON.stringify(x));
const fail=(message,status=400)=>{const e=new Error(message);e.status=status;throw e;};
export function handle(input,req,{siteUrl=''}={}) {
  let state=clone(input),changed=false,archive=null,recoveryNotice='';
  const url=new URL(req.url,'https://night-market.invalid'),b=req.body||{};
  const respond=(status,body,type='application/json')=>({status,body,type,state,changed,archive});
  function mutate(fn){const result=fn();changed=true;return result;}
  function valid(s) {
    if(s?.schema!==1 || typeof s.teacherKey!=='string' || !/^[a-f0-9]{48}$/.test(s.teacherKey)) throw new Error('Invalid backup format.');
    if(s.room){
      const r=s.room;
      if(!/^[A-Z2-9]{5}$/.test(r.code)||!Array.isArray(r.players)||r.players.length!==13||!['practice','revision','scored','complete'].includes(r.phase)||!['waiting','open','locked','revealed'].includes(r.status)||!Number.isInteger(r.round)||r.round<1||r.round>3||!Array.isArray(r.history)||r.history.length>6||typeof r.submissions!=='object'||!r.submissions||typeof r.roundId!=='string')throw new Error('Invalid game state.');
      r.players.forEach((p,i)=>{if(p.id!==i||typeof p.name!=='string'||p.name.length>60||typeof p.pin!=='string'||!p.policies||!p.reflections||typeof p.alias!=='string'||p.alias.length>50||!p.overrides)throw new Error('Invalid roster.');});
      Object.entries(r.submissions).forEach(([id,d])=>{if(!r.players[+id])throw new Error('Invalid seat.');validateChoice(d);});
      r.history.forEach(h=>{if(!['practice','scored'].includes(h.season)||!Array.isArray(h.decisions)||new Set(h.decisions.map(d=>d.id)).size!==13||h.decisions.some((d,i)=>d.id!==i))throw new Error('Invalid round record.');h.result=analyze(h.decisions,h.round);});
      if(new Set(r.history.map(h=>h.season+h.round)).size!==r.history.length)throw new Error('Duplicate round.');
      if(r.status==='revealed'&&!r.history.some(h=>h.season===r.phase&&h.round===r.round))throw new Error('Missing reveal record.');
    }
    return s;
  }
  function room(){return state.room||fail('Create a room first.');}
  function teacher(req){if(req.headers.authorization!==`Bearer ${state.teacherKey}`)fail('Teacher access required.',401);}
  function player(req){const r=room(), token=(req.headers.authorization||'').replace(/^Bearer /,'');return r.players.find(p=>p.token&&p.token===token)||fail('Please join again with your room and seat codes.',401);}
  const textValue=(v,label,max=2500)=>typeof v==='string'&&v.trim().length&&v.length<=max?v.trim():fail(`Enter ${label} (up to ${max} characters).`);
  function guard(r,b){if(b.roundId!==r.roundId)fail('The round changed. Refresh and try again.',409);}
  function addDecision(p,b,byTeacher=false){
    const r=room();guard(r,b);
    if(r.status!=='open'||!['practice','scored'].includes(r.phase))fail('This round is not open.',409);
    if(r.submissions[p.id])fail('Your decision is already locked.',409);
    if(!p.policies[r.phase])fail('File your policy before submitting.');
    validateChoice(b);
    const override=!!b.override;
    if(override&&p.overrides[r.phase])fail('Your one policy override for this season is already used.');
    const overrideReason=override?textValue(b.overrideReason,'your override reason',700):'';
    const proxyReason=byTeacher?textValue(b.proxyReason,'the reason for teacher entry',700):'';
    if(override)p.overrides[r.phase]=true;
    r.submissions[p.id]={id:p.id,venue:b.venue,contribution:b.contribution,override,overrideReason,proxyReason,submittedAt:new Date().toISOString()};
  }
  function rankings(r,season){const totals=r.players.map(p=>({id:p.id,alias:p.alias,total:0}));r.history.filter(h=>h.season===season).forEach(h=>h.result.rows.forEach(row=>totals[row.id].total+=row.payoff));totals.sort((a,b)=>b.total-a.total||a.id-b.id);return totals.map((x,i)=>({...x,rank:1+totals.filter(t=>t.total>x.total+1e-8).length}));}
  function view(r,p,isTeacher=false){
    const season=r.phase==='practice'?'practice':'scored';
    const out={code:r.code,phase:r.phase,status:r.status,round:r.round,roundId:r.roundId,venues:VENUES,calendar:CALENDAR,submitted:Object.keys(r.submissions).length,history:r.history.map(h=>({...h,decisions:h.decisions.map(d=>({id:d.id,venue:d.venue,contribution:d.contribution})),result:{...h.result,rows:h.result.rows.map(row=>{const x={...row,alias:r.players[row.id].alias};delete x.overrideReason;delete x.proxyReason;delete x.submittedAt;return x;})}})),roster:r.players.map(q=>({id:q.id,alias:q.alias})),leaderboards:{practice:rankings(r,'practice'),scored:rankings(r,'scored')},recoveryNotice};
    if(p){out.me={id:p.id,name:p.name,alias:p.alias,policies:p.policies,reflections:p.reflections,overrides:p.overrides};out.myDecision=r.submissions[p.id]||null;}
    if(isTeacher){out.players=r.players.map(q=>({id:q.id,name:q.name,alias:q.alias,pin:q.pin,joined:!!q.token,submitted:!!r.submissions[q.id],policies:q.policies,reflections:q.reflections,overrides:q.overrides}));out.urls=[siteUrl];}
    return out;
  }

  try {
      const route=req.method+' '+url.pathname;
      if(route==='GET /api/health')return respond(200,{ok:true});
      if(route==='GET /api/board'){const r=room();if(url.searchParams.get('code')!==r.code)fail('Room code not found.',404);return respond(200,view(r,null));}
      if(route==='GET /api/teacher'){teacher(req);return respond(200,state.room?view(room(),null,true):{empty:true,recoveryNotice,defaultRoster:ROSTER});}
      if(route==='GET /api/state')return respond(200,view(room(),player(req)));
      if(route==='POST /api/lookup'){
        const r=room();if(b.code!==r.code)fail('Room code not found.',404);
        return respond(200,{players:r.players.map(p=>({id:p.id,name:p.alias}))});
      }
      if(route==='POST /api/join'){
        const r=room();if(b.code!==r.code)fail('Room code not found.',404);
        const p=r.players.find(p=>p.id===b.id);if(!p||p.pin!==b.pin)fail('Check your seat code with your teacher.',401);
        return respond(200,mutate(()=>{p.token=secret();return {token:p.token};}));
      }
      if(route==='POST /api/policy'){
        const p=player(req),r=room();guard(r,b);
        const season=r.phase==='revision'?'scored':'practice';
        if(!((r.phase==='practice'&&r.round===1&&r.status==='waiting')||r.phase==='revision'))fail('Policies are closed.');
        if(p.policies[season])fail('Your policy is already preregistered.');
        const policy={policy:textValue(b.policy,'your policy'),prediction:textValue(b.prediction,'your prediction'),fallback:textValue(b.fallback,'your fallback'),rationale:season==='scored'?textValue(b.rationale,'what changed and why'):'',filedAt:new Date().toISOString()};
        return respond(200,mutate(()=>{p.policies[season]=policy;return {ok:true};}));
      }
      if(route==='POST /api/decision'){const p=player(req);return respond(200,mutate(()=>{addDecision(p,b);return {ok:true};}));}
      if(route==='POST /api/reflection'){
        const p=player(req),r=room();if(!r.history.some(h=>h.id===b.historyId))fail('Choose a revealed round.');
        return respond(200,mutate(()=>{p.reflections[b.historyId]={text:textValue(b.text,'your reflection'),updatedAt:new Date().toISOString()};return {ok:true};}));
      }
      if(route==='POST /api/sandbox'){
        if(req.headers.authorization!==`Bearer ${state.teacherKey}`)player(req);
        const r=room();validateRule(b.rule);if(!['practice','scored'].includes(b.season))fail('Choose a season.');
        const histories=r.history.filter(h=>h.season===b.season);if(!histories.length)fail('Reveal a round first.');
        return respond(200,{rule:b.rule,season:b.season,rounds:histories.map(h=>({round:h.round,before:h.result,after:analyze(h.decisions,h.round,b.rule)}))});
      }
      if(route==='GET /api/export'){
        teacher(req);const r=room();
        if(url.searchParams.get('type')==='recovery')return respond(200,state);
        const exported={schema:1,rules:{venues:VENUES,calendar:CALENDAR,formula:'base - crowding + 4 - contribution + totalContribution / 5'},roomCode:r.code,phase:r.phase,students:r.players.map(({id,name,alias,policies,reflections})=>({id,name,alias,policies,reflections})),history:r.history};
        if(url.searchParams.get('type')==='csv'){
          const rows=[['season','round','id','name','alias','venue','contribution','base','crowding','credits_kept','lantern_benefit','score','best_score','regret','policy_override','override_reason','teacher_entry_reason','policy','prediction','fallback','revision_rationale','reflection']];
          r.history.forEach(h=>h.result.rows.forEach(x=>{const p=r.players[x.id],d=h.decisions[x.id],policy=p.policies[h.season];rows.push([h.season,h.round,x.id+1,p.name,p.alias,VENUES[x.venue],x.contribution,x.base,x.crowding,x.kept,x.lantern,x.payoff,x.bestPayoff,x.regret,d.override,d.overrideReason,d.proxyReason,policy?.policy,policy?.prediction,policy?.fallback,policy?.rationale,p.reflections[h.id]?.text]);}));
          const csv=rows.map(row=>row.map(x=>{let s=String(x??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}).join(',')).join('\r\n');return respond(200,'\ufeff'+csv,'text/csv');
        }return respond(200,exported);
      }
      if(req.method==='POST'&&url.pathname.startsWith('/api/admin/')){
        teacher(req);const action=url.pathname.slice('/api/admin/'.length);
        if(action==='create')return respond(200,mutate(()=>{
          if(state.room)fail('Archive and reset the current room first.');
          const names=b.names||ROSTER;if(!Array.isArray(names)||names.length!==13||new Set(names.map(n=>String(n).trim())).size!==13)fail('Enter 13 distinct student names.');
          const code=Array.from(crypto.getRandomValues(new Uint8Array(5)),n=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n%31]).join('');
          state.room={code,phase:'practice',status:'waiting',round:1,roundId:secret(),submissions:{},history:[],players:names.map((name,id)=>({id,name:textValue(name,'a student name',60),alias:`Founder ${String(id+1).padStart(2,'0')}`,pin:randomInt(100000,1000000).toString(),token:null,policies:{},reflections:{},overrides:{practice:false,scored:false}}))};return {ok:true};
        }));
        if(action==='restore')return respond(200,mutate(()=>{
          const restored=valid(clone(b.backup));archive=clone(state);restored.teacherKey=state.teacherKey;state=restored;recoveryNotice='Recovery file loaded. Check the round and ask students to refresh.';return {ok:true};
        }));
        const r=room();guard(r,b);
        return respond(200,mutate(()=>{
          if(action==='open'){
            if(r.status!=='waiting'||!['practice','scored'].includes(r.phase))fail('This round cannot open yet.');
            if(r.players.some(p=>!p.policies[r.phase]))fail('All 13 policies must be preregistered first.');r.status='open';
          }else if(action==='lock'){
            if(r.status!=='open')fail('Only an open round can be locked.');r.status='locked';
          }else if(action==='reopen'){
            if(r.status!=='locked')fail('Only a locked round can reopen.');r.status='open';
          }else if(action==='reveal'){
            if(r.status!=='locked'||Object.keys(r.submissions).length!==13)fail('Lock the round with all 13 submissions before revealing.');
            const decisions=r.players.map(p=>r.submissions[p.id]);r.history.push({id:r.roundId,season:r.phase,round:r.round,revealedAt:new Date().toISOString(),decisions,result:analyze(decisions,r.round)});r.status='revealed';
          }else if(action==='advance'){
            if(r.status!=='revealed')fail('Reveal this round first.');
            if(r.round<3)r.round++;else if(r.phase==='practice'){r.phase='revision';r.round=1;}else r.phase='complete';
            r.status='waiting';r.submissions={};r.roundId=secret();
          }else if(action==='startScored'){
            if(r.phase!=='revision'||r.players.some(p=>!p.policies.scored))fail('All 13 revised policies must be preregistered first.');
            r.phase='scored';r.round=1;r.status='waiting';r.roundId=secret();
          }else if(action==='proxy'){
            const p=r.players.find(p=>p.id===b.id);if(!p)fail('Choose a student.');addDecision(p,b,true);
          }else if(action==='recoverSeat'){
            const p=r.players.find(p=>p.id===b.id);if(!p)fail('Choose a student.');p.token=null;p.pin=randomInt(100000,1000000).toString();
          }else if(action==='reset'){
            if(b.confirm!==r.code)fail('Type the room code to confirm reset.');
            archive=clone(state);state.room=null;
          }else fail('Unknown action.',404);
          return {ok:true};
        }));
      }
      fail('Not found.',404);
  }catch(e){return {status:e.status||400,body:{error:e.message},type:'application/json',state:input,changed:false,archive:null};}
}
