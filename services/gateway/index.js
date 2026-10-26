const express=require('express');const helmet=require('helmet');const jwt=require('jsonwebtoken');const rateLimit=require('express-rate-limit');const {createClient}=require('redis');
const SECRET=process.env.JWT_SECRET||'local-dev-change-this-secret';
const targets={auth:process.env.AUTH_URL||'http://localhost:3001',customer:process.env.CUSTOMER_URL||'http://localhost:3002',product:process.env.PRODUCT_URL||'http://localhost:3003',order:process.env.ORDER_URL||'http://localhost:3004',shipment:process.env.SHIPMENT_URL||'http://localhost:3005'};
async function main(){const app=express();app.use(helmet());app.use(express.json({limit:'1mb'}));
 let redis;try{redis=createClient({url:process.env.REDIS_URL||'redis://localhost:6379'});redis.on('error',e=>console.error('Redis:',e.message));await redis.connect();}catch(e){console.error('Redis unavailable; using in-memory limiter',e.message);redis=null;}
 const memory=new Map();const limiter=async(req,res,next)=>{try{const key=`rate:${req.ip}`;let count;if(redis){count=await redis.incr(key);if(count===1)await redis.expire(key,60);}else{const now=Date.now(),state=memory.get(key);if(!state||now>state.until)memory.set(key,{count:1,until:now+60000});else state.count++;count=memory.get(key).count;}res.setHeader('RateLimit-Limit','100');if(count>100)return res.status(429).json({error:'Too many requests'});next();}catch(e){next(e);}};
 app.use(limiter);
 app.get('/api/health',async(_req,res)=>{const deps={gateway:'UP'};for(const [name,url] of Object.entries(targets)){try{const r=await fetch(`${url}/health`,{signal:AbortSignal.timeout(1500)});deps[name]=r.ok?'UP':'DOWN';}catch{deps[name]='DOWN';}}if(redis){try{await redis.ping();deps.redis='UP';}catch{deps.redis='DOWN';}}else deps.redis='DEGRADED';const ok=Object.values(deps).every(v=>v==='UP');res.status(ok?200:503).json({status:ok?'UP':'DEGRADED',dependencies:deps});});
 app.use('/api',async(req,res)=>{try{const path=req.path;let target;
  if(path.startsWith('/auth/'))target=targets.auth;else if(path.startsWith('/customers'))target=targets.customer;else if(path.startsWith('/products'))target=targets.product;else if(path.startsWith('/orders'))target=targets.order;else if(path.startsWith('/shipments'))target=targets.shipment;else return res.status(404).json({error:'Route not found'});
  const open=(path==='/auth/register'&&req.method==='POST')||(path==='/auth/login'&&req.method==='POST');let claims;
  if(!open){const header=req.headers.authorization||'';if(!header.startsWith('Bearer '))return res.status(401).json({error:'Bearer token required'});try{claims=jwt.verify(header.slice(7),SECRET);}catch{return res.status(401).json({error:'Invalid or expired token'});}
   const role=claims.role;const adminOnly=path==='/products'&&req.method==='POST'||/^\/products\/[^/]+$/.test(path)&&['PUT','DELETE'].includes(req.method);if(adminOnly&&role!=='Admin')return res.status(403).json({error:'Admin role required'});
   if(path.startsWith('/shipments/')&&path.endsWith('/status')&&!['Admin','ShipmentStaff'].includes(role))return res.status(403).json({error:'Shipment staff role required'});
   if(path.startsWith('/customers/')){const uid=Number(path.split('/')[2]);if(uid!==Number(claims.sub)&&role!=='Admin')return res.status(403).json({error:'Forbidden'});}
  }
  const headers={'content-type':'application/json'};if(claims){headers['x-user-id']=String(claims.sub);headers['x-user-role']=claims.role;}
  const body=['GET','HEAD'].includes(req.method)?undefined:JSON.stringify(req.body||{});const upstream=await fetch(`${target}/api${path}${req.url.includes('?')?req.url.slice(req.url.indexOf('?')):''}`,{method:req.method,headers,body,signal:AbortSignal.timeout(15000)});const raw=await upstream.text();
  if(path==='/auth/register'&&upstream.status===201){try{const data=JSON.parse(raw);const c=await fetch(`${targets.customer}/internal/customers`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({uid:data.uid})});if(!c.ok)console.error('Customer profile provisioning failed',await c.text());}catch(e){console.error('Customer profile provisioning failed',e.message);}}
  res.status(upstream.status);const type=upstream.headers.get('content-type');if(type)res.setHeader('content-type',type);res.send(raw);
 }catch(e){console.error(e);res.status(502).json({error:'Upstream service unavailable'});}});
 app.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('API Gateway listening on 3000'));
}
main().catch(e=>{console.error(e);process.exit(1)});
