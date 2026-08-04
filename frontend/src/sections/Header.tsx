import { useEffect, useState } from "react";
import logoImage from "../assets/company.logo.png";

const navLinks = [
  { label: "Products", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Resources", href: "#faq" },
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
        <a href="#pricing" className="text-link">
          Login
        </a>
        <a href="#pricing" className="button button-primary">
          Get started
        </a>
      </div>
    </header>
  );
}

export default Header;
