import analyticsDashboard from "../assets/analytics-dashboard.png";

function Hero() {
  return (
    <section id="hero" className="hero">
      <div className="hero-copy">
        <p className="eyebrow">The operating system for growing teams</p>
        <h1>One clear view of every customer, dollar, and decision.</h1>
        <p className="hero-text">
          LoomIQ brings CRM, finance, and operations into one intelligent workspace—so your team can move faster with less admin.
        </p>
        <div className="hero-actions">
          <a href="#pricing" className="button button-primary">
            Start free
          </a>
          <a href="#showcase" className="hero-text-link">
            Explore the platform <span aria-hidden="true">→</span>
          </a>
        </div>
        <p className="hero-reassurance">No credit card required · Set up in minutes</p>
      </div>

      <div className="hero-product" aria-label="LoomIQ analytics dashboard preview">
        <div className="hero-product-bar">
          <span />
          <span />
          <span />
          <p>Business overview</p>
        </div>
        <div className="hero-product-image-wrap">
          <img
            src={analyticsDashboard}
            alt="LoomIQ business analytics dashboard showing revenue, accounts, forecasts, and AI insights"
            className="analytics-dashboard-image"
            draggable={false}
          />
        </div>
      </div>
    </section>
  );
}

export default Hero;
