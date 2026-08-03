import logoImage from "../assets/company.logo.png";

function FooterSection() {
  return (
    <footer className="footer">
      <div>
        <a className="brand" href="#hero">
          <img src={logoImage} alt="LoomIQ" className="brand-logo" />
          <span>LoomIQ</span>
        </a>
        <p>Modern CRM and ERP software for ambitious teams.</p>
      </div>
      <div className="footer-links">
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
        <a href="#faq">FAQ</a>
      </div>
    </footer>
  );
}

export default FooterSection;
