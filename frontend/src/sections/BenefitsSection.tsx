const benefits = [
  {
    title: "Reduce manual coordination",
    description:
      "Replace repeated spreadsheet updates and phone calls with one order and production record shared across teams.",
  },
  {
    title: "Keep materials accountable",
    description:
      "Know what was received, issued, processed, rejected, returned, and dispatched across your material flow.",
  },
  {
    title: "Protect delivery commitments",
    description:
      "See delays, shortages, pending inspections, and unfinished orders early enough to act on them.",
  },
  {
    title: "Understand order margin",
    description:
      "Bring material, wastage, production, purchase, dispatch, and finance data together to understand the real cost of each order.",
  },
];

function BenefitsSection() {
  return (
    <section
      id="benefits"
      className="section section-shell section-automation"
    >
      <div className="section-heading">
        <p className="eyebrow">Benefits</p>
        <h2>More control across the manufacturing cycle.</h2>
        <p>
          The value shows up in fewer handoff gaps, clearer production status, and
          better visibility into the costs behind every delivery.
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
