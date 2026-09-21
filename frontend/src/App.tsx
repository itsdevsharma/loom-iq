import { lazy, Suspense, useEffect, type ComponentType } from "react";
import { OfferProvider, useOffer } from "./offer";
import { cmsValue, websitePricing } from './websiteContent';
import "./App.css";
import { applyPageSeo } from "./seo";
import Header from "./sections/Header";
import Hero from "./sections/Hero";
import DemoSection from "./sections/DemoSection";
import ProblemSection from "./sections/ProblemSection";
import FeaturesSection from "./sections/FeaturesSection";
import HowItWorksSection from "./sections/HowItWorksSection";
import BenefitsSection from "./sections/BenefitsSection";
import BusinessFlexibilitySection from "./sections/BusinessFlexibilitySection";
import ValueSection from "./sections/ValueSection";
import PlatformHighlights from "./sections/PlatformHighlights";
import PricingSection from "./sections/PricingSection";
import ProofSection from "./sections/ProofSection";
import TrustSection from "./sections/TrustSection";
import FaqSection from "./sections/FaqSection";
import DemoFormSection from "./sections/DemoFormSection";
import DemoRegistrationSection from "./sections/DemoRegistrationSection";
import FinalCTA from "./sections/FinalCTA";
import FooterSection from "./sections/FooterSection";

const ManagedPage = lazy(() => import("./sections/ManagedPage"));
const InfoPage = lazy(() => import("./sections/InfoPage"));
const ThankYouPage = lazy(() => import("./sections/ThankYouPage"));
const SignupPage = lazy(() => import("./sections/SignupPage"));
const PaymentPage = lazy(() => import("./sections/PaymentPage"));
const AccountPage = lazy(() => import("./sections/AccountPage"));
const AccountHelpPage = lazy(() => import("./sections/AccountHelpPage"));

const sections: Record<string, ComponentType> = { Hero, DemoSection, ProblemSection, FeaturesSection, HowItWorksSection, BenefitsSection, BusinessFlexibilitySection, ValueSection, PlatformHighlights, PricingSection, TrustSection, FaqSection, DemoFormSection, DemoRegistrationSection, FinalCTA };

function MobilePurchase() {
  const { offer, ready } = useOffer();
  const starter = websitePricing().Starter;
  const discounted = !ready || offer.eligible;
  const price = discounted ? starter.firstMonth : starter.recurring;
  const formattedPrice = `₹${price.toLocaleString("en-IN")}`;

  return <aside className="mobile-purchase" aria-label="Quick purchase">
    <span><small>{discounted ? 'Launch price from' : 'Plans from'}</small><strong>{formattedPrice}/month</strong></span>
    <a className="button button-primary" href="#pricing">Start Using LoomIQ — {formattedPrice}/month</a>
  </aside>;
}

function App() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "") || "";
  const normalizedHomePath = basePath || "/";
  const landing = path === `${basePath}/garment-erp`;
  const paymentPath = `${basePath}/payment`;

  useEffect(() => {
    const route = ['account', 'forgot-password', 'reset-password', 'verify-email'].some(route => path === `${basePath}/${route}`) ? 'account'
      : path === `${basePath}/thank-you` || path === "/thank-you" ? "thank-you"
      : path === `${basePath}/privacy` || path === "/privacy" ? "privacy"
      : path === `${basePath}/terms` || path === "/terms" ? "terms"
      : path === `${basePath}/refunds` || path === "/refunds" ? "refunds"
      : path === `${basePath}/signup` || path === "/signup" ? "signup"
      : path === paymentPath || path === "/payment" ? "payment"
      : path === normalizedHomePath || path === "/" ? "home" : "404";
    applyPageSeo(landing ? "garment-erp" : path === `${basePath}/demo` ? "demo" : route);
  }, [basePath, normalizedHomePath, path, paymentPath, landing]);

  if (path === `${basePath}/demo`) return <OfferProvider><div className="app-shell demo-page"><header className="demo-page-header"><a className="demo-page-brand" href={import.meta.env.BASE_URL}>LoomIQ<span>ERP</span></a><nav aria-label="Demo navigation"><a href={import.meta.env.BASE_URL}>Back to site</a><a className="demo-page-login" href={import.meta.env.BASE_URL + 'account'}>Already have access? <strong>Sign in</strong></a></nav></header><main className="demo-page-main"><DemoFormSection /></main></div></OfferProvider>;
  if (path === `${basePath}/account`) return <AccountPage />;
  for (const kind of ['forgot-password', 'reset-password', 'verify-email'] as const) if (path === `${basePath}/${kind}`) return <AccountHelpPage kind={kind} />;
  if (path === `${basePath}/signup` || path === "/signup") return <OfferProvider><SignupPage /></OfferProvider>;
  if (path === paymentPath || path === "/payment") return <OfferProvider><PaymentPage /></OfferProvider>;
  if (path === `${basePath}/thank-you` || path === "/thank-you") return <ThankYouPage />;
  if (path === `${basePath}/privacy` || path === "/privacy") return <InfoPage kind="privacy" />;
  if (path === `${basePath}/terms` || path === "/terms") return <InfoPage kind="terms" />;
  if (path === `${basePath}/refunds` || path === "/refunds") return <InfoPage kind="refunds" />;
  if (!landing && path !== normalizedHomePath && path !== "/") return <ManagedPage slug={path.slice(basePath.length).replace(/^\//, '')} />;

  const layout = cmsValue('Site.layout', ['Hero', 'DemoSection', 'HowItWorksSection', 'PricingSection', 'FaqSection', 'DemoRegistrationSection', 'FinalCTA']);
  return <OfferProvider><div className="app-shell">
    {landing ? <header className="landing-topbar"><a className="brand" href={import.meta.env.BASE_URL}>LoomIQ</a><nav aria-label="Purchase navigation"><a href="#showcase">Product</a><a href={import.meta.env.BASE_URL + "account"}>Login</a><a className="button button-primary" href="#pricing">Get Started</a></nav></header> : <Header />}
    <main>{layout.map(name => {
      const Section = sections[name];
      if (!Section) return null;
      return <div key={name}>{name === 'PricingSection' && <ProofSection />}<Section /></div>;
    })}</main>
    <FooterSection />
    <MobilePurchase />
  </div></OfferProvider>;
}

export default function WebsiteApp() { return <Suspense fallback={<main className="section section-shell"><p role="status">Loading LoomIQ…</p></main>}><App /></Suspense>; }
