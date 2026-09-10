import "../TrustSection.css";

const trustItems = [
  { title: "Protected accounts", description: "Password-protected accounts with email verification and secure password recovery." },
  { title: "Verified payments", description: "Payment confirmation is checked with Razorpay before an invoice is issued." },
  { title: "Private invoices", description: "Sign in to view your own payment history and save your invoices." },
  { title: "Guided onboarding", description: "Track your setup and open your workspace when our team has arranged access." },
];

function TrustSection() {
  return (
    <section id="trust" className="section section-shell section-trust">
      <div className="trust-inner">
        <div className="section-heading">
          <p className="eyebrow">Trust & security</p>
          <h2>Built for controlled, traceable operations.</h2>
          <p>
            Production, inventory, quality, and finance records need clear ownership.
            LoomIQ supports controlled access and reliable records across your operation.
          </p>
        </div>

        <div className="trust-grid">
          {trustItems.map((item) => (
            <article key={item.title} className="trust-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>

        <p className="trust-disclaimer">
          Specific compliance certifications vary by deployment. Contact us for
          details relevant to your business.
        </p>
      </div>
    </section>
  );
}

export default TrustSection;
