import {connected} from './frontier-geography.js';
// Rules for the expanded classroom world; old saved worlds retain their original rules.
export const TECHNOLOGIES={
 irrigation:{name:'Irrigation',cost:{food:4,ore:6,gold:10},requires:null,description:'+2 food from every food region.'},
 workshops:{name:'Workshops',cost:{ore:8,gold:12},requires:null,description:'+2 ore from every ore region.'},
 markets:{name:'Markets',cost:{ore:6,gold:14},requires:null,description:'+2 gold from every gold region.'},
 logistics:{name:'Logistics',cost:{food:8,ore:10,gold:18},requires:'irrigation',description:'Feed 6 army units per food instead of 4.'},
 engineering:{name:'Engineering',cost:{ore:12,gold:20},requires:'workshops',description:'Development costs 2 ore + 2 gold instead of 4 ore + 3 gold.'},
 diplomacy:{name:'Trade guild',cost:{food:6,gold:20},requires:'markets',description:'Each successful convoy earns you 5 gold instead of 2.'}
};
export const expanded=g=>g.rulesVersion===3;
export const actionsOf=o=>o?.actions||[o||{action:'hold'}];
export const roundSeconds=g=>expanded(g)?Math.max(60,g.settings.seconds-30*(Math.max(1,g.round)-1)):g.settings.seconds;
export const developCost=p=>p.tech?.includes('engineering')?{ore:2,gold:2}:{ore:4,gold:3};
export const freshStats=()=>({production:0,captures:0,allianceRounds:0,trades:0,recruited:0});
export function victoryTargets(seed){const n=[...seed].reduce((a,c)=>a+c.charCodeAt(0),0);return {wealth:80+n%16,production:240+n%61,conquest:12+n%4,diplomacy:6+n%3,army:30+n%7};}
export function victoryProgress(g,p){const land=g.tiles.filter(t=>t.owner===p.id),s={...freshStats(),...p.stats};return [
 {key:'wealth',label:'Build a treasury',hint:'Store more gold.',value:p.resources.gold},
 {key:'production',label:'Power the economy',hint:'Produce more resources across all rounds.',value:s.production},
 {key:'conquest',label:'Expand your realm',hint:'Hold more land and capture at least 4 regions.',value:land.length,qualifies:s.captures>=4,requirement:`${s.captures} / 4 regions captured`},
 {key:'diplomacy',label:'Build lasting partnerships',hint:'Maintain mutual alliances and deliver at least 4 trade convoys.',value:s.allianceRounds,qualifies:s.trades>=4,requirement:`${s.trades} / 4 convoys delivered`},
 {key:'army',label:'Raise an army',hint:'Keep a larger army and recruit at least 20 units.',value:land.reduce((a,t)=>a+t.troops,0),qualifies:s.recruited>=20,requirement:`${s.recruited} / 20 units recruited`}
 ].map(r=>({...r,target:g.victoryTargets[r.key],ratio:r.value/g.victoryTargets[r.key]}));}
export function victoryView(g,teacher=false){if(!expanded(g))return null;const revealed=teacher||g.history.length>=5||g.status==='complete';return {revealed,availableFrom:6,winners:g.winners||[],rows:g.players.filter(p=>!p.bot).map(p=>({id:p.id,eliminated:p.eliminated,routes:victoryProgress(g,p).map(({ratio,target,...r})=>({...r,...(!revealed?{hint:{conquest:'Hold more land and capture new regions.',diplomacy:'Sustain mutual alliances and deliver trade convoys.',army:'Recruit units and keep a larger army.'}[r.key]||r.hint,requirement:undefined,qualifies:undefined}:{}),...(revealed?{target,ratio}:{}),clue:ratio>=.85?'Very close':ratio>=.6?'Making strong progress':'Keep building'}))}))};}
export function checkVictory(g){if(!expanded(g))return false;const humans=g.players.filter(p=>!p.bot&&!p.eliminated);g.winners=g.round<6?[]:humans.flatMap(p=>{const routes=victoryProgress(g,p).filter(r=>r.ratio>=1&&r.qualifies!==false).map(r=>r.key);return routes.length?[{id:p.id,name:p.name,routes}]:[];});if(g.winners.length){g.endReason='Victory threshold reached';return true;}if(!humans.length){g.endReason='All human cities were eliminated';return true;}return false;}
// Weak, deterministic, legal plans. A missing human order gets one modest caretaker action.
export function botOrder(g,p){const owned=g.tiles.filter(t=>t.owner===p.id);const offers=g.players.filter(q=>q.id!==p.id&&!q.eliminated&&g.orders[q.id]?.ally===p.id).sort((a,b)=>a.id-b.id);const ally=offers[0]?.id??p.ally??null;
 const base={ally,automatic:true,bot:!!p.bot,caretaker:!p.bot};
 const mode=(g.round+p.id)%4;
 if(mode===0&&owned.some(t=>t.level<1)&&p.resources.ore>=4&&p.resources.gold>=3)return {...base,action:'develop',tile:owned.find(t=>t.level<1).id};
 if(mode===1&&p.resources.food>=2&&p.resources.ore>=2&&owned.length&&owned.reduce((a,t)=>a+t.troops,0)<18)return {...base,action:'recruit',tile:[...owned].sort((a,b)=>b.troops-a.troops)[0].id,units:2};
 if(mode===2&&ally!==null&&p.resources.ore>=3)return {...base,action:'trade',resource:'ore'};
 if(mode===3){const from=owned.find(t=>t.troops>=3),target=from&&g.tiles.find(t=>t.owner===null&&t.troops+t.level<2&&connected(from.id,t.id,g));if(target)return {...base,action:'move',from:from.id,to:target.id,units:2};}
 return {...base,action:'hold'};
}
