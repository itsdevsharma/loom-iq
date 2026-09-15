import analyticsDashboard from "../assets/analytics-dashboard.webp";

export default function ProofSection() {
  return <section className="section section-shell proof-section" aria-labelledby="proof-title">
    <div className="section-heading">
      <p className="eyebrow">See the product before you pay</p>
      <h2 id="proof-title">One clear view from cutting to dispatch.</h2>
      <p>Track every order from cutting to dispatch. Know what is delayed, what material is available and what payment is pending—without checking multiple registers and spreadsheets.</p>
    </div>
    <div className="proof-layout">
      <figure className="proof-screen"><img src={analyticsDashboard} alt="LoomIQ dashboard preview with production and inventory data" /><figcaption>Real product screen with example data</figcaption></figure>
      <aside className="proof-early-access">
        <p className="eyebrow">Early access</p>
        <h3>Built for Indian garment manufacturers.</h3>
        <p>LoomIQ is in early access. We have not published customer testimonials or outcome claims yet, so you can assess the product from the screens and your own workflow—not invented proof.</p>
        <ul><li>Orders, fabric, job work and production in one workflow</li><li>Stock, invoicing and pending payments visible together</li><li>Guided onboarding for your actual business data</li></ul>
      </aside>
    </div>
  </section>;
}
