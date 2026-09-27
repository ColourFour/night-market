'use strict';
// Source: Game_Theory_All_Lessons.pptx, slides 163–169, 192–204, 210–215.
const ROSTER = Array.from({length:13},(_,i)=>`Founder ${String(i+1).padStart(2,'0')}`);
const VENUES = ['Neon Square','Garden Lane','Rooftop Row'];
const CALENDAR = [[18,16,14],[16,18,14],[16,14,18]];
const round1 = n => Math.round(n * 10) / 10;
function validateChoice(d) {
  if (!d || !Number.isInteger(d.venue) || d.venue < 0 || d.venue > 2 || !Number.isInteger(d.contribution) || d.contribution < 0 || d.contribution > 4) throw new Error('Choose a venue and a whole contribution from 0 to 4.');
}
function validateRule(rule) {
  if (!rule || !['original','externalReward','equalFundReward','congestionTax','minimum'].includes(rule.type)) throw new Error('Choose one supported rule.');
  if (!Number.isFinite(rule.value) || rule.value < 0 || rule.value > 4 || (rule.type === 'minimum' && !Number.isInteger(rule.value))) throw new Error('Rule value must be between 0 and 4; minimum contributions must be whole numbers.');
  return rule;
}
function score(decisions, round, rule = {type:'original', value:0}) {
  validateRule(rule);
  if (decisions.length !== 13 || !Number.isInteger(round) || round < 1 || round > 3) throw new Error('A round requires all 13 founders and a valid calendar row.');
  decisions.forEach(validateChoice);
  const actions = decisions.map(d => ({...d, contribution:rule.type === 'minimum' ? Math.max(d.contribution, rule.value) : d.contribution}));
  const counts = VENUES.map((_,v)=>actions.filter(d=>d.venue===v).length);
  const totalContribution = actions.reduce((s,d)=>s+d.contribution,0);
  const reward = ['externalReward','equalFundReward'].includes(rule.type) ? rule.value : 0;
  const fundCost = reward * totalContribution;
  const rows = actions.map(d => {
    const base = CALENDAR[round-1][d.venue], crowding = counts[d.venue];
    const kept = 4-d.contribution, lantern = totalContribution/5;
    const subsidy = reward*d.contribution, levy = rule.type === 'equalFundReward' ? fundCost/13 : 0;
    const tax = rule.type === 'congestionTax' ? rule.value * (crowding-1) : 0;
    return {...d, base, crowding, kept, lantern, subsidy, levy, tax, payoff:base-crowding+kept+lantern+subsidy-levy-tax};
  });
  const playerTotal = rows.reduce((s,d)=>s+d.payoff,0);
  const congestionCost = counts.reduce((s,n)=>s+n*n,0);
  const taxRevenue = rows.reduce((s,d)=>s+d.tax,0);
  const externalCost = rule.type === 'externalReward' ? fundCost : 0;
  return {counts,totalContribution,rows,playerTotal,congestionCost,externalCost,taxRevenue,netTotal:playerTotal-externalCost+taxRevenue,
    auditTotal:counts.reduce((s,n,v)=>s+n*(CALENDAR[round-1][v]-n),0)+52+1.6*totalContribution};
}
function analyze(decisions, round, rule = {type:'original',value:0}) {
  const result=score(decisions,round,rule);
  result.rows=result.rows.map((row,i)=>{
    const alternatives=[];
    for(let venue=0;venue<3;venue++) for(let contribution=(rule.type==='minimum'?rule.value:0);contribution<=4;contribution++) {
      const changed=decisions.map((d,j)=>j===i?{...d,venue,contribution}:d);
      alternatives.push({venue,contribution,payoff:score(changed,round,rule).rows[i].payoff});
    }
    const bestPayoff=Math.max(...alternatives.map(a=>a.payoff));
    return {...row, alternatives, bestPayoff, bestActions:alternatives.filter(a=>Math.abs(a.payoff-bestPayoff)<1e-8), regret:Math.max(0,bestPayoff-row.payoff)};
  });
  return result;
}
export {ROSTER,VENUES,CALENDAR,round1,validateChoice,validateRule,score,analyze};
