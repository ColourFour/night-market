import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cryptoView,cryptoPayload,cryptoInput,setCryptoArchive} from '../docs/crypto-ui.js';
test('Student UI has exactly three fields, no generator, and no teacher controls',()=>{
 const s={id:'abcdef',status:'open',submitted:0,total:3,me:{id:0,name:'<img onerror=alert(1)>',entry:null},myGuessCount:0};const h=cryptoView(s,'student');
 assert.match(h,/OPERATION/);assert.match(h,/name="rule"/);assert.match(h,/name="ciphertext"/);assert.match(h,/name="plaintext"/);assert.match(h,/Seal &amp; transmit|Seal & transmit/);
 assert.doesNotMatch(h,/<img|data-action="crypto-reveal"|crypto-decode/);assert.match(h,/&lt;img/);
 const ready=cryptoView({...s,me:{...s.me,entry:{rule:'RULE',ciphertext:'CODE',plaintext:'OWN'}},messages:[{studentId:1,name:'Other',ciphertext:'SECRET CODE',myGuess:null}]},'student');
 assert.match(ready,/crypto-guess-1/);assert.match(ready,/SECRET CODE/);assert.match(ready,/without the rule/);assert.doesNotMatch(ready,/crypto-submit|crypto-decode|data-action="crypto-reveal"/);
});
test('Teacher sees the rule before ciphertext and can end with unreviewed files but cannot end with unsaved attempts',()=>{
 const s={id:'abcdef',status:'open',submitted:1,total:1,reviewed:0,guessCount:0,seats:[],entries:[{studentId:0,name:'Agent',rule:'RULE FIRST',ciphertext:'CODE SECOND',attempt:null}]};let h=cryptoView(s,'teacher');
 assert.ok(h.indexOf('RULE FIRST')<h.indexOf('CODE SECOND'));assert.match(h,/Could not decode/);assert.match(h,/id="crypto-end"/);assert.match(h,/End assessment/);assert.doesNotMatch(h,/name="plaintext"/);
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
test('Every cipher view preserves explicit rows and indentation, including a first blank line',()=>{
 const raw='\n  A  B\n  C  D\n  E  F\n  G  H\n  I  J  \n',entry={studentId:0,name:'Agent',rule:'Read down.',ciphertext:raw,plaintext:'SECRET'};
 const student={id:'layout',status:'open',submitted:2,total:2,me:{id:1,name:'Other',entry:{...entry,studentId:1}},messages:[{...entry,myGuess:null}]};
 const markup='<pre class="cr-ciphertext"><span>'+raw+'</span></pre>';
 assert.ok(cryptoView(student,'student').includes(markup));
 assert.ok(cryptoView({...student,reviewed:0,guessCount:0,seats:[],entries:[{...entry,attempt:null}]},'teacher').includes(markup));
 assert.ok(cryptoView({...student,status:'revealed',results:[{...entry,teacher:{guess:'SECRET',correct:true},decodedByPeers:0,peers:[]}]},'student').includes(markup));
 const compose=cryptoView({...student,me:{...student.me,entry:null}},'student');assert.match(compose,/name="ciphertext" wrap="off" rows="5"/);
 assert.match(compose,/Line breaks and spaces are kept exactly/);
});
test('Hint/check UI exposes teacher publishing and student allowances, with escaped clues and a read-only confirmed answer',()=>{
 const message={studentId:1,name:'Other',ciphertext:'CODE',myGuess:'ANSWER',hint:{requested:true,available:true,text:'Hint <script>'},checks:{softRemaining:0,definitiveRemaining:0,solved:true,history:[{kind:'soft',guess:'Guess <img>',feedback:'Very close'},{kind:'definitive',guess:'ANSWER',correct:true}]}};
 const h=cryptoView({id:'abcdef',status:'open',submitted:2,total:2,me:{id:0,name:'Me',entry:{rule:'r',ciphertext:'c',plaintext:'p'}},messages:[message]},'student');
 assert.match(h,/Hint &lt;script&gt;/);assert.match(h,/Guess &lt;img&gt;/);assert.doesNotMatch(h,/<script>|<img>/);assert.match(h,/Correct answer confirmed and saved/);assert.match(h,/readonly/);assert.match(h,/data-crypto-check="soft"[^>]*disabled/);assert.match(h,/data-crypto-check="definitive"[^>]*disabled/);
 assert.deepEqual(cryptoPayload('crypto-guess-1',{targetId:'1',guess:'Hi',checkKind:'soft'}),{path:'check',body:{targetId:1,guess:'Hi',kind:'soft'}});
 assert.deepEqual(cryptoPayload('crypto-hint-1',{targetId:'1',hint:'Clue'}),{path:'admin/hint',body:{targetId:1,hint:'Clue'}});
 const teacher=cryptoView({id:'abcdef',status:'open',submitted:1,total:1,reviewed:0,guessCount:0,seats:[],hintRequestCount:1,checkCount:1,entries:[{studentId:1,name:'Other',rule:'RULE',ciphertext:'CODE',hint:'Teacher clue',hintRequests:1,attempt:null}]},'teacher');
 assert.match(teacher,/crypto-hint-1/);assert.match(teacher,/1 REQUEST/);assert.match(teacher,/Update published hint/);
});
test('Final pages show class and personal records, missing work and archive provenance without controls for students',()=>{
 const summary={submitted:1,registered:2,teacherMatched:0,teacherReviewed:0,peerGuesses:0,peerCorrect:0,students:[{studentId:0,name:'A <img>',submitted:true,teacherStatus:'not_reviewed',peersDecodedMessage:0,peerGuessesReceived:0,othersSolved:0,othersAttempted:0,hintsViewed:0,softChecks:0,definitiveChecks:0},{studentId:1,name:'Missing',submitted:false,teacherStatus:'not_submitted',peersDecodedMessage:0,peerGuessesReceived:0,othersSolved:0,othersAttempted:0,hintsViewed:0,softChecks:0,definitiveChecks:0}]};
 const s={id:'final',status:'revealed',submitted:1,endedAt:1793059200000,me:{id:0,name:'A'},summary,results:[{studentId:0,name:'A <img>',plaintext:'TRUE',ciphertext:'CODE',rule:'RULE',teacher:{reviewed:false,correct:false,passed:false,guess:''},peers:[],decodedByPeers:0}]};
 const h=cryptoView(s,'student');assert.match(h,/Final results/);assert.match(h,/YOUR FINAL RECORD/);assert.match(h,/Not tested/);assert.match(h,/Not submitted/);assert.match(h,/Not reviewed/);assert.match(h,/No attempt saved/);assert.match(h,/Print \/ save results/);assert.doesNotMatch(h,/<img>|crypto-end|crypto-archives|crypto-guess-/);
 setCryptoArchive({items:[{archiveId:4,missionId:'past',savedAt:'2026-10-27T01:00:00Z',status:'archived_before_end',submitted:1,teacherMatched:0,peerCorrect:0,peerGuesses:0}]});assert.match(cryptoView(s,'teacher'),/Past Cryptology sittings/);assert.match(cryptoView(s,'teacher'),/ARCHIVED BEFORE END/);
 setCryptoArchive({archiveId:4,missionId:'past',savedAt:'2026-10-27T01:00:00Z',status:'archived_before_end',summary,results:s.results});assert.match(cryptoView(s,'teacher'),/does not publish its answers/);assert.match(cryptoView(s,'teacher'),/data-archive-id="4"/);
 setCryptoArchive(null);
});
