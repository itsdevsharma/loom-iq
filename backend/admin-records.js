const {fail,keyFor}=require('./account-service');
const {currentAdmin,requirePermission}=require('./admin-content-routes');
const collections={enquiries:'demoRequests',customers:'customers',orders:'orders',support:'supportRequests'};
function demoUsage(activity=[]){
  const events=Array.isArray(activity)?activity:[];
  const count=type=>events.filter(event=>event.type===type).length;
  const last=[...events].filter(event=>event.type==='erp_login').at(-1);
  return {logins:count('erp_login'),logouts:count('erp_logout'),recordsCreated:count('record_created'),recordsUpdated:count('record_updated'),reportsViewed:count('report_viewed'),lastLoginAt:last?.at||null};
}
function publicRecord(type,row){
  if(type==='customers')return {id:row.email,name:row.name,email:row.email,company:row.company,createdAt:row.createdAt||row.registeredAt,accountState:row.emailVerifiedAt?'email_verified':'signed_up',trialRequested:Boolean(row.trialRequest),paidOrder:row.paidOrder||null,onboarding:row.onboarding||{status:'requested'}};
  if(type==='orders')return {id:row.id||row.orderId||row._id||row.createdAt,plan:row.plan,amount:row.amount,status:row.status||'created',createdAt:row.createdAt,billing:row.billing,paidAt:row.paidAt,discounted:row.discounted};
  if(type==='enquiries'){
    const expired=['active','suspended'].includes(row.status)&&row.expiresAt&&row.expiresAt<=Date.now();
    const result=Object.fromEntries(['id','name','email','company','phone','businessType','requestType','notes','createdAt','updatedAt','expiresAt','convertedAt','purchaseOrderId','activity','credentials','feedback'].filter(key=>row[key]!==undefined).map(key=>[key,row[key]]));
    return {...result,status:expired?'expired':row.status||'new',usage:demoUsage(row.activity),...(row.erp?.userId?{erp:{userId:row.erp.userId}}:{})};
  }
  return Object.fromEntries(['id','name','email','company','phone','businessType','kind','service','business','sourcePage','attribution','message','subject','requestType','status','notes','createdAt','updatedAt'].filter(key=>row[key]!==undefined).map(key=>[key,row[key]]));
}
function cleanText(value){return typeof value==='string'?value.trim().replace(/\s+/g,' '):'';}
function validateDemo(values){
  const name=cleanText(values.name),email=cleanText(values.email).toLowerCase(),company=cleanText(values.company),mobile=cleanText(values.mobile).replace(/[^0-9+]/g,'');
  if(name.length<2||name.length>100)throw fail(400,'Enter a name between 2 and 100 characters.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)throw fail(400,'Enter a valid email address.');
  if(company.length<2||company.length>150)throw fail(400,'Enter a company name between 2 and 150 characters.');
  if(mobile.length<10||mobile.length>16)throw fail(400,'Enter a valid mobile number.');
  return {name,email,company,mobile,businessType:cleanText(values.businessType).slice(0,80)};
}
function requireSuperadmin(admin){if(!admin.roles.includes('superadmin'))throw fail(403,'Only super admins can create demo credentials without email verification.');}
function registerAdminRecordRoutes(app,{store,addAudit,erpIntegration,sendMail}){
  app.get('/api/admin/records/:type',async(req,res)=>{
    const admin=await currentAdmin(req,store);requirePermission(admin,'records.read');
    const collection=collections[req.params.type];if(!collection)throw fail(404,'Record type not found.');
    const search=String(req.query.search||'').toLowerCase();
    const rows=(await (store().listWithIds ? store().listWithIds(collection) : store().list(collection))).map(row=>publicRecord(req.params.type,row)).filter(row=>JSON.stringify(row).toLowerCase().includes(search)).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    const page=Math.max(1,parseInt(req.query.page)||1),limit=20;
    res.json({items:rows.slice((page-1)*limit,page*limit),total:rows.length,page,limit});
  });
  app.patch('/api/admin/records/:type/:id',async(req,res)=>{
    const admin=await currentAdmin(req,store);requirePermission(admin,'records.write');
    const type=req.params.type;if(!['customers','enquiries','support'].includes(type))throw fail(400,'These records cannot be edited here.');
    const status=req.body.status;const statuses=type==='customers'?['requested','in-progress','active']:['new','in-progress','resolved','closed'];
    if(!statuses.includes(status))throw fail(400,'Choose a valid status.');
    const notes=typeof req.body.notes==='string'?req.body.notes.trim():'';if(notes.length>5000)throw fail(400,'Notes must be under 5000 characters.');
    let workspaceUrl=null;
    if(type==='customers'&&status==='active'){try{const url=new URL(req.body.workspaceUrl);if(url.protocol!=='https:'||url.username||url.password)throw 0;workspaceUrl=url.href}catch{throw fail(400,'Provide a valid HTTPS workspace URL.')}}
    await store().transaction(async tx=>{const id=type==='customers'?keyFor(req.params.id):req.params.id;const record=await tx.get(collections[type],id);if(!record)throw fail(404,'Record not found.');if(type==='customers'){if(!record.trialRequest&&!record.paidOrder)throw fail(400,'This customer has no onboarding request.');record.onboarding={status,workspaceUrl,updatedAt:Date.now()}}else{record.status=status;record.notes=notes;record.updatedAt=Date.now()}await tx.put(collections[type],id,record);await addAudit({admin:admin.email,action:'records.update',resource:type,resourceId:req.params.id,success:true},tx)});
    res.json({success:true});
  });
  // This intentionally bypasses the public OTP flow, but only for a signed-in
  // super admin. The ERP still creates and expires the isolated demo tenant.
  app.post('/api/admin/demo-credentials',async(req,res)=>{
    const admin=await currentAdmin(req,store);requireSuperadmin(admin);
    if(!erpIntegration?.configured())throw fail(503,'The ERP demo service is not configured.');
    const values=validateDemo(req.body||{});
    let started,activated;
    try{
      started=await erpIntegration.startDemo({name:values.name,businessName:values.company,email:values.email,mobile:values.mobile,source:'loomiq_superadmin',campaign:'admin_direct',ip:'admin'});
      if(!started.requestId||!started.otp)throw fail(502,'The ERP did not return a demo verification request.');
      activated=await erpIntegration.verifyDemo({requestId:started.requestId,otp:started.otp});
      if(!activated.credentials?.username||!activated.credentials?.temporaryPassword||!activated.credentials?.expiresAt)throw fail(502,'The ERP did not return usable demo credentials.');
    }catch(error){throw fail(error.status||502,error.message||'Unable to create demo credentials.');}
    const now=Date.now();const record={id:'demo_'+require('crypto').randomUUID(),...values,status:'active',requestType:'three_hour_demo',erpRequestId:started.requestId,createdAt:new Date(now).toISOString(),updatedAt:new Date(now).toISOString(),expiresAt:activated.credentials.expiresAt,erp:{userId:activated.userId,organizationId:activated.organizationId},credentials:{username:activated.credentials.username,loginUrl:activated.loginUrl,issuedAt:now},activity:[{type:'demo_created_by_superadmin',at:now,detail:`Created by ${admin.email}; OTP bypass approved.`},{type:'demo_activated',at:now,detail:'Demo credentials issued by super admin'}]};
    await store().transaction(async tx=>{await tx.put('demoRequests',record.id,record);await addAudit({admin:admin.email,action:'demo.create_without_otp',resource:'enquiries',resourceId:record.id,success:true},tx);});
    let emailDelivered=false;
    try{await sendMail({to:values.email,subject:'Your LoomIQ 3-hour demo credentials',text:`Your LoomIQ ERP demo is ready.\n\nLogin: ${activated.loginUrl}\nUsername: ${activated.credentials.username}\nTemporary password: ${activated.credentials.temporaryPassword}\nExpires: ${new Date(activated.credentials.expiresAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',timeZoneName:'short'})}\n\nDo not share these credentials.`});emailDelivered=true;}catch(error){console.error('Admin-created demo credential email failed:',error.message);}
    res.status(201).json({success:true,data:{id:record.id,username:activated.credentials.username,expiresAt:activated.credentials.expiresAt,emailDelivered}});
  });
}
module.exports={registerAdminRecordRoutes};
