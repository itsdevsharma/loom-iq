import analyticsDashboard from "../assets/analytics-dashboard.png";

function DemoSection() {
  return (
    <section id="showcase" className="section section-shell demo-section">
      <div className="demo-container">
        <div className="section-heading">
          <p className="eyebrow">Manufacturing overview</p>
          <h2>See what is happening across your factory and orders.</h2>
          <p>
            LoomIQ brings customer orders, material stock, production progress,
            quality, dispatch, and finance into a single operating view.
          </p>
        </div>

        <div className="demo-layout">
          <div className="demo-screen">
            <div className="demo-topbar" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="demo-content">
              <img
                src={analyticsDashboard}
                alt="LoomIQ textile manufacturing overview dashboard preview"
                className="demo-dashboard-image"
                draggable={false}
              />
            </div>
          </div>

          <p className="demo-disclaimer">
            Manufacturing overview dashboard preview.
          </p>
        </div>
      </div>
    </section>
  );
}

export default DemoSection;
