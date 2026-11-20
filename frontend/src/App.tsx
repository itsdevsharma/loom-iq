import { lazy, Suspense, useEffect, type ComponentType } from "react";
import { OfferProvider } from "./offer";
import { cmsValue } from './websiteContent';
import "./App.css";
import { applyManagedPageSeo, applyPageSeo } from "./seo";
import Hero from "./sections/Hero";
import { AgencyHome, AgencyServicePage } from "./sections/AgencyPages";
import { AgencyHeader, AgencyFooter } from "./components/AgencyChrome";
import { agencyRouteMetadata, agencyServices } from "./agencyContent";
import MobilePurchase from "./components/MobilePurchase";
import ErpLanding from "./sections/ErpLanding";
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

const ManagedPage = lazy(() => import("./sections/ManagedPage"));
const InfoPage = lazy(() => import("./sections/InfoPage"));
const ThankYouPage = lazy(() => import("./sections/ThankYouPage"));
const SignupPage = lazy(() => import("./sections/SignupPage"));
const PaymentPage = lazy(() => import("./sections/PaymentPage"));
const AccountPage = lazy(() => import("./sections/AccountPage"));
const AccountHelpPage = lazy(() => import("./sections/AccountHelpPage"));

const sections: Record<string, ComponentType> = { Hero, DemoSection, ProblemSection, FeaturesSection, HowItWorksSection, BenefitsSection, BusinessFlexibilitySection, ValueSection, PlatformHighlights, PricingSection, TrustSection, FaqSection, DemoFormSection, DemoRegistrationSection, FinalCTA };


function App() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "") || "";
  const normalizedHomePath = basePath || "/";
  const landing = path === `${basePath}/garment-erp`;
  const erp = path === `${basePath}/erp`;
  const erpPricing = path === `${basePath}/erp/pricing`;
  const paymentPath = `${basePath}/payment`;

  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, [path]);

  useEffect(() => {
    const route = ['account', 'forgot-password', 'reset-password', 'verify-email'].some(route => path === `${basePath}/${route}`) ? 'account'
      : path === `${basePath}/thank-you` || path === "/thank-you" ? "thank-you"
      : path === `${basePath}/privacy` || path === "/privacy" ? "privacy"
      : path === `${basePath}/terms` || path === "/terms" ? "terms"
      : path === `${basePath}/refunds` || path === "/refunds" ? "refunds"
      : path === `${basePath}/signup` || path === "/signup" ? "signup"
      : path === paymentPath || path === "/payment" ? "payment"
      : path === normalizedHomePath || path === "/" ? "home" : "404";
    const agencyMetadata = agencyRouteMetadata.find(item => path === `${basePath}/${item.path}`);
    if (agencyMetadata) { applyManagedPageSeo({ title: agencyMetadata.title, description: agencyMetadata.description }); return; }
    applyPageSeo(path === `${basePath}/digital-marketing` ? "digital-marketing" : landing ? "garment-erp" : path === `${basePath}/demo` ? "demo" : route);
  }, [basePath, normalizedHomePath, path, paymentPath, landing]);

  if (path === normalizedHomePath || path === "/") return <AgencyHome />;
  if (path === `${basePath}/digital-marketing`) return <AgencyServicePage />;
  const service = agencyServices.find(item => path === `${basePath}/services/${item.slug}`);
  if (service) return <AgencyServicePage service={service} />;
  if (erp) return <OfferProvider><ErpLanding /></OfferProvider>;
  if (erpPricing) return <OfferProvider><div className="agency-site agency-erp-page"><AgencyHeader /><main><section className="agency-container agency-section agency-pricing-heading"><p className="agency-kicker">LOOMIQ ERP · SOFTWARE PLANS</p><h1>Choose the right plan<br />for your operations.</h1><p className="agency-lead">Compare software features and prices, or request an ERP demo before choosing a plan. Digital marketing services are quoted separately.</p><div className="agency-actions"><a className="agency-button agency-button-primary" href={import.meta.env.BASE_URL + "demo"}>Request an ERP Demo</a><a className="agency-text-link" href={import.meta.env.BASE_URL + "erp"}>Explore ERP Software</a></div></section><PricingSection general /></main><AgencyFooter /></div></OfferProvider>;
  if (path === `${basePath}/demo`) return <OfferProvider><div className="app-shell demo-page"><header className="demo-page-header"><a className="demo-page-brand" href={import.meta.env.BASE_URL}>LoomIQ<span>ERP</span></a><nav aria-label="Demo navigation"><a href={import.meta.env.BASE_URL}>Back to site</a><a className="demo-page-login" href={import.meta.env.BASE_URL + 'account'}>Already have access? <strong>Sign in</strong></a></nav></header><main className="demo-page-main"><DemoFormSection /></main></div></OfferProvider>;
  if (path === `${basePath}/account`) return <AccountPage />;
  for (const kind of ['forgot-password', 'reset-password', 'verify-email'] as const) if (path === `${basePath}/${kind}`) return <AccountHelpPage kind={kind} />;
  if (path === `${basePath}/signup` || path === "/signup") return <OfferProvider><SignupPage /></OfferProvider>;
  if (path === paymentPath || path === "/payment") return <OfferProvider><PaymentPage /></OfferProvider>;
  if (path === `${basePath}/thank-you` || path === "/thank-you") return <ThankYouPage />;
  if (path === `${basePath}/privacy` || path === "/privacy") return <InfoPage kind="privacy" />;
  if (path === `${basePath}/terms` || path === "/terms") return <InfoPage kind="terms" />;
  if (path === `${basePath}/refunds` || path === "/refunds") return <InfoPage kind="refunds" />;
  if (!landing && !erp && path !== normalizedHomePath && path !== "/") return <ManagedPage slug={path.slice(basePath.length).replace(/^\//, '')} />;

  const layout = cmsValue('Site.layout', ['Hero', 'ProblemSection', 'FeaturesSection', 'DemoSection', 'BenefitsSection', 'HowItWorksSection', 'PricingSection', 'TrustSection', 'FaqSection', 'FinalCTA']);
  return <OfferProvider><div className="agency-site agency-erp-page app-shell">
    <a className="agency-skip" href="#home-main">Skip to content</a>
    {landing ? <header className="landing-topbar"><a className="brand" href={import.meta.env.BASE_URL}>LoomIQ</a><nav aria-label="Purchase navigation"><a href="#showcase">Product</a><a href={import.meta.env.BASE_URL + "account"}>Login</a><a className="button button-primary" href="#pricing">Get Started</a></nav></header> : <AgencyHeader />}
    <main id="home-main">{layout.map(name => {
      const Section = sections[name];
      if (!Section) return null;
      return <div key={name}>{name === 'PricingSection' && <ProofSection />}<Section /></div>;
    })}</main>
    <AgencyFooter />
    <MobilePurchase />
  </div></OfferProvider>;
}

export default function WebsiteApp() { return <Suspense fallback={<main className="section section-shell"><p role="status">Loading LoomIQ…</p></main>}><App /></Suspense>; }
