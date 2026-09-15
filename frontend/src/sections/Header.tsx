import { cmsValue, siteLink } from '../websiteContent';
import { useEffect, useState } from "react";
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`topbar ${isScrolled ? "topbar--scrolled" : ""}`}>
      <div className="topbar-inner">
        <a className="brand" href={siteLink(cmsValue("Header.2", "#hero"))} onClick={() => setIsMenuOpen(false)}>
          <img src={cmsValue("Header.3", logoImage)} alt={cmsValue("Header.4", "LoomIQ")} className="brand-logo" width="56" height="56" decoding="async" />{cmsValue("Header.5", " LoomIQ ")}</a>
        <button
          className="menu-toggle"
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
        <nav id="primary-navigation" className={`nav-links ${isMenuOpen ? "is-open" : ""}`} aria-label={cmsValue("Header.8", "Primary navigation")}>
          {navLinks.map((link) => (
            <a key={link.label} href={siteLink(link.href)} onClick={() => setIsMenuOpen(false)}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          <a href={import.meta.env.BASE_URL + 'account'} className="text-link">{cmsValue("Header.9", "My account")}</a>
          <a href={siteLink(cmsValue("Header.10", "#demo"))} className="text-link" onClick={() => setIsMenuOpen(false)}>{cmsValue("Header.11", "Book a demo")}</a>
          <a href={siteLink(cmsValue("Header.12", "#pricing"))} className="button button-primary" onClick={() => { setIsMenuOpen(false); trackEvent("direct_purchase_nav_clicked"); }}>{cmsValue("Header.13", " View plans & offer ")}</a>
        </div>
      </div>
    </header>
  );
}

export default Header;
