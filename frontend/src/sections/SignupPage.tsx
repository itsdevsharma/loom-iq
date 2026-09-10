import { useState } from 'react';
import type { FormEvent } from 'react';
import { useOffer } from '../offer';
import logo from '../assets/company.logo.webp';
import '../SignupPage.css';

export default function SignupPage() {
  const { offer, ready, authenticate } = useOffer();
  const [showPassword, setShowPassword] = useState(false);
  const [login, setLogin] = useState(() => new URLSearchParams(window.location.search).get('login') === '1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const query = new URLSearchParams(window.location.search);
  const plan = query.get('plan') === 'Growth' ? 'Growth' : 'Starter';
  const base = import.meta.env.BASE_URL;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try { await authenticate(login ? 'login' : 'signup', { ...data, acceptTerms: data.acceptTerms === 'on' }); }
    catch (e) { setError(e instanceof Error ? e.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  return <main className="signup-page">
    <header className="signup-header">
      <a className="signup-brand" href={base} aria-label="LoomIQ home"><img src={logo} alt="" />Loom<span>IQ</span></a>
      <a className="signup-home" href={base}>Back to website <span aria-hidden="true">↗</span></a>
    </header>
    <ol className="signup-steps" aria-label="Getting started">
      <li className={!offer.signedUp ? 'is-current' : 'is-complete'} aria-current={!offer.signedUp ? 'step' : undefined}><span>{offer.signedUp ? '✓' : '1'}</span>Create account</li>
      <li className={offer.signedUp ? 'is-current' : ''} aria-current={offer.signedUp ? 'step' : undefined}><span>2</span>Review plan</li>
      <li><span>3</span>Get set up</li>
    </ol>
    <div className="signup-guidance"><a className="button button-primary" href={base + '#demo'}>Book a personalized demo</a> <a className="text-link" href={base + '#pricing'}>View pricing</a></div>
    {!ready ? <p role="status">Loading your account…</p> : !offer.signedUp ? (
      <div className="signup-layout">
      <aside className="signup-story" aria-label="Why start with LoomIQ">
        <span className="signup-story-tag"><span aria-hidden="true">✦</span> Your next chapter starts here</span>
        <h2>Less chasing updates.<br /><em>More moving forward.</em></h2>
        <p>Bring your orders, stock, production, and finances into one connected workspace.</p>
        <div className="signup-workflow" aria-label="Connected workflows: orders, production, dispatch">
          <div className="signup-workflow-top"><span className="signup-workflow-mark">L</span><span>Your operation, connected<small>One place to see what comes next</small></span><span className="signup-live-dot" aria-hidden="true" /></div>
          <div className="signup-flow"><span><b aria-hidden="true">≡</b>Orders</span><i aria-hidden="true">→</i><span><b aria-hidden="true">⚙</b>Production</span><i aria-hidden="true">→</i><span><b aria-hidden="true">↗</b>Dispatch</span></div>
          <div className="signup-workflow-note"><span aria-hidden="true">✓</span> A clearer view from first order to final delivery</div>
        </div>
        <ul className="signup-benefits"><li><span aria-hidden="true">✓</span><div><strong>Start on your terms</strong><small>Start with a personalized demo to find the right fit.</small></div></li><li><span aria-hidden="true">✓</span><div><strong>See the terms before you decide</strong><small>Review pricing and conditions before creating an account.</small></div></li><li><span aria-hidden="true">✓</span><div><strong>A team to help you get started</strong><small>Talk through your workflow and onboarding needs.</small></div></li></ul>
        <div className="signup-story-footer">Built around the way your business works.</div>
      </aside>
      <section className="signup-card" id="account">
        <p className="eyebrow">{login ? "Your LoomIQ workspace" : "A simpler way to run your business"}</p>
        <h1>{login ? 'Welcome back.' : 'Make room for better work.'}</h1>
        <p className="signup-intro">{login ? 'Sign in to pick up where you left off. Review your plan and account details.' : 'Already discussed your setup? Create an account to continue to checkout. For a demo, no account is needed.'}</p>
        {!login && <div className="signup-no-card"><LockIcon /> No card needed to create an account</div>}
        <form onSubmit={submit}>
          <fieldset disabled={busy}>
            {!login && <><label>Full name<input name="name" autoComplete="name" placeholder="Your full name" minLength={2} maxLength={100} required /></label>
              <label>Company name<input name="company" autoComplete="organization" placeholder="Your company name" minLength={2} maxLength={150} required /></label></>}
            <label>Work email<input name="email" type="email" placeholder="you@company.com" autoComplete="email" maxLength={254} required /></label>
            <label htmlFor="signup-password">Password</label>
            <div className="signup-password"><input id="signup-password" name="password" type={showPassword ? 'text' : 'password'} placeholder={login ? 'Enter your password' : 'Create a strong password'} autoComplete={login ? 'current-password' : 'new-password'} aria-describedby={!login ? 'signup-password-help' : undefined} minLength={10} maxLength={72} required /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></div>
            {!login && <small id="signup-password-help" className="signup-password-help">Use at least 10 characters.</small>}
            {!login && <label className="signup-check"><input name="acceptTerms" type="checkbox" required /><span>I agree to the <a href={base + 'terms'} target="_blank" rel="noreferrer">Terms</a> and <a href={base + 'privacy'} target="_blank" rel="noreferrer">Privacy Policy</a>.</span></label>}
            <button className="button button-primary" type="submit">{busy ? 'Please wait…' : login ? 'Sign in' : 'Create my account'}</button>
          </fieldset>
        </form>
        {error && <p className="signup-error" role="alert">{error}</p>}
        {login && <p><a href={base + 'forgot-password'}>Forgot password?</a></p>}
        <div className="signup-switch"><button className="text-link" type="button" disabled={busy} onClick={() => { setLogin(!login); setShowPassword(false); setError(''); }}>{login ? 'New here? Create an account' : 'Already signed up? Sign in'}</button></div>
        <div className="signup-form-trust"><LockIcon /><span>Your account is password-protected.<br />You choose your plan before making any payment.</span></div>
      </section></div>
    ) : (
      <section className="signup-card signup-choices" id="account">
        <p className="eyebrow">Your account is ready</p>
        <h1>{offer.trialSelected ? 'Your trial request is received.' : 'Choose your next step.'}</h1>
        {offer.reason === 'purchased' && <p><a className="button button-primary" href={base + 'thank-you?type=purchase'}>View purchase & invoice</a></p>}
        <p className="signup-account-email">Signed in as {offer.customer?.email}</p>
        <p><a className="button button-primary" href={base + 'account'}>My account & invoices</a></p>
        <p>{offer.trialSelected ? 'Our team will contact you to arrange trial access. You can still get 50% off if you purchase within your 24-hour offer window.' : 'Book a demo to discuss your setup, or continue to checkout if you have already chosen your plan.'}</p>
        <a className="button button-secondary" href={base + 'payment?plan=' + plan}>Review checkout</a>
      </section>
    )}
    {offer.signedUp && error && <p className="signup-error" role="alert">{error}</p>}
    <footer className="signup-footer"><span><LockIcon /> Payments processed by Razorpay</span><nav aria-label="Signup information"><a href={base + 'privacy'}>Privacy</a><a href={base + 'terms'}>Terms</a><a href="mailto:support@loomiq.com">Need help? Contact us ↗</a></nav></footer>
  </main>;
}

function LockIcon() { return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></svg>; }
