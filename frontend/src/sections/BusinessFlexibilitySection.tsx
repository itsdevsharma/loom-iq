import "../BusinessFlexibilitySection.css";

const useCases = [
  { title: "Fabric mills", description: "Plan yarn and fabric production, track lots, record wastage, and manage finished rolls." },
  { title: "Dyeing & processing", description: "Move batches through dyeing, finishing, inspection, rework, and release." },
  { title: "Garment units", description: "Connect customer styles, material requirements, production stages, quality, and dispatch." },
  { title: "Home textiles", description: "Manage repeat orders, colourways, raw materials, production status, and customer delivery." },
  { title: "Trading with production", description: "Bring purchased goods and in-house production into one stock and order view." },
  { title: "Growing textile groups", description: "Add locations, product lines, users, and approvals without losing operating control." },
];

function BusinessFlexibilitySection() {
  return (
    <section id="industries" className="section section-shell section-flexibility">
      <div className="flexibility-inner">
        <div className="section-heading">
          <p className="eyebrow">Built for textile businesses</p>
          <h2>One ERP for the way cloth moves through your business.</h2>
          <p>
            Whether you run a fabric mill, processing unit, garment operation, or
            textile trading business, LoomIQ keeps commercial and factory work connected.
          </p>
        </div>

        <div className="flexibility-grid">
          {useCases.map((item) => (
            <article key={item.title} className="flexibility-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default BusinessFlexibilitySection;
