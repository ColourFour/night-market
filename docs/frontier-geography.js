// Shared hex geography. Axial coordinates make touching edges the only legal routes.
export const HEX_DIRECTIONS=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
export const hexDistance=(a,b)=>Math.max(Math.abs(a.q-b.q),Math.abs(a.r-b.r),Math.abs(a.q+a.r-b.q-b.r));
export const hexPosition=t=>({x:Math.sqrt(3)*54*(t.q+t.r/2),y:81*t.r});
export function tilePosition(t){return hexPosition(Number.isInteger(t.q)?t:{q:t.sector-Math.floor(t.ring/2),r:t.ring});}
export function connected(a,b,g){
 if(a===b)return false;
 if(typeof g==='object'&&g.mapVersion===2){const x=g.tiles.find(t=>t.id===a),y=g.tiles.find(t=>t.id===b);return !!x&&!!y&&hexDistance(x,y)===1;}
 const count=typeof g==='number'?g:g.players.length,sa=Math.floor(a/3),sb=Math.floor(b/3),ra=a%3,rb=b%3;
 return sa===sb&&Math.abs(ra-rb)===1||ra===rb&&ra>0&&(Math.abs(sa-sb)===1||Math.abs(sa-sb)===count-1);
}
const hash=(q,r)=>Math.abs(Math.sin(q*127.1+r*311.7+8.3)*43758.5453)%1;
export function makeHexLand(players){
 const radius=Math.max(3,Math.ceil(Math.sqrt((players.length*8+10)/3))),land=[];
 for(let r=-radius;r<=radius;r++)for(let q=-radius*2;q<=radius*2;q++){
  const x=q+r/2,y=r;
  const edge=1+.10*Math.sin(x*1.9+y*.7)+.07*Math.cos(y*2.2-x*.4);
  if((x/(radius*1.2))**2+(y/(radius*.86))**2<=edge)land.push({q,r});
 }
 // Keep one connected continent even at the ragged coast.
 const reached=new Set(['0,0']),queue=[land.find(c=>c.q===0&&c.r===0)];
 for(const c of queue)for(const d of land)if(!reached.has(`${d.q},${d.r}`)&&hexDistance(c,d)===1){reached.add(`${d.q},${d.r}`);queue.push(d);}
 const cells=land.filter(c=>reached.has(`${c.q},${c.r}`));
 const candidates=cells.filter(c=>cells.filter(d=>hexDistance(c,d)===1).length===6),homes=[];
 for(let i=0;i<players.length;i++){
  const choices=candidates.filter(c=>!homes.includes(c));
  choices.sort((a,b)=>{
   const score=c=>homes.length?Math.min(...homes.map(h=>hexDistance(c,h))):-(Math.abs(c.q+Math.floor(radius/2))+Math.abs(c.r));
   return score(b)-score(a)||a.r-b.r||a.q-b.q;
  });homes.push(choices[0]);
 }
 const reserved=new Set(homes),ordered=[];
 for(const h of homes){
  const neighbours=cells.filter(c=>!reserved.has(c)&&hexDistance(h,c)===1).sort((a,b)=>hash(a.q,a.r)-hash(b.q,b.r));
  const pair=neighbours.slice(0,2);if(pair.length!==2)throw Error('The world needs more starting space.');
  pair.forEach(c=>reserved.add(c));ordered.push(h,...pair);
 }
 ordered.push(...cells.filter(c=>!reserved.has(c)));
 const names={food:['Greenfields','Cedar Vale','Rivermeadow','Fernwood'],ore:['Ironridge','Slate Hills','Copper Reach','Stonecrest'],gold:['Sunport','Amber Coast','Market Plain','Goldwater']};
 return ordered.map((c,id)=>{
  const i=Math.floor(id/3),capital=id<players.length*3&&id%3===0,near=id<players.length*3;
  const kind=capital?'capital':near?(id%3===1?'food':'ore'):['food','ore','gold'][Math.floor(hash(c.q,c.r)*3)];
  const coast=cells.filter(d=>hexDistance(c,d)===1).length<6;
  return {id,q:c.q,r:c.r,name:capital?`${players[i].name} · Home`:`${names[kind][id%4]} ${id+1}`,kind,terrain:capital?'city':kind==='food'?(id%2?'forest':'fields'):kind==='ore'?'mountains':coast?'harbour':'town',owner:capital?players[i].id:null,troops:capital?6:1,level:0,capital,coast};
 });
}
export function exploredTiles(g,id){
 const p=g.players.find(p=>p.id===id),known=new Set(p?.explored||[]);
 for(const t of g.tiles)if(t.owner===id){known.add(t.id);for(const q of g.tiles)if(connected(t.id,q.id,g))known.add(q.id);}
 return [...known].sort((a,b)=>a-b);
}
export function revealExploration(g){if(g.mapVersion===2)for(const p of g.players)p.explored=exploredTiles(g,p.id);}
