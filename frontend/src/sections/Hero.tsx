import HeroScene from "./HeroScene";

function Hero() {
  return (
    <section id="hero" className="hero section-shell hero-section">
      <HeroScene />
      <div className="hero-beams" aria-hidden="true">
        <span className="beam beam-1" />
        <span className="beam beam-2" />
        <span className="beam beam-3" />
        <span className="beam beam-4" />
        <span className="beam beam-5" />
        <span className="beam beam-6" />
      </div>

      <div className="hero-copy">
        
        <p className="eyebrow">AI-powered CRM & ERP</p>
        <h1>Run growth and operations from one intelligent command center.</h1>
        <p className="hero-text">
          LoomIQ brings revenue, finance, and service teams together with
          real-time intelligence, predictive automation, and enterprise-grade
          execution.
        </p>
        <div className="hero-actions">
          <a href="#pricing" className="button button-primary">
            Start free
          </a>
          <a href="#showcase" className="button button-secondary">
            View platform
          </a>
        </div>
      </div>

      <div className="hero-frame" aria-hidden="true">
        
        <div className="dashboard-shell">
          
          <div className="dashboard-window">
            <div className="dashboard-topbar">
              <div className="dot-row">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
              <span className="dashboard-chip">Live operations</span>
            </div>
            <div className="dashboard-grid">
              <div className="dashboard-panel panel-large">
                <h3>Pipeline health</h3>
                <div className="dashboard-list">
                  <div className="dashboard-row">
                    <span>Qualified opportunities</span>
                    <strong>124</strong>
                  </div>
                  <div className="dashboard-row">
                    <span>Forecast confidence</span>
                    <strong>94%</strong>
                  </div>
                  <div className="dashboard-row">
                    <span>Automations active</span>
                    <strong>32</strong>
                  </div>
                </div>
              </div>
              <div className="dashboard-panel panel-side">
                <h3>Revenue velocity</h3>
                <div className="mini-chart">
                  <span style={{ height: "58%" }} />
                  <span style={{ height: "72%" }} />
                  <span style={{ height: "68%" }} />
                  <span style={{ height: "90%" }} />
                  <span style={{ height: "78%" }} />
                  <span style={{ height: "96%" }} />
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: "82%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
