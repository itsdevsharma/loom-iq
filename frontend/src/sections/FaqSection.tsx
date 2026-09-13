import '../FaqSection.css';
import { cmsValue } from '../websiteContent';
const faqs = cmsValue("FaqSection.1", [
  {
    question: "What happens after I request a demo?",
    answer: "Our team contacts you to arrange a personalized demo around your workflow. We then discuss the appropriate modules, setup requirements, and whether trial access or a paid plan fits. You do not need an account or payment to request a demo."
  },
  {
    question: "What do the subscription prices cover?",
    answer: "The prices cover the software modules listed in each plan and onboarding support. We confirm user and location limits, migration, customization, integrations, and applicable taxes for your requirements before you commit. Trial and direct-purchase conditions are available in the pricing section without registration."
  },
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
]);

function FaqSection() {
  return (
    <section id="faq" className="section section-shell section-faq">
      <details className="faq-disclosure">
      <summary className="faq-disclosure-summary">
      <div className="faq-disclosure-heading">
        <p className="eyebrow">{cmsValue("FaqSection.2", "FAQs")}</p>
        <h2>{cmsValue("FaqSection.3", "Questions textile teams ask before changing systems.")}</h2>
        <p className="faq-disclosure-description">Pricing, payments, setup, and support — find the answers here.</p>
      </div>
      <span className="faq-disclosure-action"><span className="faq-disclosure-show">View FAQs</span><span className="faq-disclosure-hide">Close FAQs</span><span className="faq-disclosure-icon" aria-hidden="true">+</span></span>
      </summary>
      <div className="faq-list">
        {faqs.map((faq) => (
          <details key={faq.question} className="faq-item">
            <summary>{faq.question}</summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
      </details>
    </section>
  );
}

export default FaqSection;
