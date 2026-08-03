const crmHighlights = [
  "Pipeline visibility for every rep and manager",
  "Automated follow-ups and meeting preparation",
  "Forecasting that adapts to customer momentum",
];

const erpHighlights = [
  "Unified quotes, billing, and fulfillment tracking",
  "Cross-functional approvals without email chains",
  "Operational reporting that keeps every team aligned",
];

function ProblemSolution() {
  return (
    <section className="section section-shell section-capabilities">
      <div className="section-heading">
        <p className="eyebrow">CRM & ERP</p>
        <h2>Built for the way modern companies actually operate.</h2>
        <p>
          Connect front-office momentum with back-office clarity across every
          department.
        </p>
      </div>
      <div className="capability-grid">
        <article className="capability-card">
          <h3>CRM features</h3>
          <ul>
            {crmHighlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="capability-card">
          <h3>ERP features</h3>
          <ul>
            {erpHighlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

export default ProblemSolution;
