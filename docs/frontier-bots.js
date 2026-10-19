import {checkedPlan,actionLimit,adjacent} from './frontier-core.js?v=solo1';
import {TECHNOLOGIES,developCost,botOrder} from './frontier-strategy.js';
export const BOT_LEVELS={
 easy:{name:'Easy',description:'One modest action per round. Builds slowly and only attacks unclaimed land.'},
 standard:{name:'Standard',description:'Combines actions, recruits defenders and takes vulnerable nearby land.'},
 strategic:{name:'Strategic',description:'Researches, defends borders and pursues victory targets. Can attack rival cities.'},
 mixed:{name:'Mixed',description:'A varied world: five Easy, five Standard and four Strategic opponents.'}
};
const styles=['builder','commander','merchant'];
// A bot can inspect its discovered map and public history, never anyone's pending plan.
export function robotPlan(world,id){
 const g=structuredClone(world);g.orders={};const p=g.players.find(p=>p.id===id);
 if(!p||p.eliminated)return {action:'plan',actions:[],ally:null,bot:true};
 const level=p.botLevel||'easy',style=p.botStyle||styles[id%3];
 const targetsKnown=g.history.length>=5?g.victoryTargets:{wealth:90,army:34};
 const known=new Set(p.explored||[]),land=g.tiles.filter(t=>t.owner===id),visible=g.tiles.filter(t=>known.has(t.id)||t.owner===id);
 const living=g.players.filter(q=>!q.eliminated&&q.id!==id);
 const adjacentPeople=living.filter(q=>visible.some(t=>t.owner===q.id&&land.some(f=>adjacent(f.id,t.id,g))));
 // Easy bots offer the human friendship. Others retain a pact or seek a nearby partner periodically.
 const ally=p.ally!==null&&living.some(q=>q.id===p.ally)?p.ally:level==='easy'&&living.some(q=>q.id===0)?0:style==='merchant'?(adjacentPeople.find(q=>q.id===0)||adjacentPeople[0])?.id??null:null;
 if(level==='easy'){
  const order=botOrder(g,{...p,ally});const plan=checkedPlan(g,id,{actions:order.action==='hold'?[]:[order],ally});return {...plan,bot:true};
 }
 const actions=[],used=new Set(),resources={...p.resources},targets=new Set();
 const add=o=>{if(actions.length>=actionLimit(g))return false;try{checkedPlan(g,id,{actions:[...actions,o],ally});}catch{return false;}actions.push(o);if(o.action==='move'){used.add(o.from);targets.add(o.to);}else if(o.tile!==undefined)used.add(o.tile);const cost=o.action==='develop'?developCost(p):o.action==='recruit'?{food:o.units,ore:o.units}:o.action==='research'?TECHNOLOGIES[o.tech].cost:o.action==='trade'?{[o.resource]:3}:{};for(const [k,v]of Object.entries(cost))resources[k]-=v;return true;};
 const army=land.reduce((n,t)=>n+t.troops,0),foodIncome=land.reduce((n,t)=>n+(t.kind==='capital'?2+t.level:t.kind==='food'?3+2*t.level+(p.tech.includes('irrigation')?2:0):0),0);
 const upkeep=Math.ceil(army/(p.tech.includes('logistics')?6:4));
 const threatened=t=>visible.some(q=>q.owner!==null&&q.owner!==id&&(ally===null||q.owner!==ally)&&adjacent(q.id,t.id,g)&&q.troops>t.troops+t.level+1);
 // Strategic bots reserve food and strengthen exposed regions before committing to growth.
 if(level==='strategic')for(const t of land.filter(threatened).sort((a,b)=>Number(b.capital)-Number(a.capital)))if(!used.has(t.id)&&resources.food+foodIncome>upkeep+4)add({action:'recruit',tile:t.id,units:Math.min(4,resources.food,resources.ore)});
 const pursueGold=level==='strategic'&&style==='merchant'&&resources.gold>=targetsKnown.wealth*.65;
 if(level==='strategic'&&!pursueGold){
  const priority=foodIncome<=upkeep+2?['irrigation','logistics']:style==='merchant'?['markets','diplomacy','workshops']:['workshops','engineering','irrigation','logistics','markets'];
  for(const tech of priority)if(!p.tech.includes(tech)&&(!TECHNOLOGIES[tech].requires||p.tech.includes(TECHNOLOGIES[tech].requires))&&add({action:'research',tech}))break;
 }
 // Attacks use visible starting defences; opponents can still reinforce or counterattack simultaneously.
 for(const from of [...land].sort((a,b)=>b.troops-a.troops)){
  if(used.has(from.id)||from.troops<3)continue;
  const reserve=level==='strategic'&&threatened(from)?Math.max(2,Math.floor(from.troops/2)):1;
  const target=visible.filter(t=>t.owner!==id&&(ally===null||t.owner!==ally)&&!targets.has(t.id)&&adjacent(from.id,t.id,g)&&!(t.capital&&g.round<=2)&&from.troops-reserve>t.troops+t.level+(level==='strategic'?1:0)).sort((a,b)=>(Number(b.capital)*3+b.level+(b.kind==='gold'&&style==='merchant'?3:0))-(Number(a.capital)*3+a.level+(a.kind==='gold'&&style==='merchant'?3:0))||a.id-b.id)[0];
  if(target)add({action:'move',from:from.id,to:target.id,units:from.troops-reserve});
 }
 if(ally!==null&&(p.ally===ally||level==='strategic')){const resource=['ore','food','gold'].find(k=>resources[k]>(k==='food'?upkeep+6:8)&&!(k==='gold'&&pursueGold));if(resource)add({action:'trade',resource});}
 const develop=()=>{for(const t of [...land].sort((a,b)=>(Number(b.capital)*3+(b.kind==='food'&&foodIncome<=upkeep+2?5:0))-(Number(a.capital)*3+(a.kind==='food'&&foodIncome<=upkeep+2?5:0))||a.level-b.level))if(!used.has(t.id)&&t.level<3&&!pursueGold)add({action:'develop',tile:t.id});};
 const recruit=()=>{let extra=0;for(const t of [...land].sort((a,b)=>b.troops-a.troops)){if(used.has(t.id)||army+extra>=(level==='strategic'?targetsKnown.army+4:24))continue;if(!visible.some(q=>q.owner!==id&&(ally===null||q.owner!==ally)&&adjacent(t.id,q.id,g)))continue;const units=Math.min(level==='strategic'?6:3,resources.ore,resources.food,Math.max(0,(foodIncome+Math.floor(resources.food/3)-upkeep)*3-extra));if(units>0&&add({action:'recruit',tile:t.id,units}))extra+=units;}};
 if(style==='commander'){recruit();develop();}else{develop();recruit();}
 return {...checkedPlan(g,id,{actions,ally}),bot:true};
}
