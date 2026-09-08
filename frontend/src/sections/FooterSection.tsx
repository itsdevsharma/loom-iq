import logoImage from "../assets/company.logo.webp";

const footerGroups = [
  {
    title: "Platform",
    links: [
      ["Features", "#features"],
      ["How it works", "#how-it-works"],
      ["Pricing", "#pricing"],
    ],
  },
  {
    title: "Resources",
    links: [
      ["Demo", "#demo"],
      ["FAQ", "#faq"],
      ["Trust & security", "#trust"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About LoomIQ", "#hero"],
      ["Contact", "#demo"],
    ],
  },
];

function FooterSection() {
  return (
    <footer className="page-footer" id="footer">
      <div className="footer-container">
        <div className="footer">
          <div className="footer-brand-column">
            <a className="footer-brand" href="#hero" aria-label="LoomIQ home">
              <img src={logoImage} alt="" className="footer-logo" />
              <span>LoomIQ</span>
            </a>
            <p>ERP for cloth manufacturers: orders, materials, production, quality, dispatch, and finance.</p>
            <div className="ff-social" aria-label="Social links">
              <a href="#hero">LinkedIn</a>
              <a href="#hero">Github</a>
              <a href="#hero">Instagram</a>
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
            <h3>Talk through your workflow</h3>
            <p>See how LoomIQ can fit your textile manufacturing workflow.</p>
            <a className="footer-contact-link" href="#demo">Book a personalized demo <span aria-hidden="true">→</span></a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} LoomIQ. All rights reserved.</span>
          <div>
            <a href={`${import.meta.env.BASE_URL}privacy`}>Privacy</a>
            <a href={`${import.meta.env.BASE_URL}terms`}>Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default FooterSection;
