import {handle} from '../../../docs/core.js';
const env=(name:string)=>Deno.env.get(name)||'';
const site=env('NIGHT_MARKET_SITE_URL')||'https://colourfour.github.io/night-market/';
const allowedOrigin=site?new URL(site).origin:'';
const teacherOverride=env('NIGHT_MARKET_TEACHER_KEY');
const db=env('SUPABASE_URL')+'/rest/v1/';
const service=env('SUPABASE_SERVICE_ROLE_KEY');
const headers={apikey:service,Authorization:'Bearer '+service,'Content-Type':'application/json'};
async function query(path:string,body?:unknown){
  const r=await fetch(db+path,{method:body===undefined?'GET':'POST',headers,...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(12000)});
  if(!r.ok)throw new Error('The game store is unavailable. Try again in a moment.');
  return r.json();
}
const hash=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),n=>n.toString(16).padStart(2,'0')).join('');
Deno.serve(async req=>{
  const origin=req.headers.get('origin');
  const cors={'Access-Control-Allow-Origin':allowedOrigin,'Access-Control-Allow-Headers':'authorization, content-type, if-none-match','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Expose-Headers':'ETag','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
  const reply=(status:number,body:unknown,type='application/json')=>new Response(type==='application/json'?JSON.stringify(body):String(body),{status,headers:{...cors,'Content-Type':type+'; charset=utf-8'}});
  if(!allowedOrigin||!service)return reply(503,{error:'Teacher setup is not complete.'});
  if(origin&&origin!==allowedOrigin)return reply(403,{error:'Open the classroom website directly.'});
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(!['GET','POST'].includes(req.method))return reply(405,{error:'Method not supported.'});
  const full=new URL(req.url),index=full.pathname.indexOf('/api/');
  if(index<0)return reply(404,{error:'Not found.'});
  const url=full.pathname.slice(index)+full.search;
  let body:any;
  try{
    if(req.method==='POST'){
      if(!req.headers.get('content-type')?.startsWith('application/json'))return reply(415,{error:'JSON required.'});
      // Stream a bounded request; a false Content-Length cannot bypass the limit.
      const reader=req.body?.getReader();let size=0;const chunks:Uint8Array[]=[];
      if(reader)while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2000000){await reader.cancel();return reply(413,{error:'File too large.'});}chunks.push(value);}
      const bytes=new Uint8Array(size);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
      try{body=JSON.parse(new TextDecoder().decode(bytes)||'{}');}catch{return reply(400,{error:'Invalid JSON.'});}
    }
    if(url==='/api/join'||url==='/api/lookup'){
      // Seat-scoped join limits cannot be bypassed by changing a browser header.
      const key=url==='/api/join'?'seat:'+String(body?.id):'lookup';
      const ok=await query('rpc/night_market_limit',{bucket_key:await hash(key),max_hits:url==='/api/join'?12:80,window_seconds:300});
      if(!ok)return reply(429,{error:'Too many joining attempts. Wait five minutes or ask your teacher.'});
    }
    for(let attempt=0;attempt<30;attempt++){
      const rows=await query('night_market_state?id=eq.1&select=version,game');
      if(!rows[0])return reply(503,{error:'Teacher setup is not complete.'});
      const state={...rows[0].game};
      if(teacherOverride)state.teacherKey=teacherOverride;
      if(!/^[a-f0-9]{48}$/.test(state.teacherKey))return reply(503,{error:'Teacher setup is not complete.'});
      const result=handle(state,{method:req.method,url,body,headers:{authorization:req.headers.get('authorization')||''}},{siteUrl:site});
      if(!result.changed){
        if(req.method==='GET'&&result.status===200&&url!=='/api/health'&&!url.startsWith('/api/export')){
          const etag='"'+rows[0].version+'"';
          if(req.headers.get('if-none-match')?.replace(/^W\//,'')===etag)return new Response(null,{status:304,headers:{...cors,ETag:etag}});
          const response=reply(result.status,result.body,result.type);response.headers.set('ETag',etag);return response;
        }
        return reply(result.status,result.body,result.type);
      }
      // Private state (including credentials) is service-role only; never return it to students.
      const next={...result.state};
      const archive=result.archive?{...result.archive}:null;
      const committed=await query('rpc/night_market_commit',{expected_version:rows[0].version,next_game:next,archive_game:archive});
      if(committed)return reply(result.status,result.body,result.type);
      await new Promise(resolve=>setTimeout(resolve,15+Math.random()*60));
    }
    return reply(409,{error:'The class is submitting at once. Please try your action again.'});
  }catch(e){return reply(503,{error:e instanceof Error?e.message:'Connection interrupted. Please retry.'});}
});
