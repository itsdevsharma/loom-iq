import { cmsValue } from '../websiteContent';
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
        <span aria-hidden="true">✦</span>{cmsValue("OffersPopup.1", " Your welcome offer ")}</button>
      {isOpen && <dialog ref={dialogRef} className="offers-popup" aria-labelledby="offers-title" aria-describedby="offers-description" onCancel={(event) => {
        event.preventDefault();
        closePopup();
      }} onClick={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.target === event.currentTarget && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) closePopup();
      }}>
        <button className="offers-popup-close" type="button" onClick={closePopup} aria-label={cmsValue("OffersPopup.2", "Close welcome offer")} autoFocus>×</button>
        <div className="offers-hero">
          <p className="offers-kicker"><span aria-hidden="true">✦</span>{cmsValue("OffersPopup.3", " A welcome to better work")}</p>
          <h2 id="offers-title">{cmsValue("OffersPopup.4", "Your next chapter.")}<br /><em>{cmsValue("OffersPopup.5", "A better start.")}</em></h2>
          <p id="offers-description">{cmsValue("OffersPopup.6", "Orders, stock, and production. One connected workspace. Two ways to get started.")}</p>
        </div>
        <div className="offers-content">
          <div className="offers-choice offers-choice-featured">
            <div><span className="offers-choice-label">{cmsValue("OffersPopup.7", "Ready to get going?")}</span><strong>{cmsValue("OffersPopup.discount", "{discount}")} <span>{cmsValue("OffersPopup.8", "off")}</span></strong><p>{cmsValue("OffersPopup.9", "On your membership month")}</p></div>
            <span className="offers-choice-icon" aria-hidden="true">↗</span>
          </div>
          <div className="offers-divider"><span>{cmsValue("OffersPopup.10", "or explore first")}</span></div>
          <div className="offers-choice offers-choice-trial"><div><strong>{cmsValue("OffersPopup.11", "7-day free trial")}</strong><p>{cmsValue("OffersPopup.12", "Get a feel for LoomIQ with your team.")}</p></div><span className="offers-trial-icon" aria-hidden="true">→</span></div>
          <a className="button button-primary offers-popup-cta" href={import.meta.env.BASE_URL + "signup"} onClick={() => {
            trackEvent("offers_popup_cta_clicked");
            setIsOpen(false);
          }}>{cmsValue("OffersPopup.13", "Create my account ")}<span aria-hidden="true">→</span></a>
          <p className="offers-reassurance">{cmsValue("OffersPopup.14", "No card needed to sign up · Choose your option next")}</p>
          <p className="offers-popup-note">{cmsValue("OffersPopup.15", "Trial accounts can use the purchase discount within 24 hours of their first offer visit. The deadline does not reset. Each checkout is a one-time payment with no automatic charges.")}</p>
          <button className="offers-later" type="button" onClick={closePopup}>{cmsValue("OffersPopup.16", "I’ll keep exploring")}</button>
        </div>
      </dialog>}
    </>
  );
}

export default OffersPopup;
