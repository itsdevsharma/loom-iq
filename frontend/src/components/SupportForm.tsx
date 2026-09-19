import { cmsValue } from '../websiteContent';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import './SupportForm.css';

export default function SupportForm() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash === '#support') setOpen(true);
    };
    const openFromLink = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(link instanceof HTMLAnchorElement) || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = new URL(link.href);
      if (target.origin === location.origin && target.pathname === location.pathname && target.search === location.search && target.hash === '#support') {
        event.preventDefault();
        link.focus();
        setOpen(true);
      }
    };
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    document.addEventListener('click', openFromLink);
    return () => {
      window.removeEventListener('hashchange', openFromHash);
      document.removeEventListener('click', openFromLink);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const modal = dialog.current;
    const previousOverflow = document.body.style.overflow;
    modal?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      modal?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);
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
  return <>
    <div id="support" className="support-entry">
      <span>Need a hand? We’re here to help.</span>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog">Contact support <span aria-hidden="true">↗</span></button>
    </div>
    {createPortal(<dialog ref={dialog} className="support-dialog" aria-labelledby="support-heading" aria-describedby="support-description" onClose={() => setOpen(false)} onClick={event => {
      if (event.target === event.currentTarget) {
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setOpen(false);
      }
    }}>
    <button className="support-close" type="button" aria-label="Close support form" onClick={() => setOpen(false)}>×</button>
    <div className="support-icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></svg></div>
    <p className="support-eyebrow">EMAIL SUPPORT</p>
    <h2 id="support-heading">{cmsValue("SupportForm.1", "How can we help?")}</h2>
    <p id="support-description">{cmsValue("SupportForm.2", "Tell us about your issue. Our team will reply to your email.")}</p>
    {sent ? <div className="support-success"><p role="status">{cmsValue("SupportForm.3", "Your message has been sent. We’ll get back to you by email.")}</p><button type="button" onClick={() => setOpen(false)}>Done</button></div> : <form onSubmit={submit} aria-busy={busy}>
      <label>{cmsValue("SupportForm.4", "Your name")}<input name="name" placeholder="Your full name" autoComplete="name" required minLength={2} maxLength={100} /></label>
      <label>{cmsValue("SupportForm.5", "Your email")}<input name="email" placeholder="you@company.com" type="email" autoComplete="email" required maxLength={254} /></label>
      <label className="support-wide">{cmsValue("SupportForm.6", "Subject")}<input name="subject" placeholder="What do you need help with?" required minLength={3} maxLength={150} /></label>
      <label className="support-wide">{cmsValue("SupportForm.7", "Describe your issue")}<textarea name="message" placeholder="Share a few details so we can help you better…" required minLength={10} maxLength={5000} rows={5} /></label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={busy}>{busy ? 'Sending…' : cmsValue("SupportForm.8", "Send message")}</button>
    </form>}
    </dialog>, document.body)}
  </>;
}
