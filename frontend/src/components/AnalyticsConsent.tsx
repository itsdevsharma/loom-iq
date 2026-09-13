import { cmsValue } from '../websiteContent';
import { useEffect, useRef, useState } from 'react';
import { initializeAnalytics } from '../analytics';
import './AnalyticsConsent.css';
export default function AnalyticsConsent() {
  const [open, setOpen] = useState(() => !hasStoredChoice());
  const [submitted, setSubmitted] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.show();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  useEffect(() => {
    const reopen = () => { setSubmitted(false); setOpen(true); };
    window.addEventListener('loomiq-consent-settings', reopen);
    return () => window.removeEventListener('loomiq-consent-settings', reopen);
  }, []);
  function choose(allow: boolean) {
    if (submitted) return;
    setSubmitted(true);
    try { localStorage.setItem('loomiq-analytics', allow ? 'granted' : 'denied'); } catch { /* Without storage, analytics remains disabled. */ }
    setOpen(false);
    if (allow) initializeAnalytics();
    else if (window.gtag || window.fbq) window.location.reload();
  }
  return (
    <dialog ref={dialogRef} className="analytics-consent" aria-labelledby="analytics-consent-title" onCancel={() => setOpen(false)}>
      <h2 id="analytics-consent-title">{cmsValue("AnalyticsConsent.1", "Analytics preference")}</h2>
      <p>{cmsValue("AnalyticsConsent.2", "We use essential cookies for accounts and checkout. Allow optional analytics to help us understand website use?")}</p>
      <div>
        <button type="button" disabled={submitted} onClick={() => choose(false)}>{cmsValue("AnalyticsConsent.3", "Essential only")}</button>
        <button type="button" disabled={submitted} onClick={() => choose(true)}>{cmsValue("AnalyticsConsent.4", "Allow analytics")}</button>
        <a href={import.meta.env.BASE_URL + 'privacy'}>{cmsValue("AnalyticsConsent.5", "Privacy")}</a>
      </div>
    </dialog>
  );
}

function hasStoredChoice(): boolean {
  try { return Boolean(localStorage.getItem('loomiq-analytics')); } catch { return false; }
}
