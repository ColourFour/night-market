import {createSolo,soloView,saveSoloPlan,playSoloRound,nextSoloRound,finishSolo,soloExport,saveSolo,loadSolo,BOT_LEVELS} from './frontier-solo-core.js';
import {frontierView,frontierLocal,frontierInput,clearFrontier} from './frontier-ui.js?v=solo1';
import {planPayload} from './frontier-plan-ui.js?v=solo1';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let storage;try{storage=localStorage;}catch{}
let session=loadSolo(storage),setup=!session,saved=!!session,busy=false,confirmEnd=false;
const button=(action,text,secondary=true)=>`<button type="button" data-action="solo-${action}" class="${secondary?'secondary':''}">${text}</button>`;
function persist(){saved=saveSolo(storage,session);}
function notice(text){$('#notice').textContent=text;}
function setupView(){return `<section class="frontier-hero"><div class="eyebrow">Frontier Cities · solo robot mode</div><h1>A world of your own.</h1><p>One human. Fourteen robot cities. Build, trade and compete at your own pace.</p></section><section class="panel solo-setup"><h2>Choose your challenge</h2><form id="solo-create"><label>Your name<input name="name" maxlength="60" required autocomplete="given-name" value="${esc(session?.pairs.players[0].name||'')}" placeholder="Enter your name"></label><fieldset class="solo-levels"><legend>Robot ability</legend>${Object.entries(BOT_LEVELS).map(([key,l])=>`<label><input type="radio" name="difficulty" value="${key}" ${key===(session?.difficulty||'mixed')?'checked':''}><span><strong>${l.name}</strong><small>${l.description}</small></span></label>`).join('')}</fieldset><ul><li>No timer. Save and resolve when you are ready.</li><li>Up to 3 actions in rounds 1–4; no overall action cap from round 5. Actions are optional.</li><li>Robots use the same resources and legal actions. They cannot see your pending plan.</li><li>You and the robots race to the same victory targets, revealed after round 5.</li><li>Saved progress stays in this browser. Class scores are separate.</li></ul>${session?'<p>Starting a new world replaces this device’s previous solo game. Download its results first if you want to keep them.</p>':''}<button>${session?'Start a new solo world':'Start solo game'}</button>${session?button('resume','Return to saved game'):''}</form></section>`;}
function download(type){const value=soloExport(session,type);const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([typeof value==='string'?value:JSON.stringify(value,null,2)],{type:type==='json'?'application/json':'text/csv'}));a.download='Frontier-Cities-solo.'+(type==='json'?'json':'csv');a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function render(){
 const opened=[...document.querySelectorAll('details[open][data-key]')].map(d=>d.dataset.key);
 const nav='<div class="game-nav"><a class="button secondary" href="./">← Class games</a><span>Solo · private practice</span></div>';
 let content=setup?setupView():'';
 if(!setup){const g=soloView(session);content=`<section class="panel solo-controls"><div><div class="eyebrow">Solo · ${BOT_LEVELS[session.difficulty].name} robots</div><h2>${g.status==='complete'?'Your solo game is complete':g.status==='revealed'?'Round report ready':'Plan at your own pace'}</h2><p role="status">${saved?'Saved on this device. Return here to resume your game.':'Temporary game: browser storage is unavailable or full. Keep this tab open; download your results before leaving.'}</p></div><div class="actions">${g.status==='revealed'?button('next','Begin next round',false):''}${button('setup','New solo game')}${button('download','Download results')}${g.status!=='complete'?button('end','End solo game'):''}</div>${confirmEnd?`<p>End now and keep the completed rounds? The current unresolved plan will not be played.</p>${button('confirm-end','End and show final report',false)}${button('cancel-end','Keep playing')}`:''}<details data-key="solo-opponents"><summary>Meet your robots · abilities and alliances</summary><p>Easy robots offer you an alliance. Other robots may favour a nearby partner or stay independent. Alliances still need mutual choices.</p><div class="solo-bot-list">${g.players.filter(p=>p.bot).map(p=>`<article><strong>${esc(p.name)}</strong><small>${esc(p.botStyle)} · ${p.eliminated?'eliminated':BOT_LEVELS[p.botLevel].description}</small></article>`).join('')}</div></details></section>`+frontierView(g,'student');}
 $('#app').innerHTML=nav+content;
 for(const d of document.querySelectorAll('details[data-key]'))if(opened.includes(d.dataset.key))d.open=true;
 $('#connection').textContent='● Solo · on this device';$('#demo-tools').innerHTML='';
}
document.addEventListener('submit',e=>{
 if(!['solo-create','frontier-order'].includes(e.target.id))return;e.preventDefault();if(busy)return;busy=true;
 try{if(e.target.id==='solo-create'){const b=Object.fromEntries(new FormData(e.target));session=createSolo(b.name,b.difficulty);setup=false;confirmEnd=false;clearFrontier();}else{frontierInput();session=saveSoloPlan(session,planPayload());}persist();notice('');render();}catch(e){notice(e.message);}finally{busy=false;}
});
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-action]');if(!el||busy)return;busy=true;
 try{const action=el.dataset.action;
 if(action==='solo-play'){frontierInput();session=playSoloRound(session,planPayload());persist();notice('');}
 else if(action==='solo-next'){session=nextSoloRound(session);persist();}
 else if(action==='solo-setup'){setup=true;confirmEnd=false;}
 else if(action==='solo-resume'){setup=false;}
 else if(action==='solo-download'){download('json');return;}
 else if(action==='solo-end'){confirmEnd=true;}
 else if(action==='solo-cancel-end'){confirmEnd=false;}
 else if(action==='solo-confirm-end'){session=finishSolo(session);confirmEnd=false;persist();}
 else if(!frontierLocal(action,el.dataset))return;
 render();if(['solo-play','solo-next','solo-setup','solo-resume','solo-confirm-end'].includes(action))window.scrollTo({top:0,behavior:'instant'});
 }catch(e){notice(e.message);}finally{busy=false;}
});
document.addEventListener('input',e=>{if(e.target.closest?.('#frontier-order'))frontierInput();});
document.addEventListener('change',e=>{if(e.target.closest?.('#frontier-order')){frontierInput();render();}});
document.addEventListener('keydown',e=>{const tile=e.target.closest?.('[data-action=frontier-tile]');if(tile&&['Enter',' '].includes(e.key)){e.preventDefault();tile.click();}});
render();
