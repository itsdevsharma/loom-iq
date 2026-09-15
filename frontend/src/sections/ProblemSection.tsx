import '../ProblemSection.css';
const comparisons = [
  ['Orders in separate spreadsheets', 'Order information in your ERP'],
  ['Stock updates spread across registers', 'Inventory in your operating view'],
  ['Production updates buried in messages', 'Production alongside your orders'],
  ['Accounts reviewed in isolation', 'Accounts and business reporting together'],
];
export default function ProblemSection() {
  return <section id="problem" className="section section-shell section-problem">
    <div className="section-heading"><p className="eyebrow">From scattered updates to one place</p><h2>Still managing your garment factory with Excel & WhatsApp?</h2><p>Give your daily order, stock, production, and accounts information a shared home.</p></div>
    <div className="comparison-table"><div className="comparison-heading"><strong>Without LoomIQ</strong><strong>With LoomIQ</strong></div>{comparisons.map(([before, after]) => <div className="comparison-row" key={before}><p>{before}</p><p>{after}</p></div>)}</div>
    <a className="button button-primary section-purchase" href="#pricing">See pricing</a>
  </section>;
}
