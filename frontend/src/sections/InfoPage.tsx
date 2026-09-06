import "../InfoPage.css";

type InfoPageProps = { kind: "privacy" | "terms" };

const pageContent = {
  privacy: {
    title: "Privacy policy",
    intro: "This placeholder policy needs review and completion before LoomIQ is launched publicly.",
    sections: [
      ["Information we collect", "When you request a demo, we collect the name, work email, company, and optional business type you submit."],
      ["How we use information", "We use demo request information to respond to your enquiry, prepare a relevant walkthrough, and improve our services."],
      ["Your choices", "Contact the LoomIQ team to request access, correction, or deletion of information submitted through this site."],
    ],
  },
  terms: {
    title: "Terms of use",
    intro: "These placeholder terms need legal review and completion before LoomIQ is launched publicly.",
    sections: [
      ["Website content", "LoomIQ provides this website and its preview content for general informational purposes. Product availability and functionality may change."],
      ["Demo requests", "Submitting a demo request does not create a customer relationship or guarantee product access, pricing, or availability."],
      ["Legal review", "This page is not a complete legal agreement. Obtain jurisdiction-specific legal advice before publishing it as final terms."],
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