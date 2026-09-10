type PageRoute = "home" | "privacy" | "terms" | "refunds" | "thank-you" | "payment" | "signup" | "account" | "404";

const runtimeOrigin = typeof window !== "undefined" ? window.location.origin : "https://www.loomiq.com";
const basePath = import.meta.env.BASE_URL || "/";
const siteUrl = (import.meta.env.VITE_SITE_URL || runtimeOrigin).replace(/\/$/, "");
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
  account: { title: 'Your Account | LoomIQ', description: 'Manage your LoomIQ account, onboarding and invoices.', canonical: `${siteUrl}${basePath}account` },
  home: {
    title: "ERP Software for Connected Business Operations | LoomIQ",
    description: "Manage orders, inventory, production, finance, and operations from one flexible ERP platform built for growing businesses.",
    canonical: `${siteUrl}${basePath}`,
  },
  privacy: {
    title: "Privacy Policy | LoomIQ",
    description: "Review how LoomIQ handles demo requests, business information, and website data for privacy and compliance purposes.",
    canonical: `${siteUrl}${basePath}privacy`,
  },
  terms: {
    title: "Terms of Service | LoomIQ",
    description: "Read the LoomIQ website terms covering demo requests, product information, and the use of this platform.",
    canonical: `${siteUrl}${basePath}terms`,
  },
  refunds: {
    title: "Refund & Cancellation Policy | LoomIQ",
    description: "Review LoomIQ membership renewal, cancellation, access, and refund information.",
    canonical: `${siteUrl}${basePath}refunds`,
  },
  "thank-you": {
    title: "Thank You | LoomIQ",
    description: "Review your LoomIQ confirmation and next steps.",
    canonical: `${siteUrl}${basePath}thank-you`,
  },
  signup: {
    title: "Sign Up & Choose Your Welcome Offer | LoomIQ",
    description: "Review LoomIQ pricing and conditions before creating an account. Book a personalized demo with no signup required.",
    canonical: `${siteUrl}${basePath}signup`,
  },
  payment: {
    title: "Secure Membership Checkout | LoomIQ",
    description: "Choose your LoomIQ ERP membership, share your business details, and continue to secure payment.",
    canonical: `${siteUrl}${basePath}payment`,
  },
  404: {
    title: "Page Not Found | LoomIQ",
    description: "The page you requested could not be found. Explore LoomIQ ERP features and request a walkthrough.",
    canonical: `${siteUrl}/`,
  },
};

export function applyPageSeo(route: PageRoute) {
  const metadata = routeMetadata[route];

  setTitle(metadata.title);
  setMeta("description", metadata.description);
  setMeta("robots", route === "404" || route === "thank-you" || route === "signup" || route === "payment" || route === 'account' ? "noindex, nofollow" : "index, follow");
  setMeta("og:title", metadata.title, "property");
  setMeta("og:description", metadata.description, "property");
  setMeta("og:url", metadata.canonical, "property");
  setMeta("og:type", "website", "property");
  setMeta("og:site_name", "LoomIQ", "property");
  setMeta("og:image", imageUrl, "property");
  setMeta("og:image:alt", "LoomIQ ERP platform overview", "property");
  setMeta("twitter:title", metadata.title);
  setMeta("twitter:description", metadata.description);
  setMeta("twitter:image", imageUrl);
  setCanonical(metadata.canonical);
}
