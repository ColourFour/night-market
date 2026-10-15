// Private, three-round practice. No requests or scores are sent to the classroom.
import {newFrontier,resolveFrontier,frontierStandings,adjacent} from './frontier-core.js?v=hex1';
import {frontierMap,frontierTerritory,roundReport} from './frontier-ui.js?v=hex1';
import {device} from './browser-storage.js?v=lobby1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const LESSONS=[
 {title:'Expand your city',tip:'Move / Attack is one action: your own region = reinforce; any other region = attack. You must beat its defender, not tie.',choices:[['expand','Move / Attack · 2 units','Send 2 from home to district 2. Leave 4 at home.'],['testTie','Move / Attack · try 1 unit','Test what happens when attack and defence tie.']],lesson:'Move / Attack wins land only when your force is stronger. Mira recruited units; Sol developed a home. Those choices cost resources.'},
 {title:'Invest or defend',tip:'Choose growth or a stronger army. You get only one order.',choices:[['develop','Develop your home','Pay 4 ore + 3 gold for better production and defence.'],['recruit','Recruit 2 units','Pay 2 food + 2 ore to add units at home.']],lesson:'Develop improves a district. Recruit adds units. Mira held position and still collected income. Sol expanded instead.'},
 {title:'Make a deal',tip:'Mira will choose you as an ally. Trade with Mira, or stay independent. Sol will attack a neighbouring region.',choices:[['trade','Ally & trade with Mira','Send 3 ore. Mira receives 5; you earn 2 gold.'],['hold','Hold without an ally','Keep your resources and make no pact.']],lesson:'Trade needs both players to choose each other. A mutual alliance also earns +2 gold each. Hold takes no action; harvest and food upkeep still happen.'}
];
export function newTutorial(name){return {version:1,phase:'intro',choice:null,done:false,game:newFrontier([{id:0,name},{id:1,name:'Mira · robot'},{id:2,name:'Sol · robot'}],{seconds:80,rounds:3})};}
export function beginTutorialRound(t,now){const g=t.game;g.round++;g.roundId=crypto.randomUUID();g.status='open';g.deadline=now+80000;g.nextRoundAt=null;g.orders={};t.choice=null;t.phase='choose';}
export function resolveTutorial(t,now){
 if(t.phase!=='choose')return;const g=t.game,choice=t.choice;
 const learner=choice==='expand'?{action:'move',from:0,to:1,units:2,ally:null}:choice==='testTie'?{action:'move',from:0,to:1,units:1,ally:null}:choice==='develop'?{action:'develop',tile:0,ally:null}:choice==='recruit'?{action:'recruit',tile:0,units:2,ally:null}:choice==='trade'?{action:'trade',resource:'ore',ally:1}:{action:'hold',ally:null,...(!choice?{automatic:true}:{})};
 const bots=g.round===1?[{action:'recruit',tile:3,units:2,ally:null},{action:'develop',tile:6,ally:null}]:g.round===2?[{action:'hold',ally:null},{action:'move',from:6,to:7,units:3,ally:null}]:[{action:'trade',resource:'ore',ally:0},{action:'move',from:7,to:g.tiles.find(t=>t.owner===null&&adjacent(7,t.id,g)).id,units:1,ally:null}];
 g.orders={0:learner,1:bots[0],2:bots[1]};resolveFrontier(g,now);t.phase='review';t.reviewUntil=now+20000;
}
export function tickTutorial(t,now){if(t.phase==='choose'&&now>=t.game.deadline){resolveTutorial(t,now);return true;}if(t.phase==='review'&&now>=t.reviewUntil){if(t.game.round===3)t.phase='complete';else beginTutorialRound(t,now);return true;}return false;}
let current=null,identity='',shown=false,previewTeacher=false;
const KEY='frontier-introduction-v1';
function save(){device.setItem(KEY,JSON.stringify({identity,tutorial:current}));}
function ensure(state,token){if(identity!==token||!current){identity=token;try{const saved=JSON.parse(device.getItem(KEY));current=saved?.identity===token&&saved.tutorial?.version===1?saved.tutorial:null;}catch{}if(!current)current=newTutorial(state.me?.name||'You');}}
export const tutorialActive=()=>shown;
const button=(action,text,secondary=false)=>`<button type="button" class="${secondary?'secondary':''}" data-action="frontier-tutorial-${action}">${text}</button>`;
export function tutorialView(state,role,token){
 ensure(state,token);
 const live=role==='student'&&state.me?.participating&&['open','paused','revealed','complete'].includes(state.status);
 if(live){if(!current.done){current.done=true;save();}shown=false;return '';}
 shown=role==='student'?!current.done:previewTeacher;
 if(!shown)return `<div class="actions tutorial-entry">${button('replay',role==='teacher'?'Preview 3-round bot introduction':'Replay bot introduction',true)}</div>`;
 const t=current,g=t.game,lesson=LESSONS[Math.max(0,g.round-1)],view={...g,tiles:g.tiles.filter(t=>g.players[0].explored.includes(t.id)),fog:true,standings:frontierStandings(g),me:{id:0,name:g.players[0].name,participating:false,order:null}};
 const intro=t.phase==='intro';
 const skip=role==='student'?`<div class="actions tutorial-entry">${button('skip','Skip introduction · Join class game',true)}</div>`:'';
 const header=`<section class="frontier-hero tutorial-hero"><div class="eyebrow">Bot introduction · about 5 minutes · ${intro?'3 short rounds':`Round ${g.round} of 3`}</div><h1>${intro?'Build. Choose. Understand.':t.phase==='complete'?'Ready for your classmates.':lesson.title}</h1><p>${intro?'Learn with Mira and Sol before entering the class world.':t.phase==='choose'?lesson.tip:t.phase==='complete'?'One order each round. Watch what everyone else does.':'Read your order, the bots’ orders and the outcome below.'}</p></section>`;
 const meter=`<ol class="tutorial-progress">${LESSONS.map((l,i)=>`<li class="${g.round===i+1?'current':g.round>i+1?'done':''}">${g.round>i+1?'✓':i+1} · ${l.title}</li>`).join('')}</ol>`;
 if(intro)return `<div class="frontier tutorial">${skip}${header}<section class="panel"><h2>Three things to remember</h2><ul><li>Win by finishing with the <strong>most prosperity</strong>.</li><li>Choose <strong>one order</strong>. Everyone’s orders resolve together.</li><li>Read the round report: <strong>action → outcome → change</strong>.</li></ul><p>Each practice round gives you up to 80 seconds to choose, then 20 seconds to review. You can reveal early. Practice never affects class scores.</p>${button('start','Start the 3-round introduction')}${role==='teacher'?button('exit','Back to teacher controls',true):''}</section></div>`;
 const resources=`<div class="frontier-resources">${['food','ore','gold'].map(k=>`<div><span>${k}</span><strong>${g.players[0].resources[k]}</strong></div>`).join('')}<div><span>Prosperity</span><strong>${view.standings.find(p=>p.id===0).score}</strong></div></div>`;
 let controls='';
 if(t.phase==='choose')controls=`<section class="panel tutorial-task"><div class="tutorial-task-title"><h2>Choose your order</h2><strong id="tutorial-clock">—</strong></div><div class="tutorial-options">${lesson.choices.map(([id,title,detail])=>`<button type="button" data-action="frontier-tutorial-choice" data-choice="${id}" aria-pressed="${t.choice===id}" class="${t.choice===id?'chosen':'secondary'}"><strong>${title}</strong><span>${detail}</span></button>`).join('')}</div><p role="status">${t.choice?'✓ Order saved. The map has not changed yet. Both bots are ready.':'Choose an option above. No choice by zero means hold.'}</p>${t.choice?button('reveal','Reveal everyone’s orders') :''}</section>`;
 else controls=`<section class="panel tutorial-lesson"><h2>${t.phase==='complete'?'You have tried the round report.':'What this round teaches'}</h2><p>${lesson.lesson}</p>${t.phase==='review'?`<p>Compare all three players below. <strong id="tutorial-clock">20s</strong> to read before ${g.round===3?'the introduction finishes':'the next practice round'}.</p>`:`<ul><li><strong>Move / Attack:</strong> reinforce your own region or attack another.</li><li><strong>Develop:</strong> improve production and defence.</li><li><strong>Recruit:</strong> add units; remember food upkeep.</li><li><strong>Trade:</strong> exchange with a mutual ally.</li><li><strong>Hold:</strong> take no action; still collect income.</li><li><strong>In class:</strong> your teacher starts the shared timer. Orders stay secret until it ends.</li></ul>${button('finish',role==='teacher'?'Return to teacher controls':'Enter the class world')}${button('replay','Try the introduction again',true)}`}</section>`;
 const report=t.phase==='choose'?'':roundReport(view,g.history.at(-1));
 return `<div class="frontier tutorial">${skip}${header}${meter}${resources}${controls}${report}<details class="tutorial-map" data-key="tutorial-map"><summary>Inspect the practice map</summary>${frontierMap(view)}${frontierTerritory(view)}</details>${g.history.filter(h=>h.round!==g.round).map(h=>`<details data-key="tutorial-round-${h.round}"><summary>Practice round ${h.round} report</summary>${roundReport(view,h)}</details>`).join('')}${role==='teacher'?button('exit','Back to teacher controls',true):''}</div>`;
}
export function tutorialAction(action,data,state,role,token,now=Date.now()){
 if(!action.startsWith('frontier-tutorial-'))return false;ensure(state,token);
 const a=action.slice('frontier-tutorial-'.length);
 if(a==='replay'){current=newTutorial(state.me?.name||'You');previewTeacher=role==='teacher';}
 else if(a==='start'&&current.phase==='intro')beginTutorialRound(current,now);
 else if(a==='choice'&&current.phase==='choose'){if(now>=current.game.deadline)resolveTutorial(current,now);else if(LESSONS[current.game.round-1].choices.some(c=>c[0]===data.choice))current.choice=data.choice;}
 else if(a==='reveal'&&current.phase==='choose')resolveTutorial(current,now);
 else if(a==='skip'&&role==='student'){current.done=true;previewTeacher=false;}
 else if(a==='finish'&&current.phase==='complete'){current.done=true;previewTeacher=false;}
 else if(a==='exit'&&role==='teacher')previewTeacher=false;
 save();return true;
}
export function tutorialClock(now=Date.now()){
 if(!shown||!current)return false;const changed=tickTutorial(current,now);if(changed)save();const el=document.querySelector('#tutorial-clock');if(el){const deadline=current.phase==='choose'?current.game.deadline:current.reviewUntil;el.textContent=Math.max(0,Math.ceil((deadline-now)/1000))+'s';}return changed;
}
