function FinalCTA() {
  return (
    <section
      className="section final-cta section-shell final-cta-connect"
      id="final-cta"
    >
      <div className="final-cta-frame">

        <div className="final-cta-copy">
          <p className="eyebrow">Get started</p>
          <h2>Ready to bring your textile operation into one view?</h2>
          <p>
            See how LoomIQ can connect orders, materials, production, quality,
            dispatch, and finance around the way your factory works.
          </p>
          <div className="hero-actions final-cta-actions">
            <a href="#demo" className="button button-primary">
              Book a personalized demo
            </a>
          </div>
          <p className="final-cta-meta">
            Bring a real order or production workflow. We will map it to the platform.
          </p>
        </div>

        <div className="final-cta-proof" aria-label="What the walkthrough covers">
          <p className="final-cta-proof-label">In the walkthrough</p>
          <div className="final-cta-proof-grid">
            <div>
              <strong>One order view</strong>
              <span>Customer requirements, materials, production, and delivery together.</span>
            </div>
            <div>
              <strong>Your factory flow</strong>
              <span>See how planning, stores, quality, and dispatch can connect.</span>
            </div>
            <div>
              <strong>Practical next steps</strong>
              <span>Leave with a clearer view of the controls your operation needs.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinalCTA;
