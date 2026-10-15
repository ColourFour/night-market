// Read-only smoke check. Does not create a world, claim seats, or alter class results.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const values={...process.env};
if(fs.existsSync('.private/live.env'))for(const line of fs.readFileSync('.private/live.env','utf8').split('\n')){const m=line.match(/^(?:export\s+)?(NIGHT_MARKET_API|NIGHT_MARKET_TEACHER_KEY)=(.*)$/);if(m)values[m[1]]=m[2].trim().replace(/^['"]|['"]$/g,'');}
const base=values.NIGHT_MARKET_API,key=values.NIGHT_MARKET_TEACHER_KEY;
assert.ok(base&&key,'Private live configuration is required.');
async function get(route,token=key,expected=200){const r=await fetch(base+'/api/'+route,{headers:{Authorization:'Bearer '+token,Origin:'https://colourfour.github.io'},signal:AbortSignal.timeout(30000)});assert.equal(r.status,expected,route+' status');assert.equal(r.headers.get('access-control-allow-origin'),'https://colourfour.github.io');return r.json();}
const teacher=await get('frontier/teacher');assert.ok(teacher.empty||teacher.id);assert.equal(JSON.stringify(teacher).includes(key),false);
await get('frontier/teacher','invalid',401);await get('frontier/state','invalid',401);
const pairs=await get('pairs/teacher');const zones=await get('zones/teacher');
console.log(JSON.stringify({passed:true,frontier:teacher.empty?'ready for teacher setup':teacher.status,rosterSize:teacher.roster?.length??teacher.players?.length,pairedGame:pairs.status,economicZones:zones.status,authentication:'invalid tokens rejected',cors:'verified'}));
