import "../ProblemSection.css";

const painPoints = [
  {
    title: "Orders disconnected from production",
    description:
      "Sales orders, specifications, and promised dates are managed separately from production planning and factory progress.",
  },
  {
    title: "Material stock is hard to trust",
    description:
      "Fabric, yarn, trims, chemicals, and finished goods move through different stores and processes without one dependable balance.",
  },
  {
    title: "Production updates arrive late",
    description:
      "Planning, weaving or knitting, dyeing, finishing, quality, and dispatch teams rely on calls and spreadsheets to report progress.",
  },
  {
    title: "Margins disappear in the gaps",
    description:
      "Wastage, rework, delayed orders, and untracked costs make it difficult to see the real margin on each order.",
  },
];

function ProblemSection() {
  return (
    <section id="problem" className="section section-shell section-problem">
      <div className="problem-inner">
        <div className="problem-copy">
          <p className="eyebrow">The manufacturing problem</p>
          <h2>Still running the factory through spreadsheets and phone calls?</h2>
          <p>
            In cloth manufacturing, a missed update can mean the wrong material,
            a delayed lot, or an order that misses its delivery date. LoomIQ
            connects the records behind each handoff.
          </p>
        </div>

        <div className="problem-grid">
          {painPoints.map((point) => (
            <article key={point.title} className="problem-card">
              <span className="problem-icon" aria-hidden="true">
                ⚡
              </span>
              <h3>{point.title}</h3>
              <p>{point.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProblemSection;
