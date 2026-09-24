import '../ProblemSection.css';
const comparisons = [['Orders scattered across WhatsApp and Excel', 'Orders in one shared system'], ['Production status difficult to track', 'A clear production view'], ['Stock not available in real time', 'Inventory alongside every order'], ['Billing spread across tools', 'Sales and billing in one place']];
export default function ProblemSection() {
  return <section id="problem" className="section section-shell section-problem">
    <div className="section-heading"><p className="eyebrow">The daily problem</p><h2>Business badh raha hai, par Excel aur paperwork bhi badh raha hai?</h2><p>LoomIQ brings it all together.</p></div>
    <div className="comparison-table"><div className="comparison-heading"><strong>Without LoomIQ</strong><strong>With LoomIQ</strong></div>{comparisons.map(([before, after]) => <div className="comparison-row" key={before}><p>{before}</p><p>{after}</p></div>)}</div>
    <a className="button button-primary section-purchase" href="#pricing">Claim 50% Off →</a>
  </section>;
}
