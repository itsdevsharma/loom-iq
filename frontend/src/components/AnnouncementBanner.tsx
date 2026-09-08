import { useOffer } from '../offer';
import { trackEvent } from '../analytics';

export default function AnnouncementBanner() {
  const { offer, remaining, ready } = useOffer();
  const seconds = Math.max(0, Math.floor(remaining / 1000));
  const countdown = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(value => String(value).padStart(2, '0')).join(':');
  return <aside className="purchase-announcement" aria-label="50 percent membership offer">
    <div className="purchase-announcement-copy">
      <span className="purchase-announcement-badge">50% OFF</span>
      <div><strong>{ready && offer.reason === 'expired' ? 'Your 24-hour offer has ended.' : 'Save 50% on your membership month.'}</strong>
        <small>Everyone qualifies · 24h from first visit · Regular rates afterward.</small>
      </div>
    </div>
    <div className="purchase-announcement-action">
      {ready && offer.expiresAt && remaining > 0 && <div className="purchase-announcement-timer"><span>Your offer ends in</span><strong role="timer" aria-live="off">{countdown}</strong></div>}
      <a href="#pricing" className="button button-primary" onClick={() => trackEvent('direct_purchase_clicked')}>{offer.eligible ? 'Get 50% off →' : 'View plans →'}</a>
    </div>
  </aside>;
}
