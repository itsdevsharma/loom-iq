import { useEffect, useRef, useState, type ReactNode } from 'react';
import logo from '../assets/company.logo.webp';
import { agencyServices } from '../agencyContent';
const base = import.meta.env.BASE_URL;
function consultationHref() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const onMarketingPage = path === (base.replace(/\/$/, '') || '/') || path === base + 'digital-marketing' || agencyServices.some(service => path === base + 'services/' + service.slug);
  return onMarketingPage ? '#consultation' : base + '#consultation';
}
export function AgencyHeader() {
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const services = useRef<HTMLDetailsElement>(null);
  function close() { setOpen(false); if (services.current) services.current.open = false; }
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !header.current?.contains(event.target)) close(); };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const serviceOpen = services.current?.open;
      close();
      if (window.innerWidth <= 1000) toggle.current?.focus();
      else if (serviceOpen) services.current?.querySelector('summary')?.focus();
    };
    const resize = () => { if (window.innerWidth > 1000) setOpen(false); };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape); window.addEventListener('resize', resize);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); window.removeEventListener('resize', resize); };
  }, []);
  return <header className="agency-header" ref={header}><div className="agency-container agency-header-inner">
    <a className="agency-brand" href={base} aria-label="LoomiQ home"><img src={logo} alt="" width="36" height="36" /><span>LoomiQ</span></a>
    <button className="agency-menu-toggle" ref={toggle} type="button" aria-label={open ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={open} aria-controls="agency-navigation" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Menu'}</button>
    <nav id="agency-navigation" className={open ? 'is-open' : ''} aria-label="Primary navigation">
      <a href={base} onClick={close}>Home</a>
      <details className="agency-services-menu" ref={services}><summary>Services <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12"><path d="m2 4 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg></summary><div><a href={base + 'digital-marketing'} onClick={close}>All digital marketing services</a>{agencyServices.map(item => <a key={item.slug} href={base + 'services/' + item.slug} onClick={close}>{item.title}</a>)}</div></details>
      <a href={base + 'erp'} onClick={close}>ERP Software</a><a href={base + '#about'} onClick={close}>About Us</a><a href={base + '#contact'} onClick={close}>Contact</a><a className="agency-button agency-button-primary" href={consultationHref()} onClick={close}>Get Free Consultation</a>
    </nav>
  </div></header>;
}
export function AgencyFooter() {
  return <footer className="agency-footer"><div className="agency-container"><div className="agency-footer-grid"><div><a className="agency-brand" href={base}>LoomiQ</a><p>Your partner in digital growth<br />& business technology.</p><a href="mailto:loomiq2025@gmail.com">loomiq2025@gmail.com</a></div><div><h2>Digital marketing</h2>{agencyServices.map(item => <a key={item.slug} href={base + 'services/' + item.slug}>{item.title}</a>)}</div><div><h2>Business solutions</h2><a href={base + 'erp'}>LoomiQ ERP</a><a href={base + 'erp/pricing'}>ERP plans & pricing</a><a href={base + 'demo'}>Request an ERP demo</a><a href={base + 'account'}>My account</a></div><address><h2>Let’s talk</h2><a href="tel:+918222088524">+91 82220 88524</a><a href="tel:93543555930">93543555930</a><a href={consultationHref()}>Request a consultation</a></address></div><div className="agency-footer-bottom"><span>© {new Date().getFullYear()} LoomiQ. All rights reserved.</span><nav aria-label="Legal navigation"><a href={base + 'privacy'}>Privacy</a><a href={base + 'terms'}>Terms</a><a href={base + 'refunds'}>ERP refunds</a><button type="button" onClick={() => window.dispatchEvent(new Event('loomiq-consent-settings'))}>Analytics settings</button></nav></div></div></footer>;
}
export function ServiceIcon({ type }: { type: string }) {
  const paths: Record<string, ReactNode> = {
    target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><path d="m12 12 8-8" /></>,
    search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></>,
    chart: <><path d="M4 3v17h17M8 15l4-5 4 2 5-7" /></>,
    conversation: <path d="M4 4h16v12H9l-5 4V4ZM8 8h8M8 12h5" />,
    sliders: <><path d="M6 3v7m0 4v7M12 3v12m0 4v2M18 3v3m0 4v11M3 10h6m0 5h6m0-9h6" /></>,
    people: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m3 10v-3a6 6 0 0 0-2-4" /></>,
  };
  return <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type] || paths.target}</svg>;
}
