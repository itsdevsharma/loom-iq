import PricingCard from "./PricingCard";

const pricingPlans = [
  {
    name: "Starter",
    price: "₹1,990",
    description: "Start with order management, material stock, purchasing, billing, and core production visibility.",
    features: [
      "Customers, enquiries, quotations, and sales orders",
      "Raw material and finished goods catalogue",
      "Invoices and payment tracking",
      "Basic order and production dashboard",
      "Stock receipts, issues, and low-stock alerts",
      "One store or production location",
      "Basic purchase and supplier records",
      "3–5 users and one workspace",
      "Basic roles and approval workflows",
      "Email support and onboarding",
    ],
    cta: "Talk through your setup",
    featured: false,
    period: "/mo",
  },
  {
    name: "Growth",
    price: "₹2,990",
    description: "Run multiple locations with material planning, production tracking, quality, costing, and reporting.",
    features: [
      "Everything in Starter",
      "Material planning against confirmed orders",
      "Work orders and production stage tracking",
      "Multiple stores, locations, and stock transfers",
      "Batch, roll, lot, and wastage records",
      "Quality inspection and rework tracking",
      "Order costing and margin reports",
      "Purchase management and suppliers",
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
    price: "Custom",
    description: "For textile groups needing multi-unit control, integrations, governance, and tailored workflows.",
    features: [
      "Everything in Growth",
      "Multi-unit and multi-company configuration",
      "Advanced production, costing, and integrations",
      "Enterprise permissions and governance",
      "Dedicated onboarding and support",
    ],
    cta: "Talk through your setup",
    featured: false,
    period: "",
  },
];

function PricingSection() {
  return (
    <section id="pricing" className="section section-shell section-pricing">
      <div className="section-heading">
        <p className="eyebrow">Pricing</p>
        <h2>Start with the controls your factory needs today.</h2>
        <p>
          Choose the operating depth that fits your textile business today and add
          locations, workflows, and controls as you grow.
        </p>
      </div>
      <div className="pricing-grid">
        {pricingPlans.map((plan) => (
          <PricingCard
            key={plan.name}
            planName={plan.name}
            tagline={plan.description}
            price={plan.price}
            period={plan.period}
            features={plan.features}
            ctaLabel={plan.cta}
            href="#demo"
            featured={!!plan.featured}
            badge={plan.featured ? "Most popular" : undefined}
          />
        ))}
      </div>
      <p className="pricing-note">
        All plans include onboarding support for your manufacturing workflow.
      </p>
    </section>
  );
}

export default PricingSection;
