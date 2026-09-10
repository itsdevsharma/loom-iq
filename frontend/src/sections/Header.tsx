import { useEffect, useState } from "react";
import logoImage from "../assets/company.logo.webp";
import { trackEvent } from "../analytics";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

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
        <a className="brand" href="#hero" onClick={() => setIsMenuOpen(false)}>
          <img src={logoImage} alt="LoomIQ" className="brand-logo" /> LoomIQ
        </a>
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="primary-navigation"
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
        <nav id="primary-navigation" className={`nav-links ${isMenuOpen ? "is-open" : ""}`} aria-label="Primary navigation">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} onClick={() => setIsMenuOpen(false)}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          <a href={import.meta.env.BASE_URL + 'account'} className="text-link">My account</a>
          <a href="#demo" className="text-link" onClick={() => setIsMenuOpen(false)}>Book a demo</a>
          <a href="#pricing" className="button button-primary" onClick={() => { setIsMenuOpen(false); trackEvent("direct_purchase_nav_clicked"); }}>
            View plans & offer
          </a>
        </div>
      </div>
    </header>
  );
}

export default Header;
