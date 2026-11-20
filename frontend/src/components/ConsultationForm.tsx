import { useState, type FormEvent } from 'react';
import { agencyServices } from '../agencyContent';
import { trackEvent } from '../analytics';

type Props = { service?: string; heading?: string };
export default function ConsultationForm({ service = '', heading = 'Let’s talk about your business.' }: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;
    const data = new FormData(event.currentTarget);
    setStatus('sending'); setError('');
    try {
      const response = await fetch(`${import.meta.env.PUBLIC_API_URL ?? ''}/api/support`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.get('name'), email: data.get('email'), subject: `${data.get('service')} consultation`, message: `Business: ${data.get('business')}\nPhone: ${data.get('phone') || 'Not provided'}\nService: ${data.get('service')}\n\n${data.get('message')}` }),
      });
      if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(result.message || 'We couldn’t send your enquiry. Please try again or email loomiq2025@gmail.com.'); }
      setStatus('sent'); trackEvent('marketing_enquiry_submitted');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'We couldn’t send your enquiry. Please try again.'); setStatus('error'); }
  }
  return <div className="agency-consultation">
    <p className="agency-kicker">FREE INITIAL CONSULTATION</p><h2>{heading}</h2><p>Share a few details. We’ll reply by email to discuss your goals and the right next step.</p>
    {status === 'sent' ? <div className="agency-form-success" role="status"><h3>Your enquiry is with us.</h3><p>The LoomiQ team will reply to your email. There’s no commitment to a paid service.</p><button type="button" className="agency-button agency-button-secondary" onClick={() => setStatus('idle')}>Send another enquiry</button></div> : <form onSubmit={submit} aria-busy={status === 'sending'}>
      <div className="agency-form-row"><label>Your name<input name="name" autoComplete="name" minLength={2} maxLength={100} required placeholder="Full name" /></label><label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required placeholder="you@business.com" /></label></div>
      <div className="agency-form-row"><label>Business or website<input name="business" autoComplete="organization" maxLength={200} required placeholder="Business name or URL" /></label><label><span className="agency-phone-label">Phone (optional)</span><input name="phone" type="tel" autoComplete="tel" maxLength={30} placeholder="Your contact number" /></label></div>
      <label>Service you’re interested in<select name="service" defaultValue={service} required><option value="" disabled>Select a service</option><option>Digital Marketing</option>{agencyServices.map(item => <option key={item.slug}>{item.title}</option>)}<option>Website Audit</option><option>ERP Software</option><option>Help me decide</option></select></label>
      <label>Your goals<textarea name="message" minLength={10} maxLength={3500} rows={3} required placeholder="What do you offer, and what would you like to achieve?" /></label>
      {error && <p role="alert" className="agency-error">{error}</p>}
      <button type="submit" className="agency-button agency-button-primary" disabled={status === 'sending'}>{status === 'sending' ? 'Sending enquiry…' : 'Get a Free Consultation'}</button>
      <p className="agency-form-note">We use your details to respond to your enquiry. <a href={import.meta.env.BASE_URL + 'privacy'}>Privacy Policy</a>. No obligation to purchase.</p>
    </form>}
  </div>;
}
