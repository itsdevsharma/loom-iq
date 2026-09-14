import { cmsValue } from '../websiteContent';
import { useState, type FormEvent } from 'react';

export default function SupportForm() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${import.meta.env.PUBLIC_API_URL ?? ''}/api/support`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(data)),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || 'Could not send your message. Please try again shortly.');
      }
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send your message. Please try again.');
    } finally { setBusy(false); }
  }
  return <section id="support" className="support-form" aria-labelledby="support-heading">
    <h2 id="support-heading">{cmsValue("SupportForm.1", "How can we help?")}</h2>
    <p>{cmsValue("SupportForm.2", "Tell us about your issue. Our team will reply to your email.")}</p>
    {sent ? <p role="status">{cmsValue("SupportForm.3", "Your message has been sent. Weâ€™ll get back to you by email.")}</p> : <form onSubmit={submit}>
      <label>{cmsValue("SupportForm.4", "Your name")}<input name="name" autoComplete="name" required minLength={2} maxLength={100} /></label>
      <label>{cmsValue("SupportForm.5", "Your email")}<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
      <label>{cmsValue("SupportForm.6", "Subject")}<input name="subject" required minLength={3} maxLength={150} /></label>
      <label>{cmsValue("SupportForm.7", "Describe your issue")}<textarea name="message" required minLength={10} maxLength={5000} rows={5} /></label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={busy}>{busy ? 'Sendingâ€¦' : cmsValue("SupportForm.8", "Send message")}</button>
    </form>}
  </section>;
}
