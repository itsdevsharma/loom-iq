const {test}=require('node:test'),assert=require('node:assert/strict'),express=require('express'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {fileRepository}=require('./repository'),{keyFor}=require('./account-service'),{registerAdminCommerce}=require('./admin-commerce'),{customerQuote}=require('./customer-pricing');
test('commerce: signup privacy, authorization, customer quotes, revisions, expiry and gateway analytics',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'commerce-')),repo=fileRepository(path.join(dir,'state.json')),token='d'.repeat(64),email='client@example.invalid',key=keyFor(email),now=Date.now();
 await repo.put('admins','admin',{email:'owner@example.invalid',roles:['superadmin']});await repo.put('sessions',keyFor(token),{adminKey:'admin',expiresAt:now+60000});
 await repo.put('customers',key,{email,name:'Client',company:'Company',registeredAt:now,passwordHash:'private-password'});
 await repo.put('orders','order_live',{id:'order_live',customerKey:key,amount:199000,status:'paid',paidAt:now,createdAt:now,testMode:false,billing:{email}});
 await repo.put('orders','order_test',{id:'order_test',customerKey:key,amount:99500,status:'paid',paidAt:now,createdAt:now,testMode:true,billing:{email}});
 const audits=[];let calls=0;const app=express();app.use(express.json());registerAdminCommerce(app,{store:()=>repo,addAudit:async(a,tx)=>{audits.push(a);await tx.put('audit_logs',String(audits.length),{...a,createdAt:Date.now()})},razorpay:{orders:{fetchPayments:async id=>{calls++;return {items:[{id:'pay_test',order_id:id,currency:'INR',amount:99500,amount_refunded:20000,status:'captured',method:'upi',created_at:Math.floor(now/1000),card:{secret:'hidden'}}]}}}}});app.use((e,req,res,next)=>res.status(e.status||500).json({message:e.message}));const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(async()=>{await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true})});
 async function request(route,method='GET',body,auth=true){const res=await fetch(`http://127.0.0.1:${server.address().port}/api/admin/`+route,{method,headers:{'Content-Type':'application/json',...(auth?{Cookie:`loomiq_admin_session=${token}`}:{})},body:body?JSON.stringify(body):undefined});return {status:res.status,body:await res.json()}}
 assert.equal((await request('customers','GET',null,false)).status,401);let result=await request('customers');assert.equal(result.body.summary.total,1);assert.equal(result.body.items[0].createdAt,now);assert.ok(!JSON.stringify(result).includes('private-password'));
 const route=`customers/${email}/pricing/Starter`,change={amount:750.25,reason:'Agreed customer rate',revision:0};
 assert.equal((await request(route,'PUT',{...change,amount:-1})).status,400);assert.equal((await request(route,'PUT',{...change,amount:1.001})).status,400);assert.equal((await request(route,'PUT',{...change,reason:''})).status,400);
 assert.equal((await request(route,'PUT',change)).status,200);assert.equal((await request(route,'PUT',change)).status,409);
 let quote=await customerQuote(repo,key,'Starter',{eligible:true,expiresAt:now+60000});assert.equal(quote.amount,75025);assert.equal(quote.source,'customer');assert.equal(quote.discounted,false);
 assert.equal((await customerQuote(repo,'other','Starter',{eligible:true})).amount,199000);assert.equal((await repo.get('orders','order_live')).amount,199000);
 assert.equal((await request('customers/'+email)).body.history[0].reason,change.reason);
 assert.equal((await request(route,'PUT',{...change,revision:1,expiresAt:now+60000})).status,200);assert.equal((await customerQuote(repo,key,'Starter',{eligible:false},now+60001)).amount,199000);
 assert.equal((await request(route,'PUT',{remove:true,reason:'Restore regular rules',revision:2})).status,200);assert.equal((await customerQuote(repo,key,'Starter',{eligible:true})).amount,199000);
 result=await request('payments?days=all');assert.equal(result.body.summary.captured,199000);assert.equal(result.body.items.length,1);assert.equal(result.body.items[0].mode,'live');
 assert.equal((await request('payments/order_live/refresh','POST',{})).status,409);assert.equal(calls,0);
 assert.equal((await request('payments/order_test/refresh','POST',{})).status,200);assert.equal((await request('payments/order_test/refresh','POST',{})).status,429);
 result=await request('payments?mode=test&days=all');assert.equal(result.body.summary.captured,99500);assert.equal(result.body.summary.refunded,20000);assert.equal(result.body.summary.net,79500);assert.ok(!JSON.stringify(result).includes('hidden'));assert.equal((await repo.get('orders','order_test')).amount,99500);
 await repo.put('admins','admin',{email:'reader@example.invalid',roles:[],permissions:['records.read']});assert.equal((await request(route,'PUT',{...change,revision:3})).status,403);assert.equal((await request('payments')).status,403);
});
