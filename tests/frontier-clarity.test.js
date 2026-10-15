import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newFrontier,resolveFrontier,frontierStandings} from '../docs/frontier-core.js';
import {frontierView,clearFrontier} from '../docs/frontier-ui.js';
function view(g,id=0){return {...g,standings:frontierStandings(g),submitted:Object.keys(g.orders).length,expected:3,me:{id,name:g.players[id].name,participating:true,eliminated:false,order:g.orders[id]||null},seats:g.players.map(p=>({...p,submitted:!!g.orders[p.id]}))};}
test('Round instructions, order cards and hidden choices become a readable action/outcome report',()=>{
 const g=newFrontier([{id:0,name:'A'},{id:1,name:'B <script>'},{id:2,name:'C'}]);g.status='open';g.round=1;g.deadline=Date.now()+180000;
 g.orders={0:{action:'move',from:0,to:1,units:2,ally:null},1:{action:'develop',tile:3,ally:null}};
 clearFrontier();const before=frontierView(view(g),'student');assert.match(before,/Choose & save/);assert.match(before,/1\. Choose ONE order/);assert.match(before,/name="action" value="develop"/);assert.match(before,/Your planned route/);assert.doesNotMatch(before,/Who did what|Developed territory 4|data-label="Outcome"/);
 resolveFrontier(g);const after=frontierView(view(g),'student');assert.match(after,/Who did what\. What changed/);assert.match(after,/Captured territory 2/);assert.match(after,/Developed territory 4/);assert.match(after,/No order received/);assert.match(after,/B &lt;script&gt;/);assert.doesNotMatch(after,/B <script>/);assert.match(after,/data-label="food"/);assert.match(after,/Net resource change includes/);assert.match(after,/Your prosperity/);
 assert.ok(after.indexOf('frontier-report')<after.indexOf('frontier-map panel'));
 delete g.history[0].outcomes;assert.match(frontierView(view(g),'student'),/Not recorded for this older round/);
});
