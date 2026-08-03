const logos = ["Stripe", "Linear", "Notion", "Vercel", "HubSpot", "Framer"];

function TrustStrip() {
  return (
    <section className="trust-strip section-shell">
      <p className="eyebrow">Trusted by companies building at scale</p>
      <div className="logo-row">
        {logos.map((logo) => (
          <span key={logo} className="logo-pill">
            {logo}
          </span>
        ))}
      </div>
      <div className="trust-meta">
        <span>4.9/5 average rating</span>
        <span>Trusted by 2,000+ revenue teams</span>
        <span>Enterprise-ready security and compliance</span>
      </div>
    </section>
  );
}

export default TrustStrip;
