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
    fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/purchase/receipt${order ? '/' + encodeURIComponent(order) : ''}`, { credentials: 'include', signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(response.status === 401 ? 'Sign in with your purchasing account to view your invoice.' : 'Your payment confirmation is not available yet. If you completed payment, retry shortly or contact support before paying again.'); return response.json(); })
      .then(setReceipt).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [purchase, order, attempt]);
  const confirmed = !purchase || Boolean(receipt);
  return <main className="confirmation-page">
    <header className="confirmation-header"><a href={base} className="confirmation-brand"><img src={logo} alt="" />Loom<span>IQ</span></a><a href="#support">Need a hand? Contact support ↗</a></header>
    <div className="confirmation-layout"><section className={`confirmation-card${receipt ? ' confirmation-card--receipt' : ''}`}>
      <div className="confirmation-intro">
        <span className="confirmation-check" aria-hidden="true">{confirmed ? '✓' : '…'}</span>
        <p className="confirmation-eyebrow">{purchase ? receipt?.testMode ? 'Test payment complete' : receipt ? 'Payment confirmed' : 'Checking your payment' : 'Request received'}</p>
        <h1>{purchase ? receipt ? 'You’re one step closer to better work.' : 'Let’s confirm your purchase.' : trial ? 'Your next chapter starts here.' : 'Let’s build a clearer workflow.'}</h1>
        <p className="confirmation-lead">{purchase ? receipt ? `Thank you${receipt.customer.name ? ', ' + receipt.customer.name : ''}. Your LoomIQ ${receipt.plan} payment is confirmed. We’ll help you get started.` : 'We’re retrieving your payment details and invoice securely.' : trial ? 'Your trial request is with our team. We’ll get in touch to arrange your access.' : 'Your demo request is received. Our team will contact you to arrange a personalized demo, then help you decide whether trial access or a paid plan fits your needs.'}</p>
        {receipt?.testMode && <p className="confirmation-test">Test Mode · No real money was charged.</p>}
      </div>
      {error && <div className="confirmation-error" role="alert"><p>{error}</p><button onClick={() => { setError(''); setAttempt(value => value + 1); }}>Check again</button><a href={base + 'signup'}>Sign in</a></div>}
      {receipt && <section className="confirmation-receipt" aria-label="Payment summary">
        <div className="confirmation-receipt-heading"><div><span className="confirmation-eyebrow">Your membership</span><h2>LoomIQ {receipt.plan}</h2><p>First month · One-time payment</p></div><div className="confirmation-amount"><small>{receipt.testMode ? 'Test amount' : 'Amount paid'}</small><strong>₹{(receipt.amount / 100).toLocaleString('en-IN')}</strong></div></div>
        <dl><div><dt>Invoice number</dt><dd>{receipt.number}</dd></div><div><dt>Payment date</dt><dd>{new Date(receipt.issuedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</dd></div><div><dt>Billed to</dt><dd>{receipt.customer.company || receipt.customer.name}</dd></div><div><dt>Payment reference</dt><dd>{receipt.paymentId}</dd></div></dl>
        <div className="confirmation-invoice-action"><a className="confirmation-primary" href={`${import.meta.env.VITE_API_URL ?? ''}/api/purchase/invoice/${encodeURIComponent(receipt.orderId)}`} target="_blank" rel="noreferrer">View & save invoice <span aria-hidden="true">↗</span></a><span>Print or save as PDF from your browser.</span></div>
      </section>}
      {confirmed && <section className="confirmation-next"><h2>What happens next</h2><div className="confirmation-steps"><article><span>01</span><h3>We connect</h3><p>Our team reaches out to understand your operation and goals.</p></article><article><span>02</span><h3>We plan your setup</h3><p>Walk through your workflows and agree on the next steps together.</p></article><article><span>03</span><h3>You get started</h3><p>Get guidance as you begin bringing your work into LoomIQ.</p></article></div></section>}
      <div className="confirmation-bottom"><a href={base}>← Back to LoomIQ</a><span>Questions? <a href="#support">We’re here to help.</a></span></div>
    </section>
    <SupportForm /></div><footer className="confirmation-footer">LoomIQ · Built around the way your business works.<nav><a href={base + 'account'}>My account & invoices</a><a href={base + 'privacy'}>Privacy</a><a href={base + 'terms'}>Terms</a></nav></footer>
  </main>;
}
