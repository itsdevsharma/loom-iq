import { cmsValue, siteLink } from '../websiteContent';
import logoImage from "../assets/company.logo.webp";

const footerGroups = cmsValue("FooterSection.1", [
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
]);

function FooterSection() {
  return (
    <footer className="page-footer" id="footer">
      <div className="footer-container">
        <div className="footer">
          <div className="footer-brand-column">
            <a className="footer-brand" href={siteLink(cmsValue("FooterSection.2", "#hero"))} aria-label={cmsValue("FooterSection.3", "LoomIQ home")}>
              <img src={cmsValue("FooterSection.4", logoImage)} alt="" className="footer-logo" />
              <span>{cmsValue("FooterSection.5", "LoomIQ")}</span>
            </a>
            <p>{cmsValue("FooterSection.6", "ERP for cloth manufacturers: orders, materials, production, quality, dispatch, and finance.")}</p>
          </div>

          {footerGroups.map((group) => (
            <div className="footer-column" key={group.title}>
              <h3>{group.title}</h3>
              <ul>
                {group.links.map(([label, href]) => (
                  <li key={label}><a href={siteLink(href)}>{label}</a></li>
                ))}
              </ul>
            </div>
          ))}

          <div className="footer-column footer-contact"><h3>Need help?</h3><p>Support is available if you need help with your purchase. Email <a href="mailto:loomiq2025@gmail.com">loomiq2025@gmail.com</a>.</p><a className="footer-contact-link" href="#support">Contact support →</a></div>
        </div>
        <div className="footer-bottom">
          <span>{cmsValue("FooterSection.18", "© ")}{new Date().getFullYear()}{cmsValue("FooterSection.19", " LoomIQ. All rights reserved.")}</span>
          <div>
            <a href={`${import.meta.env.BASE_URL}privacy`}>{cmsValue("FooterSection.20", "Privacy")}</a>
            <button className="analytics-settings" onClick={() => window.dispatchEvent(new Event("loomiq-consent-settings"))}>Analytics settings</button><a href={`${import.meta.env.BASE_URL}refunds`}>Refund policy</a><a href={`${import.meta.env.BASE_URL}terms`}>{cmsValue("FooterSection.21", "Terms")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default FooterSection;
