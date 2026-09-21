import { cmsTemplate, cmsValue, websitePricing } from '../websiteContent';
import logoImage from "../assets/company.logo.webp";
import { offerUnavailableMessage } from '../offerMessage';
import { useOffer } from "../offer";
import type { Offer } from "../offer";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import "../PaymentPage.css";
import { trackEvent, trackCheckout } from "../analytics";
import SupportForm from '../components/SupportForm';

type Quote = { amount:number; recurring:number; source:'customer'|'website'|'campaign'|'launch-lock'; discounted:boolean; expiresAt:number|null };

type PlanKey = "Starter" | "Growth";

type PaymentPlan = {
  name: PlanKey;
  description: string;
  features: string[];
};

const plans: PaymentPlan[] = cmsValue("PaymentPage.1", [
  {
    name: "Starter",
    description: "A focused operating system for growing teams.",
    features: ["Orders and invoicing", "Stock, purchasing, and suppliers", "Multi-location transfers", "Batch and wastage records", "Quality and rework tracking", "Costing and margin reports"],
  },
  {
    name: "Growth",
    description: "Advanced control for multi-location operations.",
    features: ["Everything in Starter", "Material planning and work orders", "Production stage tracking", "Cash-flow and expense reports", "Custom workflows and permissions", "Priority support"],
  },
]);

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

// Published plan price, available synchronously from the CMS snapshot.
function publishedPrice(name: PlanKey) {
  return websitePricing()[name].recurring;
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
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", address: "", city: "", state: "", gstin: "", pan: "", stateCode: "" });
  const [pendingOrder, setPendingOrder] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [quotes, setQuotes] = useState<Partial<Record<PlanKey, Quote>>>({});
  const [quoteError, setQuoteError] = useState('');
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteRevision, setQuoteRevision] = useState(0);
  useEffect(() => {
    // Prices are requested as soon as checkout mounts rather than after the offer
    // check resolves: the session cookie already identifies the customer, and the
    // published price is on screen meanwhile, so a slow offer check can no longer
    // delay the personalised total.
    let active = true;
    const timer = window.setTimeout(() => {
    setQuoteLoading(true); setQuoteError('');
    Promise.all(plans.map(async item => {
      const response = await fetch(`${import.meta.env.PUBLIC_API_URL ?? ""}/api/purchase/quote`, {method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify({plan:item.name}), signal:AbortSignal.timeout(10000)});
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load your price.');
      return [item.name, data] as const;
    })).then(entries => { if(active)setQuotes(Object.fromEntries(entries)); }).catch(error => {if(active)setQuoteError(error.message)}).finally(()=>{if(active)setQuoteLoading(false)});
    }, 0);
    return () => {active=false;window.clearTimeout(timer)};
  }, [quoteRevision]);
  useEffect(()=>{const refresh=()=>setQuoteRevision(n=>n+1);window.addEventListener('focus',refresh);return()=>window.removeEventListener('focus',refresh)},[]);
  const plan = useMemo(() => plans.find((item) => item.name === selectedPlan) ?? plans[0], [selectedPlan]);
  const configured = websitePricing()[plan.name];
  const quote = quotes[selectedPlan];
  // The published price renders immediately; the personalised quote replaces it
  // as soon as the checkout API answers, so pricing is never shown as loading.
  const amountFor = (name: PlanKey) => quotes[name] ? quotes[name]!.amount / 100 : publishedPrice(name);
  const price = amountFor(selectedPlan);
  const introductory = quote?.discounted === true;
  const recurring = quote?.recurring ?? configured.recurring;
  const discount = recurring - price;

  useEffect(() => {
    if (!quote || quoteLoading || quoteError) return;
    const track = () => trackCheckout(selectedPlan, quote.amount);
    track(); window.addEventListener('loomiq-analytics-ready', track);
    return () => window.removeEventListener('loomiq-analytics-ready', track);
  }, [selectedPlan, quote, quoteLoading, quoteError]);
  const customerForm = { ...form, name: form.name || offer.customer?.name || "", phone: form.phone || offer.customer?.phone || "", company: form.company || offer.customer?.company || "", address: form.address || offer.customer?.address || "", city: form.city || offer.customer?.city || "", state: form.state || offer.customer?.state || "" };
  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submitPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!quote || quoteLoading || quoteError) return;
    setMessage("");
    setIsSubmitting(true);
    trackEvent("checkout_started");

    try {
      const response = await fetch(`${import.meta.env.PUBLIC_API_URL ?? ""}/api/purchase/order`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, customer: { ...customerForm, email: offer.customer?.email }, expectedAmount: quote.amount, acceptConditions: true }),
      });
      const result = await response.json() as { success?: boolean; message?: string; orderId?: string; keyId?: string; amount?: number; offer?: Offer };

      if (result.offer) update(result.offer);
      if (!response.ok || !result.success) {
        if (response.status === 409) setQuoteRevision(n => n + 1);
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
        prefill: { name: customerForm.name, email: offer.customer?.email ?? "", contact: form.phone },
        notes: { company: customerForm.company, plan: plan.name },
        theme: { color: "#5145a5" },
        modal: { ondismiss: () => { setIsSubmitting(false); setMessage(cmsValue("PaymentPage.extra65", "Checkout closed. You can review your details and try again.")); } },
        handler: async (paymentResponse) => {
          setPendingOrder(paymentResponse.razorpay_order_id);
          try {
          const verification = await fetch(`${import.meta.env.PUBLIC_API_URL ?? ""}/api/purchase/verify`, {
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
            setMessage(cmsValue("PaymentPage.extra66", "We could not confirm your payment. If you were charged, contact support with your payment reference before trying again."));
          } finally {
            setIsSubmitting(false);
          }
        },
      });
      trackEvent("payment_initiated");
      razorpay.open();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Secure checkout is unavailable right now.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="payment-page">
      <header className="payment-header">
        <a className="payment-brand" href={import.meta.env.BASE_URL} aria-label={cmsValue("PaymentPage.3", "LoomIQ home")}>
          <img className="payment-brand-mark" src={cmsValue("PaymentPage.4", logoImage)} alt="" />{cmsValue("PaymentPage.5", "Loom")}<span className="payment-brand-iq">{cmsValue("PaymentPage.6", "IQ")}</span>
        </a>
        <span className="payment-header-note"><LockIcon />{cmsValue("PaymentPage.7", " Payments processed by Razorpay")}</span>
        <a className="payment-back" href={`${import.meta.env.BASE_URL}#pricing`}>{cmsValue("PaymentPage.8", "← Back to plans")}</a>
      </header>


      <div className="payment-content">
        <div className="payment-intro">
          <h1>{cmsValue("PaymentPage.9", "Complete your purchase")}</h1>
          <p>{cmsValue("PaymentPage.10", "LoomIQ membership · Billed in INR")}</p>
        </div>

        <form className="payment-layout" onSubmit={submitPayment}>
          <div className="payment-form"><section className="setup-disclosure"><h2>After purchasing</h2><ol><li>Your account is created instantly</li><li>Select your garment-production workflow</li><li>Import products, customers and stock</li><li>Receive guided onboarding</li></ol><p><strong>7-Day Money-Back Guarantee:</strong> try LoomIQ with your actual business. If it isn’t right for you, request a refund within seven days.</p></section>
            <fieldset className="payment-card payment-plan-fieldset" disabled={isSubmitting}>
              <legend className="payment-sr-only">{cmsValue("PaymentPage.11", "Choose your plan")}</legend>
              <div className="payment-section-heading"><h2>{cmsValue("PaymentPage.12", "Your plan")}</h2>{introductory && <span className="payment-offer-badge">{cmsValue("PaymentPage.13", "24-hour offer · {discount} off")}</span>}</div>
              <div className="payment-offers">
                {plans.map((item) => (
                  <label className={`payment-plan ${selectedPlan === item.name ? "is-selected" : ""}`} key={item.name}>
                    <div className="payment-plan-top"><strong>{item.name}</strong><input type="radio" name="plan" value={item.name} checked={selectedPlan === item.name} onChange={() => setSelectedPlan(item.name)} /></div>
                    {quotes[item.name]?.discounted && <div className="payment-plan-original"><s>{formatPrice(quotes[item.name]?.recurring ?? websitePricing()[item.name].recurring)}</s><span>{cmsValue("PaymentPage.14", "{discount} OFF")}</span></div>}
                    <div className="payment-plan-price">{formatPrice(amountFor(item.name))}<span>{cmsValue("PaymentPage.15", "/ month")}</span></div>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="payment-card" disabled={isSubmitting}>
              <legend className="payment-sr-only">{cmsValue("PaymentPage.16", "Business and contact details")}</legend>
              <div className="payment-section-heading"><h2>{cmsValue("PaymentPage.17", "Contact &amp; billing details")}</h2><span className="payment-required-note">{cmsValue("PaymentPage.requiredFields", "Required unless marked optional")}</span></div>
              <div className="payment-fields">
                <div className="payment-form-row">
                  <label>{cmsValue("PaymentPage.19", "Full name")}<input required autoComplete="name" placeholder={cmsValue("PaymentPage.20", "Your full name")} value={customerForm.name} onChange={(event) => updateField("name", event.target.value)} /></label>
                  <label>{cmsValue("PaymentPage.21", "Work email")}<input required type="email" autoComplete="email" placeholder={cmsValue("PaymentPage.22", "you@company.com")} value={offer.customer?.email ?? ""} readOnly /></label>
                </div>
                <div className="payment-form-row">
                  <label>{cmsValue("PaymentPage.23", "Phone number")}<input required type="tel" autoComplete="tel" placeholder={cmsValue("PaymentPage.24", "+91 98765 43210")} value={customerForm.phone} onChange={(event) => updateField("phone", event.target.value)} /></label>
                  <label>{cmsValue("PaymentPage.25", "Business name")}<input required autoComplete="organization" placeholder={cmsValue("PaymentPage.26", "Company or trading name")} value={customerForm.company} onChange={(event) => updateField("company", event.target.value)} /></label>
                </div>
                <div className="payment-field-divider" />
                <label>{cmsValue("PaymentPage.27", "Billing address")}<input required autoComplete="street-address" placeholder={cmsValue("PaymentPage.28", "Building, street and area")} value={customerForm.address} onChange={(event) => updateField("address", event.target.value)} /></label>
                <div className="payment-form-row">
                  <label>{cmsValue("PaymentPage.29", "City")}<input required autoComplete="address-level2" placeholder={cmsValue("PaymentPage.30", "City")} value={customerForm.city} onChange={(event) => updateField("city", event.target.value)} /></label>
                  <label>{cmsValue("PaymentPage.31", "State")}<input required autoComplete="address-level1" placeholder={cmsValue("PaymentPage.32", "State")} value={customerForm.state} onChange={(event) => updateField("state", event.target.value)} /></label>
                </div>
                <div className="payment-form-row">
                  <label>PAN (optional)<input maxLength={10} value={form.pan} onChange={(event) => updateField("pan", event.target.value.toUpperCase())} /></label>
                  <label>GSTIN (optional)<input maxLength={15} value={form.gstin} onChange={(event) => updateField("gstin", event.target.value.toUpperCase())} /></label>
                </div>
                <label>State code (optional)<input inputMode="numeric" pattern="[0-9]{2}" maxLength={2} value={form.stateCode} onChange={(event) => updateField("stateCode", event.target.value)} /></label>
              </div>
            </fieldset>

          </div>

          <aside className="payment-sidebar" aria-label={cmsValue("PaymentPage.33", "Order summary")}>
            <section className="payment-summary">
              <div className="payment-summary-header"><span>{cmsValue("PaymentPage.34", "YOUR ORDER")}</span><span className="payment-summary-currency">{cmsValue("PaymentPage.35", "INR")}</span></div>
              <p className="payment-limited-offer">{quote?.source === 'customer' ? `Your agreed customer price applies to this purchase${quote.expiresAt ? ` until ${new Date(quote.expiresAt).toLocaleString()}` : ''}.` : introductory ? cmsValue("PaymentPage.36", "24-hour offer: save {discount} on this membership month. Available to everyone, including trial accounts. Complete this checkout before its deadline; late payments on expired orders are refunded.") : offerUnavailableMessage(offer.reason)}</p>
              <div className="payment-product"><img className="payment-product-icon" src={cmsValue("PaymentPage.37", logoImage)} alt="" /><div><h2>{cmsValue("PaymentPage.38", "LoomIQ ")}{plan.name}</h2><p>{cmsValue("PaymentPage.39", "ERP membership · First month")}</p></div></div>
              <div className="payment-breakdown">
                <div><span>{cmsValue("PaymentPage.40", "Original monthly price")}</span><span>{introductory ? <s>{formatPrice(recurring)}</s> : formatPrice(recurring)}</span></div>
                {introductory && <div className="payment-discount"><span>{cmsValue("PaymentPage.41", "24-hour offer savings ")}<small>{Math.round(discount / recurring * 100)}%</small></span><span>−{formatPrice(discount)}</span></div>}
              </div>
              <div className="payment-total"><div><strong>{cmsValue("PaymentPage.42", "Due today")}</strong><span>{cmsValue("PaymentPage.43", "First month")}</span></div><strong aria-busy={quoteLoading || !quote}>{formatPrice(price)}</strong></div>
              <div className="payment-billing-note"><p>{cmsValue("PaymentPage.44", "One membership month. No automatic charges.")}<br />{cmsValue("PaymentPage.45", "Regular price: ")}{formatPrice(recurring)}{cmsValue("PaymentPage.46", "/month.")}</p></div>
            </section>
            <div className="payment-consent-area">
              <label className="payment-consent"><input required type="checkbox" disabled={isSubmitting} /><span>{cmsValue("PaymentPage.47", "I agree to the ")}<a href={`${import.meta.env.BASE_URL}terms`} target="_blank" rel="noreferrer">{cmsValue("PaymentPage.48", "Terms")}</a>, <a href={`${import.meta.env.BASE_URL}privacy`} target="_blank" rel="noreferrer">{cmsValue("PaymentPage.49", "Privacy")}</a>{cmsValue("PaymentPage.50", " and ")}<a href={`${import.meta.env.BASE_URL}refunds`} target="_blank" rel="noreferrer">{cmsValue("PaymentPage.51", "Refund Policy")}</a>{quote?.source === 'customer' ? ". The agreed price covers one membership month, with no automatic charges." : cmsValue("PaymentPage.52", ". I understand the discount is available for 24 hours from my first offer visit, including for trial accounts, and discounted payment must complete before the checkout deadline.")}</span></label>
              {quoteError && <p role="alert">{quoteError} <button type="button" onClick={()=>setQuoteRevision(n=>n+1)}>Retry price</button></p>}
              {message && <p className="payment-message" role="alert">{message}</p>}{pendingOrder && <p><a href={`${import.meta.env.BASE_URL}thank-you?type=purchase&order=${encodeURIComponent(pendingOrder)}`}>Check payment status & invoice</a> before making another payment.</p>}
              <button className="payment-submit" type="submit" disabled={isSubmitting || !!pendingOrder || !ready || quoteLoading || !!quoteError || !quote}><LockIcon />{isSubmitting ? cmsValue("PaymentPage.53", "Completing checkout…") : cmsTemplate("PaymentPage.extra68", "Pay {0}", [formatPrice(price)])}<span aria-hidden="true">→</span></button>
              <p className="payment-submit-note">{cmsValue("PaymentPage.54", "Payment details are handled by Razorpay.")}</p>
            </div>

            <p className="payment-support">{cmsValue("PaymentPage.55", "Need help? ")}<a href="#support">{cmsValue("PaymentPage.57", "Contact support ↗")}</a></p>
          </aside>
        </form>
        <SupportForm />
        <footer className="payment-footer"><span>{cmsValue("PaymentPage.58", "© ")}{new Date().getFullYear()}{cmsValue("PaymentPage.59", " LoomIQ")}</span><nav aria-label={cmsValue("PaymentPage.60", "Checkout policies")}><a href={`${import.meta.env.BASE_URL}privacy`}>{cmsValue("PaymentPage.61", "Privacy")}</a><a href={`${import.meta.env.BASE_URL}terms`}>{cmsValue("PaymentPage.62", "Terms")}</a><a href={`${import.meta.env.BASE_URL}refunds`}>{cmsValue("PaymentPage.63", "Refund policy")}</a></nav><span><LockIcon />{cmsValue("PaymentPage.64", " Payment via Razorpay")}</span></footer>
      </div>
    </main>
  );
}

function LockIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><path d="M12 14v3" /></svg>;
}

export default PaymentPage;
