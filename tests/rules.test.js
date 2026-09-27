import {test} from 'node:test';
import assert from 'node:assert/strict';
import {score,analyze,CALENDAR} from '../docs/rules.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function demo(){return Array.from({length:13},(_,id)=>({id,venue:id<6?0:id<10?1:2,contribution:2}));}
test('Published demonstration and all 15 counterfactual choices match the source deck',()=>{
  const r=analyze(demo(),1);assert.deepEqual(r.counts,[6,4,3]);assert.equal(r.totalContribution,26);
  near(r.rows[0].payoff,19.2);near(r.rows[6].payoff,19.2);near(r.rows[10].payoff,18.2);near(r.playerTotal,246.6);near(r.auditTotal,246.6);
  near(r.rows[0].bestPayoff,20.8);near(r.rows[0].regret,1.6);
  near(r.rows[0].alternatives.find(a=>a.venue===1&&a.contribution===0).payoff,19.8);
});
test('Independent oracle: calendar, crowding and 15 unilateral deviations across 90 profiles',()=>{
  let seed=219;const rand=()=>{seed=(seed*16807)%2147483647;return seed;};
  for(let trial=0;trial<90;trial++){
    const round=trial%3+1,ds=Array.from({length:13},(_,id)=>({id,venue:rand()%3,contribution:rand()%5}));const result=analyze(ds,round);
    let total=0;for(let i=0;i<13;i++){
      const own=ds[i],others=ds.filter((_,j)=>j!==i),C=others.reduce((a,d)=>a+d.contribution,0);
      const oracle=(v,c)=>CALENDAR[round-1][v]-1-others.filter(d=>d.venue===v).length+4-c+(C+c)/5;
      near(result.rows[i].payoff,oracle(own.venue,own.contribution));total+=oracle(own.venue,own.contribution);
      const max=Math.max(...[0,1,2].flatMap(v=>[0,1,2,3,4].map(c=>oracle(v,c))));near(result.rows[i].bestPayoff,max);near(result.rows[i].regret,max-oracle(own.venue,own.contribution));
    }near(result.auditTotal,total);
  }
});
test('Sandbox funding and enforced minimum are accounted for without changing recorded actions',()=>{
  const ds=demo(),base=score(ds,1),reward=score(ds,1,{type:'externalReward',value:1}),equal=score(ds,1,{type:'equalFundReward',value:1}),tax=score(ds,1,{type:'congestionTax',value:0.5});
  near(reward.playerTotal,base.playerTotal+26);near(reward.externalCost,26);near(reward.netTotal,base.playerTotal);near(equal.playerTotal,base.playerTotal);near(tax.netTotal,base.playerTotal);
  const zero=ds.map(d=>({...d,contribution:0})),minimum=score(zero,1,{type:'minimum',value:2});near(minimum.rows[0].payoff-score(zero,1).rows[0].payoff,3.2);assert.equal(zero[0].contribution,0);
  const rewardRegret=analyze(ds,1,{type:'externalReward',value:1});assert.ok(rewardRegret.rows.every(r=>r.bestActions.every(a=>a.contribution===4)));
});
