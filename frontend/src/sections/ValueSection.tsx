import "../ValueSection.css";

const valuePoints = [
  { title: "Plan against real orders", description: "Turn customer requirements and delivery dates into clear material and production plans." },
  { title: "Control material movement", description: "Track yarn, fabric, trims, chemicals, and finished goods across stores and processes." },
  { title: "Protect order margins", description: "Bring purchases, wastage, rework, labour, and dispatch costs into the same order view." },
  { title: "Grow without losing control", description: "Add products, machines, locations, users, and workflows as your manufacturing operation grows." },
];

function ValueSection() {
  return (
    <section id="value" className="section section-shell section-value">
      <div className="value-inner">
        <div className="section-heading">
          <p className="eyebrow">Why LoomIQ</p>
          <h2>Built around the way cloth manufacturers work.</h2>
          <p>
            One operating system for commercial teams, stores, production, quality,
            dispatch, and accounts — without forcing the factory into a generic workflow.
          </p>
        </div>

        <div className="value-grid">
          {valuePoints.map((point) => (
            <article key={point.title} className="value-card">
              <h3>{point.title}</h3>
              <p>{point.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ValueSection;
