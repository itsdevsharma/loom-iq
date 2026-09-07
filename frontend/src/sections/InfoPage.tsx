import "../InfoPage.css";

type InfoPageProps = { kind: "privacy" | "terms" };

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
} as const;

function InfoPage({ kind }: InfoPageProps) {
  const content = pageContent[kind];

  return (
    <main className="info-page">
      <a className="info-page-back" href={`${import.meta.env.BASE_URL}`}>Back to LoomIQ</a>
      <p className="eyebrow">LoomIQ</p>
      <h1>{content.title}</h1>
      <p className="info-page-intro">{content.intro}</p>
      {content.sections.map(([heading, body]) => (
        <section key={heading}>
          <h2>{heading}</h2>
          <p>{body}</p>
        </section>
      ))}
    </main>
  );
}

export default InfoPage;