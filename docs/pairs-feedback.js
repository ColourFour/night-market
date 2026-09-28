import {pairPayoff} from './pairs-core.js?v=practice1';
export function outcome(choice,other,name='your opponent'){
 const [score,otherScore]=pairPayoff(choice,other);
 const explanation=choice==='contribute'?(other==='contribute'?`You and ${name} both contributed, so you each earned 5 points.`:`You contributed and ${name} took. You earned 0 points; ${name} earned 6.`):(other==='contribute'?`You took and ${name} contributed. You earned 6 points; ${name} earned 0.`:`You and ${name} both took, so you each earned 2 points.`);
 return {score,otherScore,emoji:{0:'😢',2:'☹️',5:'👍',6:'👍'}[score],explanation};
}
