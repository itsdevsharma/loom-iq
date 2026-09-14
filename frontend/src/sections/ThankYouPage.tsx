import { trackVerifiedPurchase } from '../analytics';
import { cmsTemplate, cmsValue } from '../websiteContent';
import SupportForm from '../components/SupportForm';
import { useEffect, useState } from 'react';
import logo from '../assets/company.logo.webp';
import '../ThankYouPage.css';
type Receipt = { number: string; orderId: string; paymentId: string; issuedAt: number; plan: string; amount: number; testMode: boolean; customer: { name: string; email: string; company: string } };
export default function ThankYouPage() {
  const query = new URLSearchParams(window.location.search);
  const purchase = query.get('type') === 'purchase';
  const trial = query.get('type') === 'trial';
  const order = query.get('order');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const base = import.meta.env.BASE_URL;
  useEffect(() => {
    if (!purchase) return;
    const controller = new AbortController();
    fetch(`${import.meta.env.PUBLIC_API_URL ?? ''}/api/purchase/receipt${order ? '/' + encodeURIComponent(order) : ''}`, { credentials: 'include', signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(response.status === 401 ? 'Sign in with your purchasing account to view your invoice.' : 'Your payment confirmation is not available yet. If you completed payment, retry shortly or contact support before paying again.'); return response.json(); })
      .then(setReceipt).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [purchase, order, attempt]);
  useEffect(() => {
    if (!receipt || receipt.testMode) return;
    const track = () => { void trackVerifiedPurchase(receipt.orderId).catch(() => {}); };
    track(); window.addEventListener('loomiq-analytics-ready', track);
    return () => window.removeEventListener('loomiq-analytics-ready', track);
  }, [receipt]);
  const confirmed = !purchase || Boolean(receipt);
  return <main className="confirmation-page">
    <header className="confirmation-header"><a href={base} className="confirmation-brand"><img src={cmsValue("ThankYouPage.1", logo)} alt="" />{cmsValue("ThankYouPage.2", "Loom")}<span>{cmsValue("ThankYouPage.3", "IQ")}</span></a><a href={cmsValue("ThankYouPage.4", "#support")}>{cmsValue("ThankYouPage.5", "Need a hand? Contact support ↗")}</a></header>
    <div className="confirmation-layout"><section className={`confirmation-card${receipt ? " confirmation-card--receipt" : ''}`}>
      <div className="confirmation-intro">
        <span className="confirmation-check" aria-hidden="true">{confirmed ? '✓' : '…'}</span>
        <p className="confirmation-eyebrow">{purchase ? receipt?.testMode ? cmsValue("ThankYouPage.7", "Test payment complete") : receipt ? cmsValue("ThankYouPage.8", "Payment confirmed") : cmsValue("ThankYouPage.9", "Checking your payment") : cmsValue("ThankYouPage.10", "Request received")}</p>
        <h1>{purchase ? receipt ? cmsValue("ThankYouPage.credentialsTitle", "Your LoomIQ ERP login credentials are being created.") : cmsValue("ThankYouPage.12", "Let’s confirm your purchase.") : trial ? cmsValue("ThankYouPage.13", "Your next chapter starts here.") : cmsValue("ThankYouPage.14", "Let’s build a clearer workflow.")}</h1>
        <p className="confirmation-lead">{purchase ? receipt ? cmsTemplate("ThankYouPage.credentialsLead", "Thank you{0}. Your LoomIQ {1} payment is confirmed. We’ll send your ERP login credentials to {2} by email.", [receipt.customer.name ? ', ' + receipt.customer.name : '', receipt.plan, receipt.customer.email]) : cmsValue("ThankYouPage.15", "We’re retrieving your payment details and invoice securely.") : trial ? cmsValue("ThankYouPage.16", "Your trial request is with our team. We’ll get in touch to arrange your access.") : cmsValue("ThankYouPage.17", "Your demo request is received. Our team will contact you to arrange a personalized demo, then help you decide whether trial access or a paid plan fits your needs.")}</p>
        {receipt && <div className="confirmation-credentials-help">
          <p>{cmsValue("ThankYouPage.credentialsHelp", "Haven’t received your credentials? Check your spam or junk folder, then contact us for help.")}</p>
          <a href="#support">{cmsValue("ThankYouPage.credentialsContact", "Contact us")}</a>
          <a href="mailto:support@loomiq.com">{cmsValue("ThankYouPage.credentialsEmail", "Email support@loomiq.com")}</a>
        </div>}
        {receipt?.testMode && <p className="confirmation-test">{cmsValue("ThankYouPage.18", "Test Mode · No real money was charged.")}</p>}
      </div>
      {error && <div className="confirmation-error" role="alert"><p>{error}</p><button onClick={() => { setError(''); setAttempt(value => value + 1); }}>{cmsValue("ThankYouPage.19", "Check again")}</button><a href={base + 'signup'}>{cmsValue("ThankYouPage.20", "Sign in")}</a></div>}
      {receipt && <section className="confirmation-receipt" aria-label={cmsValue("ThankYouPage.21", "Payment summary")}>
        <div className="confirmation-receipt-heading"><div><span className="confirmation-eyebrow">{cmsValue("ThankYouPage.22", "Your membership")}</span><h2>{cmsValue("ThankYouPage.23", "LoomIQ ")}{receipt.plan}</h2><p>{cmsValue("ThankYouPage.24", "First month · One-time payment")}</p></div><div className="confirmation-amount"><small>{receipt.testMode ? cmsValue("ThankYouPage.25", "Test amount") : cmsValue("ThankYouPage.26", "Amount paid")}</small><strong>₹{(receipt.amount / 100).toLocaleString('en-IN')}</strong></div></div>
        <dl><div><dt>{cmsValue("ThankYouPage.27", "Invoice number")}</dt><dd>{receipt.number}</dd></div><div><dt>{cmsValue("ThankYouPage.28", "Payment date")}</dt><dd>{new Date(receipt.issuedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</dd></div><div><dt>{cmsValue("ThankYouPage.29", "Billed to")}</dt><dd>{receipt.customer.company || receipt.customer.name}</dd></div><div><dt>{cmsValue("ThankYouPage.30", "Payment reference")}</dt><dd>{receipt.paymentId}</dd></div></dl>
        <div className="confirmation-invoice-action"><a className="confirmation-primary" href={`${import.meta.env.PUBLIC_API_URL ?? ''}/api/purchase/invoice/${encodeURIComponent(receipt.orderId)}`} target="_blank" rel="noreferrer">{cmsValue("ThankYouPage.31", "View & save invoice ")}<span aria-hidden="true">↗</span></a><span>{cmsValue("ThankYouPage.pdfHelp", "Your PDF invoice is ready to open, save, or print.")}</span></div>
      </section>}
      {confirmed && !purchase && <section className="confirmation-next"><h2>{cmsValue("ThankYouPage.33", "What happens next")}</h2><div className="confirmation-steps"><article><span>01</span><h3>{cmsValue("ThankYouPage.34", "We connect")}</h3><p>{cmsValue("ThankYouPage.35", "Our team reaches out to understand your operation and goals.")}</p></article><article><span>02</span><h3>{cmsValue("ThankYouPage.36", "We plan your setup")}</h3><p>{cmsValue("ThankYouPage.37", "Walk through your workflows and agree on the next steps together.")}</p></article><article><span>03</span><h3>{cmsValue("ThankYouPage.38", "You get started")}</h3><p>{cmsValue("ThankYouPage.39", "Get guidance as you begin bringing your work into LoomIQ.")}</p></article></div></section>}
      <div className="confirmation-bottom"><a href={base}>{cmsValue("ThankYouPage.40", "← Back to LoomIQ")}</a><span>{cmsValue("ThankYouPage.41", "Questions? ")}<a href={cmsValue("ThankYouPage.42", "#support")}>{cmsValue("ThankYouPage.43", "We’re here to help.")}</a></span></div>
    </section>
    <SupportForm /></div><footer className="confirmation-footer">{cmsValue("ThankYouPage.44", "LoomIQ · Built around the way your business works.")}<nav><a href={base + 'account'}>{cmsValue("ThankYouPage.45", "My account & invoices")}</a><a href={base + 'privacy'}>{cmsValue("ThankYouPage.46", "Privacy")}</a><a href={base + 'terms'}>{cmsValue("ThankYouPage.47", "Terms")}</a></nav></footer>
  </main>;
}
