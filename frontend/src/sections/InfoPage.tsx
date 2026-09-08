import "../InfoPage.css";
import logo from "../assets/company.logo.webp";

type InfoPageProps = { kind: "privacy" | "terms" | "refunds" };

const pageContent = {
  privacy: {
    title: "Privacy Policy",
    intro: "LoomIQ collects and uses information only to support business inquiries, product conversations, and the operation of this website.",
    sections: [
      ["Information we collect", "When you request a demo, we may collect your name, work email, company, and the business type or workflow information you provide to help us understand your requirements."],
      ["How we use information", "We use the information you submit to respond to your enquiry, prepare a relevant walkthrough, and improve the way we explain our ERP platform and services."],
      ["Your choices", "If you need to review, update, or request removal of information submitted through this site, contact the LoomIQ team using the details available on the website or through your account contact."],
    ],
  },
  terms: {
    title: "Terms of Service",
    intro: "These terms explain how this website and its information should be used and clarify that demo requests are for evaluation and discussion rather than a binding contract.",
    sections: [
      ["Website content", "LoomIQ provides this website and preview content for general informational purposes. Product details, features, and availability may change as our platform evolves."],
      ["Demo requests", "Submitting a demo request does not create a customer relationship, guarantee product access, pricing, or final contract terms unless expressly agreed in writing."],
      ["Legal review", "This page is a general informational notice and should be reviewed by qualified legal counsel before being treated as a final commercial agreement for a specific jurisdiction."],
    ],
  },
  refunds: {
    title: "Refund & Cancellation Policy",
    intro: "This policy explains monthly renewal, cancellation, access, and refund expectations for LoomIQ memberships.",
    sections: [
      ["Monthly renewal", "Memberships renew automatically each month at the recurring price shown at checkout unless cancelled before the next renewal date."],
      ["Cancellation", "You can request cancellation by contacting LoomIQ support before the next renewal. Cancellation prevents the next charge; access normally continues until the end of the paid billing period."],
      ["Refunds", "The discounted first-month payment is generally non-refundable after payment. If you believe a payment was made in error or a service issue affected your account, contact support promptly so the request can be reviewed."],
      ["Support", "For cancellation or billing help, email support@loomiq.com with your account email and company name."],
    ],
  },
} as const;

function InfoPage({ kind }: InfoPageProps) {
  const content = pageContent[kind];

  const base = import.meta.env.BASE_URL;
  const sectionId = (index: number) => `section-${index + 1}`;

  return (
    <div className="legal-page">
      <header className="legal-header">
        <a className="legal-brand" href={base}><img src={logo} alt="" width="32" height="32" /><span>LoomIQ</span></a>
        <a className="legal-home" href={base}>Back to website <span aria-hidden="true">↗</span></a>
      </header>
      <main className="legal-main">
        <nav className="legal-breadcrumb" aria-label="Breadcrumb"><a href={base}>Home</a><span aria-hidden="true">/</span><span aria-current="page">{content.title}</span></nav>
        <div className="legal-title">
          <p className="legal-eyebrow">LEGAL INFORMATION</p>
          <h1>{content.title}</h1>
          <p>{content.intro}</p>
        </div>
        <div className="legal-layout">
          <aside className="legal-sidebar">
            <nav aria-label="On this page">
              <p className="legal-nav-label">ON THIS PAGE</p>
              <ol>{content.sections.map(([heading], index) => <li key={heading}><a href={`#${sectionId(index)}`}><span>{String(index + 1).padStart(2, "0")}</span>{heading}</a></li>)}</ol>
            </nav>
            <div className="legal-help"><strong>Questions about this policy?</strong><p>Contact our team for clarification.</p><a href="mailto:support@loomiq.com">support@loomiq.com</a></div>
          </aside>
          <article className="legal-document" aria-label={content.title}>
            {content.sections.map(([heading, body], index) => (
              <section key={heading} id={sectionId(index)} aria-labelledby={`${sectionId(index)}-heading`}>
                <span className="legal-section-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div><h2 id={`${sectionId(index)}-heading`}>{heading}</h2><p>{body}</p></div>
              </section>
            ))}
            <div className="legal-document-contact"><h2>Contact LoomIQ</h2><p>For questions regarding {kind === "terms" ? "these terms" : "this policy"}, please email <a href="mailto:support@loomiq.com">support@loomiq.com</a>.</p></div>
          </article>
        </div>
      </main>
      <footer className="legal-footer"><span>© {new Date().getFullYear()} LoomIQ. All rights reserved.</span><nav aria-label="Legal pages">{([['privacy', 'Privacy Policy'], ['terms', 'Terms of Service'], ['refunds', 'Refund Policy']] as const).map(([route, label]) => <a key={route} href={base + route} aria-current={kind === route ? 'page' : undefined}>{label}</a>)}</nav></footer>
    </div>
  );
}

export default InfoPage;
