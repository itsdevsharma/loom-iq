import { cmsTemplate, cmsValue, websitePricing } from '../websiteContent';
import { useOffer } from "../offer";
import { useEffect } from "react";
import PricingCard from "./PricingCard";
import { trackEvent } from "../analytics";

const pricingPlans = cmsValue("PricingSection.1", [
  {
    name: "Starter",
    description: "Start with order management, material stock, purchasing, billing, and core production visibility.",
    features: [
      "Customers, orders, quotations, and invoicing",
      "Material stock, purchasing, and suppliers",
      "Multiple stores, locations, and stock transfers",
      "Batch, roll, lot, and wastage records",
      "Quality inspection and rework tracking",
      "Order costing and margin reports",
    ],
    featured: false,
    period: "/mo",
  },
  {
    name: "Growth",
    description: "Run multiple locations with material planning, production tracking, quality, costing, and reporting.",
    features: [
      "Everything in Starter",
      "Material planning against confirmed orders",
      "Work orders and production stage tracking",
      "Cash-flow, receivables, and expense reports",
      "More users, custom workflows, and permissions",
      "WhatsApp integration",
      "Priority support",
    ],
    featured: true,
    period: "/mo",
  },
  {
    name: "Enterprise",
    description: "A tailored setup for your operation with multi-unit control, integrations, governance, and custom workflows.",
    features: [
      "Everything in Growth",
      "Multi-unit and multi-company configuration",
      "Advanced production, costing, and integrations",
      "Enterprise permissions and governance",
      "Dedicated onboarding and support",
    ],
    featured: false,
    period: "/mo",
  },
]);

function PricingSection() {
  const { offer } = useOffer();
  const prices = websitePricing();
  const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;
  useEffect(() => {
    const element = document.getElementById('pricing');
    if (!element) return;
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { trackEvent("pricing_page_view"); observer.disconnect(); } }, {threshold:0.15});
    observer.observe(element); return () => observer.disconnect();

  }, []);

  return (
    <section id="pricing" className="section section-shell section-pricing">
      <div className="section-heading">
        <p className="eyebrow">{cmsValue("PricingSection.2", "Pricing")}</p>
        <h2>{cmsValue("PricingSection.3", "Flexible ERP plans for growing business operations.")}</h2>
        <p>{cmsValue("PricingSection.4", " Choose the operating depth that fits your business today and add locations, workflows, and controls as your operations grow. ")}</p>
      </div>
      <p className="pricing-note">{cmsValue("PricingSection.5", "Buy Starter or Growth within 24 hours of your first offer visit to save {discount} on your membership month.")}</p>
      <div className="pricing-grid">
        {pricingPlans.map((plan) => (
          <PricingCard
            key={plan.name}
            planName={plan.name}
            tagline={plan.description}
            price={money(plan.name === "Enterprise" ? prices.Enterprise.recurring : offer.eligible ? prices[plan.name as "Starter" | "Growth"].firstMonth : prices[plan.name as "Starter" | "Growth"].recurring)}
            originalPrice={offer.eligible && plan.name !== "Enterprise" ? money(prices[plan.name as "Starter" | "Growth"].recurring) : undefined}
            recurringText={cmsTemplate("PricingSection.recurring", "Regular price: {0}/month", [money(prices[plan.name as keyof typeof prices].recurring)])}
            period={plan.period}
            features={plan.features}
            ctaLabel={plan.name === "Enterprise" ? cmsValue("PricingSection.7", "Book a personalized demo") : "Get LoomIQ"}
            href={plan.name === "Enterprise" ? `${import.meta.env.BASE_URL}demo` : `${import.meta.env.BASE_URL}${offer.signedUp ? "payment" : "signup"}?plan=${plan.name}`}
            onCtaClick={() => trackEvent(plan.name === "Enterprise" ? "demo_cta_clicked" : "direct_purchase_clicked")}
            featured={!!plan.featured}
            badge={offer.eligible && plan.name !== "Enterprise" ? cmsValue("PricingSection.8", "{discount} off · 24-hour offer") : plan.featured ? (plan.name === "Growth" ? cmsValue("PricingSection.9", "Growth plan") : `${plan.name} plan`) : null}
          />
        ))}
      </div>
      <p className="pricing-demo-alternative">{cmsValue("PricingSection.10", "Want to see it in action first? ")}<a href={cmsValue("PricingSection.11", "#demo")}>{cmsValue("PricingSection.12", "Book a personalized demo →")}</a></p>
      <p className="pricing-note">{cmsValue("PricingSection.13", " These are monthly software subscription prices for the modules listed above, with onboarding support. User and location limits, migration, integrations, customization, and any applicable taxes will be confirmed with your setup before you commit. Enterprise pricing starts at {enterpriseRegular}/month. ")}</p>
      
    </section>
  );
}

export default PricingSection;
