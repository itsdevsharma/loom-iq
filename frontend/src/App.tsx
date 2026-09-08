import { OfferProvider } from "./offer";
import { useEffect } from "react";
import "./App.css";
import { applyPageSeo } from "./seo";
import AnnouncementBanner from "./components/AnnouncementBanner";
import Header from "./sections/Header";
import Hero from "./sections/Hero";
import FeaturesSection from "./sections/FeaturesSection";
import HowItWorksSection from "./sections/HowItWorksSection";
import PricingSection from "./sections/PricingSection";
import TrustSection from "./sections/TrustSection";
import FaqSection from "./sections/FaqSection";
import DemoFormSection from "./sections/DemoFormSection";
import FooterSection from "./sections/FooterSection";
import InfoPage from "./sections/InfoPage";
import ThankYouPage from "./sections/ThankYouPage";
import SignupPage from "./sections/SignupPage";
import PaymentPage from "./sections/PaymentPage";

function App() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "") || "";
  const normalizedHomePath = basePath || "/";
  const paymentPath = `${basePath}/payment`;

  useEffect(() => {
    const route =
      path === `${basePath}/thank-you` || path === "/thank-you"
        ? "thank-you"
        : path === `${basePath}/privacy` || path === "/privacy"
          ? "privacy"
          : path === `${basePath}/terms` || path === "/terms"
            ? "terms"
            : path === `${basePath}/refunds` || path === "/refunds"
              ? "refunds"
              : path === `${basePath}/signup` || path === "/signup"
                ? "signup"
                : path === paymentPath || path === "/payment"
                  ? "payment"
            : path === normalizedHomePath || path === "/"
              ? "home"
              : "404";

    applyPageSeo(route);
  }, [basePath, normalizedHomePath, path, paymentPath]);

  if (path === `${basePath}/signup` || path === "/signup") return <OfferProvider><SignupPage /></OfferProvider>;
  if (path === paymentPath || path === "/payment") return <OfferProvider><PaymentPage /></OfferProvider>;
  if (path === `${basePath}/thank-you` || path === "/thank-you") return <ThankYouPage />;
  if (path === `${basePath}/privacy` || path === "/privacy") return <InfoPage kind="privacy" />;
  if (path === `${basePath}/terms` || path === "/terms") return <InfoPage kind="terms" />;
  if (path === `${basePath}/refunds` || path === "/refunds") return <InfoPage kind="refunds" />;
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
    <OfferProvider><div className="app-shell">
      <Header />
      <AnnouncementBanner />
      <main>
        <Hero />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <TrustSection />
        <FaqSection />
        <DemoFormSection />
      </main>

      <FooterSection />
    </div></OfferProvider>
  );
}

export default App;
