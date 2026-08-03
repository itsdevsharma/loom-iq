const pricingPlans = [
  {
    name: "Starter",
    price: "$29",
    description: "Perfect for lean teams building momentum.",
    cta: "Start free",
  },
  {
    name: "Growth",
    price: "$99",
    description: "For scaling companies that need more automation.",
    cta: "Book demo",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Advanced controls, security, and setup support.",
    cta: "Talk to sales",
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
          <article
            key={plan.name}
            className={`pricing-card ${plan.featured ? "featured" : ""}`}
          >
            <h3>{plan.name}</h3>
            <p className="price">{plan.price}</p>
            <p>{plan.description}</p>
            <a href="#hero" className="button button-primary">
              {plan.cta}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

export default PricingSection;
