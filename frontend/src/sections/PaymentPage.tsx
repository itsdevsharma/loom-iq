import logoImage from "../assets/company.logo.webp";
import { offerUnavailableMessage } from '../offerMessage';
import { useOffer } from "../offer";
import type { Offer } from "../offer";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import "../PaymentPage.css";
import { trackEvent } from "../analytics";

type PlanKey = "Starter" | "Growth";

type PaymentPlan = {
  name: PlanKey;
  price: number;
  recurring: number;
  description: string;
  features: string[];
};

const plans: PaymentPlan[] = [
  {
    name: "Starter",
    price: 995,
    recurring: 1990,
    description: "A focused operating system for growing teams.",
    features: ["Orders and invoicing", "Stock, purchasing, and suppliers", "Multi-location transfers", "Batch and wastage records", "Quality and rework tracking", "Costing and margin reports"],
  },
  {
    name: "Growth",
    price: 1495,
    recurring: 2990,
    description: "Advanced control for multi-location operations.",
    features: ["Everything in Starter", "Material planning and work orders", "Production stage tracking", "Cash-flow and expense reports", "Custom workflows and permissions", "Priority support"],
  },
];

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  notes: { company: string; plan: string };
  modal: { ondismiss: () => void };
  theme: { color: string };
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

function formatPrice(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function loadRazorpay() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function PaymentPage() {
  const { offer, ready, update } = useOffer();
  useEffect(() => {
    if (ready && !offer.signedUp) window.location.replace(import.meta.env.BASE_URL + 'signup' + window.location.search);
  }, [ready, offer.signedUp]);
  const queryPlan = new URLSearchParams(window.location.search).get("plan");
  const initialPlan: PlanKey = queryPlan === "Growth" ? "Growth" : "Starter";
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(initialPlan);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", address: "", city: "", state: "", gstin: "" });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const plan = useMemo(() => plans.find((item) => item.name === selectedPlan) ?? plans[0], [selectedPlan]);
  const price = offer.eligible ? plan.price : plan.recurring;
  const discount = plan.recurring - price;

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submitPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);
    trackEvent("checkout_started");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/purchase/order`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, customer: { ...form, email: offer.customer?.email }, expectedAmount: price * 100, acceptConditions: true }),
      });
      const result = await response.json() as { success?: boolean; message?: string; orderId?: string; keyId?: string; amount?: number; offer?: Offer };

      if (result.offer) update(result.offer);
      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Secure checkout is not configured yet.");
      }

      const razorpayLoaded = await loadRazorpay();
      if (!result.orderId || !result.keyId || !razorpayLoaded || !window.Razorpay) {
        throw new Error("Payment setup is incomplete. Please contact LoomIQ to finish checkout.");
      }

      const razorpay = new window.Razorpay({
        key: result.keyId,
        amount: result.amount ?? price * 100,
        currency: "INR",
        name: "LoomIQ",
        description: `${plan.name} ERP membership`,
        order_id: result.orderId,
        prefill: { name: form.name, email: offer.customer?.email ?? "", contact: form.phone },
        notes: { company: form.company, plan: plan.name },
        theme: { color: "#5145a5" },
        modal: { ondismiss: () => { setIsSubmitting(false); setMessage("Checkout closed. You can review your details and try again."); } },
        handler: async (paymentResponse) => {
          try {
          const verification = await fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/purchase/verify`, {
            method: "POST",
        credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(paymentResponse),
          });
          const verificationResult = await verification.json() as { success?: boolean; message?: string };
          if (!verification.ok || !verificationResult.success) {
            setMessage(verificationResult.message ?? "Payment verification failed. Please contact support.");
            return;
          }
          trackEvent("checkout_completed");
          window.location.href = `${import.meta.env.BASE_URL}thank-you?type=purchase&order=${encodeURIComponent(paymentResponse.razorpay_order_id)}`;
          } catch {
            setMessage("We could not confirm your payment. If you were charged, contact support with your payment reference before trying again.");
          } finally {
            setIsSubmitting(false);
          }
        },
      });
      razorpay.open();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Secure checkout is unavailable right now.");
      setIsSubmitting(false);
    }
  };

  if (!ready || !offer.signedUp) return <main className="payment-page"><p role="status">Checking your account…</p></main>;

  return (
    <main className="payment-page">
      <header className="payment-header">
        <a className="payment-brand" href={import.meta.env.BASE_URL} aria-label="LoomIQ home">
          <img className="payment-brand-mark" src={logoImage} alt="" />Loom<span className="payment-brand-iq">IQ</span>
        </a>
        <span className="payment-header-note"><LockIcon /> Payments processed by Razorpay</span>
        <a className="payment-back" href={`${import.meta.env.BASE_URL}#pricing`}>← Back to plans</a>
      </header>


      <div className="payment-content">
        <div className="payment-intro">
          <h1>Complete your purchase</h1>
          <p>LoomIQ membership · Billed in INR</p>
        </div>

        <form className="payment-layout" onSubmit={submitPayment}>
          <div className="payment-form">
            <fieldset className="payment-card payment-plan-fieldset" disabled={isSubmitting}>
              <legend className="payment-sr-only">Choose your plan</legend>
              <div className="payment-section-heading"><h2>Your plan</h2>{offer.eligible && <span className="payment-offer-badge">24-hour offer · 50% off</span>}</div>
              <div className="payment-offers">
                {plans.map((item) => (
                  <label className={`payment-plan ${selectedPlan === item.name ? "is-selected" : ""}`} key={item.name}>
                    <div className="payment-plan-top"><strong>{item.name}</strong><input type="radio" name="plan" value={item.name} checked={selectedPlan === item.name} onChange={() => setSelectedPlan(item.name)} /></div>
                    {offer.eligible && <div className="payment-plan-original"><s>{formatPrice(item.recurring)}</s><span>50% OFF</span></div>}
                    <div className="payment-plan-price">{formatPrice(offer.eligible ? item.price : item.recurring)}<span>/ month</span></div>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="payment-card" disabled={isSubmitting}>
              <legend className="payment-sr-only">Business and contact details</legend>
              <div className="payment-section-heading"><h2>Contact &amp; billing details</h2><span className="payment-required-note">All fields required</span></div>
              <div className="payment-fields">
                <div className="payment-form-row">
                  <label>Full name<input required autoComplete="name" placeholder="Your full name" value={form.name} onChange={(event) => updateField("name", event.target.value)} /></label>
                  <label>Work email<input required type="email" autoComplete="email" placeholder="you@company.com" value={offer.customer?.email ?? ""} readOnly /></label>
                </div>
                <div className="payment-form-row">
                  <label>Phone number<input required type="tel" autoComplete="tel" placeholder="+91 98765 43210" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} /></label>
                  <label>Business name<input required autoComplete="organization" placeholder="Company or trading name" value={form.company} onChange={(event) => updateField("company", event.target.value)} /></label>
                </div>
                <div className="payment-field-divider" />
                <label>Billing address<input required autoComplete="street-address" placeholder="Building, street and area" value={form.address} onChange={(event) => updateField("address", event.target.value)} /></label>
                <div className="payment-form-row">
                  <label>City<input required autoComplete="address-level2" placeholder="City" value={form.city} onChange={(event) => updateField("city", event.target.value)} /></label>
                  <label>State<input required autoComplete="address-level1" placeholder="State" value={form.state} onChange={(event) => updateField("state", event.target.value)} /></label>
                </div>
              </div>
            </fieldset>

          </div>

          <aside className="payment-sidebar" aria-label="Order summary">
            <section className="payment-summary">
              <div className="payment-summary-header"><span>YOUR ORDER</span><span className="payment-summary-currency">INR</span></div>
              <p className="payment-limited-offer">{offer.eligible ? "24-hour offer: save 50% on this membership month. Available to everyone, including trial accounts. Complete this checkout before its deadline; late payments on expired orders are refunded." : offerUnavailableMessage(offer.reason)}</p>
              <div className="payment-product"><img className="payment-product-icon" src={logoImage} alt="" /><div><h2>LoomIQ {plan.name}</h2><p>ERP membership · First month</p></div></div>
              <div className="payment-breakdown">
                <div><span>Original monthly price</span><s>{formatPrice(plan.recurring)}</s></div>
                {offer.eligible && <div className="payment-discount"><span>24-hour offer savings <small>50%</small></span><span>−{formatPrice(discount)}</span></div>}
              </div>
              <div className="payment-total"><div><strong>Due today</strong><span>First month</span></div><strong>{formatPrice(price)}</strong></div>
              <div className="payment-billing-note"><p>One membership month. No automatic charges.<br />Regular price: {formatPrice(plan.recurring)}/month.</p></div>
            </section>
            <div className="payment-consent-area">
              <label className="payment-consent"><input required type="checkbox" disabled={isSubmitting} /><span>I agree to the <a href={`${import.meta.env.BASE_URL}terms`} target="_blank" rel="noreferrer">Terms</a>, <a href={`${import.meta.env.BASE_URL}privacy`} target="_blank" rel="noreferrer">Privacy</a> and <a href={`${import.meta.env.BASE_URL}refunds`} target="_blank" rel="noreferrer">Refund Policy</a>. I understand the discount is available for 24 hours from my first offer visit, including for trial accounts, and discounted payment must complete before the checkout deadline.</span></label>
              {message && <p className="payment-message" role="alert">{message}</p>}
              <button className="payment-submit" type="submit" disabled={isSubmitting || !ready}><LockIcon />{isSubmitting ? "Completing checkout…" : `Pay ${formatPrice(price)}`}<span aria-hidden="true">→</span></button>
              <p className="payment-submit-note">Payment details are handled by Razorpay.</p>
            </div>

            <p className="payment-support">Need help? <a href="mailto:support@loomiq.com">Contact support ↗</a></p>
          </aside>
        </form>
        <footer className="payment-footer"><span>© {new Date().getFullYear()} LoomIQ</span><nav aria-label="Checkout policies"><a href={`${import.meta.env.BASE_URL}privacy`}>Privacy</a><a href={`${import.meta.env.BASE_URL}terms`}>Terms</a><a href={`${import.meta.env.BASE_URL}refunds`}>Refund policy</a></nav><span><LockIcon /> Payment via Razorpay</span></footer>
      </div>
    </main>
  );
}

function LockIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><path d="M12 14v3" /></svg>;
}

export default PaymentPage;
