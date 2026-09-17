import { cmsTemplate, cmsValue } from '../websiteContent';
import { useEffect, useState, type FormEvent } from 'react';
import { accountApi } from '../accountApi';
import SupportForm from '../components/SupportForm';
import '../AccountPage.css';

type Account = { customer: { name: string; email: string; company: string }; emailVerified: boolean; trialRequested: boolean; onboarding: string; workspaceUrl: string | null; invoices: { orderId: string; number: string; plan: string; amount: number; issuedAt: number; testMode: boolean }[] };
export default function AccountPage() {
  const [data, setData] = useState<Account | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [verificationCode, setVerificationCode] = useState('');
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
    setBusy(true); setActionError(''); setMessage('');
    try {
      const result = await accountApi(path, payload);
      if (path === 'account/logout') window.location.assign(base + 'signup?login=1');
      else if (path === 'trial/select') { setMessage(cmsValue("AccountPage.extra38", "Your trial request is received. Our team will arrange access.")); setAttempt(n => n + 1); }
      else { setMessage(result.message); if (path === 'account/verify-email') { setVerificationCode(''); setAttempt(n => n + 1); } }
    } catch (e) { setActionError(e instanceof Error ? e.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  function verifyEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (data) void action('account/verify-email', { email: data.customer.email, token: verificationCode });
  }
  return <main className="account-page">
    <header><a href={base}>{cmsValue("AccountPage.1", "LoomIQ")}</a><nav aria-label={cmsValue("AccountPage.2", "Account navigation")}><a href={base + '#pricing'}>{cmsValue("AccountPage.3", "Plans")}</a><a href={cmsValue("AccountPage.4", "#support")}>{cmsValue("AccountPage.5", "Support")}</a><button disabled={busy} onClick={() => void action('account/logout')}>{cmsValue("AccountPage.6", "Sign out")}</button></nav></header>
    <div className="account-hero"><div><p className="account-eyebrow">Account overview</p><h1>{data ? cmsTemplate("AccountPage.extra39", "Welcome, {0}", [data.customer.name]) : cmsValue("AccountPage.7", "Your account")}</h1><p>Manage your workspace, account access, and billing in one place.</p></div>{data && <div className={`account-verification ${data.emailVerified ? 'is-verified' : ''}`}><span className="account-status-dot" aria-hidden="true" />{data.emailVerified ? cmsValue("AccountPage.11", "Email verified") : cmsValue("AccountPage.12", "Your email has not been verified.")}</div>}</div>
    {error && <div role="alert"><p>{error}</p><button onClick={() => { setError(''); setAttempt(n => n + 1); }}>{cmsValue("AccountPage.8", "Retry loading account")}</button></div>}
    {actionError && <div role="alert"><p>{actionError}</p></div>}
    {message && <p role="status">{message}</p>}
    {!data && !error && <p role="status">{cmsValue("AccountPage.9", "Loading your account…")}</p>}
    {data && <>
      <div className="account-dashboard"><section className="account-card account-profile"><div className="account-card-heading"><div><p className="account-eyebrow">Profile</p><h2>{cmsValue("AccountPage.10", "Account details")}</h2></div><span className="account-avatar" aria-hidden="true">{data.customer.name.slice(0, 1).toUpperCase()}</span></div><dl className="account-details"><div><dt>Company</dt><dd>{data.customer.company}</dd></div><div><dt>Email address</dt><dd>{data.customer.email}</dd></div></dl>
        {!data.emailVerified && <div className="account-otp"><button disabled={busy} onClick={() => void action('account/send-verification')}>{cmsValue("AccountPage.13", "Send verification email")}</button><form onSubmit={verifyEmail}><label>Verification code<input value={verificationCode} onChange={event => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code" required pattern="[0-9]{6}" /></label><button disabled={busy || verificationCode.length !== 6} type="submit">Verify email</button></form></div>}
        <a className="account-text-action" href={base + 'forgot-password'}>{cmsValue("AccountPage.14", "Reset password")}</a>
      </section>
      <section className="account-card account-workspace"><p className="account-eyebrow">Workspace</p><h2>{cmsValue("AccountPage.15", "Your workspace")}</h2>
        <p>{data.onboarding === 'active' ? cmsValue("AccountPage.16", "Your workspace is ready.") : data.onboarding === 'in-progress' ? cmsValue("AccountPage.17", "Your workspace is being activated.") : data.onboarding === 'requested' ? cmsValue("AccountPage.18", "Your request is being prepared.") : 'Start a private three-hour LoomIQ ERP demo, then activate the same workspace when you are ready.'}</p>
        {data.workspaceUrl ? <a className="button button-primary" href={data.workspaceUrl} rel="noreferrer">{cmsValue("AccountPage.20", "Open workspace")}</a> : <a href={base + 'demo'}>{cmsValue("AccountPage.21", "Start 3-hour demo")}</a>}
        <p>{cmsValue("AccountPage.22", "Membership purchases are one-time payments. There are no automatic charges.")}</p>
      </section></div>
      <section className="account-card account-billing"><div className="account-card-heading"><div><p className="account-eyebrow">Billing</p><h2>{cmsValue("AccountPage.27", "Payments & invoices")}</h2></div>{data.invoices.length > 0 && <span className="account-count">{data.invoices.length}</span>}</div>
        {!data.invoices.length ? <p>{cmsValue("AccountPage.28", "No confirmed payments yet. ")}<a href={base + 'payment'}>{cmsValue("AccountPage.29", "Review plans")}</a></p> : <ul className="account-invoices">{data.invoices.map(invoice => <li key={invoice.orderId}>
          <h3>{invoice.plan} {invoice.testMode && <span>{cmsValue("AccountPage.30", "— Test payment")}</span>}</h3>
          <p>{new Date(invoice.issuedAt).toLocaleDateString('en-IN')}{cmsValue("AccountPage.31", " · INR ")}{(invoice.amount / 100).toLocaleString('en-IN')} · {invoice.number}</p>
          <a href={`${import.meta.env.PUBLIC_API_URL ?? ''}/api/purchase/invoice/${encodeURIComponent(invoice.orderId)}`} target="_blank" rel="noreferrer">{cmsValue("AccountPage.32", "View / save invoice")}</a>
          <button disabled={busy || !data.emailVerified} onClick={() => void action(`account/invoices/${encodeURIComponent(invoice.orderId)}/email`)}>{cmsValue("AccountPage.33", "Email invoice")}</button>
        </li>)}</ul>}
        {!data.emailVerified && data.invoices.length > 0 && <p>{cmsValue("AccountPage.34", "Verify your email to receive invoice emails.")}</p>}
      </section>
    </>}
    {data && <SupportForm />}
    <footer><a href={base + 'privacy'}>{cmsValue("AccountPage.35", "Privacy")}</a><a href={base + 'terms'}>{cmsValue("AccountPage.36", "Terms")}</a><a href={base + 'refunds'}>{cmsValue("AccountPage.37", "Refund policy")}</a></footer>
  </main>;
}
