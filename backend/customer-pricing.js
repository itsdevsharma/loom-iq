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
  const campaignActive = Boolean(offer?.eligible && offer?.discountPercent > 0);
  const campaignAmount = Math.round(plan.firstMonth * 100);
  const amount = active ? override.amount : lockActive ? locked.amount : campaignActive ? campaignAmount : Math.round(plan.recurring * 100);
  return {plan:planName,currency:'INR',amount,recurring:plan.recurring,source:active?'customer':lockActive?'launch-lock':campaignActive?'campaign':'website',discounted:!active&&!lockActive&&campaignActive,pricingRevision:customer?.pricingRevision||0,expiresAt:active ? override.expiresAt : campaignActive ? offer.expiresAt : lockActive ? locked.expiresAt : null};
}
module.exports={customerQuote,amountInPaise,PLANS};
