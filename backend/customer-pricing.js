const {configuredPricing}=require('./website-content');
const {fail}=require('./account-service');
const PLANS=['Starter','Growth'];
function amountInPaise(value){
  if(typeof value!=='number'||!Number.isFinite(value)||value<1||value>10000000||Math.abs(value*100-Math.round(value*100))>0.000001)throw fail(400,'Enter an INR amount from ₹1 to ₹1,00,00,000 with at most two decimal places.');
  return Math.round(value*100);
}
async function customerQuote(store,customerKey,planName,offer,now=Date.now()){
  if(!PLANS.includes(planName))throw fail(400,'Invalid plan.');
  const [pricing,customer]=await Promise.all([configuredPricing(store),customerKey?store.get('customers',customerKey):null]);
  const plan=pricing[planName],override=customer?.pricingOverrides?.[planName],locked=customer?.launchPriceLock?.[planName];
  const active=override&&(!override.expiresAt||override.expiresAt>now);
  const lockActive=locked&&locked.expiresAt>now;
  return {plan:planName,currency:'INR',amount:active?override.amount:lockActive?locked.amount:Math.round(plan.recurring*100),recurring:plan.recurring,source:active?'customer':lockActive?'launch-lock':'website',discounted:false,pricingRevision:customer?.pricingRevision||0,expiresAt:active ? override.expiresAt : lockActive ? locked.expiresAt : null};
}
module.exports={customerQuote,amountInPaise,PLANS};
