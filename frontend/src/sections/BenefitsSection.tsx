const benefits = [
  {
    title: "Forecast with context",
    description:
      "Use AI to understand deal momentum, risk signals, and customer health before problems surface.",
  },
  {
    title: "Automate the busywork",
    description:
      "Generate summaries, task follow-ups, and handoffs instantly so your team can stay focused.",
  },
  {
    title: "Scale with confidence",
    description:
      "Grow from a lean team to a global operation without adding layers of administrative overhead.",
  },
];

function BenefitsSection() {
  return (
    <section
      id="automation"
      className="section section-shell section-automation"
    >
      <div className="section-heading">
        <p className="eyebrow">AI automation</p>
        <h2>Let intelligent workflows do the heavy lifting.</h2>
        <p>
          Every workflow is designed to reduce friction and make execution feel
          effortless.
        </p>
      </div>
      <div className="benefit-grid">
        {benefits.map((benefit) => (
          <article key={benefit.title} className="benefit-card">
            <h3>{benefit.title}</h3>
            <p>{benefit.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default BenefitsSection;
