const features = [
  {
    title: "Unified customer intelligence",
    description:
      "Bring CRM, ERP, and service context together in one beautifully structured workspace.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M5 18V9m7 9V5m7 13v-7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Predictive automation",
    description:
      "Trigger follow-ups, approvals, and recommendations before your team has to ask.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M6 15l4-4 3 3 5-6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19 8h-4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Enterprise-grade trust",
    description:
      "Secure permissions, audit trails, and governance built for organizations that move fast.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3l6 3v5c0 4.2-2.6 7.7-6 10-3.4-2.3-6-5.8-6-10V6l6-3Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="section section-shell section-features">
      <div className="section-heading">
        <p className="eyebrow">Features</p>
        <h2>Everything your team needs to stay in sync.</h2>
        <p>
          Designed for operations leaders who need clarity, speed, and control
          without complexity.
        </p>
      </div>
      <div className="card-grid">
        {features.map((feature) => (
          <article key={feature.title} className="feature-card">
            <div className="feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default FeaturesSection;
