import '../DemoRegistrationSection.css';

const registrationSteps = [
  {
    title: 'Share your details',
    description: 'Enter your name, work email, mobile number, and business name in the short registration form.',
  },
  {
    title: 'Verify your email',
    description: 'Use the six-digit code we send to your work email to keep your workspace private and secure.',
  },
  {
    title: 'Start exploring',
    description: 'Receive unique credentials for a private LoomIQ ERP workspace that is ready to use for three hours.',
  },
];

export default function DemoRegistrationSection() {
  return <section id="demo-registration" className="section section-shell demo-registration-section">
    <div className="demo-registration-heading">
      <p className="eyebrow">See LoomIQ in action</p>
      <h2>Register for your private demo in three simple steps.</h2>
      <p>There is no credit card, payment, or sales call required. Your demo workspace is isolated and expires automatically.</p>
    </div>
    <ol className="demo-registration-steps">
      {registrationSteps.map((step, index) => <li key={step.title}>
        <span className="demo-registration-number" aria-hidden="true">0{index + 1}</span>
        <div><h3>{step.title}</h3><p>{step.description}</p></div>
      </li>)}
    </ol>
    <div className="demo-registration-action">
      <a className="button button-primary" href={`${import.meta.env.BASE_URL}demo`}>Register for a free demo <span aria-hidden="true">→</span></a>
      <span>Private workspace · 3-hour access</span>
    </div>
  </section>;
}
