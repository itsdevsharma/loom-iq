import { useEffect, type ReactNode } from 'react';
import { trackEvent } from '../analytics';
import MarketingDeliverables from './MarketingDeliverables';
import { SectionHeader, SectionWrapper } from '../components/SectionLayout';
import ConsultationForm from '../components/ConsultationForm';
import { AgencyFooter, AgencyHeader, ServiceIcon } from '../components/AgencyChrome';
import { agencyServices, overviewService, type AgencyService } from '../agencyContent';
import { websitePricing } from '../websiteContent';
import dashboard from '../assets/tour-dashboard.webp';
import '../Agency.css';
import '../AgencyHome.css';
const base = import.meta.env.BASE_URL;
const commonQuestions: [string, string][] = [
  ['Which businesses do you work with?', 'We work with businesses across industries, including e-commerce, restaurants, startups, local services, manufacturing and education. We begin by understanding your audience, offer and goals.'],
  ['Can I choose just one marketing service?', 'Yes. Start with an individual service or a combination agreed during the consultation. We recommend a scope based on your goals, resources and budget.'],
  ['Is the consultation free?', 'Yes. The initial consultation helps us understand your business and discuss possible next steps. Any paid work is scoped and quoted before you commit.'],
  ['Are advertising budgets included in your fees?', 'Management fees and media spend are separate. Your proposal explains the scope, responsibilities, advertising budget and applicable charges.'],
  ['Can you guarantee leads, rankings or sales?', 'No. Results depend on your offer, competition, budget, website and sales process. We agree on meaningful goals and report performance transparently.'],
  ['Do I need to buy ERP software to use your marketing services?', 'No. Digital marketing and ERP software are independent offerings. You can use either service on its own.'],
];
function AgencyShell({ children, home = false }: { children: ReactNode; home?: boolean }) {
  return <div className={`agency-site${home ? " agency-home" : ""}`}><a className="agency-skip" href="#agency-main">Skip to content</a><AgencyHeader /><main id="agency-main">{children}</main><AgencyFooter /></div>;
}
function ServiceCard({ service }: { service: AgencyService }) {
  const href = base + 'services/' + service.slug;
  return <article className="agency-service-item"><ServiceIcon type={service.icon} /><h3><a href={href}>{service.title}</a></h3><p>{service.description}</p><a className="agency-text-link" href={href}>Explore {service.shortTitle}</a></article>;
}
function ServicesList() {
  return <div className="agency-service-grid">{agencyServices.map(service => <ServiceCard key={service.slug} service={service} />)}</div>;
}
function ProcessStep({ title, description, number }: { title: string; description: string; number: number }) {
  return <li><span className="agency-step-number" aria-hidden="true">{String(number).padStart(2, '0')}</span><h3>{title}</h3><p>{description}</p></li>;
}
function IndustryCard({ title, description }: { title: string; description: string }) {
  return <li><h3>{title}</h3><p>{description}</p></li>;
}

function Questions({ questions = commonQuestions, home = false }: { questions?: [string, string][]; home?: boolean }) {
  if (home) return <SectionWrapper id="faq" labelledBy="faq-title" containerClassName="agency-faq"><SectionHeader id="faq-title" eyebrow="BEFORE WE BEGIN" title="Frequently asked questions." description="Clear answers before you take the next step." /><div>{questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></SectionWrapper>;
  return <section id="faq" className="agency-section agency-container agency-faq"><div><p className="agency-kicker">BEFORE WE BEGIN</p><h2>Frequently asked questions.</h2><p>Clear answers before you take the next step.</p></div><div>{questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>;
}
function Contact({ consultation = '#consultation', home = false }: { consultation?: string; home?: boolean }) {
  const content = <><div><p className="agency-kicker">YOUR NEXT STEP</p><h2 id={home ? "contact-title" : undefined}>Let’s talk about what<br />growth means for you.</h2><p>Tell us about your business. We’ll help you explore a sensible starting point.</p><a className="agency-button agency-button-primary" href={consultation}>Get a Free Consultation</a></div><address><span>Speak with the LoomiQ team</span><a href="tel:+918222088524">+91 82220 88524</a><a href="tel:93543555930">93543555930</a><a href="mailto:loomiq2025@gmail.com">loomiq2025@gmail.com</a><a className="agency-text-link" href="https://wa.me/918222088524" target="_blank" rel="noreferrer" onClick={() => trackEvent("contact_whatsapp")}>Chat on WhatsApp</a></address></>;
  return home ? <SectionWrapper id="contact" labelledBy="contact-title" tone="highlight" className="agency-contact" containerClassName="agency-contact-grid">{content}</SectionWrapper> : <section id="contact" className="agency-contact"><div className="agency-container">{content}</div></section>;
}
function ErpPreview() {
  return <SectionWrapper id="erp" labelledBy="erp-title" className="agency-erp" containerClassName="agency-home-dashboard">
    <div><SectionHeader id="erp-title" eyebrow="SMART TECHNOLOGY, TOO" title={<>Attract customers.<br />Keep operations connected.</>} description="Already attracting customers? Keep orders, inventory, sales and billing connected with our separate ERP offering. Explore the product screens and compare plans." />
      <span className="agency-product-label">LOOMIQ ERP</span><h3>One connected view<br />of your business.</h3><p>Bring operational records into one place, with product walkthroughs and guided onboarding.</p>
      <div className="agency-actions"><a className="agency-button agency-button-primary" href={base + 'erp'}>Explore ERP Software</a><a className="agency-text-link" href={base + 'demo'}>Request a demo</a></div>
    </div>
    <figure><a href={base + 'erp#showcase'}><img src={dashboard} alt="LoomiQ ERP dashboard showing sales, purchasing and production activity" width="1652" height="952" loading="lazy" /></a><figcaption>Product interface preview · example data</figcaption></figure>
  </SectionWrapper>;
}
function ErpPricingPreview() {
  const prices = websitePricing();
  return <SectionWrapper id="pricing" labelledBy="home-pricing-title" tone="soft" className="agency-home-pricing">
    <SectionHeader id="home-pricing-title" eyebrow="ERP SOFTWARE PRICING" title="ERP plans at a glance" description="Standard monthly software pricing. Marketing services are quoted separately." />
    <dl className="agency-home-plan-grid">{Object.entries(prices).map(([name, plan]) => <div key={name}><dt>{name}</dt><dd>₹{plan.recurring.toLocaleString('en-IN')}<span>/month</span></dd></div>)}</dl>
    <a className="agency-button agency-button-primary" href={base + 'erp/pricing'}>Compare ERP plans</a>
  </SectionWrapper>;
}

export function AgencyHome() {
  return <AgencyShell home>
    <SectionWrapper id="hero" labelledBy="hero-title" tone="highlight" className="agency-hero" containerClassName="agency-hero-grid"><div className="agency-hero-copy"><p className="agency-kicker">DIGITAL MARKETING & BUSINESS SOLUTIONS</p><h1 id="hero-title">Reach the right customers.<br /><span>Give every campaign a clear goal.</span></h1><p className="agency-lead">For businesses that need more relevant enquiries and a clearer digital presence. Plan your Meta Ads, Google Ads, SEO and social media around your audience, budget and sales process.</p><div className="agency-actions"><a className="agency-button agency-button-primary" href="#consultation">Get a Free Consultation</a><a className="agency-text-link" href="#services">Explore Our Services</a><a className="agency-text-link" href="https://wa.me/918222088524" target="_blank" rel="noreferrer" onClick={() => trackEvent("contact_whatsapp")}>Chat on WhatsApp</a></div><ul className="agency-hero-promises"><li>Scope and budget agreed before launch</li><li>Campaigns connected to your sales process</li><li>Reporting on spend, enquiries and next steps</li></ul><p className="agency-brand-line">Looking for business software? <a href={base + "erp"}>Explore LoomiQ ERP</a></p></div><div id="consultation"><ConsultationForm /></div></SectionWrapper>
    <SectionWrapper id="trust" labelledBy="trust-title" className="agency-home-trust">
      <SectionHeader id="trust-title" eyebrow="BEFORE YOU COMMIT" title="Clear expectations from the start." description="Scope and budget agreed before launch. Campaigns connected to your sales process." />
      <div className="agency-expectations"><div><h3>Clear scope.</h3><p>Deliverables and fees agreed in your proposal.</p></div><div><h3>Your budget.</h3><p>Media spend is separate from management fees.</p></div><div><h3>Useful measures.</h3><p>Review enquiries and sales feedback alongside clicks.</p></div></div>
    </SectionWrapper>
    <SectionWrapper id="services" labelledBy="services-title" tone="soft">
      <SectionHeader id="services-title" eyebrow="OUR DIGITAL MARKETING SERVICES" title={<>The right channels.<br />One connected strategy.</>} description="Start with your business goals. Build the mix of paid advertising, organic visibility and lead generation that supports them." />
      <ServicesList />
    </SectionWrapper>
    <SectionWrapper id="process" labelledBy="process-title">
      <SectionHeader id="process-title" eyebrow="OUR MARKETING PROCESS" title={<>From first conversation<br />to informed next steps.</>} description="A predictable working process, with clear scope and responsibilities at every stage." />
      <ol className="agency-process">{[['Discover', 'Understand your business, customers, current presence and goals.'], ['Plan', 'Agree on channels, creative, scope, budget and measures of success.'], ['Launch', 'Prepare assets and tracking, review approvals and launch the agreed work.'], ['Refine', 'Review performance, test ideas and decide what to improve next.']].map(([title, description], index) => <ProcessStep key={title} title={title} description={description} number={index + 1} />)}</ol>
    </SectionWrapper>
    <MarketingDeliverables />
    <SectionWrapper id="industries" labelledBy="industries-title" className="agency-home-industries">
      <SectionHeader id="industries-title" eyebrow="INDUSTRIES WE SERVE" title={<>Different businesses.<br />A strategy built for yours.</>} description="We adapt the plan to your customers and goals, rather than fitting every business into the same campaign." />
      <ul className="agency-industry-grid">{[['E-commerce & retail', 'Connect product campaigns with purchase and repeat-order goals.'], ['Restaurants & hospitality', 'Plan around your location, bookings and local demand.'], ['Startups & growing brands', 'Test positioning and channels against a defined starting budget.'], ['Local & service businesses', 'Connect enquiries to your service area and follow-up process.'], ['Manufacturers & B2B', 'Plan for longer buying cycles and qualified sales conversations.'], ['Education & institutions', 'Align enquiry campaigns with programmes and admission periods.']].map(([title, description]) => <IndustryCard key={title} title={title} description={description} />)}</ul>
    </SectionWrapper>
    <SectionWrapper id="about" labelledBy="strategy-title" tone="dark" className="agency-why" containerClassName="agency-why-grid"><div><p className="agency-kicker">WHY CHOOSE LOOMIQ?</p><h2 id="strategy-title">Your business sets<br />the direction.</h2><p>LoomiQ brings digital marketing and business technology under one brand. Our approach starts with understanding what you sell, who you serve and what you want to improve.</p><div className="agency-reasons"><div><h3>Strategy before spend</h3><p>A clear objective, audience and scope before a campaign goes live.</p></div><div><h3>Decisions backed by data</h3><p>Agreed measures and campaign reviews to guide what comes next.</p></div><div><h3>Reporting you can use</h3><p>Understand the work, the spend and the performance without guesswork.</p></div></div></div><aside className="agency-dashboard" aria-label="Illustrative campaign reporting framework"><div className="agency-dashboard-bar"><span>LoomiQ / Campaign overview</span><span>REPORTING FRAMEWORK</span></div><h3>Measure what matters.</h3><p>Set the goal. Choose the channel. Agree on the measure.</p><div className="agency-report-table" tabIndex={0} role="region" aria-label="Scrollable campaign measurement framework"><table><thead><tr><th scope="col">Channel</th><th scope="col">Goal</th><th scope="col">Review</th></tr></thead><tbody><tr><td>Meta Ads</td><td>Enquiries</td><td>Lead quality & cost</td></tr><tr><td>Google Ads</td><td>Conversions</td><td>Actions & spend</td></tr><tr><td>SEO</td><td>Visibility</td><td>Organic discovery</td></tr><tr><td>Social media</td><td>Engagement</td><td>Content response</td></tr></tbody></table></div><p className="agency-caption">Illustrative planning view. This is not a live client report or a claim of results.</p></aside></SectionWrapper>
    <ErpPreview /><ErpPricingPreview /><Questions home /><Contact home />
  </AgencyShell>;
}

export function AgencyServicePage({ service = overviewService }: { service?: AgencyService }) {
  useEffect(() => { trackEvent('view_service'); }, [service.slug]);
  const isOverview = service.slug === 'digital-marketing';
  return <AgencyShell><section className="agency-service-hero agency-container agency-section"><nav className="agency-breadcrumb" aria-label="Breadcrumb"><a href={base}>Home</a><span>/</span><a href={base + 'digital-marketing'}>Services</a><span>/</span><span aria-current="page">{service.shortTitle}</span></nav><p className="agency-kicker">{service.title.toUpperCase()}</p><h1>{service.headline}</h1><p className="agency-lead">{service.intro}</p><div className="agency-actions"><a className="agency-button agency-button-primary" href="#consultation">{service.slug === 'seo' ? 'Request a Website Audit' : 'Get a Free Consultation'}</a><a className="agency-text-link" href="#included">Explore the service</a></div><p className="agency-caption">For businesses across industries. Scope and fees agreed before work begins.</p></section><section id="included" className="agency-service-includes"><div className="agency-container agency-section"><div className="agency-section-heading"><div><p className="agency-kicker">WHAT’S INCLUDED IN THE PLAN</p><h2>{service.outcome}</h2></div><p>We tailor the scope to your business. Your proposal confirms deliverables, responsibilities, timing and costs.</p></div><div className="agency-includes-grid">{service.includes.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>{isOverview && <section className="agency-container agency-section"><div className="agency-section-heading"><div><p className="agency-kicker">EXPLORE OUR SERVICES</p><h2>A focused plan for each channel.</h2></div></div><ServicesList /></section>}<section className="agency-container agency-section agency-service-contact"><div><p className="agency-kicker">LET’S PLAN YOUR NEXT STEP</p><h2>Start with a conversation.</h2><p>Tell us about your business and what you want to achieve. We’ll contact you on the number you provide to discuss a suitable starting point.</p><p>Advertising spend is separate from management fees. No guaranteed leads, rankings or sales.</p><a className="agency-text-link" href="tel:+918222088524">Call +91 82220 88524</a><br /><a className="agency-text-link" href="tel:93543555930">Call 93543555930</a></div><div id="consultation"><ConsultationForm key={service.slug} service={service.slug === 'seo' ? 'Website Audit' : isOverview ? 'Digital Marketing' : service.title} /></div></section><Questions questions={[...service.questions, ...commonQuestions.slice(2, 5)]} /><Contact /></AgencyShell>;
}
