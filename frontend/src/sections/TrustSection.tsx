import "../TrustSection.css";

const trustItems = [
  { title: "Role-based access", description: "Granular permissions to keep data safe across teams." },
  { title: "Encrypted data in transit", description: "All network traffic is encrypted using modern TLS standards." },
  { title: "Reliable infrastructure", description: "Hosted on enterprise-grade cloud infrastructure." },
  { title: "Backups and recovery", description: "Regular automated backups to protect your business data." },
];

function TrustSection() {
  return (
    <section id="trust" className="section section-shell section-trust">
      <div className="trust-inner">
        <div className="section-heading">
          <p className="eyebrow">Trust & security</p>
          <h2>Built for controlled, traceable operations.</h2>
          <p>
            Production, inventory, quality, and finance records need clear ownership.
            LoomIQ supports controlled access and reliable records across your operation.
          </p>
        </div>

        <div className="trust-grid">
          {trustItems.map((item) => (
            <article key={item.title} className="trust-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>

        <p className="trust-disclaimer">
          Specific compliance certifications vary by deployment. Contact us for
          details relevant to your business.
        </p>
      </div>
    </section>
  );
}

export default TrustSection;
