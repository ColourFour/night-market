import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newTutorial,beginTutorialRound,resolveTutorial,tickTutorial,LESSONS} from '../docs/frontier-tutorial.js';
test('Three bot rounds teach all five actions, use real outcomes and take at most five active minutes',()=>{
 const t=newTutorial('Learner');beginTutorialRound(t,0);const taught=new Set();
 for(let round=1;round<=3;round++){
  assert.equal(t.game.round,round);t.choice=['expand','develop','trade'][round-1];
  const deadline=t.game.deadline;assert.equal(tickTutorial(t,deadline-1),false);assert.equal(tickTutorial(t,deadline),true);assert.equal(t.phase,'review');
  const h=t.game.history.at(-1);assert.equal(h.round,round);assert.equal(h.outcomes.length,3);Object.values(h.orders).forEach(o=>taught.add(o.action));
  assert.equal(tickTutorial(t,deadline+19999),false);assert.equal(tickTutorial(t,deadline+20000),true);
 }
 assert.equal(t.phase,'complete');assert.equal(t.reviewUntil,300000);assert.deepEqual([...taught].sort(),['develop','hold','move','recruit','trade']);
 assert.equal(t.game.players[0].ally,1);assert.equal(t.game.players[1].ally,0);assert.equal(t.game.history[0].outcomes[0].after.territories.length,2);
 assert.equal(t.game.history[2].orders[2].action,'move');assert.equal(t.done,false);
});
test('Alternative choices teach a tied attack, recruiting and rejected trade; timeout holds',()=>{
 const t=newTutorial('Learner');beginTutorialRound(t,0);t.choice='testTie';resolveTutorial(t,1000);
 assert.equal(t.game.tiles[1].owner,null);assert.equal(t.game.tiles[1].troops,0);
 tickTutorial(t,21000);t.choice='recruit';resolveTutorial(t,22000);assert.equal(t.game.history[1].orders[0].action,'recruit');
 tickTutorial(t,42000);t.choice='hold';resolveTutorial(t,43000);assert.equal(t.game.players[0].ally,null);assert.match(t.game.history[2].events.map(e=>e.text).join(' '),/convoy was cancelled/);
 const timeout=newTutorial('No click');beginTutorialRound(timeout,0);tickTutorial(timeout,80000);assert.equal(timeout.game.history[0].orders[0].automatic,true);
 assert.equal(LESSONS.length,3);assert.equal(timeout.game.history[0].outcomes[0].before.score,12);
});
