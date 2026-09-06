import "./App.css";
import Header from "./sections/Header";
import Hero from "./sections/Hero";
import PlatformHighlights from "./sections/PlatformHighlights";
import ValueSection from "./sections/ValueSection";
import ProblemSection from "./sections/ProblemSection";
import FeaturesSection from "./sections/FeaturesSection";
import HowItWorksSection from "./sections/HowItWorksSection";
import DemoSection from "./sections/DemoSection";
import BenefitsSection from "./sections/BenefitsSection";
import BusinessFlexibilitySection from "./sections/BusinessFlexibilitySection";
import PricingSection from "./sections/PricingSection";
import TrustSection from "./sections/TrustSection";
import FaqSection from "./sections/FaqSection";
import DemoFormSection from "./sections/DemoFormSection";
import FinalCTA from "./sections/FinalCTA";
import FooterSection from "./sections/FooterSection";
import InfoPage from "./sections/InfoPage";
import ThankYouPage from "./sections/ThankYouPage";

function App() {
  const path = window.location.pathname.replace(/\/$/, "");
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  if (path === `${basePath}/thank-you` || path === "/thank-you") return <ThankYouPage />;
  if (path === `${basePath}/privacy` || path === "/privacy") return <InfoPage kind="privacy" />;
  if (path === `${basePath}/terms` || path === "/terms") return <InfoPage kind="terms" />;

  return (
    <div className="app-shell">
      <Header />

      <main>
        <Hero />
        <DemoFormSection />
        <PlatformHighlights />
        <ValueSection />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorksSection />
        <DemoSection />
        <BenefitsSection />
        <BusinessFlexibilitySection />
        <PricingSection />
        <TrustSection />
        <FaqSection />
        <FinalCTA />
      </main>

      <FooterSection />
    </div>
  );
}

export default App;
