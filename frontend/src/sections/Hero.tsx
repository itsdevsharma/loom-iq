import { trackEvent } from '../analytics';
import AnnouncementBanner from '../components/AnnouncementBanner';

const analyticsDashboard = `${import.meta.env.BASE_URL}cms-defaults/analytics-dashboard.webp`;

function Hero() {
  return (
    <section id="hero" className="hero" aria-labelledby="hero-title">
      <AnnouncementBanner className="hero-announcement" />
      <div className="hero-copy">
        <p className="eyebrow">CRM + ERP for Textile Manufacturers</p>
        <h1 id="hero-title">Production se Sales tak — aapka poora business ek hi software mein.</h1>
        <p className="hero-text">Inventory, production, orders, sales and billing — all in one place, built for Indian textile businesses.</p>
        <div className="hero-actions">
          <a href="#pricing" className="button button-primary" onClick={() => trackEvent("direct_purchase_clicked")}>Claim 50% Off <span aria-hidden="true">→</span></a>
          <a href="#showcase" className="hero-text-link">See how it works <span aria-hidden="true">↓</span></a>
        </div>
        <p className="hero-reassurance">Choose a plan • Create your account • Pay securely</p>
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
