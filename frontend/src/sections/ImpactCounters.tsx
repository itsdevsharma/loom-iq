function ImpactCounters() {
  const stats = [
    {
      value: "360°",
      label: "Unified Business View",
      description:
        "Track revenue, customers, inventory, projects, and operations from one centralized dashboard.",
    },
    {
      value: "Real-Time",
      label: "AI-Powered Insights confidence",
      description:
        "Identify trends, forecast growth, and receive actionable recommendations before issues impact your business.",
    },
    {
      value: "Automated",
      label: "Smart Workflows",
      description:
        "Eliminate repetitive tasks with intelligent automation across CRM, ERP, finance, and customer support.",
    },
  ];

  return (
    <section className="section section-shell section-counters">
      <div className="counter-intro">
        <p className="eyebrow">Business Insights</p>
        <h2>Make every decision with confidence.</h2>
        <p>
          Get a complete view of sales, finance, operations, and customer performance through real-time dashboards and AI-powered analytics.
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
