const integrations = [
  "Slack",
  "Google Workspace",
  "Zapier",
  "HubSpot",
  "Stripe",
  "Mailchimp",
];

function AiAndIntegrations() {
  return (
    <section
      id="integrations"
      className="section section-shell section-integrations"
    >
      <div className="section-heading">
        <p className="eyebrow">Integrations</p>
        <h2>Connect your favorite tools without switching tabs.</h2>
        <p>
          Work where your team already does, while preserving one clean system
          of record.
        </p>
      </div>
      <div className="logo-slider" aria-label="Integration logos">
        <div className="logo-track">
          {integrations.concat(integrations).map((item, index) => (
            <div key={`${item}-${index}`} className="logo-chip">
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AiAndIntegrations;
