import { cmsValue } from '../websiteContent';
function FinalCTA() {
  return (
    <section
      className="section final-cta section-shell final-cta-connect"
      id="final-cta"
    >
      <div className="final-cta-frame">

        <div className="final-cta-copy">
          <p className="eyebrow">{cmsValue("FinalCTA.1", "Get started")}</p>
          <h2>{cmsValue("FinalCTA.2", "Ready to bring your textile operation into one view?")}</h2>
          <p>{cmsValue("FinalCTA.3", " See how LoomIQ can connect orders, materials, production, quality, dispatch, and finance around the way your factory works. ")}</p>
          <div className="hero-actions final-cta-actions">
            <a href={cmsValue("FinalCTA.4", "#demo")} className="button button-primary">{cmsValue("FinalCTA.5", " Book a personalized demo ")}</a>
          </div>
          <p className="final-cta-meta">{cmsValue("FinalCTA.6", " Bring a real order or production workflow. We will map it to the platform. ")}</p>
        </div>

        <div className="final-cta-proof" aria-label={cmsValue("FinalCTA.7", "What the walkthrough covers")}>
          <p className="final-cta-proof-label">{cmsValue("FinalCTA.8", "In the walkthrough")}</p>
          <div className="final-cta-proof-grid">
            <div>
              <strong>{cmsValue("FinalCTA.9", "One order view")}</strong>
              <span>{cmsValue("FinalCTA.10", "Customer requirements, materials, production, and delivery together.")}</span>
            </div>
            <div>
              <strong>{cmsValue("FinalCTA.11", "Your factory flow")}</strong>
              <span>{cmsValue("FinalCTA.12", "See how planning, stores, quality, and dispatch can connect.")}</span>
            </div>
            <div>
              <strong>{cmsValue("FinalCTA.13", "Practical next steps")}</strong>
              <span>{cmsValue("FinalCTA.14", "Leave with a clearer view of the controls your operation needs.")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinalCTA;
