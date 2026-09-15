import analyticsDashboard from "../assets/analytics-dashboard.webp";

export default function DemoSection() {
  return <section id="showcase" className="section section-shell demo-section">
    <div className="demo-container">
      <div className="section-heading"><p className="eyebrow">Product tour</p><h2>See what is happening across your factory and orders.</h2><p>Explore the LoomIQ operating view for customer orders, material stock, production progress, quality, dispatch and finance.</p></div>
      <div className="demo-layout"><div className="demo-screen" tabIndex={0} role="region" aria-label="Scrollable product preview"><div className="demo-topbar" aria-hidden="true"><span /><span /><span /></div><div className="demo-content"><img src={analyticsDashboard} alt="LoomIQ manufacturing overview dashboard preview" className="demo-dashboard-image" draggable={false} loading="lazy" width={1440} height={921} /></div></div><p className="demo-disclaimer">Product interface preview with example data.</p></div>
      <div className="preview-actions"><a className="button button-primary" href="#pricing">Start Using LoomIQ — ₹1,990/month</a><a href={analyticsDashboard} target="_blank" rel="noreferrer">Open full-size preview ↗</a></div>
      <aside id="demo" className="demo-support"><h3>Need an Enterprise walkthrough?</h3><p>Demos and WhatsApp conversations are available for hesitant buyers and Enterprise teams. You can purchase Starter or Growth online without booking a demo.</p></aside>
    </div>
  </section>;
}
