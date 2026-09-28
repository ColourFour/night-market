// Shared scoring engine for Economic Zones. Half-points are exact binary values.
export const ZONES=[
 {name:'Industrial Fringe',value:1,tag:'Heavy industry · worn infrastructure'},
 {name:'Transit Sector',value:2,tag:'Commuter networks · crowded streets'},
 {name:'Commercial Strip',value:3,tag:'Shops · services · everyday commerce'},
 {name:'Innovation District',value:4,tag:'Research · technology · new capital'},
 {name:'Skyline Core',value:5,tag:'Finance · luxury · global connections'}
];
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const secret=()=>Array.from(crypto.getRandomValues(new Uint8Array(18)),x=>x.toString(16).padStart(2,'0')).join('');
export function validateAllocation(a,budget=100){if(!Array.isArray(a)||a.length!==5||a.some(n=>!Number.isInteger(n)||n<0||n>budget)||a.reduce((s,n)=>s+n,0)!==budget)fail(`Allocate exactly ${budget} units using five nonnegative whole numbers.`);return [...a];}
export function scoreMatch(a,b){validateAllocation(a);validateAllocation(b);const zones=ZONES.map((z,i)=>({zone:i,a:a[i],b:b[i],scoreA:a[i]>b[i]?z.value:a[i]===b[i]?z.value/2:0,scoreB:b[i]>a[i]?z.value:b[i]===a[i]?z.value/2:0}));return {scoreA:zones.reduce((s,z)=>s+z.scoreA,0),scoreB:zones.reduce((s,z)=>s+z.scoreB,0),zones};}
export function tournament(entries){
 if(entries.length<2)fail('At least two submissions are needed.');
 entries.forEach(e=>validateAllocation(e.allocation));
 const rows=entries.map(e=>({id:e.id,name:e.name,total:0,average:0,played:0,wins:0,ties:0,losses:0,zoneWins:[0,0,0,0,0],zoneTies:[0,0,0,0,0]})),matches=[];
 for(let i=0;i<entries.length;i++)for(let j=i+1;j<entries.length;j++){
  const m={a:entries[i].id,b:entries[j].id,...scoreMatch(entries[i].allocation,entries[j].allocation)};matches.push(m);
  for(const [at,side,opposite] of [[i,'A','B'],[j,'B','A']]){const r=rows[at];r.total+=m['score'+side];r.played++;r[m['score'+side]>m['score'+opposite]?'wins':m['score'+side]===m['score'+opposite]?'ties':'losses']++;
   m.zones.forEach((z,k)=>{if(z['score'+side]===ZONES[k].value)r.zoneWins[k]++;else if(z.scoreA===z.scoreB)r.zoneTies[k]++;});}
 }
 rows.forEach(r=>r.average=r.total/r.played);rows.sort((a,b)=>b.total-a.total||a.id-b.id);rows.forEach(r=>r.rank=1+rows.filter(other=>other.total>r.total).length);
 return {rows,matches,participants:entries.length,matchCount:matches.length,totalPoints:rows.reduce((s,r)=>s+r.total,0)};
}
// Exact finite-budget best response against fixed submitted opponents. It is not a dominant-strategy claim.
export function bestResponse(opponents,budget=100){
 if(!opponents.length)fail('Choose a field with at least one opponent.');opponents.forEach(a=>validateAllocation(a,budget));
 let dp=Array(budget+1).fill(null);dp[0]={points:0,allocation:[]};
 for(let zone=0;zone<5;zone++){
  const values=Array.from({length:budget+1},(_,units)=>opponents.reduce((sum,a)=>sum+(units>a[zone]?2*ZONES[zone].value:units===a[zone]?ZONES[zone].value:0),0));
  const next=Array(budget+1).fill(null);
  for(let spent=0;spent<=budget;spent++)if(dp[spent])for(let units=0;units<=budget-spent;units++){const points=dp[spent].points+values[units];if(!next[spent+units]||points>next[spent+units].points)next[spent+units]={points,allocation:[...dp[spent].allocation,units]};}
  dp=next;
 }
 return {allocation:dp[budget].allocation,total:dp[budget].points/2,average:dp[budget].points/2/opponents.length,opponents:opponents.length};
}
const text=(v,max=4000)=>{if(v===undefined||v===null)return '';if(typeof v!=='string'||v.length>max)fail('Keep each written answer within 4,000 characters.');return v.trim();};
export function handleZones(input,req,{now=Date.now()}={}){
 let state=structuredClone(input),changed=false,archive=null;
 const token=(req.headers.authorization||'').replace(/^Bearer /,''),b=req.body||{},url=new URL(req.url,'https://zones.invalid'),route=req.method+' '+url.pathname;
 const teacher=()=>{if(!token||token!==state.teacherKey)fail('Teacher access required.',401);};
 const student=()=>state.pairs?.players.find(p=>p.token&&p.token===token)||fail('Please choose your name again.',401);
 const game=()=>state.zones||fail('Your teacher has not opened Economic Zones yet.',404);
 const enrolled=()=>{const p=student(),g=game();if(!g.roster.some(r=>r.id===p.id&&r.name===p.name))fail('The class roster changed. Ask your teacher to reset Economic Zones.',409);return p;};
 const guard=g=>{if(b.id!==g.id)fail('This experiment has changed. Refresh before submitting.',409);};
 const visible=g=>['revealed','complete'].includes(g.status);
 const entries=g=>g.roster.filter(p=>g.submissions[p.id]).map(p=>({...p,allocation:g.submissions[p.id].allocation}));
 function view(g,p=null,isTeacher=false){
  const out={id:g.id,status:g.status,zones:ZONES,roster:g.roster,submitted:Object.keys(g.submissions).length,total:g.roster.length};
  if(isTeacher)out.seats=g.roster.map(p=>({...p,submitted:!!g.submissions[p.id],sum:g.submissions[p.id]?.allocation.reduce((s,n)=>s+n,0)??null,homework:!!g.homework[p.id]}));
  if(p)out.me={id:p.id,name:p.name,submission:g.submissions[p.id]||null,homework:g.homework[p.id]||null};
  if(visible(g)){
   const e=entries(g),totals=ZONES.map((_,i)=>e.reduce((s,p)=>s+p.allocation[i],0));
   out.analysis={entries:e,totals,averages:totals.map(n=>n/e.length),participants:e.length};out.tournament=g.tournament;
   if(isTeacher){out.written=g.roster.map(p=>({...p,reflection:g.submissions[p.id]?.reflection||null,prediction:g.submissions[p.id]?.prediction||null,homework:g.homework[p.id]||null}));}
  }
  return out;
 }
 const response=(body,status=200,type='application/json')=>({body,status,type,state,changed,archive});
 try{
  const isTeacher=url.pathname.startsWith('/api/zones/admin/')||['/api/zones/teacher','/api/zones/export'].includes(url.pathname);
  if(isTeacher)teacher();else student();
  if(route==='GET /api/zones/teacher')return response(state.zones?view(game(),null,true):{empty:true,zones:ZONES});
  if(route==='GET /api/zones/state'){const p=student();return response(state.zones?view(game(),enrolled()):{empty:true,me:{id:p.id,name:p.name},zones:ZONES});}
  if(route==='POST /api/zones/submit'){
   const g=game(),p=enrolled();guard(g);if(g.status!=='open')fail('Submissions are locked.',409);
   const allocation=validateAllocation(b.allocation),reflection={why:text(b.reflection?.why),contested:text(b.reflection?.contested),weakness:text(b.reflection?.weakness)};
   const prediction=b.prediction===null||b.prediction===undefined?null:validateAllocation(b.prediction);
   g.submissions[p.id]={allocation,reflection,prediction,savedAt:now};changed=true;return response({ok:true});
  }
  if(route==='POST /api/zones/homework'){
   const g=game(),p=enrolled();guard(g);if(!visible(g))fail('Wait for the class reveal before writing your final evidence.',409);
   const homework={};for(const key of ['overvalued','easier','core','strongest']){homework[key]=text(b.answers?.[key]);if(homework[key].length<40)fail('Give a detailed answer of at least 40 characters for each question.');}
   g.homework[p.id]={answers:homework,savedAt:now};changed=true;return response({ok:true});
  }
  if(route==='GET /api/zones/export'){
   const g=game();if(!visible(g))fail('Reveal the experiment before exporting results.',409);
   if(url.searchParams.get('type')==='csv'){
    const header=['student',...ZONES.map(z=>z.name),'total_points','average_points','wins','ties','losses'];
    const rows=entries(g).map(p=>{const r=g.tournament?.rows.find(r=>r.id===p.id);return [p.name,...p.allocation,...(r?[r.total,r.average,r.wins,r.ties,r.losses]:['','','','',''])];});
    const encode=v=>'"'+String(typeof v==='string'&&/^[=+@\-\t\r]/.test(v)?"'"+v:v).replaceAll('"','""')+'"';
    return response('\ufeff'+[header,...rows].map(r=>r.map(encode).join(',')).join('\r\n'),200,'text/csv');
   }
   return response({game:'Economic Zones',exportedAt:now,...view(g,null,true)});
  }
  if(req.method==='POST'&&url.pathname.startsWith('/api/zones/admin/')){
   const action=url.pathname.split('/').at(-1);
   if(action==='open'&&!state.zones){if(!state.pairs?.players?.length)fail('Create the class roster in Contribute / Take first.');state.zones={id:secret(),status:'open',roster:state.pairs.players.map(p=>({id:p.id,name:p.name})),submissions:{},homework:{},tournament:null};changed=true;return response({ok:true});}
   const g=game();guard(g);
   if(action==='lock'){if(g.status!=='open')fail('Submissions are not open.',409);if(entries(g).length<2)fail('Collect at least two submissions before locking.');g.status='locked';}
   else if(action==='reveal'){if(g.status!=='locked')fail('Lock submissions before revealing.',409);g.status='revealed';}
   else if(action==='run'){if(!visible(g))fail('Reveal submissions before running the tournament.',409);g.tournament=tournament(entries(g));g.status='complete';}
   else if(action==='reopen'){if(g.status==='open')fail('Submissions are already open.',409);archive=structuredClone(state);g.status='open';g.id=secret();g.tournament=null;g.homework={};}
   else if(action==='reset'){if(b.confirm!=='RESET')fail('Type RESET to clear this experiment.');archive=structuredClone(state);state.zones={id:secret(),status:'open',roster:state.pairs.players.map(p=>({id:p.id,name:p.name})),submissions:{},homework:{},tournament:null};}
   else fail('Unknown control.',404);
   changed=true;return response({ok:true});
  }
  fail('Not found.',404);
 }catch(e){return {status:e.status||400,body:{error:e.message},type:'application/json',state:input,changed:false,archive:null};}
}
