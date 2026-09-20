const catalog = require('../shared/website-content.json');
const { fail } = require('./account-service');
const crypto = require('node:crypto');
const defaults = () => Object.fromEntries(Object.entries(catalog).map(([key, item]) => [key, structuredClone(item.default)]));
async function publishedWebsite(store) {
  const doc = await store.get('website_content', 'site');
  return { values: { ...defaults(), ...(doc?.published || {}) }, revision: doc?.publishedAt || 0 };
}
async function configuredPricing(store) { return (await publishedWebsite(store)).values['Site.pricing']; }
async function configuredOffer(store) { return (await publishedWebsite(store)).values['Site.offer']; }
function validateValue(value, example, name, depth=0) {
  if (depth > 15) throw fail(400, 'Content is too deeply nested.');
  if (typeof value !== typeof example || value === null) throw fail(400, `Invalid value for ${name}.`);
  if (typeof value === 'string') {
    if (value.length > 30000) throw fail(400, `${name} is too long.`);
    if (/href|url|src|link|canonical|image/i.test(name) && !/alt/i.test(name) && value.trim()) {
      try { const url = new URL(value, 'https://example.invalid'); if (!['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol)) throw 0; }
      catch { throw fail(400, 'Use a relative URL, HTTP(S) link, email link, or telephone link.'); }
    }
  } else if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0 || value > (name === 'endsAt' ? 4102444800000 : 10000000)) throw fail(400, `Invalid number for ${name}.`);
  } else if (Array.isArray(example)) {
    if (!Array.isArray(value) || value.length > 150) throw fail(400, `Invalid list for ${name}.`);
    for (let i=0;i<value.length;i++) validateValue(value[i], example[i] ?? example[0], name, depth+1);
  } else if (typeof example === 'object') {
    if (Array.isArray(value) || Object.keys(value).some(key => !Object.hasOwn(example,key)) || Object.keys(example).some(key => !Object.hasOwn(value,key))) throw fail(400, `Keep the defined fields for ${name}.`);
    for (const key of Object.keys(example)) validateValue(value[key],example[key],key,depth+1);
  }
}
function validateContent(values) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) throw fail(400,'Content must be an object.');
  for (const [key,value] of Object.entries(values)) {
    if (!Object.hasOwn(catalog,key)) throw fail(400,`Unknown content field: ${key}`);
    validateValue(value,catalog[key].default,catalog[key].kind === 'url' ? 'url' : key);
  }
  const layout=values['Site.layout'];
  if (layout && (new Set(layout).size !== layout.length || layout.some(key=>!(catalog['Site.layout'].options || catalog['Site.layout'].default).includes(key)))) throw fail(400,'Choose each supported homepage section at most once.');
  const pricing=values['Site.pricing'];
  if(pricing) for(const name of ['Starter','Growth']) if(pricing[name].firstMonth < 1 || pricing[name].recurring < pricing[name].firstMonth || !Number.isInteger(pricing[name].firstMonth*100) || !Number.isInteger(pricing[name].recurring*100)) throw fail(400,'Plan prices must be positive INR amounts with at most two decimals; the offer cannot exceed the regular price.');
  const offer=values['Site.offer'];
  if(offer && (!Number.isInteger(offer.discountPercent) || offer.discountPercent < 0 || offer.discountPercent > 100 || !Number.isInteger(offer.slotsTotal) || offer.slotsTotal < 1 || !Number.isInteger(offer.slotsRemaining) || offer.slotsRemaining < 0 || offer.slotsRemaining > offer.slotsTotal || !Number.isSafeInteger(offer.endsAt) || offer.endsAt < 0)) throw fail(400,'Offer settings must use a 0–100% discount, valid slot counts, and a valid end date.');
  if(pricing && offer) for(const name of ['Starter','Growth']) if(Math.round(pricing[name].recurring*(100-offer.discountPercent)) !== Math.round(pricing[name].firstMonth*100)) throw fail(400,'Offer prices must match the configured discount percentage.');
  for(const group of ['PricingSection','PaymentPage']) {
    const key=Object.keys(catalog).find(k=>catalog[k].group===group&&catalog[k].kind==='structured');
    if(key && values[key] && JSON.stringify(values[key].map(p=>p.name))!==JSON.stringify(catalog[key].default.map(p=>p.name))) throw fail(400,'Keep the built-in plan names and order; checkout depends on these identifiers.');
  }
}
function registerWebsiteContentRoutes(app, {store, addAudit, currentAdmin, requirePermission}) {
  app.use('/api/content/assets', require('express').static(require('node:path').join(__dirname, '../frontend/public/cms-defaults'), {maxAge:'1d'}));
  app.get('/api/content/website',async(req,res)=>res.json(await publishedWebsite(store())));
  app.get('/api/admin/website',async(req,res)=>{
    const admin=await currentAdmin(req,store);requirePermission(admin,'content.read');
    const doc=await store().get('website_content','site');
    const versions=await store().list('website_versions');
    res.json({catalog,values:{...defaults(),...(doc?.draft||doc?.published||{})},revision:doc?.revision||0,publishedAt:doc?.publishedAt||null,hasDraft:JSON.stringify(doc?.draft||{})!==JSON.stringify(doc?.published||{}),versions:versions.map(v=>({id:v.id,createdAt:v.createdAt,createdBy:v.createdBy})).sort((a,b)=>b.createdAt-a.createdAt)});
  });
  app.put('/api/admin/website',async(req,res)=>{
    const admin=await currentAdmin(req,store);requirePermission(admin,'content.write');validateContent(req.body.values);
    let revision;
    await store().transaction(async tx=>{const doc=await tx.get('website_content','site')||{};if(req.body.revision!==(doc.revision||0))throw fail(409,'Website content changed in another session. Reload before saving.');revision=(doc.revision||0)+1;await tx.put('website_content','site',{...doc,draft:{...defaults(),...req.body.values},revision,updatedBy:admin.email});await addAudit({admin:admin.email,action:'website.save',resource:'website',resourceId:'site',success:true},tx)});
    res.json({revision});
  });
  app.post('/api/admin/website/publish',async(req,res)=>{
    const admin=await currentAdmin(req,store);requirePermission(admin,'content.publish');
    await store().transaction(async tx=>{const doc=await tx.get('website_content','site');if(!doc?.draft)throw fail(400,'Save a draft before publishing.');if(req.body.revision!==doc.revision)throw fail(409,'The draft changed. Reload before publishing.');validateContent(doc.draft);const id=crypto.randomUUID(),now=Date.now();await tx.put('website_versions',id,{id,values:doc.draft,createdAt:now,createdBy:admin.email});await tx.put('website_content','site',{...doc,published:doc.draft,publishedAt:now,revision:doc.revision+1});await addAudit({admin:admin.email,action:'website.publish',resource:'website',resourceId:id,success:true},tx)});
    res.json({success:true});
  });
  app.post('/api/admin/website/restore/:id',async(req,res)=>{
    const admin=await currentAdmin(req,store);requirePermission(admin,'content.write');
    await store().transaction(async tx=>{const version=await tx.get('website_versions',req.params.id);if(!version)throw fail(404,'Version not found.');const doc=await tx.get('website_content','site')||{};if(req.body.revision!==(doc.revision||0))throw fail(409,'Website content changed. Reload before restoring.');await tx.put('website_content','site',{...doc,draft:version.values,revision:(doc.revision||0)+1});await addAudit({admin:admin.email,action:'website.restore',resource:'website',resourceId:req.params.id,success:true},tx)});res.json({success:true});
  });
}
module.exports={registerWebsiteContentRoutes,configuredPricing,configuredOffer,publishedWebsite,validateContent};
