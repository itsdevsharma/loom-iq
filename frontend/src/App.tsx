import { useEffect } from "react";
import "./App.css";
import { applyPageSeo } from "./seo";
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
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "") || "";
  const normalizedHomePath = basePath || "/";

  useEffect(() => {
    const route =
      path === `${basePath}/thank-you` || path === "/thank-you"
        ? "thank-you"
        : path === `${basePath}/privacy` || path === "/privacy"
          ? "privacy"
          : path === `${basePath}/terms` || path === "/terms"
            ? "terms"
            : path === normalizedHomePath || path === "/"
              ? "home"
              : "404";

    applyPageSeo(route);
  }, [basePath, normalizedHomePath, path]);

  if (path === `${basePath}/thank-you` || path === "/thank-you") return <ThankYouPage />;
  if (path === `${basePath}/privacy` || path === "/privacy") return <InfoPage kind="privacy" />;
  if (path === `${basePath}/terms` || path === "/terms") return <InfoPage kind="terms" />;
  if (path !== normalizedHomePath && path !== "/") {
    return (
      <div className="info-page">
        <a className="info-page-back" href={import.meta.env.BASE_URL}>Back to LoomIQ</a>
        <p className="eyebrow">LoomIQ</p>
        <h1>Page not found</h1>
        <p className="info-page-intro">The page you requested is not available. Please return to the homepage and continue exploring the LoomIQ platform.</p>
        <a className="button button-primary" href={import.meta.env.BASE_URL}>Return home</a>
      </div>
    );
  }

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
