const faqs = [
  {
    question: "Is LoomIQ built for cloth manufacturers?",
    answer:
      "Yes. LoomIQ is designed for fabric mills, dyeing and processing units, garment manufacturers, home-textile businesses, and textile traders that need commercial, factory, stores, and finance data connected."
  },
  {
    question: "Can it handle raw material and finished goods inventory?",
    answer:
      "Yes. You can manage yarn, fabric, trims, dyes, chemicals, packaging, work in progress, rolls, batches, and finished goods across stores and locations."
  },
  {
    question: "Can we track production and quality stages?",
    answer:
      "Yes. The workflow can cover material issue, production stages, dyeing or finishing, inspection, rejection, rework, approval, and dispatch. The exact setup depends on your process."
  },
  {
    question: "Can LoomIQ show the cost and margin of an order?",
    answer:
      "LoomIQ is designed to connect material, purchase, wastage, production, dispatch, and finance records so your team can review the cost and margin behind an order."
  },
  {
    question: "Can it support multiple stores or manufacturing units?",
    answer:
      "The platform supports location-based stock and workflows. Multi-unit and multi-company requirements can be configured with the appropriate permissions, approvals, and reporting."
  },
];

function FaqSection() {
  return (
    <section id="faq" className="section section-shell section-faq">
      <div className="section-heading">
        <p className="eyebrow">FAQs</p>
        <h2>Questions textile teams ask before changing systems.</h2>
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
