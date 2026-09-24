import "../FeaturesSection.css";

const features = [
  { id: "01", icon: "◎", title: "Inventory", description: "Know what stock is available and what is committed.", detail: "Keep materials, work in progress and finished goods in one view." },
  {
    id: "02",
    icon: "↗",
    title: "Production", description: "Follow work from planning to dispatch.", detail: "Keep production updates connected to the order." 
  },
  {
    id: "03",
    icon: "✦",
    title: "Sales", description: "Manage customers, orders and delivery commitments.", detail: "Give every team one current order record." 
  },
  {
    id: "04",
    icon: "▣",
    title: "Billing", description: "Keep invoicing and business records close to sales.", detail: "See the information needed to run your business." 
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="fs03">
      <div className="fs03__inner">
        <div className="fs03__top">
          <div>
            <p className="fs03__badge">Business management modules</p>
            <h2 className="fs03__headline">Ek hi system mein poora business control.</h2>
          </div>
          <p className="fs03__right-text">Inventory, production, sales and billing — the four views a growing textile business needs every day.</p>
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
            <span className="fs03__dots" aria-hidden="true"><i /><i /><i /></span>Built to connect inventory, production, sales and billing</div>
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
