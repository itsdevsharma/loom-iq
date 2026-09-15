import { cmsValue } from '../websiteContent';
import analyticsDashboard from "../assets/analytics-dashboard.webp";

function DemoSection() {
  return (
    <section id="showcase" className="section section-shell demo-section">
      <div className="demo-container">
        <div className="section-heading">
          <p className="eyebrow">{cmsValue("DemoSection.1", "Manufacturing overview")}</p>
          <h2>{cmsValue("DemoSection.2", "See what is happening across your factory and orders.")}</h2>
          <p>{cmsValue("DemoSection.3", " LoomIQ brings customer orders, material stock, production progress, quality, dispatch, and finance into a single operating view. ")}</p>
        </div>

        <div className="demo-layout">
          <div className="demo-screen" tabIndex={0} role="region" aria-label="Scrollable product preview">
            <div className="demo-topbar" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="demo-content">
              <img
                src={cmsValue("DemoSection.4", analyticsDashboard)}
                alt={cmsValue("DemoSection.5", "LoomIQ textile manufacturing overview dashboard preview")}
                className="demo-dashboard-image"
                draggable={false}
                loading="lazy" width={1440} height={921}
              />
            </div>
          </div>

          <p className="demo-disclaimer">{cmsValue("DemoSection.6", " Manufacturing overview dashboard preview. ")}</p>
        </div>
        <div className="preview-actions"><a className="button button-primary" href="#pricing">Compare plans</a><a href={analyticsDashboard} target="_blank" rel="noreferrer">Open full-size preview ↗</a></div>
        <aside id="demo" className="demo-support"><h3>Product questions?</h3><p>A recorded video and a public garment ERP demo are not available in the supplied materials. Email <a href="mailto:support@loomiq.com">support@loomiq.com</a> for product or onboarding questions. Purchasing online does not require a demo booking.</p></aside>
      </div>
    </section>
  );
}

export default DemoSection;
