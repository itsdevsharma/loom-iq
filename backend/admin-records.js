const {fail,keyFor}=require('./account-service');
const {currentAdmin,requirePermission}=require('./admin-content-routes');
const collections={enquiries:'demoRequests',customers:'customers',orders:'orders',support:'supportRequests'};
function publicRecord(type,row){
  if(type==='customers')return {id:row.email,name:row.name,email:row.email,company:row.company,createdAt:row.createdAt,trialRequested:Boolean(row.trialRequest),paidOrder:row.paidOrder||null,onboarding:row.onboarding||{status:'requested'}};
  if(type==='orders')return {id:row.id||row.orderId||row._id||row.createdAt,plan:row.plan,amount:row.amount,status:row.status||'created',createdAt:row.createdAt,billing:row.billing,paidAt:row.paidAt,discounted:row.discounted};
  return Object.fromEntries(['id','name','email','company','phone','businessType','message','subject','requestType','status','notes','createdAt','updatedAt'].filter(key=>row[key]!==undefined).map(key=>[key,row[key]]));
}
function registerAdminRecordRoutes(app,{store,addAudit}){
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
}
module.exports={registerAdminRecordRoutes};
