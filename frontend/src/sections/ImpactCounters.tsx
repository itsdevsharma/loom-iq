function ImpactCounters() {
  const stats = [
    {
      value: "124%",
      label: "Faster sales execution",
      description:
        "Predictive workflows keep reps moving on the right deals at the right time.",
    },
    {
      value: "94%",
      label: "Forecast confidence",
      description:
        "Live insights and AI signals help teams trust every projection.",
    },
    {
      value: "32",
      label: "Automations live",
      description:
        "Automate routine follow-ups, renewals, and support handoffs with no code.",
    },
  ];

  return (
    <section className="section section-shell section-counters">
      <div className="counter-intro">
        <p className="eyebrow">Growth momentum</p>
        <h2>See the numbers that make every operation click.</h2>
        <p>
          A single horizontal view of performance, confidence, and automation
          gives your teams the clarity to move faster together.
        </p>
      </div>

      <div className="counter-row">
        {stats.map((item) => (
          <article key={item.label} className="counter-card">
            <strong>{item.value}</strong>
            <span>{item.label}</span>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ImpactCounters;
