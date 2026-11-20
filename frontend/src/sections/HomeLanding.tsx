import { trackEvent } from '../analytics';
import '../HomeLanding.css';

const base = import.meta.env.BASE_URL;

export function HomeHero() {
  return <>
    <section id="hero" className="home-intro" aria-labelledby="home-title">
      <div className="home-intro-copy">
        <p className="home-label">DIGITAL MARKETING WITH META ADS</p>
        <h1 id="home-title">Grow your business<br /><span>with Meta ads.</span></h1>
        <p className="home-intro-text">Reach new customers with digital marketing built around Facebook and Instagram ads. We help you plan your campaigns, test your message and understand where your advertising budget goes.</p>
        <div className="home-actions">
          <a className="home-button home-button-primary" href={base + 'digital-marketing#consultation'}>Discuss your campaign</a>
          <a className="home-link" href="#solutions">Explore our services</a>
        </div>
        <p className="home-intro-note">Facebook & Instagram · Strategy, creative and optimisation</p>
      </div>
      <aside className="home-campaign" aria-labelledby="home-campaign-title">
        <div className="home-campaign-label"><span>FACEBOOK & INSTAGRAM</span><span>LoomIQ</span></div>
        <h2 id="home-campaign-title">A clear plan.<br />From first impression<br />to the next enquiry.</h2>
        <dl>
          <div><dt>Strategy</dt><dd>Your offer, your audience, your goals.</dd></div>
          <div><dt>Creative</dt><dd>Ad concepts and messages worth testing.</dd></div>
          <div><dt>Campaigns</dt><dd>Set up, review and refine your Meta ads.</dd></div>
          <div><dt>Reporting</dt><dd>Understand spend, enquiries and next steps.</dd></div>
        </dl>
        <p>Built around your business. Scoped to your budget.</p>
      </aside>
    </section>
    <section id="solutions" className="home-solutions" aria-labelledby="solutions-title">
      <div className="home-solutions-heading"><p className="home-label">CHOOSE YOUR NEXT STEP</p><h2 id="solutions-title">Better operations. More opportunity.</h2><p>Start with what your business needs today.</p></div>
      <div className="home-solutions-grid">
        <article className="home-solution">
          <span className="home-solution-category">BUSINESS MANAGEMENT</span>
          <h3>Get your work<br />in one place.</h3>
          <p>Connect orders, inventory, production and billing so your team can work from the same information.</p>
          <ul><li>Keep stock and orders connected</li><li>Follow production through to dispatch</li><li>Bring sales and invoicing together</li></ul>
          <div className="home-solution-actions"><a className="home-button home-button-primary" href="#features">Explore LoomIQ ERP</a><a className="home-link" href="#pricing">View software plans</a></div>
        </article>
        <article className="home-solution home-solution-marketing">
          <span className="home-solution-category">DIGITAL MARKETING</span>
          <h3>Put your business<br />in front of new customers.</h3>
          <p>Facebook and Instagram advertising with a clear campaign plan, considered creative and ongoing optimisation.</p>
          <ul><li>Campaign strategy built around your goals</li><li>Creative direction and message testing</li><li>Clear reporting on spend and enquiries</li></ul>
          <div className="home-solution-actions"><a className="home-button home-button-primary" href={base + 'digital-marketing'}>Explore Meta ads services</a><a className="home-link" href={base + 'digital-marketing#consultation'}>Discuss your campaign</a></div>
        </article>
      </div>
      <p className="home-solutions-note">Choose either service independently. Marketing fees and advertising spend are scoped separately from ERP plans.</p>
    </section>
  </>;
}

export function HomeContact() {
  return <section className="home-contact" id="home-contact" aria-labelledby="home-contact-title">
    <div><p className="home-label">LET’S FIND THE RIGHT FIT</p><h2 id="home-contact-title">What’s next for your business?</h2><p>Whether you need more clarity in your operations or a plan to reach new customers, tell us where you want to go.</p><div className="home-actions"><a className="home-button home-button-primary" href={base + 'digital-marketing#consultation'}>Discuss digital marketing</a><a className="home-link" href={base + 'demo'} onClick={() => trackEvent('demo_cta_clicked')}>Request an ERP walkthrough</a></div></div>
    <address><span>Talk to the LoomIQ team</span><a href="tel:+918222088524">+91 82220 88524</a><a href="tel:93543555930">93543555930</a><a className="home-contact-email" href="mailto:loomiq2025@gmail.com">loomiq2025@gmail.com</a></address>
  </section>;
}
