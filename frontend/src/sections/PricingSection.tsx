
import PricingCard from "./PricingCard";

const pricingPlans = [
  {
    name: "Starter",
    price: "$29",
    description: "Perfect for lean teams building momentum.",
    cta: "Start free",
    period: "/mo",
  },
  {
    name: "Growth",
    price: "$99",
    description: "For scaling companies that need more automation.",
    cta: "Book demo",
    featured: true,
    period: "/mo",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Advanced controls, security, and setup support.",
    cta: "Talk to sales",
    period: "",
  },
];


function PricingSection() {
  return (
    <section id="pricing" className="section section-shell section-pricing">
      <div className="section-heading">
        <p className="eyebrow">Pricing</p>
        <h2>Choose a plan that matches your next stage.</h2>
        <p>Flexible plans for early teams and global organizations alike.</p>
      </div>
      <div className="pricing-grid">
        {pricingPlans.map((plan) => (
          <PricingCard
            key={plan.name}
            planName={plan.name}
            tagline={plan.description}
            price={plan.price}
            period={plan.price === "Custom" ? "" : "/mo"}
            ctaLabel={plan.cta}
            featured={!!plan.featured}
            badge={plan.featured ? "Most popular" : undefined}
          />
        ))}
      </div>
    </section>
  );
}

export default PricingSection;
