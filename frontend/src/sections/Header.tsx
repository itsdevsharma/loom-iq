import { useEffect, useState } from "react";
import logoImage from "../assets/company.logo.png";
import { trackEvent } from "../analytics";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

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
      <a className="brand" href="#hero">
        <img src={logoImage} alt="LoomIQ" className="brand-logo" /> LoomIQ
      </a>
      <nav className="nav-links" aria-label="Primary navigation">
        {navLinks.map((link) => (
          <a key={link.label} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
      <div className="nav-actions">
        <a href="#demo" className="button button-primary" onClick={() => trackEvent("demo_cta_clicked")}>
          Book a Free Demo
        </a>
      </div>
    </header>
  );
}

export default Header;
