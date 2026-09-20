import { cmsValue } from '../websiteContent';
import { useOffer } from '../offer';
import { trackEvent } from '../analytics';

export default function AnnouncementBanner({ className = '' }: { className?: string }) {
  const { offer, remaining, ready } = useOffer();
  const seconds = Math.max(0, Math.floor(remaining / 1000));
  const countdown = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(value => String(value).padStart(2, '0')).join(':');
  const discount = offer.discountPercent || 50;
  const slots = offer.slotsRemaining;
  return <aside className={`purchase-announcement ${className}`.trim()} aria-label={cmsValue("AnnouncementBanner.1", "Limited-time membership offer")}>
    <div className="purchase-announcement-copy">
      <span className="purchase-announcement-badge">{discount}% OFF</span>
      <div><strong>{ready && offer.eligible ? 'Launch pricing is live — save on your first membership month.' : ready && offer.reason === 'purchased' ? 'Your first-purchase offer has been used.' : 'Explore LoomIQ plans and launch pricing.'}</strong>
        <small>{ready && offer.eligible && slots ? `Only ${slots} launch ${slots === 1 ? 'place' : 'places'} remaining` : 'Simple monthly plans · No automatic charges'}</small>
      </div>
    </div>
    <div className="purchase-announcement-action">
      {ready && offer.eligible && remaining > 0 && <div className="purchase-announcement-timer"><span>Offer ends in</span><strong role="timer" aria-live="off">{countdown}</strong></div>}
      <a href={cmsValue("AnnouncementBanner.7", "#pricing")} className="button button-primary" onClick={() => trackEvent('direct_purchase_clicked')}>{offer.eligible ? `Claim ${discount}% off` : 'View plans'} <span aria-hidden="true">→</span></a>
    </div>
  </aside>;
}
