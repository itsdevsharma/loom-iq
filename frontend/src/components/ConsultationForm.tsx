import { useRef, useState, type FormEvent } from 'react';
import { agencyServices } from '../agencyContent';
import { trackEvent } from '../analytics';

type Props = { service?: string; heading?: string };
export default function ConsultationForm({ service = '', heading = 'Get a free digital growth consultation.' }: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');
  const started = useRef(false);
  const confirmation = useRef<HTMLDivElement>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;
    const data = new FormData(event.currentTarget);
    const phone = String(data.get('phone') || '').trim();
    if (!/^[+\d\s().-]+$/.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15) {
      setError('Enter a valid phone number with 7–15 digits, including your country code.');
      event.currentTarget.querySelector<HTMLInputElement>('[name="phone"]')?.focus();
      return;
    }
    setStatus('sending'); setError('');
    const query = new URLSearchParams(window.location.search);
    const attribution = Object.fromEntries(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].map(key => [key, query.get(key) || '']));
    try {
      const response = await fetch(`${import.meta.env.PUBLIC_API_URL ?? ''}/api/consultations`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.get('name'), phone, service: data.get('service'), business: data.get('business'), website: data.get('website'), sourcePage: window.location.pathname, attribution }),
      });
      if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(result.message || 'We couldn’t save your enquiry. Please try again or call +91 82220 88524.'); }
      setStatus('sent'); trackEvent('marketing_enquiry_submitted'); trackEvent('generate_lead');
      requestAnimationFrame(() => confirmation.current?.focus());
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'We couldn’t save your enquiry. Please try again.'); setStatus('error'); }
  }
  return <div className="agency-consultation">
    <p className="agency-kicker">FREE INITIAL CONSULTATION</p><h2>{heading}</h2><p>Tell us where to reach you. We’ll discuss your goals and a suitable starting point.</p>
    {status === 'sent' ? <div ref={confirmation} tabIndex={-1} className="agency-form-success" role="status"><h3>Your consultation request is saved.</h3><p>The LoomiQ team will contact you on the number you provided to discuss your business. You don’t need to make a payment.</p><a className="agency-text-link" href="tel:+918222088524">Prefer to talk now? Call +91 82220 88524</a><button type="button" className="agency-button agency-button-secondary" onClick={() => { setStatus('idle'); started.current = false; }}>Send another enquiry</button></div> : <form onSubmit={submit} onFocus={() => { if (!started.current) { started.current = true; trackEvent('form_start'); } }} aria-busy={status === 'sending'}>
      <label>Full name<input name="name" autoComplete="name" minLength={2} maxLength={100} required placeholder="Your full name" /></label>
      <label>Business phone / WhatsApp<input name="phone" type="tel" autoComplete="tel" maxLength={30} required placeholder="Include your country code" aria-describedby="consultation-phone-note" /></label>
      <p id="consultation-phone-note" className="agency-field-note">We’ll use this number to respond to your request.</p>
      <label>Service you’re interested in<select name="service" defaultValue={service} required><option value="" disabled>Select a service</option><option>Digital Marketing</option>{agencyServices.map(item => <option key={item.slug}>{item.title}</option>)}<option>Website Audit</option><option>Help me decide</option></select></label>
      <label>Website / business name (optional)<input name="business" autoComplete="organization" maxLength={200} placeholder="Business name or website address" /></label>
      <div className="agency-honeypot" aria-hidden="true"><label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      {error && <p role="alert" className="agency-error">{error}</p>}
      <button type="submit" className="agency-button agency-button-primary" disabled={status === 'sending'}>{status === 'sending' ? 'Sending request…' : 'Request My Free Consultation'}</button>
      <p className="agency-form-note">No obligation to purchase. We use your details to respond to your enquiry. <a href={import.meta.env.BASE_URL + 'privacy'}>Privacy Policy</a>.</p>
    </form>}
  </div>;
}
