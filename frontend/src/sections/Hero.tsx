import { trackEvent } from '../analytics';

const analyticsDashboard = `${import.meta.env.BASE_URL}cms-defaults/analytics-dashboard.webp`;

function Hero() {
  return (
    <section id="hero" className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow">Made specifically for Indian garment manufacturers</p>
        <h1 id="hero-title">Stop losing track of garment orders and production.</h1>
        <p className="hero-text">LoomIQ brings orders, fabric inventory, job work, production, invoices and reports into one simple ERP built for clothing manufacturers.</p>
        <div className="hero-actions">
          <a href="#pricing" className="button button-primary" onClick={() => trackEvent("direct_purchase_clicked")}>Start Your Setup</a>
          <a href={`${import.meta.env.BASE_URL}demo`} className="hero-text-link">See LoomIQ in Action <span aria-hidden="true">→</span></a>
        </div>
        <p className="hero-reassurance">Instant account • Guided setup • 7-day money-back guarantee</p>
      </div>

      <div className="hero-product" aria-label="LoomIQ garment manufacturing dashboard preview">
        <div className="hero-product-bar"><span /><span /><span /><p>Manufacturing overview</p></div>
        <div className="hero-product-image-wrap" tabIndex={0} role="region" aria-label="Scrollable interface preview">
          <img src={analyticsDashboard} alt="LoomIQ manufacturing dashboard showing revenue, inventory, and operations" className="analytics-dashboard-image" width={1440} height={921} fetchPriority="high" decoding="async" draggable={false} />
        </div>
        <p className="preview-caption">Product preview · example data</p>
      </div>
    </section>
  );
}

export default Hero;
