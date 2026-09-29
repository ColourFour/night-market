// Future-city edition: expected net returns in fictional dollars; independent normal market shocks.
export const ZONES=[
 {name:'Industrial Fringe',value:5,sd:1,tag:'Essential goods · steady demand',image:'industrial-fringe.jpg',blurb:'Repair workshops, recycling plants and compact homes keep the city running. Advertising reaches a smaller market for affordable essentials; demand is modest but dependable.',people:'Technicians, shift workers and long-term neighbors live in repaired apartment blocks. Practical purchases and familiar local businesses shape daily life.',risk:'Low volatility: regular maintenance and essential purchases smooth out most market swings.'},
 {name:'Transit Sector',value:10,sd:2,tag:'Commuters · everyday convenience',image:'transit-sector.jpg',blurb:'Rail interchanges link busy streets, modest apartments and quick-service shops. Large daily crowds create a reliable market for food, travel and convenience.',people:'Commuters, couriers, students and shop staff share compact homes and public spaces. People are busy, price-aware and often buying on the move.',risk:'Moderate stability: commuting is regular, but disruptions and changing foot traffic affect returns.'},
 {name:'Commercial Strip',value:16,sd:4,tag:'Independent shops · changing tastes',image:'commercial-strip.jpg',blurb:'Markets, cafés and apartment towers meet on a lively shopping street. A broader customer base offers better returns, with spending that moves between trends and seasons.',people:'Small-business owners, families and service workers live above shops and around shared courtyards. Everyday needs mix with occasional treats.',risk:'Medium volatility: promotions, trends and household budgets make demand less predictable.'},
 {name:'Innovation District',value:24,sd:8,tag:'Research · launches · emerging markets',image:'innovation-district.jpg',blurb:'Glass laboratories, creative studios and planted terraces form a prosperous technology district. Successful product launches can bring a surge of valuable customers.',people:'Researchers, designers, engineers and university communities live near their workplaces. Many try new products, but attention shifts quickly.',risk:'High volatility: launch successes and quiet periods can produce very different returns.'},
 {name:'Skyline Core',value:34,sd:12,tag:'Finance · luxury · global attention',image:'skyline-core.jpg',blurb:'Skybridges connect premium homes, financial towers and luxury retail above the river. This is the largest potential market, and the most exposed to changes in confidence.',people:'Professionals, executives, residents and the service teams supporting the district move through a polished high-rise neighborhood. Spending power is high, but so are expectations.',risk:'Highest volatility: luxury demand and global confidence create the biggest swings, including rare losses.'}
];
export const LEGACY_ZONES=ZONES.map((z,i)=>({...z,value:i+1,sd:0}));
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const secret=()=>Array.from(crypto.getRandomValues(new Uint8Array(18)),x=>x.toString(16).padStart(2,'0')).join('');
export function validateAllocation(a,budget=100){if(!Array.isArray(a)||a.length!==5||a.some(n=>!Number.isInteger(n)||n<0||n>budget)||a.reduce((s,n)=>s+n,0)!==budget)fail(`Allocate exactly ${budget} units using five nonnegative whole numbers.`);return [...a];}
const money=n=>Math.round(n*100)/100;
export function scoreMatch(a,b,values=ZONES.map(z=>z.value)){
 validateAllocation(a);validateAllocation(b);if(values.length!==5||values.some(x=>!Number.isFinite(x)))fail('Invalid market returns.');
 const zones=values.map((value,i)=>({zone:i,value,a:a[i],b:b[i],winner:a[i]===b[i]?'tie':a[i]>b[i]?'A':'B',scoreA:a[i]>b[i]?value:a[i]===b[i]?value/2:0,scoreB:b[i]>a[i]?value:b[i]===a[i]?value/2:0}));
 return {scoreA:money(zones.reduce((s,z)=>s+z.scoreA,0)),scoreB:money(zones.reduce((s,z)=>s+z.scoreB,0)),zones};
}
export function tournament(entries,values=ZONES.map(z=>z.value)){
 if(entries.length<2)fail('At least two submissions are needed.');
 entries.forEach(e=>validateAllocation(e.allocation));
 const rows=entries.map(e=>({id:e.id,name:e.name,total:0,average:0,played:0,wins:0,ties:0,losses:0,zoneWins:[0,0,0,0,0],zoneTies:[0,0,0,0,0]})),matches=[];
 for(let i=0;i<entries.length;i++)for(let j=i+1;j<entries.length;j++){
  const m={a:entries[i].id,b:entries[j].id,...scoreMatch(entries[i].allocation,entries[j].allocation,values)};matches.push(m);
  for(const [at,side,opposite] of [[i,'A','B'],[j,'B','A']]){const r=rows[at];r.total=money(r.total+m['score'+side]);r.played++;r[m['score'+side]>m['score'+opposite]?'wins':m['score'+side]===m['score'+opposite]?'ties':'losses']++;
   m.zones.forEach((z,k)=>{if(z.winner===side)r.zoneWins[k]++;else if(z.winner==='tie')r.zoneTies[k]++;});}
 }
 rows.forEach(r=>r.average=r.total/r.played);rows.sort((a,b)=>b.total-a.total||a.id-b.id);rows.forEach(r=>r.rank=1+rows.filter(other=>other.total>r.total).length);
 return {rows,matches,participants:entries.length,matchCount:matches.length,values,totalPoints:money(rows.reduce((s,r)=>s+r.total,0))};
}
// Exact finite-budget best response against fixed submitted opponents. It is not a dominant-strategy claim.
export function bestResponse(opponents,budget=100,weights=ZONES.map(z=>z.value)){
 if(!opponents.length)fail('Choose a field with at least one opponent.');opponents.forEach(a=>validateAllocation(a,budget));
 let dp=Array(budget+1).fill(null);dp[0]={points:0,allocation:[]};
 for(let zone=0;zone<5;zone++){
  const values=Array.from({length:budget+1},(_,units)=>opponents.reduce((sum,a)=>sum+(units>a[zone]?2*weights[zone]:units===a[zone]?weights[zone]:0),0));
  const next=Array(budget+1).fill(null);
  for(let spent=0;spent<=budget;spent++)if(dp[spent])for(let units=0;units<=budget-spent;units++){const points=dp[spent].points+values[units];if(!next[spent+units]||points>next[spent+units].points)next[spent+units]={points,allocation:[...dp[spent].allocation,units]};}
  dp=next;
 }
 return {allocation:dp[budget].allocation,total:dp[budget].points/2,average:dp[budget].points/2/opponents.length,opponents:opponents.length};
}

const uniform=()=> (crypto.getRandomValues(new Uint32Array(1))[0]+0.5)/4294967296;
export function drawMarket(random=uniform){
 // Box-Muller: no clipping or truncation. Round to $0.02 so a tie splits to whole cents.
 return ZONES.map(z=>{const u=Math.max(Number.MIN_VALUE,Math.min(1-Number.EPSILON,random())),v=random();return Math.round((z.value+z.sd*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v))*50)/50;});
}
export function robotAllocation(random=uniform){
 // Independent of the student's current choice: value-aware mixed strategies, not an oracle.
 const plans=[[8,13,20,27,32],[15,23,28,24,10],[4,10,20,30,36],[22,25,24,20,9]];
 const a=[...plans[Math.min(plans.length-1,Math.floor(random()*plans.length))]];
 for(let i=0;i<18;i++){const from=Math.min(4,Math.floor(random()*5)),to=Math.min(4,Math.floor(random()*5));if(a[from]>0){a[from]--;a[to]++;}}
 return a;
}
export function handleZones(input,req,{now=Date.now(),random=uniform}={}){
 let state=structuredClone(input),changed=false,archive=null;
 const token=(req.headers.authorization||'').replace(/^Bearer /,''),b=req.body||{},url=new URL(req.url,'https://zones.invalid'),route=req.method+' '+url.pathname;
 const teacher=()=>{if(!token||token!==state.teacherKey)fail('Teacher access required.',401);};
 const student=()=>state.pairs?.players.find(p=>p.token&&p.token===token)||fail('Please choose your name again.',401);
 const game=()=>state.zones||fail('Your teacher has not opened Economic Zones yet.',404);
 const enrolled=()=>{const p=student(),g=game();if(!g.roster.some(r=>r.id===p.id&&r.name===p.name))fail('The class roster changed. Ask your teacher to reset Economic Zones.',409);return p;};
 const guard=g=>{if(b.id!==g.id)fail('This experiment has changed. Refresh before submitting.',409);};
 const visible=g=>['revealed','complete'].includes(g.status);
 const entries=g=>g.roster.filter(p=>g.submissions[p.id]).map(p=>({...p,allocation:g.submissions[p.id].allocation}));
 const fresh=()=>({id:secret(),edition:2,status:'practice',roster:state.pairs.players.map(p=>({id:p.id,name:p.name})),submissions:{},practice:{},homework:{},tournament:null,market:null});
 function view(g,p=null,isTeacher=false){
  const modern=g.edition===2;
  const out={id:g.id,edition:g.edition||1,status:g.status,zones:modern?ZONES:LEGACY_ZONES,roster:g.roster,submitted:Object.keys(g.submissions).length,total:g.roster.length};
  if(isTeacher)out.seats=g.roster.map(p=>({...p,submitted:!!g.submissions[p.id],sum:g.submissions[p.id]?.allocation.reduce((s,n)=>s+n,0)??null,practiceAttempts:g.practice?.[p.id]?.attempts||0}));
  if(p)out.me={id:p.id,name:p.name,submission:g.submissions[p.id]?{allocation:g.submissions[p.id].allocation,savedAt:g.submissions[p.id].savedAt}:null,practice:g.practice?.[p.id]||null};
  if(visible(g)){
   const e=entries(g),totals=ZONES.map((_,i)=>e.reduce((s,p)=>s+p.allocation[i],0));
   out.analysis={entries:e,totals,averages:totals.map(n=>n/e.length),participants:e.length};out.tournament=g.tournament;out.market=g.market;
   if(isTeacher&& !modern)out.written=g.roster.map(p=>({...p,reflection:g.submissions[p.id]?.reflection||null,prediction:g.submissions[p.id]?.prediction||null,homework:g.homework?.[p.id]||null}));
  }
  return out;
 }
 const response=(body,status=200,type='application/json')=>({body,status,type,state,changed,archive});
 try{
  const isTeacher=url.pathname.startsWith('/api/zones/admin/')||['/api/zones/teacher','/api/zones/export'].includes(url.pathname);
  if(isTeacher)teacher();else student();
  // Empty, unused experiments can upgrade safely. Existing submissions/results keep their original rules.
  if(state.zones&&state.zones.edition!==2&&!Object.keys(state.zones.submissions).length&&!state.zones.tournament){archive=structuredClone(state);state.zones=fresh();changed=true;}
  if(route==='GET /api/zones/teacher')return response(state.zones?view(game(),null,true):{empty:true,zones:ZONES});
  if(route==='GET /api/zones/state'){const p=student();return response(state.zones?view(game(),enrolled()):{empty:true,me:{id:p.id,name:p.name},zones:ZONES});}
  if(route==='POST /api/zones/practice'){
   const g=game(),p=enrolled();guard(g);if(g.edition!==2)fail('Ask your teacher to start the future-city edition.',409);
   if(!['practice','open'].includes(g.status))fail('Practice is closed while class results are being revealed.',409);
   const allocation=validateAllocation(b.allocation),bot=robotAllocation(random),values=drawMarket(random),result=scoreMatch(allocation,bot,values);
   g.practice[p.id]={attempts:(g.practice[p.id]?.attempts||0)+1,last:{allocation,bot,values,...result,at:now}};changed=true;return response({ok:true});
  }
  if(route==='POST /api/zones/submit'){
   const g=game(),p=enrolled();guard(g);if(g.status!=='open')fail('Class submissions are not open.',409);
   if(g.edition===2&&!g.practice[p.id]?.attempts)fail('Play the robot at least once before submitting for the class.',409);
   g.submissions[p.id]={allocation:validateAllocation(b.allocation),savedAt:now};changed=true;return response({ok:true});
  }
  if(route==='GET /api/zones/export'){
   const g=game();if(!visible(g))fail('Reveal the experiment before exporting results.',409);
   if(url.searchParams.get('type')==='csv'){
    const header=['student',...ZONES.map(z=>z.name),g.edition===2?'total_dollars':'total_points',g.edition===2?'average_dollars':'average_points','wins','ties','losses',...ZONES.map(z=>'realized_'+z.name)];
    const rows=entries(g).map(p=>{const r=g.tournament?.rows.find(r=>r.id===p.id);return [p.name,...p.allocation,...(r?[r.total,r.average,r.wins,r.ties,r.losses]:['','','','','']),...(g.market||[1,2,3,4,5])];});
    const encode=v=>'"'+String(typeof v==='string'&&/^[=+@\-\t\r]/.test(v)?"'"+v:v).replaceAll('"','""')+'"';
    return response('\ufeff'+[header,...rows].map(r=>r.map(encode).join(',')).join('\r\n'),200,'text/csv');
   }
   return response({game:'Economic Zones',exportedAt:now,...view(g,null,true)});
  }
  if(req.method==='POST'&&url.pathname.startsWith('/api/zones/admin/')){
   const action=url.pathname.split('/').at(-1);
   if(action==='open'&&!state.zones){if(!state.pairs?.players?.length)fail('Create the class roster in Contribute / Take first.');state.zones=fresh();changed=true;return response({ok:true});}
   const g=game();guard(g);
   if(action==='unlock'){if(g.status!=='practice')fail('Class play is already unlocked.',409);g.status='open';}
   else if(action==='lock'){if(g.status!=='open')fail('Submissions are not open.',409);if(entries(g).length<2)fail('Collect at least two submissions before locking.');g.status='locked';}
   else if(action==='reveal'){if(g.status!=='locked')fail('Lock submissions before revealing.',409);g.status='revealed';}
   else if(action==='run'){if(!visible(g))fail('Reveal submissions before running the tournament.',409);if(!g.tournament){g.market=g.edition===2?drawMarket(random):[1,2,3,4,5];g.tournament=tournament(entries(g),g.market);}g.status='complete';}
   else if(action==='reopen'){if(['practice','open'].includes(g.status))fail('Submissions are already open.',409);archive=structuredClone(state);g.status='open';g.id=secret();g.tournament=null;g.market=null;}
   else if(action==='reset'){if(b.confirm!=='RESET')fail('Type RESET to clear this experiment.');archive=structuredClone(state);state.zones=fresh();}
   else fail('Unknown control.',404);
   changed=true;return response({ok:true});
  }
  fail('Not found.',404);
 }catch(e){return {status:e.status||400,body:{error:e.message},type:'application/json',state:input,changed:false,archive:null};}
}
