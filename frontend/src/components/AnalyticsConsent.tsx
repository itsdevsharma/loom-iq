import { useState } from 'react';
import { initializeAnalytics } from '../analytics';
import './AnalyticsConsent.css';
export default function AnalyticsConsent() {
  const [open, setOpen] = useState(() => {
    try { return !localStorage.getItem('loomiq-analytics'); } catch { return true; }
  });
  function choose(allow: boolean) {
    try { localStorage.setItem('loomiq-analytics', allow ? 'granted' : 'denied'); } catch { /* Without storage, analytics remains disabled. */ }
    setOpen(false);
    if (allow) initializeAnalytics();
    else if (window.gtag) window.location.reload();
  }
  return open ? <aside className="analytics-consent" aria-label="Analytics preference"><p>We use essential cookies for accounts and checkout. Allow optional analytics to help us understand website use?</p><div><button onClick={() => choose(false)}>Essential only</button><button onClick={() => choose(true)}>Allow analytics</button><a href={import.meta.env.BASE_URL + 'privacy'}>Privacy</a></div></aside> : <button className="analytics-settings" onClick={() => setOpen(true)}>Cookie preferences</button>;
}
