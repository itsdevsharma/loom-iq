import { websitePricing } from '../websiteContent';
import { useOffer } from "../offer";
import { useEffect } from "react";
import PricingCard from "./PricingCard";
import { trackEvent } from "../analytics";

const plans = [
  { name: "Starter", description: "For a small workshop that needs one reliable order-to-dispatch view.", features: ["Small workshop", "Orders, fabric stock, invoices and core reports", "Guided onboarding included", "Migration available as an optional paid service", "Commercial invoice"], featured: false },
  { name: "Growth", description: "For a growing factory that needs the full production workflow.", features: ["Growing factory", "All Starter features plus production and job-work tools", "Guided onboarding and priority support included", "Migration available as an optional paid service", "Commercial invoice"], featured: true },
  { name: "Enterprise", description: "For multi-unit businesses that need advanced controls and a tailored rollout.", features: ["Multi-unit business", "Custom users", "Advanced controls, workflows and integrations", "Dedicated onboarding and support", "Migration scoped with your implementation", "GST treatment confirmed in your agreement"], featured: false },
];

const afterPurchase = ["Payment is verified", "A matching demo converts, or the team arranges workspace setup", "Follow onboarding in your account"];

function PricingSection({ general = false }: { general?: boolean }) {
  const { offer, ready } = useOffer();
  const prices = websitePricing();
  const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;
  useEffect(() => {
    const element = document.getElementById('pricing');
    if (!element) return;
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { trackEvent("pricing_page_view"); trackEvent("view_erp_pricing"); observer.disconnect(); } }, { threshold: 0.15 });
    observer.observe(element); return () => observer.disconnect();
  }, []);

  return <section id="pricing" className="section section-shell section-pricing">
    <div className="section-heading">
      <p className="eyebrow">Simple monthly pricing</p>
      <h2>Choose your plan and see exactly what you pay.</h2>
      <p>{general ? 'Standard monthly software pricing. Review any eligible offer and your full payable total at checkout.' : 'Clear monthly pricing for Indian textile businesses. Your full payable price is shown before checkout.'}</p>
    </div>
    {ready && offer.eligible && <p className="agency-pricing-offer">Eligible offer pricing is shown below. Renewal pricing follows your account’s applicable price agreement. Review availability and terms at checkout.</p>}
    <div className="pricing-grid">
      {plans.map(plan => {
        const enterprise = plan.name === 'Enterprise';
        const key = plan.name as keyof typeof prices;
        const planPrice = prices[key] as { recurring:number; firstMonth?:number };
        const onOffer = !enterprise && offer.eligible;
        const displayPrice = onOffer ? planPrice.firstMonth! : planPrice.recurring;
        return <PricingCard key={plan.name} planName={plan.name} tagline={general ? ({ Starter: "Core order, inventory and billing workflows.", Growth: "Additional production and job-work workflows.", Enterprise: "A tailored rollout for more complex requirements." }[plan.name]) : plan.description} originalPrice={onOffer ? money(planPrice.recurring) : undefined} price={money(displayPrice)} recurringText={onOffer ? `Standard ${money(planPrice.recurring)}/month; renewal pricing is shown in your account` : undefined} period="/month" features={general ? plan.features.filter(feature => !["Small workshop", "Growing factory", "Multi-unit business"].includes(feature)).map(feature => feature.replace("Orders, fabric stock, invoices and core reports", "Orders, stock, invoices and core reports")) : plan.features} ctaLabel={enterprise ? "Talk to sales" : `Choose ${plan.name}`} href={enterprise ? `${import.meta.env.BASE_URL}demo` : `${import.meta.env.BASE_URL}${offer.signedUp ? "payment" : "signup"}?plan=${plan.name}`} onCtaClick={() => { trackEvent(enterprise ? "demo_cta_clicked" : "direct_purchase_clicked"); if (!enterprise) trackEvent('plan_selected'); }} featured={plan.featured} badge={onOffer ? "Eligible offer" : null} purchaseSteps={enterprise ? undefined : afterPurchase} />;
      })}
    </div>
    {general && <><div className="agency-plan-comparison" role="region" aria-label="ERP plan comparison" tabIndex={0}><table><caption>Plan details to review before purchase</caption><thead><tr><th scope="col">Detail</th>{plans.map(plan => <th key={plan.name} scope="col">{plan.name}</th>)}</tr></thead><tbody><tr><th scope="row">Standard monthly price</th>{Object.entries(prices).map(([name, price]) => <td key={name}>{money(price.recurring)}</td>)}</tr><tr><th scope="row">Purchase route</th><td>Online checkout</td><td>Online checkout</td><td>Talk to sales</td></tr><tr><th scope="row">Onboarding</th><td>Guided</td><td>Guided</td><td>Scoped with your rollout</td></tr><tr><th scope="row">Data migration</th><td>Optional paid service</td><td>Optional paid service</td><td>Scoped with implementation</td></tr><tr><th scope="row">Users, storage & locations</th><td colSpan={3}>Confirm limits with the team before purchase.</td></tr><tr><th scope="row">Integrations & customisation</th><td colSpan={3}>Confirm availability, scope and any additional charges.</td></tr></tbody></table></div><p className="agency-pricing-terms">Each checkout covers one membership month with no automatic renewal. Applicable taxes and the final total appear before payment. ERP workspace setup is separate from website registration. <a href={import.meta.env.BASE_URL + 'terms'}>Review terms</a>.</p></>}
    <p className="pricing-demo-alternative">Need a tailored multi-unit rollout? <a href={`${import.meta.env.BASE_URL}demo`}>Talk to our Enterprise team.</a></p>
    <aside className="guarantee-card" aria-label="7-Day Money-Back Guarantee"><div aria-hidden="true">✓</div><div><h3>7-Day Money-Back Guarantee</h3><p>Try LoomIQ with your actual business. If it isn’t right for you, request a refund within seven days.</p><a href={`${import.meta.env.BASE_URL}refunds`}>Read the refund policy</a></div></aside>
  </section>;
}

export default PricingSection;
