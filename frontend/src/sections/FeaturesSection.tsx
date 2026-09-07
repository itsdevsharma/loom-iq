import "../FeaturesSection.css";

const features = [
  {
    id: "01",
    icon: "◎",
    title: "Orders & customers",
    description: "Capture buyer requirements, product specifications, quantities, and promised delivery dates in one place.",
    detail: "Keep enquiries, quotations, order revisions, approvals, and customer communication tied to the order your teams are producing.",
  },
  {
    id: "02",
    icon: "↗",
    title: "Material planning",
    description: "Plan yarn, fabric, trims, dyes, and packaging against confirmed orders and production requirements.",
    detail: "See what is available, what must be purchased, and what is already committed before production starts.",
  },
  {
    id: "03",
    icon: "✦",
    title: "Stores & inventory",
    description: "Track raw materials, work in progress, rolls, batches, and finished goods across locations.",
    detail: "Record receipts, issues, transfers, returns, wastage, and stock adjustments with the detail your stores team needs.",
  },
  {
    id: "04",
    icon: "▣",
    title: "Finance & costing",
    description: "Connect purchases, production costs, invoices, receivables, and order profitability.",
    detail: "Give accounts a current view of material costs, wastage, expenses, customer billing, collections, and margins.",
  },
  {
    id: "05",
    icon: "⌘",
    title: "Production & quality",
    description: "Move work orders through planning, processing, inspection, finishing, and approval.",
    detail: "Track quantities, stages, machine or job progress, rejected material, rework, and quality outcomes before dispatch.",
  },
  {
    id: "06",
    icon: "▥",
    title: "Dispatch & reporting",
    description: "See order status, production performance, stock position, delivery commitments, and margins together.",
    detail: "Move from a management view into the order, batch, purchase, or production record behind every number.",
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="fs03">
      <div className="fs03__inner">
        <div className="fs03__top">
          <div>
            <p className="fs03__badge">Business management modules</p>
            <h2 className="fs03__headline">
              From customer order to production, stock, and dispatch
            </h2>
          </div>
          <p className="fs03__right-text">
            LoomIQ connects the commercial, operational, and financial records teams rely on every day.
            Plan, produce, inspect, account for, and dispatch from one shared operating view.
          </p>
        </div>

        <div className="fs03__grid">
          {features.map((feature) => (
            <article className="fs03__card" key={feature.id}>
              <p className="fs03__card-num">{feature.id}</p>
              <h3 className="fs03__card-title">{feature.title}</h3>
              <p className="fs03__card-body">{feature.description}</p>
              <p className="fs03__card-detail">{feature.detail}</p>
            </article>
          ))}
        </div>

        <div className="fs03__sep" />
        <div className="fs03__bottom">
          <div className="fs03__trust">
            <span className="fs03__dots" aria-hidden="true"><i /><i /><i /></span>
            Built to connect order, material, production, quality, and dispatch
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
