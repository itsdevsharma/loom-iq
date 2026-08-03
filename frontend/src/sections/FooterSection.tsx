import logoImage from "../assets/company.logo.png";

const footerGroups = [
  {
    title: "Platform",
    links: [
      ["CRM", "#features"],
      ["ERP", "#features"],
      ["AI automation", "#automation"],
      ["Analytics", "#showcase"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About LoomIQ", "#hero"],
      ["Customer stories", "#testimonials"],
      ["Pricing", "#pricing"],
      ["FAQ", "#faq"],
    ],
  },
];

function FooterSection() {
  return (
    <footer className="page-footer">
      <div className="footer-container">
        <div className="footer">
          <div className="footer-brand-column">
            <a className="footer-brand" href="#hero" aria-label="LoomIQ home">
              <img src={logoImage} alt="" className="footer-logo" />
              <span>LoomIQ</span>
            </a>
            <p>Modern CRM and ERP software for ambitious teams.</p>
            <div className="ff-social" aria-label="Social links">
              <a href="#hero">LinkedIn</a>
              <a href="#hero">X</a>
              <a href="#hero">YouTube</a>
            </div>
          </div>

          {footerGroups.map((group) => (
            <div className="footer-column" key={group.title}>
              <h3>{group.title}</h3>
              <ul>
                {group.links.map(([label, href]) => (
                  <li key={label}><a href={href}>{label}</a></li>
                ))}
              </ul>
            </div>
          ))}

          <div className="footer-column footer-contact">
            <h3>Let&apos;s talk</h3>
            <p>Have a question or ready to see LoomIQ in action?</p>
            <a className="footer-contact-link" href="#pricing">Book a demo <span aria-hidden="true">→</span></a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} LoomIQ. All rights reserved.</span>
          <div>
            <a href="#hero">Privacy</a>
            <a href="#hero">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default FooterSection;
