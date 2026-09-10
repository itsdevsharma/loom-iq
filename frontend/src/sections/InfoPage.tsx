import "../InfoPage.css";
import logo from "../assets/company.logo.webp";

type InfoPageProps = { kind: "privacy" | "terms" | "refunds" };

const pageContent = {
  privacy: {
    title: "Privacy Policy",
    intro: "This policy describes the information used for LoomIQ accounts, demo and trial requests, membership purchases, support, and website analytics.",
    sections: [
      ["Information we collect", "We collect the contact and company details you submit, a password hash for your account, billing address and phone number at checkout, payment references, invoices, and messages you send to support. We store visitor and session identifiers in essential cookies. Card details are handled by Razorpay rather than stored by this website."],
      ["How we use information", "We use this information to authenticate accounts, manage offer eligibility, arrange demos and onboarding, confirm payments, provide invoices, respond to support requests, and protect the service from abuse."],
      ["Service providers and analytics", "Our database, hosting, email, and payment providers process information needed to deliver these services. When you enable optional analytics, Google Analytics receives page views and interaction events. Our custom analytics events do not include your form fields or payment details. You can change your analytics preference on this website."],
      ["Retention and requests", "Account, inquiry, and transaction records are retained to operate the service and maintain payment records. To request access, correction, or deletion, email support@loomiq.com. We may need to verify account ownership and retain records needed for unresolved transactions or applicable recordkeeping obligations."],
      ["Account security", "Keep your password and email account secure. Password reset links expire after 30 minutes and can be used once. Resetting your password invalidates existing login sessions."],
    ],
  },
  terms: {
    title: "Terms of Service",
    intro: "These terms describe website use, account registration, membership checkout, and the onboarding process for LoomIQ.",
    sections: [
      ["Website content", "LoomIQ provides this website and preview content for general informational purposes. Product details, features, and availability may change as our platform evolves."],
      ["Demo requests", "Submitting a demo request does not create a customer relationship, guarantee product access, pricing, or final contract terms unless expressly agreed in writing."],
      ["Accounts", "Provide accurate contact and billing information and keep your login credentials private. Contact support if you suspect unauthorized access. Do not use the website to interfere with other accounts or the operation of the service."],
      ["Membership payments", "Checkout purchases one membership month at the amount displayed before payment. This website does not automatically charge for later months. Additional purchases require a new checkout. Payment confirmation and invoices are available in your account."],
      ["Offer conditions", "The purchase discount lasts 24 hours from the first offer visit and does not renew daily. Trial accounts can use the discount during that window. Payment must complete before the deadline stored for the order; late captured discounted payments are submitted for refund."],
      ["Access and onboarding", "Creating an account or making a payment does not instantly create an ERP workspace. Our team arranges onboarding and provides access after setup. Your account shows progress and a workspace link when access is ready. Contact support to agree on setup and service dates before purchase if timing is essential."],
      ["Support and billing questions", "Contact support@loomiq.com for account, payment, or service questions. The Refund Policy describes cancellation requests and payment issues."],
    ],
  },
  refunds: {
    title: "Refund & Cancellation Policy",
    intro: "This policy explains one-time membership payments, cancellation requests, and payment refunds.",
    sections: [
      ["One-time payments", "Each checkout purchases one membership month. There are no automatic renewals or automatic charges from this website. To purchase another month, complete a new checkout at the displayed price."],
      ["Cancellation", "You do not need to cancel an automatic renewal. For an existing membership, onboarding cancellation, or an access issue, contact support with your account email and order reference so the team can review your request."],
      ["Refunds", "The discounted first-month payment is generally non-refundable after payment. If you believe a payment was made in error or a service issue affected your account, contact support promptly so the request can be reviewed."],
      ["Expired offer payments", "Captured discounted payments completed after their order deadline are submitted to Razorpay for a full refund. A submitted refund may take time to reach your payment method. Contact support with your payment reference if you need a status update."],
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
