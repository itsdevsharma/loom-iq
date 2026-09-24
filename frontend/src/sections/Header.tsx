import { cmsValue, siteLink } from '../websiteContent';
import { useCallback, useEffect, useRef, useState } from "react";
import logoImage from "../assets/company.logo.webp";
import { trackEvent } from "../analytics";

const navLinks = cmsValue("Header.1", [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
]);

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Dismiss the mobile panel with Escape, an outside tap, or a resize back to desktop.
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    const handleOutsidePointer = (event: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) setIsMenuOpen(false);
    };
    const desktopQuery = window.matchMedia("(min-width: 901px)");
    const handleDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setIsMenuOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handleOutsidePointer);
    desktopQuery.addEventListener("change", handleDesktop);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handleOutsidePointer);
      desktopQuery.removeEventListener("change", handleDesktop);
    };
  }, [isMenuOpen]);

  // Keep the page from scrolling behind the open mobile panel.
  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  return (
    <>
      <header
        ref={headerRef}
        className={`topbar ${isScrolled ? "topbar--scrolled" : ""} ${isMenuOpen ? "topbar--menu-open" : ""}`.trim()}
      >
        <div className="topbar-inner">
          <a className="brand" href={siteLink(cmsValue("Header.2", "#hero"))} onClick={closeMenu}>
            <img src={cmsValue("Header.3", logoImage)} alt={cmsValue("Header.4", "LoomIQ")} className="brand-logo" width="56" height="56" decoding="async" />{cmsValue("Header.5", " LoomIQ ")}</a>
          <button
            className={`menu-toggle ${isMenuOpen ? "is-open" : ""}`.trim()}
            type="button"
            aria-expanded={isMenuOpen}
            aria-controls="primary-navigation"
            aria-label={isMenuOpen ? cmsValue("Header.6", "Close navigation menu") : cmsValue("Header.7", "Open navigation menu")}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
          {/* Collapses to an inline row on desktop and becomes the mobile dropdown panel below 900px. */}
          <div className={`nav-panel ${isMenuOpen ? "is-open" : ""}`.trim()}>
            <nav id="primary-navigation" className="nav-links" aria-label={cmsValue("Header.8", "Primary navigation")}>
              {navLinks.map((link) => (
                <a key={link.label} href={siteLink(link.href)} onClick={closeMenu}>
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="nav-actions">
              <a href={import.meta.env.BASE_URL + 'account'} className="text-link" onClick={closeMenu}>{cmsValue("Header.9", "My account")}</a>
              <a href="#pricing" className="button button-primary" onClick={() => { closeMenu(); trackEvent("direct_purchase_nav_clicked"); }}>Claim 50% Off →</a>
            </div>
          </div>
        </div>
      </header>
      {isMenuOpen && <div className="nav-backdrop" role="presentation" onClick={closeMenu} />}
    </>
  );
}

export default Header;
