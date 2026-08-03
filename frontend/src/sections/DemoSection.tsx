function DemoSection() {
  return (
    <section id="showcase" className="section section-shell demo-section">
      <div className="demo-container">
      <div className="section-heading">
        <p className="eyebrow">Product showcase</p>
        <h2>See your operations in one calm, intelligent view.</h2>
        <div className="demo-copy">
          <p>Real-time opportunity and fulfillment visibility, shared context for every customer interaction, and instant alerts when risk or momentum changes.</p>
          <ul className="check-list">
            <li>Real-time opportunity and fulfillment visibility</li>
            <li>Shared context for every customer interaction</li>
            <li>Instant alerts when risk or momentum changes</li>
          </ul>
        </div>
      </div>

      <div className="demo-layout">
        

        <div className="demo-screen">
          <div className="demo-topbar" />
          <div className="demo-content">
            <div className="showcase-panel">
              <div className="showcase-cards">
                <article className="showcase-card">
                  <span>Revenue</span>
                  <strong>+$184K</strong>
                </article>
                <article className="showcase-card">
                  <span>Retention</span>
                  <strong>92%</strong>
                </article>
                <article className="showcase-card">
                  <span>Ops efficiency</span>
                  <strong>+41%</strong>
                </article>
              </div>

              <div className="analytics-card">
                <div className="analytics-row">
                  <span>Revenue</span>
                  <strong>+$184K</strong>
                </div>
                <div className="graph-track">
                  <div className="bar-fill" style={{ width: "86%" }} />
                </div>

                <div className="analytics-row">
                  <span>Retention</span>
                  <strong>92%</strong>
                </div>
                <div className="graph-track">
                  <div className="bar-fill" style={{ width: "74%" }} />
                </div>

                <div className="analytics-row">
                  <span>Ops efficiency</span>
                  <strong>+41%</strong>
                </div>
                <div className="graph-track">
                  <div className="bar-fill" style={{ width: "94%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}

export default DemoSection;
