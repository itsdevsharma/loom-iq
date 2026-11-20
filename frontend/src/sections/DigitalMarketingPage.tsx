import { useState, type FormEvent } from 'react';
import logo from '../assets/company.logo.webp';
import { trackEvent } from '../analytics';
import '../DigitalMarketingPage.css';

const services = [
  ['Campaign strategy', 'A clear starting point.', 'We work with you to understand your offer, customers and sales process, then shape a campaign around a specific business goal.'],
  ['Facebook & Instagram ads', 'Reach people with a reason to care.', 'Campaign setup, audience planning and ad copy that connect your offer with relevant prospective customers.'],
  ['Creative direction & testing', 'Find the message that connects.', 'Creative concepts and messaging variations built around your product or service, with a plan to test and learn.'],
  ['Optimisation & reporting', 'Know what your budget is doing.', 'Ongoing campaign reviews and clear reporting on spend, enquiries and the next steps to improve performance.'],
];
const faqs = [
  ['Is this service only for ERP or textile businesses?', 'No. Our digital marketing service is separate from LoomIQ ERP. Tell us about your business, audience and goals so we can assess whether Meta ads are a suitable channel.'],
  ['How much does it cost?', 'We scope the work around your goals, campaign needs and available budget. Management fees and advertising spend are quoted separately before you commit.'],
  ['Do I need an existing ad account?', 'You can come to us with an existing account or a new business. We review what is already in place and outline any account setup, permissions and assets needed before launch.'],
  ['Can you guarantee leads or sales?', 'No. Results depend on your offer, market, creative, budget and follow-up. We agree on useful measures of performance and use campaign data to guide improvements.'],
  ['What happens after I send an enquiry?', 'Our team will reply by email to discuss your business, check the fit and outline the scope and proposed next steps. Sending an enquiry does not commit you to a paid service.'],
];

export default function DigitalMarketingPage() {
  const base = import.meta.env.BASE_URL;
  const [menuOpen, setMenuOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;
    const data = new FormData(event.currentTarget);
    setStatus('sending');
    setError('');
    try {
      const response = await fetch(`${import.meta.env.PUBLIC_API_URL ?? ''}/api/support`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'), email: data.get('email'), subject: 'Digital marketing / Meta ads consultation',
          message: `Business: ${data.get('business')}\nGoal: ${data.get('goal')}\nMonthly ad budget: ${data.get('budget')}\n\n${data.get('message')}`,
        }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || 'We couldn’t send your enquiry. Please try again or email us directly.');
      }
      setStatus('sent');
      trackEvent('marketing_enquiry_submitted');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'We couldn’t send your enquiry. Please try again.');
      setStatus('error');
    }
  }

  return <div className="marketing-page">
    <a className="marketing-skip" href="#marketing-main">Skip to content</a>
    <header className="marketing-header">
      <div className="marketing-container marketing-header-inner">
        <a className="marketing-brand" href={base} aria-label="LoomIQ home"><img src={logo} alt="" width="38" height="38" /><span>LoomIQ<small>Digital marketing</small></span></a>
        <button type="button" className="marketing-menu" aria-expanded={menuOpen} aria-controls="marketing-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? 'Close menu' : 'Menu'}</button>
        <nav id="marketing-navigation" className={menuOpen ? 'is-open' : ''} aria-label="Digital marketing navigation" onClick={() => setMenuOpen(false)} onKeyDown={event => { if (event.key === 'Escape') setMenuOpen(false); }}>
          <a href="#services">Services</a><a href="#approach">Our approach</a><a href="#questions">FAQ</a><a href={base}>Explore ERP</a><a className="marketing-button marketing-primary" href="#consultation">Let’s talk growth</a>
        </nav>
      </div>
    </header>
    <main id="marketing-main">
      <section className="marketing-hero marketing-container">
        <div className="marketing-hero-copy"><p className="marketing-eyebrow">META ADS · DIGITAL MARKETING</p><h1>Your next customer<br />could be one<br /><em>good ad away.</em></h1><p className="marketing-lead">Grow your business with Facebook and Instagram ads built around your goals. From the first campaign idea to ongoing optimisation, LoomIQ helps you turn attention into meaningful enquiries.</p><div className="marketing-actions"><a className="marketing-button marketing-primary" href="#consultation">Discuss your campaign</a><a className="marketing-text-link" href="#services">See what’s included</a></div><p className="marketing-caption">A focused strategy. Clear reporting. A budget you control.</p></div>
        <aside className="marketing-brief" aria-label="Our campaign planning framework"><div className="marketing-brief-top"><span>THE CAMPAIGN BLUEPRINT</span><span>LoomIQ</span></div><h2>Good campaigns start<br />with the right questions.</h2><dl><div><dt>Your objective</dt><dd>More enquiries, sales or awareness?</dd></div><div><dt>Your audience</dt><dd>Who needs what you offer?</dd></div><div><dt>Your message</dt><dd>What makes your business the choice?</dd></div><div><dt>Your next step</dt><dd>A clear path from ad to action.</dd></div></dl><div className="marketing-brief-bottom"><span>Strategy</span><span>Creative</span><span>Testing</span><span>Learning</span></div></aside>
      </section>
      <div className="marketing-principles"><div className="marketing-container"><p>Built around your business</p><p>Facebook & Instagram campaigns</p><p>Clear scope before launch</p></div></div>
      <section id="services" className="marketing-section marketing-container"><div className="marketing-section-heading"><div><p className="marketing-eyebrow">WHAT WE DO</p><h2>From a clear plan<br />to a better campaign.</h2></div><p>One connected service for businesses ready to advertise with purpose, whether you’re starting fresh or rethinking an existing campaign.</p></div><div className="marketing-services">{services.map(([label, title, description]) => <article key={label}><p className="marketing-service-label">{label}</p><h3>{title}</h3><p>{description}</p></article>)}</div></section>
      <section id="approach" className="marketing-approach"><div className="marketing-container marketing-approach-grid"><div><p className="marketing-eyebrow">HOW WE WORK</p><h2>Less guesswork.<br />More direction.</h2><p>We start with your business, agree on the plan and keep the conversation going as your campaigns run.</p><a className="marketing-text-link" href="#consultation">Tell us what you want to achieve</a></div><ol><li><h3>Understand your business</h3><p>Discuss your offer, target customers, goals and the way your team handles enquiries.</p></li><li><h3>Build the launch plan</h3><p>Agree on scope, management fees, ad budget, creative and the actions we’ll measure.</p></li><li><h3>Launch, learn and refine</h3><p>Review campaign performance, test new ideas and share practical recommendations.</p></li></ol></div></section>
      <section className="marketing-section marketing-container marketing-scope"><div><p className="marketing-eyebrow">A SENSIBLE START</p><h2>Your goals set the scope.<br />Your budget sets the pace.</h2></div><div><p>Every business starts somewhere different. We’ll recommend a scope after understanding your offer and what you want your campaigns to achieve.</p><ul><li>Management fees and ad spend explained separately</li><li>Campaign goals and responsibilities agreed before launch</li><li>No promises of guaranteed leads or sales</li></ul><a className="marketing-button marketing-secondary" href="#consultation">Request a tailored proposal</a></div></section>
      <section id="questions" className="marketing-faq marketing-container"><div><p className="marketing-eyebrow">BEFORE WE BEGIN</p><h2>A few useful answers.</h2></div><div>{faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
      <section id="consultation" className="marketing-consultation"><div className="marketing-container marketing-contact-grid"><div><p className="marketing-eyebrow">LET’S TALK ABOUT YOUR BUSINESS</p><h2>What would growth<br />look like for you?</h2><p>Tell us where you are and where you’d like to go. We’ll reply by email to discuss your goals and the right next step.</p><a className="marketing-text-link" href="tel:93543555930">Call 93543555930</a><br /><a className="marketing-text-link" href="tel:+918222088524">Call +91 82220 88524</a><br /><a className="marketing-text-link" href="mailto:loomiq2025@gmail.com">loomiq2025@gmail.com</a><p className="marketing-caption">Looking for business software instead? <a href={base}>Explore LoomIQ ERP.</a></p></div>
      {status === 'sent' ? <div className="marketing-success" role="status"><h3>Your enquiry is with us.</h3><p>Thanks for sharing your plans. The LoomIQ team will reply to your email to discuss your campaign.</p><button className="marketing-button marketing-secondary" onClick={() => setStatus('idle')}>Send another enquiry</button></div> : <form className="marketing-form" onSubmit={submit} aria-busy={status === 'sending'}><div className="marketing-form-row"><label>Your name<input name="name" autoComplete="name" required minLength={2} maxLength={100} placeholder="Full name" /></label><label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@business.com" /></label></div><label>Business name or website<input name="business" autoComplete="organization" required maxLength={200} placeholder="Tell us about your business" /></label><div className="marketing-form-row"><label>Primary goal<select name="goal" required defaultValue=""><option value="" disabled>Select a goal</option><option>Generate enquiries</option><option>Increase online sales</option><option>Build brand awareness</option><option>Improve existing campaigns</option><option>Help me decide</option></select></label><label>Monthly ad budget<select name="budget" required defaultValue=""><option value="" disabled>Select a budget</option><option>Under ₹15,000</option><option>₹15,000–₹30,000</option><option>₹30,000–₹75,000</option><option>Above ₹75,000</option><option>Help me plan a budget</option></select></label></div><label>What would you like to achieve?<textarea name="message" rows={4} required minLength={10} maxLength={3500} placeholder="What do you offer, who do you want to reach, and what’s your biggest marketing challenge?" /></label><p className="marketing-form-note">We’ll use these details to respond to your enquiry. Read our <a href={base + 'privacy'}>Privacy Policy</a>.</p>{error && <p className="marketing-error" role="alert">{error}</p>}<button className="marketing-button marketing-primary" disabled={status === 'sending'} type="submit">{status === 'sending' ? 'Sending enquiry…' : 'Send my enquiry'}</button></form>}
      </div></section>
    </main>
    <footer className="marketing-footer marketing-container"><div><a className="marketing-brand" href={base}>LoomIQ</a><p>Business software. Digital growth.</p></div><nav aria-label="Footer navigation"><a href={base}>LoomIQ ERP</a><a href={base + 'privacy'}>Privacy</a><a href={base + 'terms'}>Terms</a><a href="#consultation">Contact</a></nav><p>© {new Date().getFullYear()} LoomIQ</p><small>Facebook, Instagram and Meta are trademarks of Meta Platforms, Inc. LoomIQ is an independent service provider.</small></footer>
  </div>;
}
