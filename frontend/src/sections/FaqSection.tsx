const faqs = [
  {
    question: "Is LoomIQ suitable for small teams?",
    answer:
      "Absolutely. LoomIQ is built with small and growing teams in mind. The Starter plan is ideal for startups, small businesses, and early-stage teams that need a professional CRM and ERP solution without the complexity or cost of enterprise software. It helps teams centralize customer data, manage sales pipelines, track leads, organize daily operations, and automate routine workflows from a single platform. As your business grows, LoomIQ scales with you, allowing you to add users, features, and modules without disrupting your existing processes. This means you can start small, improve productivity from day one, and continue using the same platform as your team and business expand."
  },
  {
    question: "Can it integrate with my current tools?",
    answer:
      "Yes. LoomIQ is designed to fit seamlessly into your existing workflow rather than replace everything at once. It can integrate with a wide range of commonly used productivity, payment, communication, and marketing tools, helping you keep your data synchronized across platforms.Whether you're managing customer communication, processing payments, tracking leads, or collaborating with your team, LoomIQ reduces manual data entry and streamlines your operations through integrations and APIs. If you have specific business software or custom systems, our team can also help explore tailored integration solutions to ensure a smooth transition",
  },
  {
    question: "Do you offer onboarding support?",
    answer:
      "Yes. Every paid LoomIQ plan includes onboarding assistance to help your team get up and running quickly. Our onboarding process covers account setup, system configuration, data migration guidance, and product walkthroughs to ensure a smooth transition. We also provide training sessions for your team to familiarize them with the platform's features and best practices. Our support team is available to answer questions, troubleshoot issues, and provide ongoing assistance as your team adapts to the new system. We aim to make the onboarding experience as seamless as possible so you can start benefiting from LoomIQ's capabilities right away.",
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
