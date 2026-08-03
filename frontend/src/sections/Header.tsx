import logoImage from "../assets/company.logo.png";
const navLinks = [
  { label: "Products", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Resources", href: "#faq" },
];

function Header() {
  return (
    <header className="topbar">
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
