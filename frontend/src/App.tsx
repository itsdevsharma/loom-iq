import "./App.css";
import Header from "./sections/Header";
import Hero from "./sections/Hero";
import ImpactCounters from "./sections/ImpactCounters";
import TrustStrip from "./sections/TrustStrip";
import FeaturesSection from "./sections/FeaturesSection";
import DemoSection from "./sections/DemoSection";
import BenefitsSection from "./sections/BenefitsSection";
import AiAndIntegrations from "./sections/AiAndIntegrations";
import TestimonialsSection from "./sections/TestimonialsSection";
import PricingSection from "./sections/PricingSection";
import FaqSection from "./sections/FaqSection";
import FinalCTA from "./sections/FinalCTA";
import FooterSection from "./sections/FooterSection";

function App() {
  return (
    <div className="app-shell">
      <Header />

      <main>
        <Hero />
        <ImpactCounters />
        <TrustStrip />
        <FeaturesSection />
        <DemoSection />
        <BenefitsSection />
        <AiAndIntegrations />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection />
        <FinalCTA />
      </main>

      <FooterSection />
    </div>
  );
}

export default App;
