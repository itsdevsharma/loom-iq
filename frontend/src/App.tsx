import BenefitsSection from "./sections/BenefitsSection";
import BusinessFlexibilitySection from "./sections/BusinessFlexibilitySection";
import ValueSection from "./sections/ValueSection";
import ProblemSection from "./sections/ProblemSection";
import PlatformHighlights from "./sections/PlatformHighlights";
import DemoSection from "./sections/DemoSection";
import FinalCTA from "./sections/FinalCTA";
import { cmsValue, websitePricing } from './websiteContent';
const ManagedPage = lazy(() => import("./sections/ManagedPage"));
import { OfferProvider } from "./offer";
import { lazy, Suspense, useEffect } from "react";
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
const InfoPage = lazy(() => import("./sections/InfoPage"));
const ThankYouPage = lazy(() => import("./sections/ThankYouPage"));
const SignupPage = lazy(() => import("./sections/SignupPage"));
const PaymentPage = lazy(() => import("./sections/PaymentPage"));
const AccountPage = lazy(() => import("./sections/AccountPage"));
const AccountHelpPage = lazy(() => import("./sections/AccountHelpPage"));

function App() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "") || "";
  const normalizedHomePath = basePath || "/";
  const landing = path === `${basePath}/garment-erp`;
  const paymentPath = `${basePath}/payment`;

  useEffect(() => {
    const route =
      ['account', 'forgot-password', 'reset-password', 'verify-email'].some(route => path === `${basePath}/${route}`)
        ? 'account'
      : path === `${basePath}/thank-you` || path === "/thank-you"
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

    applyPageSeo(landing ? "garment-erp" : path === `${basePath}/demo` ? "demo" : route);
  }, [basePath, normalizedHomePath, path, paymentPath, landing]);

  if (path === `${basePath}/demo`) return <OfferProvider><div className="app-shell"><a className="button" href={import.meta.env.BASE_URL}>Back to LoomIQ</a><main><h1>Optional product walkthrough</h1><DemoFormSection /></main><a className="button button-primary" href={import.meta.env.BASE_URL + "#pricing"}>View plans</a></div></OfferProvider>;
  if (path === `${basePath}/account`) return <AccountPage />;
  for (const kind of ['forgot-password', 'reset-password', 'verify-email'] as const) {
    if (path === `${basePath}/${kind}`) return <AccountHelpPage kind={kind} />;
  }
  if (path === `${basePath}/signup` || path === "/signup") return <OfferProvider><SignupPage /></OfferProvider>;
  if (path === paymentPath || path === "/payment") return <OfferProvider><PaymentPage /></OfferProvider>;
  if (path === `${basePath}/thank-you` || path === "/thank-you") return <ThankYouPage />;
  if (path === `${basePath}/privacy` || path === "/privacy") return <InfoPage kind="privacy" />;
  if (path === `${basePath}/terms` || path === "/terms") return <InfoPage kind="terms" />;
  if (path === `${basePath}/refunds` || path === "/refunds") return <InfoPage kind="refunds" />;
  if (!landing && path !== normalizedHomePath && path !== "/") return <ManagedPage slug={path.slice(basePath.length).replace(/^\//, '')} />;

  return (
    <OfferProvider><div className="app-shell">
      {landing ? <header className="landing-topbar"><a className="brand" href={import.meta.env.BASE_URL}>LoomIQ</a><nav aria-label="Purchase navigation"><a href="#showcase">Product</a><a href={import.meta.env.BASE_URL + "account"}>Login</a><a className="button button-primary" href="#pricing">View plans</a></nav></header> : <Header />}
      {cmsValue('Site.announcement', true) && <AnnouncementBanner />}
      <main>
        {cmsValue('Site.layout', ['Hero','FeaturesSection','HowItWorksSection','PricingSection','TrustSection','FaqSection','DemoFormSection']).map(name => {
          const Section = ({Hero, FeaturesSection, HowItWorksSection, PricingSection, TrustSection, FaqSection, DemoFormSection, BenefitsSection, BusinessFlexibilitySection, ValueSection, ProblemSection, PlatformHighlights, DemoSection, FinalCTA} as Record<string, React.ComponentType>)[name];
          return Section ? name === "Hero" ? <Hero key={name} landing={landing} /> : <Section key={name} /> : null;
        })}
      </main>

      <FooterSection /><aside className="mobile-purchase" aria-label="Quick purchase"><span>Plans from ₹{websitePricing().Starter.recurring.toLocaleString("en-IN")}/month</span><a className="button button-primary" href="#pricing">View plans</a></aside>
    </div></OfferProvider>
  );
}

export default function WebsiteApp() { return <Suspense fallback={<main className="section section-shell"><p role="status">Loading LoomIQ…</p></main>}><App /></Suspense>; }
