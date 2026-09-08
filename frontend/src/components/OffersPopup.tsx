import { useOffer } from "../offer";
import { useEffect, useRef, useState } from "react";
import { trackEvent } from "../analytics";

function OffersPopup() {
  const { offer, ready } = useOffer();
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog || offer.signedUp) return;
    const trigger = triggerRef.current;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [isOpen, offer.signedUp]);

  const closePopup = () => {
    setIsOpen(false);
    trackEvent("offers_popup_dismissed");
  };

  if (!ready || offer.signedUp) return null;

  return (
    <>
      <button ref={triggerRef} className="offers-trigger" type="button" aria-haspopup="dialog" onClick={() => {
        setIsOpen(true);
        trackEvent("offers_popup_viewed");
      }}>
        <span aria-hidden="true">✦</span>
        Your welcome offer
      </button>
      {isOpen && <dialog ref={dialogRef} className="offers-popup" aria-labelledby="offers-title" aria-describedby="offers-description" onCancel={(event) => {
        event.preventDefault();
        closePopup();
      }} onClick={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.target === event.currentTarget && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) closePopup();
      }}>
        <button className="offers-popup-close" type="button" onClick={closePopup} aria-label="Close welcome offer" autoFocus>×</button>
        <div className="offers-hero">
          <p className="offers-kicker"><span aria-hidden="true">✦</span> A welcome to better work</p>
          <h2 id="offers-title">Your next chapter.<br /><em>A better start.</em></h2>
          <p id="offers-description">Orders, stock, and production. One connected workspace. Two ways to get started.</p>
        </div>
        <div className="offers-content">
          <div className="offers-choice offers-choice-featured">
            <div><span className="offers-choice-label">Ready to get going?</span><strong>50% <span>off</span></strong><p>On your membership month</p></div>
            <span className="offers-choice-icon" aria-hidden="true">↗</span>
          </div>
          <div className="offers-divider"><span>or explore first</span></div>
          <div className="offers-choice offers-choice-trial"><div><strong>7-day free trial</strong><p>Get a feel for LoomIQ with your team.</p></div><span className="offers-trial-icon" aria-hidden="true">→</span></div>
          <a className="button button-primary offers-popup-cta" href={import.meta.env.BASE_URL + "signup"} onClick={() => {
            trackEvent("offers_popup_cta_clicked");
            setIsOpen(false);
          }}>Create my account <span aria-hidden="true">→</span></a>
          <p className="offers-reassurance">No card needed to sign up · Choose your option next</p>
          <p className="offers-popup-note">Trial and discount cannot be combined. Trial accounts are excluded from the discount. The purchase offer renews daily at midnight IST; later months use regular pricing.</p>
          <button className="offers-later" type="button" onClick={closePopup}>I’ll keep exploring</button>
        </div>
      </dialog>}
    </>
  );
}

export default OffersPopup;
