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
      const result = await accountApi('account/' + kind, kind === 'forgot-password' ? fields : { ...fields, email: link.get('email'), token: link.get('token') });
      setMessage(result.message); setComplete(true);
      window.history.replaceState(null, '', window.location.pathname);
    } catch (e) { setError(e instanceof Error ? e.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  return <main className="account-page account-help">
    <a href={import.meta.env.BASE_URL}>LoomIQ</a>
    <h1>{kind === 'forgot-password' ? 'Forgot your password?' : kind === 'reset-password' ? 'Choose a new password' : 'Verify your email'}</h1>
    <p>{kind === 'forgot-password' ? 'Enter your account email to request a reset link.' : kind === 'reset-password' ? 'Updating your password signs out all existing sessions.' : 'Confirm the email address associated with your account.'}</p>
    {!complete && <form onSubmit={submit}><fieldset disabled={busy}>
      {kind === 'forgot-password' && <label>Email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>}
      {kind === 'reset-password' && <label>New password<input name="password" type="password" autoComplete="new-password" minLength={10} maxLength={72} required /><small>At least 10 characters; maximum 72 bytes.</small></label>}
      <button type="submit">{busy ? 'Please wait…' : kind === 'forgot-password' ? 'Send reset link' : kind === 'reset-password' ? 'Update password' : 'Verify email'}</button>
    </fieldset></form>}
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    <p><a href={import.meta.env.BASE_URL + 'signup?login=1'}>Sign in</a> · <a href={import.meta.env.BASE_URL + 'account'}>My account</a></p>
  </main>;
}
