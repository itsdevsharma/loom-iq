import { cmsValue } from '../websiteContent';
import { useState, type FormEvent } from 'react';
import { accountApi } from '../accountApi';
import '../AccountPage.css';

export default function AccountHelpPage({ kind }: { kind: 'forgot-password' | 'reset-password' | 'verify-email' }) {
  const [link] = useState(() => new URLSearchParams(window.location.hash.slice(1)));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = await accountApi('account/' + kind, kind === 'forgot-password' || kind === 'verify-email' ? fields : { ...fields, email: link.get('email'), token: link.get('token') });
      setMessage(result.message); setComplete(true);
      window.history.replaceState(null, '', window.location.pathname);
    } catch (e) { setError(e instanceof Error ? e.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  return <main className="account-page account-help">
    <a href={import.meta.env.BASE_URL}>{cmsValue("AccountHelpPage.1", "LoomIQ")}</a>
    <h1>{kind === 'forgot-password' ? cmsValue("AccountHelpPage.2", "Forgot your password?") : kind === 'reset-password' ? cmsValue("AccountHelpPage.3", "Choose a new password") : cmsValue("AccountHelpPage.4", "Verify your email")}</h1>
    <p>{kind === 'forgot-password' ? cmsValue("AccountHelpPage.5", "Enter your account email to request a reset link.") : kind === 'reset-password' ? cmsValue("AccountHelpPage.6", "Updating your password signs out all existing sessions.") : cmsValue("AccountHelpPage.7", "Confirm the email address associated with your account.")}</p>
    {!complete && <form onSubmit={submit}><fieldset disabled={busy}>
      {kind === 'forgot-password' && <label>{cmsValue("AccountHelpPage.8", "Email")}<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>}
      {kind === 'reset-password' && <label>{cmsValue("AccountHelpPage.9", "New password")}<input name="password" type="password" autoComplete="new-password" minLength={10} maxLength={72} required /><small>{cmsValue("AccountHelpPage.10", "At least 10 characters; maximum 72 bytes.")}</small></label>}
      {kind === 'verify-email' && <><label>Email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label><label>Verification code<input name="token" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required /></label></>}
      <button type="submit">{busy ? cmsValue("AccountHelpPage.11", "Please wait…") : kind === 'forgot-password' ? cmsValue("AccountHelpPage.12", "Send reset link") : kind === 'reset-password' ? cmsValue("AccountHelpPage.13", "Update password") : cmsValue("AccountHelpPage.14", "Verify email")}</button>
    </fieldset></form>}
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    <p><a href={import.meta.env.BASE_URL + 'signup?login=1'}>{cmsValue("AccountHelpPage.15", "Sign in")}</a> · <a href={import.meta.env.BASE_URL + 'account'}>{cmsValue("AccountHelpPage.16", "My account")}</a></p>
  </main>;
}
