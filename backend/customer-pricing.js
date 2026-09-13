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
  const plan=pricing[planName],override=customer?.pricingOverrides?.[planName];
  const active=override&&(!override.expiresAt||override.expiresAt>now);
  return {plan:planName,currency:'INR',amount:active?override.amount:Math.round((offer.eligible?plan.firstMonth:plan.recurring)*100),recurring:plan.recurring,source:active?'customer':'website',discounted:!active&&offer.eligible,pricingRevision:customer?.pricingRevision||0,expiresAt:active?override.expiresAt||null:offer.eligible?offer.expiresAt:null};
}
module.exports={customerQuote,amountInPaise,PLANS};
