import { useEffect, useRef, useState, type FormEvent } from 'react';
import '../DemoFormSection.css';
import { trackEvent } from '../analytics';

type Phase = 'details' | 'verifying' | 'ready' | 'error';
type Credentials = { username: string; temporaryPassword: string; expiresAt: string };
const apiUrl = (path: string) => `${import.meta.env.PUBLIC_API_URL ?? ''}${path}`;

function DemoFormSection() {
  const [phase, setPhase] = useState<Phase>('details');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [retryUntil, setRetryUntil] = useState(0);
  const [retrySeconds, setRetrySeconds] = useState(0);
  useEffect(() => {
    if (!retryUntil) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((retryUntil - Date.now()) / 1000));
      setRetrySeconds(remaining);
      if (!remaining) setRetryUntil(0);
    };
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [retryUntil]);
  const handleRateLimit = (response: Response, result: { retryAfter?: number }) => {
    if (response.status !== 429) return;
    const header = response.headers.get('Retry-After');
    const seconds = header && /^\d+$/.test(header) ? Number(header) : header ? Math.ceil((Date.parse(header) - Date.now()) / 1000) : Number(result.retryAfter);
    // If the upstream service supplies no reset time, pause briefly before
    // allowing a manual retry. Never automatically resend an OTP request.
    const wait = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 60;
    setRetrySeconds(wait); setRetryUntil(Date.now() + wait * 1000);
  };
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [requestId, setRequestId] = useState('');
  const [otp, setOtp] = useState('');
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [loginUrl, setLoginUrl] = useState('');
  const [credentialEmailDelivered, setCredentialEmailDelivered] = useState(false);
  const [formStartedAt] = useState(() => Date.now());

  const requestDemo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlight.current || Date.now() < retryUntil) return;
    inFlight.current = true;
    setErrorMessage(''); setFieldErrors({}); setBusy(true);
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const company = String(formData.get('company') || '').trim();
    const mobile = String(formData.get('mobile') || '').trim();
    if (!name || !email || !company || !mobile) {
      setErrorMessage('Please enter your name, business name, email, and mobile number.'); setPhase('error'); setBusy(false); inFlight.current = false; return;
    }
    try {
      trackEvent('demo_form_submitted');
      const response = await fetch(apiUrl('/api/demo-requests'), {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, company, mobile, businessType: formData.get('businessType'), website: formData.get('website'), formStartedAt, campaign: new URLSearchParams(window.location.search).get('utm_campaign') || '' }),
      });
      const result = await response.json().catch(() => ({})) as { success?: boolean; message?: string; retryAfter?: number; errors?: Record<string, string>; data?: { requestId?: string } };
      handleRateLimit(response, result);
      if (!response.ok || !result.success || !result.data?.requestId) { setFieldErrors(result.errors ?? {}); throw new Error(result.message || 'We could not start your demo.'); }
      setRequestId(result.data.requestId); setPhase('verifying'); trackEvent('demo_otp_sent');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Network error. Please try again.'); setPhase('error'); trackEvent('demo_form_error');
    } finally { setBusy(false); inFlight.current = false; }
  };

  const verifyDemo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlight.current || Date.now() < retryUntil) return;
    inFlight.current = true;
    setErrorMessage(''); setBusy(true);
    try {
      const response = await fetch(apiUrl('/api/demo-requests'), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verify', requestId, otp }) });
      const result = await response.json().catch(() => ({})) as { success?: boolean; message?: string; retryAfter?: number; data?: { credentials?: Credentials; loginUrl?: string; credentialEmailDelivered?: boolean } };
      handleRateLimit(response, result);
      if (!response.ok || !result.success || !result.data?.credentials) throw new Error(result.message || 'We could not verify your code.');
      setCredentials(result.data.credentials); setLoginUrl(result.data.loginUrl || ''); setCredentialEmailDelivered(result.data.credentialEmailDelivered === true); setPhase('ready'); trackEvent('demo_form_success');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Network error. Please try again.'); trackEvent('demo_otp_error');
    } finally { setBusy(false); inFlight.current = false; }
  };

  const step = phase === 'details' || phase === 'error' ? 1 : 2;

  return <section id="demo" className="section section-shell section-demo-form">
    <div className="demo-form-inner">
      <div className="demo-form-copy">
        <div className="demo-copy-orb demo-copy-orb-one" aria-hidden="true" /><div className="demo-copy-orb demo-copy-orb-two" aria-hidden="true" />
        <p className="eyebrow">Private ERP sandbox</p>
        <h2>Run your workflow in LoomIQ — free for three hours.</h2>
        <p className="demo-copy-lead">Explore a private garment ERP workspace with your own secure login. No card, sales call, or setup meeting required.</p>
        <div className="demo-copy-metrics"><div><strong>3 hrs</strong><span>private access</span></div><div><strong>0</strong><span>card details</span></div><div><strong>1:1</strong><span>isolated workspace</span></div></div>
        <ul className="demo-form-list"><li><span aria-hidden="true">1</span>Verify your work email</li><li><span aria-hidden="true">2</span>Receive your unique ERP credentials</li><li><span aria-hidden="true">3</span>Start exploring in minutes</li></ul>
        <div className="demo-copy-footer"><span className="demo-copy-shield" aria-hidden="true">&#10003;</span><p>Your demo data is isolated and access ends automatically.</p></div>
      </div>
      <div className="demo-form-card">
        <div className="demo-form-card-top"><span>Step {step} of 2</span><span className="demo-form-secure"><i aria-hidden="true" />Private &amp; secure</span></div>
        {phase === 'ready' && credentials ? <div className="demo-form-success" role="status">
          <span className="demo-form-success-icon" aria-hidden="true">✓</span><h3>Your demo is ready</h3>
          <p className="demo-credentials-warning">{credentialEmailDelivered ? 'Save these credentials now. The temporary password is shown only once and has also been emailed to you.' : 'Save these credentials now. We could not deliver the email, so this browser is the only place your temporary password is currently shown.'}</p>
          <dl className="demo-credentials"><div><dt>Username</dt><dd>{credentials.username}</dd></div><div><dt>Temporary password</dt><dd>{credentials.temporaryPassword}</dd></div><div><dt>Expires</dt><dd>{new Date(credentials.expiresAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', timeZoneName: 'short' })}</dd></div></dl>
          <a className="button button-primary demo-form-submit" href={loginUrl}>Open LoomIQ ERP</a>
        </div> : phase === 'verifying' ? <form onSubmit={verifyDemo} noValidate>
          <h3>Check your email</h3><p className="demo-form-meta">Enter the six-digit verification code we sent to start your three-hour demo.</p>
          <label htmlFor="demo-otp">Verification code</label><input className="demo-otp-field" id="demo-otp" value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" required pattern="[0-9]{6}" />
          <button type="submit" className="button button-primary demo-form-submit" disabled={busy || retrySeconds > 0 || otp.length !== 6}>{retrySeconds > 0 ? `Try again in ${retrySeconds}s` : busy ? 'Verifying…' : 'Verify and create my demo'}</button>
          <button type="button" className="demo-form-link" disabled={busy} onClick={() => { setPhase('details'); setOtp(''); }}>Use different details</button>
          {errorMessage && <p className="demo-form-error" role="alert">{errorMessage}</p>}
        </form> : <form onSubmit={requestDemo} onFocus={() => trackEvent('demo_form_started')} noValidate>
          <h3>Try LoomIQ free for 3 hours</h3><p className="demo-form-meta">We will verify your email before creating your private ERP workspace.</p>
          <div className="demo-form-fields"><div><label htmlFor="demo-name">Full name</label><input id="demo-name" name="name" autoComplete="name" placeholder="Your name" required aria-invalid={Boolean(fieldErrors.name)} />{fieldErrors.name && <small>{fieldErrors.name}</small>}</div>
          <div><label htmlFor="demo-mobile">Mobile number</label><input id="demo-mobile" name="mobile" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" required aria-invalid={Boolean(fieldErrors.mobile)} />{fieldErrors.mobile && <small>{fieldErrors.mobile}</small>}</div>
          <div className="demo-form-field-wide"><label htmlFor="demo-email">Work email</label><input id="demo-email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required aria-invalid={Boolean(fieldErrors.email)} />{fieldErrors.email && <small>{fieldErrors.email}</small>}</div>
          <div><label htmlFor="demo-company">Business name</label><input id="demo-company" name="company" autoComplete="organization" placeholder="Your business" required aria-invalid={Boolean(fieldErrors.company)} />{fieldErrors.company && <small>{fieldErrors.company}</small>}</div>
          <div><label htmlFor="demo-business">Business type <span>(optional)</span></label><select id="demo-business" name="businessType" defaultValue=""><option value="">Select an option</option><option value="garment">Garment manufacturing</option><option value="textile-trading">Textile trading / Distribution</option><option value="other">Other</option></select></div></div>
          <label className="demo-form-honeypot" htmlFor="demo-website">Website</label><input className="demo-form-honeypot" id="demo-website" name="website" tabIndex={-1} autoComplete="off" />
          <button type="submit" className="button button-primary demo-form-submit" disabled={busy || retrySeconds > 0}>{retrySeconds > 0 ? `Try again in ${retrySeconds}s` : busy ? 'Sending code…' : 'Send verification code'}</button>
          <p className="demo-form-privacy">By continuing, you agree to our <a href={`${import.meta.env.BASE_URL}privacy`}>privacy policy</a>.</p>
          {errorMessage && <p className="demo-form-error" role="alert">{errorMessage}</p>}
        </form>}
      </div>
    </div>
  </section>;
}

export default DemoFormSection;
