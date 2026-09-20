import { cmsValue } from '../websiteContent';
import { useOffer } from '../offer';
import { trackEvent } from '../analytics';

export default function AnnouncementBanner({ className = '' }: { className?: string }) {
  const { offer, remaining, ready } = useOffer();
  const seconds = Math.max(0, Math.floor(remaining / 1000));
  const countdown = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(value => String(value).padStart(2, '0')).join(':');
  return <aside className={`purchase-announcement ${className}`.trim()} aria-label={cmsValue("AnnouncementBanner.1", "50 percent membership offer")}>
    <div className="purchase-announcement-copy">
      <span className="purchase-announcement-badge">{cmsValue("AnnouncementBanner.2", "{discount} OFF")}</span>
      <div><strong>{ready && offer.reason === 'purchased' ? 'Your first-purchase offer has been used.' : ready && offer.reason === 'expired' ? cmsValue("AnnouncementBanner.3", "Your 24-hour offer has ended.") : cmsValue("AnnouncementBanner.4", "Save {discount} on your membership month.")}</strong>
        <small>{cmsValue("AnnouncementBanner.5", "Everyone qualifies · 24h from first visit · Regular rates afterward.")}</small>
      </div>
    </div>
    <div className="purchase-announcement-action">
      {ready && offer.eligible && remaining > 0 && <div className="purchase-announcement-timer"><span>{cmsValue("AnnouncementBanner.6", "Your offer ends in")}</span><strong role="timer" aria-live="off">{countdown}</strong></div>}
      <a href={cmsValue("AnnouncementBanner.7", "#pricing")} className="button button-primary" onClick={() => trackEvent('direct_purchase_clicked')}>{offer.eligible ? cmsValue("AnnouncementBanner.8", "Get {discount} off →") : cmsValue("AnnouncementBanner.9", "View plans →")}</a>
    </div>
  </aside>;
}
