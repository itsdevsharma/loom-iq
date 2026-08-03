import { useEffect, useState } from "react";
import "../FeaturesSection.css";

const features = [
  { id: "CRM · 01", icon: "◎", title: "Customer intelligence", description: "Keep every contact, conversation, and activity in one clear customer timeline.", detail: "Build a complete picture of every customer. LoomIQ brings emails, calls, meetings, notes, support history, and account activity into one shared workspace, so each team starts every conversation with the right context." },
  { id: "CRM · 02", icon: "↗", title: "Pipeline management", description: "Give every rep a focused view of deals, next steps, and revenue at risk.", detail: "Move opportunities forward with a pipeline that reflects how your team really sells. See deal stages, owners, expected value, and stalled opportunities at a glance, then keep the whole revenue team aligned on the next best action." },
  { id: "CRM · 03", icon: "✦", title: "AI sales assistant", description: "Turn customer signals into timely follow-ups, summaries, and confident forecasts.", detail: "LoomIQ’s AI turns sales activity into practical guidance. It can summarize customer conversations, surface follow-up tasks, highlight deal risk, and give leaders a more informed view of the forecast." },
  { id: "ERP · 01", icon: "◫", title: "Finance & billing", description: "Connect quotes, invoices, subscriptions, and cash flow without spreadsheet handoffs.", detail: "Keep your commercial and financial records connected from the first quote through to payment. Create invoices from approved work, track subscription revenue, and give finance a current view of what has been billed, collected, and is still outstanding." },
  { id: "ERP · 02", icon: "⌘", title: "Operations hub", description: "Coordinate orders, inventory, projects, and approvals across every operational team.", detail: "Replace disconnected handoffs with a single operating view. Teams can manage orders, project work, inventory, and approval flows together, while everyone sees the same live status and ownership." },
  { id: "ERP · 03", icon: "▥", title: "Real-time reporting", description: "See sales, financial, and operational performance together—always current, always actionable.", detail: "Bring revenue, finance, and operations into one reporting layer. Track the metrics that matter without waiting for manual exports, and move from a high-level business view into the records behind every number." },
];

export default function FeaturesSection() {
  const [selectedFeature, setSelectedFeature] = useState<(typeof features)[number] | null>(null);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedFeature(null);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <section id="features" className="fs03">
      <div className="fs03__blob fs03__blob--1" />
      <div className="fs03__blob fs03__blob--2" />
      <div className="fs03__blob fs03__blob--3" />

      <div className="fs03__inner">
        <div className="fs03__top">
          <div>
            <p className="fs03__badge">One connected platform</p>
            <h2 className="fs03__headline">
              Everything your business needs<br />to move <mark>forward</mark>
            </h2>
          </div>
          <p className="fs03__right-text">
            LoomIQ connects the customer-facing work of your CRM with the financial
            and operational clarity of your ERP—without the usual complexity.
          </p>
        </div>

        <div className="fs03__grid">
          {features.map((feature) => (
            <article className="fs03__card" key={feature.id}>
              <div className="fs03__card-glow" />
              <p className="fs03__card-num">{feature.id}</p>
              <span className="fs03__card-icon" aria-hidden="true">{feature.icon}</span>
              <h3 className="fs03__card-title">{feature.title}</h3>
              <p className="fs03__card-body">{feature.description}</p>
              <button
                type="button"
                className="fs03__card-link"
                onClick={() => setSelectedFeature(feature)}
                aria-haspopup="dialog"
              >
                Learn more <span aria-hidden="true">→</span>
              </button>
            </article>
          ))}
        </div>

        <div className="fs03__sep" />
        <div className="fs03__bottom">
          <div className="fs03__trust">
            <span className="fs03__dots" aria-hidden="true"><i /><i /><i /></span>
            Built to bring every team into sync
          </div>
        </div>
      </div>

      {selectedFeature && (
        <div
          className="fs03__dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedFeature(null);
          }}
        >
          <section
            className="fs03__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="feature-dialog-title"
            aria-describedby="feature-dialog-description"
          >
            <button
              type="button"
              className="fs03__dialog-close"
              onClick={() => setSelectedFeature(null)}
              aria-label="Close dialog"
            >
              ×
            </button>
            <p className="fs03__dialog-label">{selectedFeature.id}</p>
            <span className="fs03__dialog-icon" aria-hidden="true">{selectedFeature.icon}</span>
            <h3 id="feature-dialog-title">{selectedFeature.title}</h3>
            <p id="feature-dialog-description">{selectedFeature.detail}</p>
            <button
              type="button"
              className="fs03__dialog-action"
              onClick={() => setSelectedFeature(null)}
            >
              Got it
            </button>
          </section>
        </div>
      )}
    </section>
  );
}
