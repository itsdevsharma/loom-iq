import "../HowItWorksSection.css";

const steps = [
  {
    number: "01",
    title: "Capture the order",
    description:
      "Record the buyer, fabric or garment specification, quantity, colour, delivery date, and commercial terms in one order record.",
  },
  {
    number: "02",
    title: "Plan and produce",
    description:
      "Plan materials and capacity, raise purchases, issue stock, and track each order through production, finishing, and quality checks.",
  },
  {
    number: "03",
    title: "Inspect, dispatch, and account",
    description:
      "Release approved goods for dispatch and connect delivery, invoicing, collections, and order margin back to the original requirement.",
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="section section-shell section-how">
      <div className="section-heading">
        <p className="eyebrow">How it works</p>
        <h2>From order confirmation to customer delivery.</h2>
      </div>

      <div className="how-grid">
        {steps.map((step) => (
          <article key={step.number} className="how-card">
            <span className="how-number">{step.number}</span>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default HowItWorksSection;
