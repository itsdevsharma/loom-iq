import analyticsDashboard from "../assets/analytics-dashboard.webp";

function Hero() {
  return (
    <section id="hero" className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow">ERP software for growing businesses</p>
        <h1 id="hero-title">Connected ERP software for orders, inventory, production, and finance.</h1>
        <p className="hero-text">
          LoomIQ gives teams a single view of sales, inventory, manufacturing,
          quality, dispatch, and finance so operations stay connected as the business grows.
        </p>
        <div className="hero-actions">
          <a href="#pricing" className="button button-primary">
            View plans & offer
          </a>
          <a href="#demo" className="hero-text-link">
            Book a personalized demo <span aria-hidden="true">→</span>
          </a>
        </div>
        <p className="hero-reassurance">
          Choose your plan, or explore your workflow with a free demo.
        </p>
      </div>

      <div className="hero-product" aria-label="LoomIQ textile manufacturing dashboard preview">
        <div className="hero-product-bar">
          <span />
          <span />
          <span />
          <p>Manufacturing overview</p>
        </div>
        <div className="hero-product-image-wrap">
          <img
            src={analyticsDashboard}
            alt="LoomIQ manufacturing dashboard showing revenue, inventory, and operations"
            className="analytics-dashboard-image"
            width={1440}
            height={921}
            fetchPriority="high"
            draggable={false}
          />
        </div>
      </div>
    </section>
  );
}

export default Hero;
