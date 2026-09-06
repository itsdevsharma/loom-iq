import "../InfoPage.css";

function ThankYouPage() {
  return (
    <main className="info-page thank-you-page">
      <p className="eyebrow">LoomIQ</p>
      <h1>Your demo request has been received.</h1>
      <p className="info-page-intro">Thanks for your interest. Our team will review your request and get in touch.</p>
      <a className="button button-primary" href={`${import.meta.env.BASE_URL}`}>Back to Home</a>
    </main>
  );
}

export default ThankYouPage;