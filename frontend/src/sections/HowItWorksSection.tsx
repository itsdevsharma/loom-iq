import "../HowItWorksSection.css";

const steps = [
  { number: "01", title: "Choose your plan", description: "Pick the plan that fits your business." },
  {
    number: "02",
    title: "Create your account", description: "Set up a secure LoomIQ account in a few details.",
  },
  {
    number: "03", title: "Complete payment", description: "Pay securely through Razorpay with the shown price.",
  },
  { number: "04", title: "Start managing your business", description: "Continue with guided onboarding for your business." 
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="section section-shell section-how">
      <div className="section-heading">
        <p className="eyebrow">How it works</p>
        <h2>From plan selection to your LoomIQ account.</h2>
      </div>

      <div className="how-grid">
        {steps.map((step) => (
          <article key={step.number} className="how-card">
            <span className="how-number">{step.number}</span>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default HowItWorksSection;
