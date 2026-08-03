const faqs = [
  {
    question: "Is LoomIQ suitable for small teams?",
    answer:
      "Yes. The Starter plan is designed for early-stage teams that want a polished operating system quickly.",
  },
  {
    question: "Can it integrate with my current tools?",
    answer:
      "Absolutely. LoomIQ connects with common productivity, payments, and marketing platforms.",
  },
  {
    question: "Do you offer onboarding support?",
    answer:
      "Yes, every paid plan includes onboarding help and training resources.",
  },
];

function FaqSection() {
  return (
    <section id="faq" className="section section-shell section-faq">
      <div className="section-heading">
        <p className="eyebrow">FAQs</p>
        <h2>Common questions before you get started.</h2>
      </div>
      <div className="faq-list">
        {faqs.map((faq) => (
          <details key={faq.question} className="faq-item">
            <summary>{faq.question}</summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export default FaqSection;
