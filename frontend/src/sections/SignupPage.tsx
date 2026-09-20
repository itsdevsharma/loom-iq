import { trackEvent } from '../analytics';
import { cmsValue } from '../websiteContent';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useOffer } from '../offer';
import logo from '../assets/company.logo.webp';
import '../SignupPage.css';
import SupportForm from '../components/SupportForm';

export default function SignupPage() {
  const { offer, ready, authenticate } = useOffer();
  const [showPassword, setShowPassword] = useState(false);
  const [login, setLogin] = useState(() => new URLSearchParams(window.location.search).get('login') === '1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const query = new URLSearchParams(window.location.search);
  const plan = query.get('plan') === 'Growth' ? 'Growth' : 'Starter';
  const base = import.meta.env.BASE_URL;
  const setupComplete = offer.signedUp && offer.trialSelected;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try { await authenticate(login ? 'login' : 'signup', { ...data, acceptTerms: data.acceptTerms === 'on' }); if (!login) trackEvent('signup_completed'); if (query.has('plan')) window.location.assign(base + 'payment?plan=' + plan); }
    catch (e) { setError(e instanceof Error ? e.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  return <main className="signup-page">
    <header className="signup-header">
      <a className="signup-brand" href={base} aria-label={cmsValue("SignupPage.1", "LoomIQ home")}><img src={cmsValue("SignupPage.2", logo)} alt="" />{cmsValue("SignupPage.3", "Loom")}<span>{cmsValue("SignupPage.4", "IQ")}</span></a>
      <a className="signup-home" href={base}>{cmsValue("SignupPage.5", "Back to website ")}<span aria-hidden="true">↗</span></a>
    </header>
    <ol className="signup-steps" aria-label={cmsValue("SignupPage.6", "Getting started")}>
      <li className={!offer.signedUp ? 'is-current' : 'is-complete'} aria-current={!offer.signedUp ? 'step' : undefined}><span>{offer.signedUp ? '✓' : '1'}</span>{cmsValue("SignupPage.7", "Create account")}</li>
      <li className={offer.signedUp && !setupComplete ? 'is-current' : setupComplete ? 'is-complete' : ''} aria-current={offer.signedUp && !setupComplete ? 'step' : undefined}><span>{setupComplete ? '✓' : '2'}</span>{cmsValue("SignupPage.8", "Review plan")}</li>
      <li className={setupComplete ? 'is-current' : ''} aria-current={setupComplete ? 'step' : undefined}><span>3</span>{cmsValue("SignupPage.9", "Get set up")}</li>
    </ol>

    {!ready ? <p role="status">{cmsValue("SignupPage.12", "Loading your account…")}</p> : !offer.signedUp ? (
      <div className="signup-layout">
      <aside className="signup-story" aria-label={cmsValue("SignupPage.13", "Why start with LoomIQ")}>
        <span className="signup-story-tag"><span aria-hidden="true">✦</span>{cmsValue("SignupPage.14", " Your next chapter starts here")}</span>
        <h2>{cmsValue("SignupPage.15", "Less chasing updates.")}<br /><em>{cmsValue("SignupPage.16", "More moving forward.")}</em></h2>
        <p>{cmsValue("SignupPage.17", "Bring your orders, stock, production, and finances into one connected workspace.")}</p>
        <div className="signup-workflow" aria-label={cmsValue("SignupPage.18", "Connected workflows: orders, production, dispatch")}>
          <div className="signup-workflow-top"><span className="signup-workflow-mark">{cmsValue("SignupPage.19", "L")}</span><span>{cmsValue("SignupPage.20", "Your operation, connected")}<small>{cmsValue("SignupPage.21", "One place to see what comes next")}</small></span><span className="signup-live-dot" aria-hidden="true" /></div>
          <div className="signup-flow"><span><b aria-hidden="true">≡</b>{cmsValue("SignupPage.22", "Orders")}</span><i aria-hidden="true">→</i><span><b aria-hidden="true">⚙</b>{cmsValue("SignupPage.23", "Production")}</span><i aria-hidden="true">→</i><span><b aria-hidden="true">↗</b>{cmsValue("SignupPage.24", "Dispatch")}</span></div>
          <div className="signup-workflow-note"><span aria-hidden="true">✓</span>{cmsValue("SignupPage.25", " A clearer view from first order to final delivery")}</div>
        </div>
        <ul className="signup-benefits"><li><span aria-hidden="true">✓</span><div><strong>{cmsValue("SignupPage.26", "Start on your terms")}</strong><small>{cmsValue("SignupPage.27", "Start with a personalized demo to find the right fit.")}</small></div></li><li><span aria-hidden="true">✓</span><div><strong>{cmsValue("SignupPage.28", "See the terms before you decide")}</strong><small>{cmsValue("SignupPage.29", "Review pricing and conditions before creating an account.")}</small></div></li><li><span aria-hidden="true">✓</span><div><strong>{cmsValue("SignupPage.30", "A team to help you get started")}</strong><small>{cmsValue("SignupPage.31", "Talk through your workflow and onboarding needs.")}</small></div></li></ul>
        <div className="signup-story-footer">{cmsValue("SignupPage.32", "Built around the way your business works.")}</div>
      </aside>
      <section className="signup-card" id="account">
        <p className="eyebrow">{login ? cmsValue("SignupPage.33", "Your LoomIQ workspace") : cmsValue("SignupPage.34", "A simpler way to run your business")}</p>
        <h1>{login ? cmsValue("SignupPage.35", "Welcome back.") : cmsValue("SignupPage.36", "Make room for better work.")}</h1>
        <p className="signup-intro">{login ? cmsValue("SignupPage.37", "Sign in to pick up where you left off. Review your plan and account details.") : cmsValue("SignupPage.38", "Already discussed your setup? Create an account to continue to checkout. For a demo, no account is needed.")}</p>
        {!login && <div className="signup-no-card"><LockIcon />{cmsValue("SignupPage.39", " No card needed to create an account")}</div>}
        <form onSubmit={submit}>
          <fieldset disabled={busy}>
            {!login && <><label>{cmsValue("SignupPage.40", "Full name")}<input name="name" autoComplete="name" placeholder={cmsValue("SignupPage.41", "Your full name")} minLength={2} maxLength={100} required /></label>
              <label>{cmsValue("SignupPage.42", "Company name")}<input name="company" autoComplete="organization" placeholder={cmsValue("SignupPage.43", "Your company name")} minLength={2} maxLength={150} required /></label></>}
            <label>{cmsValue("SignupPage.44", "Work email")}<input name="email" type="email" placeholder={cmsValue("SignupPage.45", "you@company.com")} autoComplete="email" maxLength={254} required /></label>
            <label htmlFor="signup-password">{cmsValue("SignupPage.46", "Password")}</label>
            <div className="signup-password"><input id="signup-password" name="password" type={showPassword ? 'text' : 'password'} placeholder={login ? cmsValue("SignupPage.47", "Enter your password") : cmsValue("SignupPage.48", "Create a strong password")} autoComplete={login ? 'current-password' : 'new-password'} aria-describedby={!login ? 'signup-password-help' : undefined} minLength={10} maxLength={72} required /><button type="button" aria-label={showPassword ? cmsValue("SignupPage.49", "Hide password") : cmsValue("SignupPage.50", "Show password")} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? cmsValue("SignupPage.51", "Hide") : cmsValue("SignupPage.52", "Show")}</button></div>
            {!login && <small id="signup-password-help" className="signup-password-help">{cmsValue("SignupPage.53", "Use at least 10 characters.")}</small>}
            {!login && <label className="signup-check"><input name="acceptTerms" type="checkbox" required /><span>{cmsValue("SignupPage.54", "I agree to the ")}<a href={base + 'terms'} target="_blank" rel="noreferrer">{cmsValue("SignupPage.55", "Terms")}</a>{cmsValue("SignupPage.56", " and ")}<a href={base + 'privacy'} target="_blank" rel="noreferrer">{cmsValue("SignupPage.57", "Privacy Policy")}</a>.</span></label>}
            <button className="button button-primary" type="submit">{busy ? cmsValue("SignupPage.58", "Please wait…") : login ? cmsValue("SignupPage.59", "Sign in") : cmsValue("SignupPage.60", "Create my account")}</button>
          </fieldset>
        </form>
        {error && <p className="signup-error" role="alert">{error}</p>}
        {login && <p><a href={base + 'forgot-password'}>{cmsValue("SignupPage.61", "Forgot password?")}</a></p>}
        <div className="signup-switch"><button className="text-link" type="button" disabled={busy} onClick={() => { setLogin(!login); setShowPassword(false); setError(''); }}>{login ? cmsValue("SignupPage.62", "New here? Create an account") : cmsValue("SignupPage.63", "Already signed up? Sign in")}</button></div>
        <div className="signup-form-trust"><LockIcon /><span>{cmsValue("SignupPage.64", "Your account is password-protected.")}<br />{cmsValue("SignupPage.65", "You choose your plan before making any payment.")}</span></div>
      </section></div>
    ) : (
      <section className="signup-card signup-choices" id="account">
        <div className="signup-choice-content">
          <div className="signup-status-icon" aria-hidden="true">✓</div>
          <p className="eyebrow">{cmsValue("SignupPage.66", "Your account is ready")}</p>
          <h1>{offer.trialSelected ? cmsValue("SignupPage.67", "Your trial request is received.") : cmsValue("SignupPage.68", "Choose your next step.")}</h1>
          <p className="signup-account-email">{cmsValue("SignupPage.70", "Signed in as ")}<strong>{offer.customer?.email}</strong></p>
          <p className="signup-choice-copy">{offer.trialSelected ? cmsValue("SignupPage.72", "Our team will contact you to arrange trial access. You can still get {discount} off if you purchase within your 24-hour offer window.") : cmsValue("SignupPage.73", "Book a demo to discuss your setup, or continue to checkout if you have already chosen your plan.")}</p>
          <div className="signup-choice-actions">
            {offer.reason === 'purchased' ? <a className="button button-primary" href={base + 'thank-you?type=purchase'}>{cmsValue("SignupPage.69", "View purchase & invoice")}</a> : <a className="button button-primary" href={base + 'account'}>{cmsValue("SignupPage.71", "My account & invoices")}</a>}
            <a className="button button-secondary" href={base + 'payment?plan=' + plan}>{cmsValue("SignupPage.74", "Review checkout")}</a>
          </div>
        </div>
      </section>
    )}
    {offer.signedUp && error && <p className="signup-error" role="alert">{error}</p>}
    <SupportForm />
    <footer className="signup-footer"><span><LockIcon />{cmsValue("SignupPage.75", " Payments processed by Razorpay")}</span><nav aria-label={cmsValue("SignupPage.76", "Signup information")}><a href={base + 'privacy'}>{cmsValue("SignupPage.77", "Privacy")}</a><a href={base + 'terms'}>{cmsValue("SignupPage.78", "Terms")}</a><a href="#support">{cmsValue("SignupPage.80", "Need help? Contact us ↗")}</a></nav></footer>
  </main>;
}

function LockIcon() { return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></svg>; }
