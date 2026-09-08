import { useOffer } from "../offer";
import { useEffect } from "react";
import PricingCard from "./PricingCard";
import { trackEvent } from "../analytics";

const pricingPlans = [
  {
    name: "Starter",
    price: "₹995",
    originalPrice: "₹1,990",
    recurringText: "Then ₹1,990/month",
    description: "Start with order management, material stock, purchasing, billing, and core production visibility.",
    features: [
      "Customers, orders, quotations, and invoicing",
      "Material stock, purchasing, and suppliers",
      "Multiple stores, locations, and stock transfers",
      "Batch, roll, lot, and wastage records",
      "Quality inspection and rework tracking",
      "Order costing and margin reports",
    ],
    cta: "Talk through your setup",
    featured: false,
    period: "/mo",
  },
  {
    name: "Growth",
    price: "₹1,495",
    originalPrice: "₹2,990",
    recurringText: "Then ₹2,990/month",
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
    cta: "Talk through your setup",
    featured: true,
    period: "/mo",
  },
  {
    name: "Enterprise",
    price: "₹4,990",
    description: "A tailored setup for your operation with multi-unit control, integrations, governance, and custom workflows.",
    features: [
      "Everything in Growth",
      "Multi-unit and multi-company configuration",
      "Advanced production, costing, and integrations",
      "Enterprise permissions and governance",
      "Dedicated onboarding and support",
    ],
    cta: "Talk through your setup",
    featured: false,
    recurringText: "Starting at ₹4,990/month",
    period: "/mo",
  },
];

function PricingSection() {
  const { offer } = useOffer();
  useEffect(() => {
    trackEvent("pricing_page_view");

  }, []);

  return (
    <section id="pricing" className="section section-shell section-pricing">
      <div className="section-heading">
        <p className="eyebrow">Pricing</p>
        <h2>Flexible ERP plans for growing business operations.</h2>
        <p>
          Choose the operating depth that fits your business today and add
          locations, workflows, and controls as your operations grow.
        </p>
      </div>
      <p className="pricing-note">Buy Starter or Growth within 24 hours of your first offer visit to save 50% on your membership month.</p>
      <div className="pricing-grid">
        {pricingPlans.map((plan) => (
          <PricingCard
            key={plan.name}
            planName={plan.name}
            tagline={plan.description}
            price={offer.eligible ? plan.price : plan.originalPrice ?? plan.price}
            originalPrice={offer.eligible ? plan.originalPrice : undefined}
            recurringText={plan.name === "Enterprise" || offer.eligible ? plan.recurringText : "Billed monthly"}
            period={plan.period}
            features={plan.features}
            ctaLabel={plan.name === "Enterprise" ? "Book a personalized demo" : offer.eligible ? `Get ${plan.name} — save 50%` : `Choose ${plan.name}`}
            href={plan.name === "Enterprise" ? "#demo" : `${import.meta.env.BASE_URL}${offer.signedUp ? "payment" : "signup"}?plan=${plan.name}`}
            onCtaClick={() => trackEvent(plan.name === "Enterprise" ? "demo_cta_clicked" : "direct_purchase_clicked")}
            featured={!!plan.featured}
            badge={offer.eligible && plan.name !== "Enterprise" ? "50% off · 24-hour offer" : plan.featured ? "Most popular" : undefined}
          />
        ))}
      </div>
      <p className="pricing-demo-alternative">Want to see it in action first? <a href="#demo">Book a personalized demo →</a></p>
      <p className="pricing-note">
        These are monthly software subscription prices for the modules listed above, with onboarding support.
        User and location limits, migration, integrations, customization, and any applicable taxes
        will be confirmed with your setup before you commit. Enterprise pricing starts at ₹4,990/month.
      </p>
      
    </section>
  );
}

export default PricingSection;
