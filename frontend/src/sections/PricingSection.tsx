import { websitePricing } from '../websiteContent';
import { useOffer } from "../offer";
import { useEffect } from "react";
import PricingCard from "./PricingCard";
import { trackEvent } from "../analytics";

const plans = [
  { name: "Starter", description: "For a small workshop that needs one reliable order-to-dispatch view.", features: ["Small workshop", "User limit: confirm before purchase", "Orders, fabric stock, invoices and core reports", "Guided onboarding included", "Migration: quoted separately", "GST: not charged; commercial invoice"], featured: false },
  { name: "Growth", description: "For a growing factory that needs the full production workflow.", features: ["Growing factory", "User limit: confirm before purchase", "All Starter features plus production and job-work tools", "Guided onboarding and priority support included", "Migration: quoted separately", "GST: not charged; commercial invoice"], featured: true },
  { name: "Enterprise", description: "For multi-unit businesses that need advanced controls and a tailored rollout.", features: ["Multi-unit business", "Custom users", "Advanced controls, workflows and integrations", "Dedicated onboarding and support", "Migration scoped with your implementation", "GST treatment confirmed in your agreement"], featured: false },
];

const afterPurchase = ["Your account is created instantly", "Select your garment-production workflow", "Import products, customers and stock", "Receive guided onboarding"];

function PricingSection() {
  const { offer } = useOffer();
  const prices = websitePricing();
  const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;
  useEffect(() => {
    const element = document.getElementById('pricing');
    if (!element) return;
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { trackEvent("pricing_page_view"); observer.disconnect(); } }, { threshold: 0.15 });
    observer.observe(element); return () => observer.disconnect();
  }, []);

  return <section id="pricing" className="section section-shell section-pricing">
    <div className="section-heading">
      <p className="eyebrow">Simple monthly pricing</p>
      <h2>Choose Your Plan</h2>
      <p>Clear monthly pricing for Indian garment manufacturers. There are no visitor timers or surprise checkout discounts.</p>
    </div>
    <div className="launch-offer"><strong>Launch Offer: Starter at ₹1,990/month</strong><span>Price locked for your first 3 months.</span></div>
    <div className="pricing-grid">
      {plans.map(plan => {
        const enterprise = plan.name === 'Enterprise';
        const key = plan.name as keyof typeof prices;
        return <PricingCard key={plan.name} planName={plan.name} tagline={plan.description} price={money(prices[key].recurring)} period="/month" features={plan.features} ctaLabel={enterprise ? "Talk to sales" : `Buy Now — ${money(prices[key].recurring)}/month`} href={enterprise ? `${import.meta.env.BASE_URL}demo` : `${import.meta.env.BASE_URL}${offer.signedUp ? "payment" : "signup"}?plan=${plan.name}`} onCtaClick={() => trackEvent(enterprise ? "demo_cta_clicked" : "direct_purchase_clicked")} featured={plan.featured} badge={plan.featured ? "Most popular" : null} purchaseSteps={enterprise ? undefined : afterPurchase} />;
      })}
    </div>
    <p className="pricing-demo-alternative">Need a tailored multi-unit rollout? <a href={`${import.meta.env.BASE_URL}demo`}>Talk to our Enterprise team.</a></p>
    <aside className="guarantee-card" aria-label="7-Day Money-Back Guarantee"><div aria-hidden="true">✓</div><div><h3>7-Day Money-Back Guarantee</h3><p>Try LoomIQ with your actual business. If it isn’t right for you, request a refund within seven days.</p><a href={`${import.meta.env.BASE_URL}refunds`}>Read the refund policy</a></div></aside>
  </section>;
}

export default PricingSection;
