import { cmsValue, websitePricing } from '../websiteContent';
import { useOffer } from '../offer';
import { trackEvent } from '../analytics';

export default function PlanConditions() {
  const { offer, remaining, ready } = useOffer();
  const prices = websitePricing();
  const money = (value:number) => `₹${value.toLocaleString("en-IN")}`;
  const active = ready && offer.eligible;
  const seconds = Math.max(0, Math.floor(remaining / 1000));
  const clock = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60];
  const base = import.meta.env.BASE_URL;
  const onSignup = window.location.pathname.replace(/\/$/, '').endsWith('/signup');
  const selectedPlan = new URLSearchParams(window.location.search).get('plan') === 'Growth' ? 'Growth' : 'Starter';
  const href = offer.signedUp ? `${base}payment?plan=${selectedPlan}` : onSignup ? '#account' : `${base}signup?plan=Starter`;

  return <aside className="conversion-offer" aria-label={cmsValue("PlanConditions.1", "LoomIQ membership offer")}>
    <div className="conversion-offer-main">
      <div className="conversion-offer-copy">
        <span className="conversion-offer-badge">{cmsValue("PlanConditions.2", "TODAY’S MEMBERSHIP OFFER · {discount} OFF")}</span>
        <h3>{cmsValue("PlanConditions.3", "Save {discount} on your membership month.")}</h3>
        <p>{cmsValue("PlanConditions.4", "Get started with LoomIQ at {discount} off your membership month within your 24-hour offer window, including trial accounts.")}</p>
        <div className="conversion-offer-prices">
          <div><span>{cmsValue("PlanConditions.5", "Starter · save {starterOffer}")}</span><strong>{money(prices.Starter.firstMonth)}</strong><s>{money(prices.Starter.recurring)}</s><small>{cmsValue("PlanConditions.6", "For the membership month, then {starterRegular}/month")}</small></div>
          <div><span>{cmsValue("PlanConditions.7", "Growth · save {growthOffer}")}</span><strong>{money(prices.Growth.firstMonth)}</strong><s>{money(prices.Growth.recurring)}</s><small>{cmsValue("PlanConditions.8", "For the membership month, then {growthRegular}/month")}</small></div>
        </div>
      </div>
      <div className="conversion-offer-action">
        {ready && offer.expiresAt && remaining > 0 ? <>
          <p className="conversion-offer-deadline">{cmsValue("PlanConditions.9", "Today’s checkout window closes in")}</p>
          <div className="conversion-offer-clock" role="timer" aria-live="off" aria-label={`${clock[0]} hours ${clock[1]} minutes ${clock[2]} seconds remaining`}>
            {clock.map((value, i) => <div key={i}><strong>{String(value).padStart(2, '0')}</strong><span>{['HOURS', 'MINUTES', 'SECONDS'][i]}</span></div>)}
          </div>
          <p className="conversion-offer-reset">{cmsValue("PlanConditions.10", "24 hours from your first offer visit. This deadline does not reset.")}</p>
        </> : <p className="conversion-offer-deadline">{!ready ? cmsValue("PlanConditions.11", "Checking your offer…") : cmsValue("PlanConditions.12", "Offer availability is confirmed at checkout.")}</p>}
        <a className="button button-primary" href={href} onClick={() => trackEvent('direct_purchase_clicked')}>{active ? cmsValue("PlanConditions.13", "Get {discount} off →") : offer.trialSelected ? cmsValue("PlanConditions.14", "View paid plans →") : cmsValue("PlanConditions.15", "Check my offer →")}</a>
        <small>{offer.signedUp ? cmsValue("PlanConditions.16", "Review your total before payment.") : cmsValue("PlanConditions.17", "Create an account, then review your checkout.")}</small>
      </div>
    </div>
    <div className="conversion-offer-terms">
      {offer.trialSelected && <p><strong>{cmsValue("PlanConditions.18", "Your account:")}</strong>{cmsValue("PlanConditions.19", " Selecting a trial does not remove your discount during the 24-hour window.")}</p>}
      <p>{cmsValue("PlanConditions.20", "For eligible Starter and Growth purchases, including trial accounts. Each checkout is a one-time payment with no automatic charges.")}</p>
      <details>
        <summary>{cmsValue("PlanConditions.21", "Offer & trial conditions")}</summary>
        <p>{cmsValue("PlanConditions.22", "The offer expires 24 hours after your first offer visit. Complete payment before the deadline shown at checkout; late captured discounted payments are submitted for refund.")}</p>
        <p>{cmsValue("PlanConditions.23", "A 7-day trial requires no payment and access is arranged by our team. Creating an account alone does not select a trial or make a payment.")}</p>
        <p>{cmsValue("PlanConditions.24", "Prefer to see the product first? ")}<a href={base + '#demo'}>{cmsValue("PlanConditions.25", "Book a personalized demo")}</a>{cmsValue("PlanConditions.26", " without an account or payment.")}</p>
      </details>
    </div>
  </aside>;
}
