import { useEffect, useState, type FormEvent } from 'react';
import { accountApi } from '../accountApi';
import SupportForm from '../components/SupportForm';
import '../AccountPage.css';

type Account = { customer: { name: string; email: string; company: string }; emailVerified: boolean; trialRequested: boolean; onboarding: string; workspaceUrl: string | null; invoices: { orderId: string; number: string; plan: string; amount: number; issuedAt: number; testMode: boolean }[] };
export default function AccountPage() {
  const [data, setData] = useState<Account | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const base = import.meta.env.BASE_URL;
  useEffect(() => {
    let active = true;
    accountApi<Account>('account/me').then(result => { if (active) setData(result); }).catch(e => {
      if (!active) return;
      if (e.status === 401) window.location.replace(base + 'signup?login=1');
      else setError(e.message);
    });
    return () => { active = false; };
  }, [base, attempt]);
  async function action(path: string, payload: unknown = {}) {
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await accountApi(path, payload);
      if (path === 'account/logout') window.location.assign(base + 'signup?login=1');
      else if (path === 'trial/select') { setMessage('Your trial request is received. Our team will arrange access.'); setAttempt(n => n + 1); }
      else setMessage(result.message);
    } catch (e) { setError(e instanceof Error ? e.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  function requestTrial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void action('trial/select', { acceptConditions: true });
  }
  return <main className="account-page">
    <header><a href={base}>LoomIQ</a><nav aria-label="Account navigation"><a href={base + '#pricing'}>Plans</a><a href="#support">Support</a><button disabled={busy} onClick={() => void action('account/logout')}>Sign out</button></nav></header>
    <h1>{data ? `Welcome, ${data.customer.name}` : 'Your account'}</h1>
    {error && <div role="alert"><p>{error}</p><button onClick={() => { setError(''); setAttempt(n => n + 1); }}>Retry loading account</button></div>}
    {message && <p role="status">{message}</p>}
    {!data && !error && <p role="status">Loading your account…</p>}
    {data && <>
      <section><h2>Account details</h2><p>{data.customer.company}</p><p>{data.customer.email}</p>
        <p>{data.emailVerified ? 'Email verified' : 'Your email has not been verified.'}</p>
        {!data.emailVerified && <button disabled={busy} onClick={() => void action('account/send-verification')}>Send verification email</button>}
        <p><a href={base + 'forgot-password'}>Reset password</a></p>
      </section>
      <section><h2>Your workspace</h2>
        <p>{data.onboarding === 'active' ? 'Your workspace is ready.' : data.onboarding === 'in-progress' ? 'Our team is setting up your workspace.' : data.onboarding === 'requested' ? 'Your request is received. Our team will contact you to arrange access.' : 'Book a demo to discuss your setup, or choose a membership.'}</p>
        {data.workspaceUrl ? <a className="button button-primary" href={data.workspaceUrl} rel="noreferrer">Open workspace</a> : <a href={base + '#demo'}>Book a demo</a>}
        <p>Membership purchases are one-time payments. There are no automatic charges.</p>
        {!data.trialRequested && !data.invoices.length && data.onboarding !== 'active' && <form onSubmit={requestTrial}>
          <h3>Request a 7-day trial</h3>
          <p>Our team arranges trial access after discussing your setup. No payment is required. Your purchase discount still expires at its original 24-hour deadline.</p>
          <label className="account-check"><input type="checkbox" required disabled={busy} />I agree to the trial conditions and understand that access is arranged by the team.</label>
          <button disabled={busy} type="submit">Request trial access</button>
        </form>}
      </section>
      <section><h2>Payments & invoices</h2>
        {!data.invoices.length ? <p>No confirmed payments yet. <a href={base + 'payment'}>Review plans</a></p> : <ul className="account-invoices">{data.invoices.map(invoice => <li key={invoice.orderId}>
          <h3>{invoice.plan} {invoice.testMode && <span>— Test payment</span>}</h3>
          <p>{new Date(invoice.issuedAt).toLocaleDateString('en-IN')} · INR {(invoice.amount / 100).toLocaleString('en-IN')} · {invoice.number}</p>
          <a href={`${import.meta.env.VITE_API_URL ?? ''}/api/purchase/invoice/${encodeURIComponent(invoice.orderId)}`} target="_blank" rel="noreferrer">View / save invoice</a>
          <button disabled={busy || !data.emailVerified} onClick={() => void action(`account/invoices/${encodeURIComponent(invoice.orderId)}/email`)}>Email invoice</button>
        </li>)}</ul>}
        {!data.emailVerified && data.invoices.length > 0 && <p>Verify your email to receive invoice emails.</p>}
      </section>
    </>}
    <SupportForm />
    <footer><a href={base + 'privacy'}>Privacy</a><a href={base + 'terms'}>Terms</a><a href={base + 'refunds'}>Refund policy</a></footer>
  </main>;
}
