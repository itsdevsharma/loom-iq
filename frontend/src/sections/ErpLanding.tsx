import { AgencyFooter, AgencyHeader } from '../components/AgencyChrome';
import DemoSection from './DemoSection';
import PricingSection from './PricingSection';
import MobilePurchase from '../components/MobilePurchase';
import { websitePricing } from '../websiteContent';
import dashboard from '../assets/tour-dashboard.webp';
const base = import.meta.env.BASE_URL;
const workflows = [
  ['Orders & sales', 'Keep customer and sales records together so your team can follow the next action.'],
  ['Inventory', 'Review products and available stock alongside operational activity.'],
  ['Billing & reporting', 'Create sales vouchers and review business information in one workspace.'],
  ['Production', 'Explore manufacturing workflows where production is part of your business.'],
];
const questions = [
  ['Can I purchase without booking a demo?', 'Yes. Choose Starter or Growth, create your account and review the full checkout before paying. A demo is optional. Enterprise requirements are discussed with the team.'],
  ['When will I get ERP access?', 'Website registration creates your customer account. A matching active ERP demo can be converted after a verified payment; purchases without a demo require team-assisted workspace setup. Your customer account shows onboarding status.'],
  ['Does my subscription renew automatically?', 'No. Each checkout is a one-time payment for one membership month. Review your renewal price and access dates in your account before making the next payment.'],
  ['What is included in the price?', 'Review the plan scope below. User, storage and location limits, integrations, migration and applicable taxes need confirmation for your requirements. The checkout shows the payable amount before payment.'],
  ['Can I explore the software first?', 'Browse the real product screens here or request a three-hour demo workspace through the demo page. Demo access depends on service availability and email verification.'],
  ['How can I get help or request a refund?', 'Use support in your account or email loomiq2025@gmail.com. The existing seven-day money-back guarantee and its process are explained in the refund policy linked below.'],
];
export default function ErpLanding() {
  const starter = websitePricing().Starter;
  return <div className="agency-site agency-erp-page app-shell"><a className="agency-skip" href="#home-main">Skip to content</a><AgencyHeader /><main id="home-main">
    <section className="agency-erp-hero agency-container agency-section"><div><p className="agency-kicker">LOOMIQ ERP · BUSINESS MANAGEMENT</p><h1>Less switching between records.<br />A clearer view of your business.</h1><p className="agency-lead">Connect orders, inventory, sales and billing in one workspace. Explore the actual interface and choose a plan that fits the way your team works.</p><div className="agency-actions"><a className="agency-button agency-button-primary" href="#pricing">Choose a Plan</a><a className="agency-text-link" href="#showcase">Explore the Product Tour</a></div><p className="agency-caption">Standard plans from ₹{starter.recurring.toLocaleString('en-IN')}/month. Demo optional. No automatic charges.</p></div><figure><img src={dashboard} alt="LoomiQ ERP dashboard showing sales, purchases, inventory and operational activity" width="1652" height="952" fetchPriority="high" /><figcaption>Actual product interface · example business data</figcaption></figure></section>
    <section id="features" className="agency-container agency-section agency-erp-workflows"><div><p className="agency-kicker">CONNECTED DAILY WORK</p><h2>Follow the record.<br />Find the next step.</h2><p>Replace scattered operational references with a shared workspace. Review the screens and discuss your required modules before choosing a plan.</p></div><dl>{workflows.map(([title, text]) => <div key={title}><dt>{title}</dt><dd>{text}</dd></div>)}</dl></section>
    <DemoSection general />
    <section id="setup" className="agency-erp-setup"><div className="agency-container agency-section"><div className="agency-section-heading"><div><p className="agency-kicker">FROM PURCHASE TO WORKSPACE</p><h2>A clear path to getting started.</h2></div><p>Your website account and ERP workspace are separate. Registration alone does not activate software access.</p></div><ol className="agency-process">{[['Compare', 'Review the product, plan scope and requirements. Try a demo if you need one.'], ['Purchase', 'Create an account and review your total and terms before paying securely through Razorpay.'], ['Set up', 'A matching demo converts after verified payment. Otherwise, our team arranges your workspace.'], ['Get working', 'Follow onboarding status in your account and work with the team to prepare your business records.']].map(([title, text]) => <li key={title}><h3>{title}</h3><p>{text}</p></li>)}</ol></div></section>
    <PricingSection general />
    <section className="agency-container agency-section agency-erp-workflows"><div><p className="agency-kicker">BEFORE YOU COMMIT</p><h2>Understand access,<br />support and your data.</h2><p>Confirm the operational details that matter to your business before moving your records.</p><a className="agency-text-link" href={base + 'privacy'}>Read our Privacy Policy</a></div><dl><div><dt>Account & payment</dt><dd>Manage invoices and onboarding in your account. Razorpay handles payment details.</dd></div><div><dt>Support & rollout</dt><dd>Agree on setup, migration, user limits and support scope with our team.</dd></div><div><dt>Data requirements</dt><dd>Ask the team to confirm backup, export and post-subscription data arrangements before purchasing.</dd></div></dl></section>
    <section id="faq" className="agency-container agency-section agency-faq"><div><p className="agency-kicker">ERP BUYING QUESTIONS</p><h2>Details before<br />your decision.</h2><p>Pricing, payment and getting started.</p></div><div>{questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
    <section className="agency-contact"><div className="agency-container"><div><p className="agency-kicker">YOUR NEXT STEP</p><h2>See the fit. Choose your plan.</h2><p>Buy an eligible plan directly, or explore a demo before deciding.</p><div className="agency-actions"><a className="agency-button agency-button-primary" href="#pricing">Choose a Plan</a><a className="agency-text-link" href={base + 'demo'}>Try an ERP Demo</a></div></div><address><span>Questions about your setup?</span><a href="tel:+918222088524">+91 82220 88524</a><a href="mailto:loomiq2025@gmail.com">loomiq2025@gmail.com</a></address></div></section>
  </main><AgencyFooter /><MobilePurchase /></div>;
}
