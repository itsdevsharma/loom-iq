import { cmsValue } from '../websiteContent';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import './SupportForm.css';

export default function SupportForm() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(() => window.location.hash === '#support');
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const syncWithHash = () => setOpen(window.location.hash === '#support');
    window.addEventListener('hashchange', syncWithHash);
    return () => window.removeEventListener('hashchange', syncWithHash);
  }, []);

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  function close() {
    setOpen(false);
    if (window.location.hash === '#support') window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }

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
  if (!open) return <span id="support" className="support-form-anchor" aria-hidden="true" />;

  return <div className="support-modal" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
    <section className="support-dialog" role="dialog" aria-modal="true" aria-labelledby="support-heading">
      <button ref={closeButton} className="support-form-close" type="button" onClick={close} aria-label="Close support form">×</button>
      <p className="support-form-eyebrow">LOOMIQ SUPPORT</p>
      <h2 id="support-heading">{cmsValue("SupportForm.1", "How can we help?")}</h2>
      <p className="support-form-intro">{cmsValue("SupportForm.2", "Tell us about your issue. Our team will reply to your email.")}</p>
      {sent ? <div className="support-form-success" role="status"><span aria-hidden="true">✓</span><div><strong>Message sent</strong><p>{cmsValue("SupportForm.3", "Your message has been sent. We’ll get back to you by email.")}</p></div><button type="button" onClick={close}>Done</button></div> : <form onSubmit={submit}>
        <label>{cmsValue("SupportForm.4", "Your name")}<input name="name" autoComplete="name" placeholder="Your full name" required minLength={2} maxLength={100} /></label>
        <label>{cmsValue("SupportForm.5", "Your email")}<input name="email" type="email" autoComplete="email" placeholder="you@company.com" required maxLength={254} /></label>
        <label>{cmsValue("SupportForm.6", "Subject")}<input name="subject" placeholder="What do you need help with?" required minLength={3} maxLength={150} /></label>
        <label>{cmsValue("SupportForm.7", "Describe your issue")}<textarea name="message" placeholder="Share a few details so we can help." required minLength={10} maxLength={5000} rows={5} /></label>
        {error && <p className="support-form-error" role="alert">{error}</p>}
        <button className="support-form-submit" type="submit" disabled={busy}>{busy ? 'Sending…' : cmsValue("SupportForm.8", "Send message")}<span aria-hidden="true">→</span></button>
      </form>}
    </section>
  </div>;
}
