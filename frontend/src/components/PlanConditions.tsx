import { useOffer } from '../offer';
import { trackEvent } from '../analytics';

export default function PlanConditions() {
  const { offer, remaining, ready } = useOffer();
  const active = ready && offer.eligible;
  const seconds = Math.max(0, Math.floor(remaining / 1000));
  const clock = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60];
  const base = import.meta.env.BASE_URL;
  const onSignup = window.location.pathname.replace(/\/$/, '').endsWith('/signup');
  const selectedPlan = new URLSearchParams(window.location.search).get('plan') === 'Growth' ? 'Growth' : 'Starter';
  const href = offer.signedUp ? `${base}payment?plan=${selectedPlan}` : onSignup ? '#account' : `${base}signup?plan=Starter`;

  return <aside className="conversion-offer" aria-label="LoomIQ membership offer">
    <div className="conversion-offer-main">
      <div className="conversion-offer-copy">
        <span className="conversion-offer-badge">TODAY’S MEMBERSHIP OFFER · 50% OFF</span>
        <h3>Save 50% on your membership month.</h3>
        <p>Get started with LoomIQ at 50% off your membership month. These promotional prices apply to eligible non-trial accounts.</p>
        <div className="conversion-offer-prices">
          <div><span>Starter · save ₹995</span><strong>₹995</strong><s>₹1,990</s><small>For the membership month, then ₹1,990/month</small></div>
          <div><span>Growth · save ₹1,495</span><strong>₹1,495</strong><s>₹2,990</s><small>For the membership month, then ₹2,990/month</small></div>
        </div>
      </div>
      <div className="conversion-offer-action">
        {ready && offer.expiresAt && remaining > 0 ? <>
          <p className="conversion-offer-deadline">Today’s checkout window closes in</p>
          <div className="conversion-offer-clock" role="timer" aria-live="off" aria-label={`${clock[0]} hours ${clock[1]} minutes ${clock[2]} seconds remaining`}>
            {clock.map((value, i) => <div key={i}><strong>{String(value).padStart(2, '0')}</strong><span>{['HOURS', 'MINUTES', 'SECONDS'][i]}</span></div>)}
          </div>
          <p className="conversion-offer-reset">Deadline: midnight IST. Offer renews daily.</p>
        </> : <p className="conversion-offer-deadline">{!ready ? 'Checking today’s offer…' : offer.trialSelected ? 'Trial accounts use regular pricing.' : 'Offer availability is confirmed at checkout.'}</p>}
        <a className="button button-primary" href={href} onClick={() => trackEvent('direct_purchase_clicked')}>{active ? 'Get 50% off →' : offer.trialSelected ? 'View paid plans →' : 'Check my offer →'}</a>
        <small>{offer.signedUp ? 'Review your total before payment.' : 'Create an account, then review your checkout.'}</small>
      </div>
    </div>
    <div className="conversion-offer-terms">
      {offer.trialSelected && <p><strong>Your account:</strong> You previously selected a trial, so this promotion does not apply to your checkout. Your rates remain Starter ₹1,990/month or Growth ₹2,990/month.</p>}
      <p>For eligible Starter and Growth purchases. Free-trial accounts excluded. Regular monthly prices apply after the discounted month.</p>
      <details>
        <summary>Offer & trial conditions</summary>
        <p>The offer renews daily at midnight IST. Complete payment before the deadline shown at checkout; late discounted payments are refunded. The trial and purchase discount cannot be combined.</p>
        <p>A 7-day trial requires no payment and access is arranged by our team. Under the current policy, selecting a trial permanently removes the purchase discount from that account. Creating an account alone does not select a trial or make a payment.</p>
        <p>Prefer to see the product first? <a href={base + '#demo'}>Book a personalized demo</a> without an account or payment.</p>
      </details>
    </div>
  </aside>;
}
