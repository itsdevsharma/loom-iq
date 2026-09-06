function PlatformHighlights() {
  const highlights = [
    {
      value: "One workflow",
      label: "Order to dispatch",
      description:
      "Connect customer orders to material planning, production status, finished goods, and dispatch.",
    },
    {
      value: "Traceable",
      label: "Materials and batches",
      description:
      "Know what was purchased, issued, processed, inspected, and delivered without chasing spreadsheets.",
    },
    {
      value: "Connected",
      label: "Factory and finance",
      description:
      "Give production, stores, sales, and accounts the same current view of commitments and stock.",
    },
  ];

  return (
    <section className="section section-shell section-counters">
      <div className="counter-intro section-heading">
        <p className="eyebrow">Built for textile operations</p>
        <h2>Know what is ordered, in production, and ready to ship.</h2>
        <p>
          LoomIQ brings commercial, factory, stores, and finance data into one
          view so your team can act before delays become expensive.
        </p>
      </div>

      <div className="counter-row standard-grid">
        {highlights.map((item) => (
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

export default PlatformHighlights;
