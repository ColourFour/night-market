import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cryptoView,cryptoPayload,cryptoInput} from '../docs/crypto-ui.js';
test('Student UI has exactly three fields, no generator, and no teacher controls',()=>{
 const s={id:'abcdef',status:'open',submitted:0,total:3,me:{id:0,name:'<img onerror=alert(1)>',entry:null},myGuessCount:0};const h=cryptoView(s,'student');
 assert.match(h,/OPERATION/);assert.match(h,/name="rule"/);assert.match(h,/name="ciphertext"/);assert.match(h,/name="plaintext"/);assert.match(h,/Seal &amp; transmit|Seal & transmit/);
 assert.doesNotMatch(h,/<img|data-action="crypto-reveal"|crypto-decode/);assert.match(h,/&lt;img/);
 const ready=cryptoView({...s,me:{...s.me,entry:{rule:'RULE',ciphertext:'CODE',plaintext:'OWN'}},messages:[{studentId:1,name:'Other',ciphertext:'SECRET CODE',myGuess:null}]},'student');
 assert.match(ready,/crypto-guess-1/);assert.match(ready,/SECRET CODE/);assert.match(ready,/without the rule/);assert.doesNotMatch(ready,/crypto-submit|crypto-decode|data-action="crypto-reveal"/);
});
test('Teacher sees the rule before ciphertext and cannot declassify incomplete or dirty work',()=>{
 const s={id:'abcdef',status:'open',submitted:1,total:1,reviewed:0,guessCount:0,seats:[],entries:[{studentId:0,name:'Agent',rule:'RULE FIRST',ciphertext:'CODE SECOND',attempt:null}]};let h=cryptoView(s,'teacher');
 assert.ok(h.indexOf('RULE FIRST')<h.indexOf('CODE SECOND'));assert.match(h,/Could not decode/);assert.match(h,/id="crypto-reveal"/);assert.match(h,/disabled/);assert.doesNotMatch(h,/name="plaintext"/);
 s.reviewed=1;s.entries[0].attempt={guess:'Saved',passed:false};h=cryptoView(s,'teacher');assert.match(h,/data-saved="Saved"/);
 const reveal={disabled:false},status={textContent:''},input={value:'Different',dataset:{saved:'Saved'}};
 const doc={querySelectorAll:()=>[{querySelector:q=>q==='[name=guess]'?input:status}],querySelector:()=>reveal};cryptoInput(s,doc);assert.equal(reveal.disabled,true);assert.match(status.textContent,/Unsaved/);
 input.value='Saved';cryptoInput(s,doc);assert.equal(reveal.disabled,false);
});
test('Revealed UI displays teacher success, peer successes, rules and actual plaintext safely',()=>{
 const s={id:'abcdef',status:'revealed',submitted:1,results:[{studentId:1,name:'Agent',rule:'Reverse <script>',ciphertext:'X',plaintext:'Truth <script>',teacher:{guess:'Truth',correct:true,passed:false},decodedByPeers:1,peers:[{name:'A',guess:'Truth',correct:true},{name:'B',guess:'No',correct:false}]}]};
 const h=cryptoView(s,'student');assert.match(h,/Teacher decoded it/);assert.match(h,/1 classmate decoded it/);assert.match(h,/Truth &lt;script&gt;/);assert.match(h,/Reverse &lt;script&gt;/);assert.match(h,/✓ Match/);assert.match(h,/× No match/);assert.doesNotMatch(h,/<script>|crypto-guess-|crypto-submit/);
 assert.deepEqual(cryptoPayload('crypto-decode-2',{targetId:'2',guess:'Hi'}),{path:'admin/decode',body:{targetId:2,guess:'Hi',passed:false}});
});
