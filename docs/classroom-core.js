// Shared daily classroom lifecycle. Server time, not device time, owns the calendar.
import {handlePairs,freshPairs,normalizeName} from './pairs-core.js';
import {handleZones} from './zones-core.js';
import {handleFrontier} from './frontier-core.js';
export const normalizeJoinName=name=>normalizeName(name).toLowerCase();
export const classDate=now=>new Date(now+8*60*60*1000).toISOString().slice(0,10);
export function handleClassroom(input,req,options={}){
 const now=options.now??Date.now(),day=classDate(now);
 let state=input,archive=null;
 if(input.classDay!==day){
  archive={...structuredClone(input),archiveReason:'daily-reset',classDay:input.classDay||'Before daily entry'};
  state={...structuredClone(input),classDay:day,pairs:freshPairs([],input.pairs?.settings),zones:null,frontier:null};
 }
 const path=new URL(req.url,'https://class.invalid').pathname;
 const handler=path.startsWith('/api/frontier/')?handleFrontier:path.startsWith('/api/zones/')?handleZones:handlePairs;
 const result=handler(state,req,{...options,now});
 if(archive){result.changed=true;result.archive=archive;}
 // Preserve the daily archive if the very first request was another reset action.
 return result;
}
export function savedDayReport(row){
 const scrub=value=>Array.isArray(value)?value.map(scrub):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([k])=>!['token','pin','teacherKey'].includes(k)).map(([k,v])=>[k,scrub(v)])):value;
 return {date:row.game.classDay||'Earlier class',savedAt:row.saved_at,contributeTake:scrub(row.game.pairs),economicZones:scrub(row.game.zones),frontierCities:scrub(row.game.frontier)};
}
export function savedDaysCsv(reports){
 const rows=[['day','game','student','opponent','round','points','detail']];
 for(const day of reports){
  const p=day.contributeTake;
  for(const h of p?.history||[])for(const r of h.results){
   if(r.bye){rows.push([day.date,'Contribute / Take',p.players[r.a].name,'',h.round,0,'Sit-out']);continue;}
   rows.push([day.date,'Contribute / Take',p.players[r.a].name,p.players[r.b].name,h.round,r.scoreA,r.choiceA+' / '+r.choiceB],[day.date,'Contribute / Take',p.players[r.b].name,p.players[r.a].name,h.round,r.scoreB,r.choiceB+' / '+r.choiceA]);
  }
  for(const r of day.economicZones?.tournament?.rows||[])rows.push([day.date,'Economic Zones',r.name,'All opponents','',r.total,`${r.wins} wins / ${r.ties} ties / ${r.losses} losses`]);
  for(const p of day.frontierCities?.players||[]){const g=day.frontierCities;rows.push([day.date,'Frontier Cities',p.name,'',g.round,'',JSON.stringify({resources:p.resources,territories:g.tiles.filter(t=>t.owner===p.id).length,eliminated:p.eliminated})]);}
 }
 const cell=v=>'"'+String(typeof v==='string'&&/^[=+@\-\t\r]/.test(v)?"'"+v:v).replaceAll('"','""')+'"';
 return '\ufeff'+rows.map(r=>r.map(cell).join(',')).join('\r\n');
}
