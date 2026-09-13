const {currentAdmin,requirePermission}=require('./admin-content-routes');
const {keyFor,fail}=require('./account-service');
const {PLANS,amountInPaise}=require('./customer-pricing');
const {configuredPricing}=require('./website-content');
const all=async(store,name)=>store.listWithIds?store.listWithIds(name):store.list(name);
const mode=order=>order.testMode===true?'test':order.testMode===false?'live':'unknown';
function paymentTotals(order){
  const payments=order.gateway?.payments;
  if(Array.isArray(payments)&&payments.length){const captured=payments.filter(p=>['captured','refunded'].includes(p.status));return {captured:captured.reduce((n,p)=>n+p.amount,0),refunded:captured.reduce((n,p)=>n+(p.amountRefunded||0),0),failed:payments.filter(p=>p.status==='failed').length};}
  return {captured:order.status==='paid'?order.amount:0,refunded:0,failed:0};
}
function orderView(order){return {id:order.id||order._id,customerKey:order.customerKey,plan:order.plan,amount:order.amount,currency:'INR',status:order.status||'created',mode:mode(order),createdAt:order.createdAt,paidAt:order.paidAt||null,paymentId:order.paymentId||null,refundId:order.refundId||null,pricingSource:order.pricingSource||'website',billing:order.billing?{name:order.billing.name,email:order.billing.email,company:order.billing.company,phone:order.billing.phone}:null,invoiceNumber:order.invoice?.number||null,gateway:order.gateway||null,...paymentTotals(order)};}
function customerView(customer,orders){
 const own=orders.filter(o=>o.customerKey===keyFor(customer.email));
 const live=own.filter(o=>mode(o)==='live');
 return {email:customer.email,name:customer.name||'',company:customer.company||'',createdAt:customer.registeredAt||customer.createdAt||null,emailVerified:Boolean(customer.emailVerifiedAt),trialRequested:Boolean(customer.trialRequest),onboarding:customer.onboarding||{status:customer.trialRequest||customer.paidOrder?'requested':'not-requested'},pricingOverrides:customer.pricingOverrides||{},pricingRevision:customer.pricingRevision||0,orderCount:own.length,paidOrders:own.filter(o=>paymentTotals(o).captured>0).length,livePaidOrders:live.filter(o=>paymentTotals(o).captured>0).length,liveCaptured:live.reduce((sum,o)=>sum+paymentTotals(o).captured,0),lastPaymentAt:Math.max(0,...own.filter(o=>paymentTotals(o).captured>0).map(o=>o.paidAt||o.createdAt))||null};
}
function registerAdminCommerce(app,{store,addAudit,razorpay}){
 const requireAccess=async(req,permission)=>{const admin=await currentAdmin(req,store);requirePermission(admin,permission);return admin};
 app.get('/api/admin/customers',async(req,res)=>{
  await requireAccess(req,'records.read');const [customers,orders]=await Promise.all([store().list('customers'),all(store(),'orders')]);
  const q=String(req.query.search||'').toLowerCase(),filter=String(req.query.status||'all');
  let rows=customers.filter(c=>typeof c.email==='string').map(c=>customerView(c,orders));
  const summary={total:rows.length,verified:rows.filter(c=>c.emailVerified).length,paid:rows.filter(c=>c.livePaidOrders>0).length,trials:rows.filter(c=>c.trialRequested).length};
  rows=rows.filter(c=>`${c.name} ${c.email} ${c.company}`.toLowerCase().includes(q)&&(filter==='paid'?c.livePaidOrders>0:filter==='unpaid'?c.livePaidOrders===0:filter==='trial'?c.trialRequested:filter==='unverified'?!c.emailVerified:true)).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)||a.email.localeCompare(b.email));
  const page=Math.max(1,parseInt(req.query.page)||1),limit=20;res.json({items:rows.slice((page-1)*limit,page*limit),total:rows.length,page,limit,summary});
 });
 app.get('/api/admin/customers/:email',async(req,res)=>{
  await requireAccess(req,'records.read');const c=await store().get('customers',keyFor(req.params.email));if(!c)throw fail(404,'Customer not found.');
  const orders=await all(store(),'orders');const history=(await store().list('audit_logs')).filter(a=>a.resource==='customer-pricing'&&a.resourceId===keyFor(c.email)).sort((a,b)=>b.createdAt-a.createdAt).slice(0,30).map(a=>({admin:a.admin,action:a.action,createdAt:a.createdAt,plan:a.plan,reason:a.reason,previous:a.previous,newValue:a.newValue}));
  res.json({customer:customerView(c,orders),orders:orders.filter(o=>o.customerKey===keyFor(c.email)).sort((a,b)=>b.createdAt-a.createdAt).map(orderView),history,pricing:await configuredPricing(store())});
 });
 app.put('/api/admin/customers/:email/pricing/:plan',async(req,res)=>{
  const admin=await requireAccess(req,'billing.write'),plan=req.params.plan;
  req.body ||= {};
  if(!PLANS.includes(plan))throw fail(400,'Choose Starter or Growth.');
  if(typeof req.body.reason!=='string'||req.body.reason.trim().length<3||req.body.reason.length>1000)throw fail(400,'Add a reason for the pricing change (3–1000 characters).');
  const remove=req.body.remove===true,amount=remove?null:amountInPaise(req.body.amount);
  const expiresAt=req.body.expiresAt??null;
  if(!remove&&expiresAt!==null&&(!Number.isSafeInteger(expiresAt)||expiresAt<=Date.now()))throw fail(400,'Choose a future expiry date or leave it blank.');
  await store().transaction(async tx=>{
   const key=keyFor(req.params.email),customer=await tx.get('customers',key);if(!customer)throw fail(404,'Customer not found.');
   if(req.body.revision!==(customer.pricingRevision||0))throw fail(409,'Customer pricing changed in another session. Reload before saving.');
   const overrides={...customer.pricingOverrides},previous=overrides[plan]||null;
   if(remove)delete overrides[plan];else overrides[plan]={amount,currency:'INR',expiresAt,reason:req.body.reason.trim(),updatedBy:admin.email,updatedAt:Date.now()};
   await tx.put('customers',key,{...customer,pricingOverrides:overrides,pricingRevision:(customer.pricingRevision||0)+1});
   await addAudit({admin:admin.email,action:remove?'pricing.remove':'pricing.set',resource:'customer-pricing',resourceId:key,plan,reason:req.body.reason.trim(),previous,newValue:overrides[plan]||null,success:true},tx);
  });res.json({success:true});
 });
 app.get('/api/admin/payments',async(req,res)=>{
  await requireAccess(req,'billing.read');
  const selectedMode=['live','test','unknown','all'].includes(req.query.mode)?req.query.mode:'live';
  const days=req.query.days==='all'?null:Math.min(365,Math.max(1,parseInt(req.query.days)||30));
  const since=days?Date.now()-days*86400000:0,q=String(req.query.search||'').toLowerCase(),status=req.query.status||'all';
  const rows=(await all(store(),'orders')).map(orderView).filter(o=>(selectedMode==='all'||o.mode===selectedMode)&&(o.paidAt||o.createdAt)>=since);
  const summary={orders:rows.length,paidCustomers:new Set(rows.filter(o=>o.captured>0).map(o=>o.customerKey)).size,captured:0,refunded:0,net:0,paid:0,pending:0,failedAttempts:0};
  const grouped={};
  for(const order of rows){summary.captured+=order.captured;summary.refunded+=order.refunded;summary.failedAttempts+=order.failed;if(order.captured>0)summary.paid++;else summary.pending++;const date=new Date(order.paidAt||order.createdAt).toISOString().slice(0,10);grouped[date]||={date,captured:0,refunded:0,orders:0};grouped[date].captured+=order.captured;grouped[date].refunded+=order.refunded;grouped[date].orders++;}summary.net=summary.captured-summary.refunded;
  const filtered=rows.filter(o=>`${o.id} ${o.paymentId||''} ${o.billing?.name||''} ${o.billing?.email||''} ${o.billing?.company||''}`.toLowerCase().includes(q)&&(status==='paid'?o.captured>0:status==='pending'?o.captured===0:status==='refunded'?o.refunded>0:status==='failed'?o.failed>0:true)).sort((a,b)=>(b.paidAt||b.createdAt)-(a.paidAt||a.createdAt));
  const page=Math.max(1,parseInt(req.query.page)||1),limit=20;
  res.json({items:filtered.slice((page-1)*limit,page*limit),total:filtered.length,page,limit,summary,trend:Object.values(grouped).sort((a,b)=>a.date.localeCompare(b.date)),gateway:{configured:Boolean(razorpay),mode:!razorpay?'unconfigured':process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_')?'live':'test'},mode:selectedMode,days});
 });
 const refreshing=new Set();
 app.post('/api/admin/payments/:id/refresh',async(req,res)=>{
  const admin=await requireAccess(req,'billing.read');if(!razorpay)throw fail(503,'Razorpay is not configured.');
  const order=await store().get('orders',req.params.id);if(!order)throw fail(404,'Order not found.');
  const gatewayMode=process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_')?'live':'test';
  if(mode(order)!==gatewayMode)throw fail(409,'This order belongs to a different or unknown Razorpay mode.');
  if(refreshing.has(req.params.id)||Date.now()-(order.gateway?.checkedAt||0)<15000)throw fail(429,'Wait a few seconds before refreshing this order again.');
  refreshing.add(req.params.id);
  try{
   const response=await razorpay.orders.fetchPayments(req.params.id);
   const payments=(response.items||[]).map(p=>{if(p.order_id!==req.params.id||p.currency!=='INR'||!Number.isSafeInteger(p.amount)||p.amount<0||!Number.isSafeInteger(p.amount_refunded||0)||(p.amount_refunded||0)<0||(p.amount_refunded||0)>p.amount)throw Error('Unexpected payment data');return {id:p.id,status:p.status,amount:p.amount,amountRefunded:p.amount_refunded||0,method:p.method||null,createdAt:p.created_at*1000,errorDescription:p.error_description||null};});
   await store().transaction(async tx=>{const current=await tx.get('orders',req.params.id);await tx.put('orders',req.params.id,{...current,gateway:{checkedAt:Date.now(),payments}});await addAudit({admin:admin.email,action:'payments.refresh',resource:'orders',resourceId:req.params.id,success:true},tx)});
   res.json({success:true});
  }catch(error){if(error.status)throw error;throw fail(502,'Unable to fetch Razorpay payment details. Please try again.');}finally{refreshing.delete(req.params.id)}
 });
}
module.exports={registerAdminCommerce,paymentTotals,customerView};
