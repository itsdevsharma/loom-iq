import { trackEvent } from '../analytics';
import { cmsValue } from '../websiteContent';
import analyticsDashboard from "../assets/analytics-dashboard.webp";

function Hero({ landing = false }: { landing?: boolean }) {
  return (
    <section id="hero" className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow">{cmsValue("Hero.1", "ERP software for growing businesses")}</p>
        <h1 id="hero-title">{landing ? "Replace Excel with a garment ERP built for manufacturers." : cmsValue("Hero.2", "Run your garment factory from one place.")}</h1>
        <p className="hero-text">{cmsValue("Hero.3", " LoomIQ gives teams a single view of sales, inventory, manufacturing, quality, dispatch, and finance so operations stay connected as the business grows. ")}</p>
        <div className="hero-actions">
          <a href={cmsValue("Hero.4", "#pricing")} className="button button-primary" onClick={() => trackEvent("direct_purchase_clicked")}>{cmsValue("Hero.5", " View plans & offer ")}</a>
          <a href={cmsValue("Hero.6", "#demo")} className="hero-text-link">{cmsValue("Hero.7", " Book a personalized demo ")}<span aria-hidden="true">→</span>
          </a>
        </div>
      </div>

      <div className="hero-product" aria-label={cmsValue("Hero.9", "LoomIQ textile manufacturing dashboard preview")}>
        <div className="hero-product-bar">
          <span />
          <span />
          <span />
          <p>{cmsValue("Hero.10", "Manufacturing overview")}</p>
        </div>
        <div className="hero-product-image-wrap" tabIndex={0} role="region" aria-label="Scrollable interface preview">
          <img
            src={cmsValue("Hero.11", analyticsDashboard)}
            alt={cmsValue("Hero.12", "LoomIQ manufacturing dashboard showing revenue, inventory, and operations")}
            className="analytics-dashboard-image"
            width={1440}
            height={921}
            fetchPriority="high"
            draggable={false}
          />
        </div>
        <p className="preview-caption">Interface preview · example data. Garment-specific product screens pending.</p>
      </div>
    </section>
  );
}

export default Hero;
