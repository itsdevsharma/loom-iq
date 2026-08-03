function DemoSection() {
  return (
    <section id="showcase" className="section section-shell section-showcase">
      <div className="split-section">
        <div>
          <p className="eyebrow">Product showcase</p>
          <h2>See your operations in one calm, intelligent view.</h2>
          <p>
            LoomIQ turns complex workflows into clean, actionable experiences
            for revenue leaders, finance teams, and service teams alike.
          </p>
          <ul className="check-list">
            <li>Real-time opportunity and fulfillment visibility</li>
            <li>Shared context for every customer interaction</li>
            <li>Instant alerts when risk or momentum changes</li>
          </ul>
        </div>
        <div className="analytics-card">
          <div className="analytics-graph">
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
    </section>
  );
}

export default DemoSection;
