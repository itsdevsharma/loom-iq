import analyticsDashboard from "../assets/analytics-dashboard.png";

function Hero() {
  return (
    <section id="hero" className="hero">
      <div className="hero-copy">
        <p className="eyebrow">ERP for cloth manufacturers</p>
        <h1>Plan production, control stock, and deliver every order on time.</h1>
        <p className="hero-text">
          LoomIQ connects orders, fabric and yarn inventory, production, quality,
          dispatch, and finance in one system built for textile manufacturing.
        </p>
        <div className="hero-actions">
          <a href="#demo" className="button button-primary">
            Book a Free Demo
          </a>
          <a href="#features" className="hero-text-link">
            Explore features <span aria-hidden="true">→</span>
          </a>
        </div>
        <p className="hero-reassurance">
          From purchase order to finished fabric and customer delivery
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
            draggable={false}
          />
        </div>
      </div>
    </section>
  );
}

export default Hero;
