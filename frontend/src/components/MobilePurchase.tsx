import { useEffect, useState } from 'react';
import { useOffer } from '../offer';
import { websitePricing } from '../websiteContent';
export default function MobilePurchase() {
  const { offer, ready } = useOffer();
  const [show, setShow] = useState(false);
  const starter = websitePricing().Starter;
  const discounted = ready && offer.eligible;
  const price = discounted ? starter.firstMonth : starter.recurring;
  const formattedPrice = `₹${price.toLocaleString("en-IN")}`;

  useEffect(() => {
    const update = () => setShow(window.scrollY > Math.max(260, window.innerHeight * 0.65));
    update(); window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return <aside className={`mobile-purchase${show ? ' is-visible' : ''}`} aria-label="Quick purchase">
    <span><small>{discounted ? 'ERP launch price from' : 'ERP plans from'}</small><strong>{formattedPrice}/month</strong></span>
    <a className="button button-primary" href={import.meta.env.BASE_URL + "erp/pricing#pricing"}>View ERP plans</a>
  </aside>;
}

