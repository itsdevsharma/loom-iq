import { cmsValue } from './websiteContent';
type PageRoute = "garment-erp" | "demo" | "home" | "privacy" | "terms" | "refunds" | "thank-you" | "payment" | "signup" | "account" | "404";

const runtimeOrigin = typeof window !== "undefined" ? window.location.origin : "https://www.loomiq.com";
const basePath = import.meta.env.BASE_URL || "/";
const siteUrl = (import.meta.env.PUBLIC_SITE_URL || runtimeOrigin).replace(/\/$/, "");
const imageUrl = `${siteUrl}${basePath}og-image.svg`;

function setMeta(name: string, content: string, type: "name" | "property" = "name") {
  let tag = document.querySelector(`meta[${type}="${name}"]`) as HTMLMetaElement | null;

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(type, name);
    document.head.appendChild(tag);
  }

  tag.setAttribute("content", content);
}

function setCanonical(url: string) {
  let tag = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", "canonical");
    document.head.appendChild(tag);
  }

  tag.setAttribute("href", url);
}

function setTitle(title: string) {
  document.title = title;
}

const routeMetadata: Record<PageRoute, { title: string; description: string; canonical: string }> = {
  "garment-erp": {title:"Replace Excel with Garment ERP | LoomIQ", description:"ERP built for garment and clothing manufacturers. Explore LoomIQ, compare monthly pricing, and purchase online.", canonical:`${siteUrl}${basePath}garment-erp`},
  demo: {title:"Request a LoomIQ Walkthrough", description:"Optional product walkthrough for garment manufacturers.", canonical:`${siteUrl}${basePath}demo`},
  account: { title: cmsValue("seo.1", "Your Account | LoomIQ"), description: cmsValue("seo.2", "Manage your LoomIQ account, onboarding and invoices."), canonical: `${siteUrl}${basePath}account` },
  home: {
    title: cmsValue("seo.3", "LoomIQ | ERP Software for Clothing Manufacturers in India"),
    description: cmsValue("seo.4", "LoomIQ is ERP software built for clothing manufacturers, garment factories and apparel brands in India. Manage orders, inventory, production, invoices and business reports from one platform."),
    canonical: `${siteUrl}${basePath}`,
  },
  privacy: {
    title: cmsValue("seo.5", "Privacy Policy | LoomIQ"),
    description: cmsValue("seo.6", "Review how LoomIQ handles demo requests, business information, and website data for privacy and compliance purposes."),
    canonical: `${siteUrl}${basePath}privacy`,
  },
  terms: {
    title: cmsValue("seo.7", "Terms of Service | LoomIQ"),
    description: cmsValue("seo.8", "Read the LoomIQ website terms covering demo requests, product information, and the use of this platform."),
    canonical: `${siteUrl}${basePath}terms`,
  },
  refunds: {
    title: cmsValue("seo.9", "Refund & Cancellation Policy | LoomIQ"),
    description: cmsValue("seo.10", "Review LoomIQ membership renewal, cancellation, access, and refund information."),
    canonical: `${siteUrl}${basePath}refunds`,
  },
  "thank-you": {
    title: cmsValue("seo.11", "Thank You | LoomIQ"),
    description: cmsValue("seo.12", "Review your LoomIQ confirmation and next steps."),
    canonical: `${siteUrl}${basePath}thank-you`,
  },
  signup: {
    title: cmsValue("seo.13", "Sign Up & Choose Your Welcome Offer | LoomIQ"),
    description: cmsValue("seo.14", "Review LoomIQ pricing and conditions before creating an account. Book a personalized demo with no signup required."),
    canonical: `${siteUrl}${basePath}signup`,
  },
  payment: {
    title: cmsValue("seo.15", "Secure Membership Checkout | LoomIQ"),
    description: cmsValue("seo.16", "Choose your LoomIQ ERP membership, share your business details, and continue to secure payment."),
    canonical: `${siteUrl}${basePath}payment`,
  },
  404: {
    title: cmsValue("seo.17", "Page Not Found | LoomIQ"),
    description: cmsValue("seo.18", "The page you requested could not be found. Explore LoomIQ ERP features and request a walkthrough."),
    canonical: `${siteUrl}/`,
  },
};

export function applyPageSeo(route: PageRoute) {
  const metadata = routeMetadata[route];
  const social = cmsValue("Site.social", {siteName:"LoomIQ", image:"/og-image.svg", imageAlt:"LoomIQ ERP platform overview"});

  setTitle(metadata.title);
  setMeta("description", metadata.description);
  setMeta("robots", route === "404" || route === "thank-you" || route === "signup" || route === "payment" || route === 'account' ? "noindex, nofollow" : "index, follow");
  setMeta("og:title", metadata.title, "property");
  setMeta("og:description", metadata.description, "property");
  setMeta("og:url", metadata.canonical, "property");
  setMeta("og:type", "website", "property");
  setMeta("og:site_name", social.siteName, "property");
  setMeta("og:image", new URL(social.image || imageUrl, siteUrl).href, "property");
  setMeta("og:image:alt", social.imageAlt, "property");
  setMeta("twitter:title", metadata.title);
  setMeta("twitter:description", metadata.description);
  setMeta("twitter:image", new URL(social.image || imageUrl, siteUrl).href);
  setCanonical(metadata.canonical);
}
