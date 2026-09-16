type PageRoute = "garment-erp" | "demo" | "home" | "privacy" | "terms" | "refunds" | "thank-you" | "payment" | "signup" | "account" | "404";

const runtimeOrigin = typeof window !== "undefined" ? window.location.origin : "https://loomiq.site";
const basePath = import.meta.env.BASE_URL || "/";
const siteUrl = (import.meta.env.PUBLIC_SITE_URL || runtimeOrigin).replace(/\/$/, "");
const imageUrl = `${siteUrl}${basePath}og-image.svg`;

type PageMetadata = { title: string; description: string; canonical: string | null; robots: string };

function setMeta(name: string, content: string, type: "name" | "property" = "name") {
  let tag = document.querySelector(`meta[${type}="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(type, name);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function setCanonical(url: string | null) {
  let tag = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!url) {
    tag?.remove();
    return;
  }
  if (!tag) {
    tag = document.createElement("link");
    tag.rel = "canonical";
    document.head.appendChild(tag);
  }
  tag.href = url;
}

const routeMetadata: Record<PageRoute, PageMetadata> = {
  "garment-erp": { title: "Replace Excel with Garment ERP | LoomIQ", description: "Explore LoomIQ ERP for garment and clothing manufacturers: production, inventory, orders, billing, and business management.", canonical: `${siteUrl}${basePath}garment-erp`, robots: "index, follow" },
  demo: { title: "Request a LoomIQ Walkthrough", description: "Request a LoomIQ walkthrough for your garment or textile manufacturing workflow.", canonical: `${siteUrl}${basePath}demo`, robots: "index, follow" },
  home: { title: "LoomIQ - ERP Software for Garment & Textile Manufacturers", description: "LoomIQ ERP helps garment and textile manufacturers manage production, inventory, orders, billing, and day-to-day business operations in one place.", canonical: `${siteUrl}${basePath}`, robots: "index, follow" },
  privacy: { title: "Privacy Policy | LoomIQ", description: "Review how LoomIQ handles demo requests, business information, and website data for privacy and compliance purposes.", canonical: `${siteUrl}${basePath}privacy`, robots: "index, follow" },
  terms: { title: "Terms of Service | LoomIQ", description: "Read the LoomIQ website terms covering demo requests, product information, and the use of this platform.", canonical: `${siteUrl}${basePath}terms`, robots: "index, follow" },
  refunds: { title: "Refund & Cancellation Policy | LoomIQ", description: "Review LoomIQ membership renewal, cancellation, access, and refund information.", canonical: `${siteUrl}${basePath}refunds`, robots: "index, follow" },
  "thank-you": { title: "Thank You | LoomIQ", description: "Review your LoomIQ confirmation and next steps.", canonical: `${siteUrl}${basePath}thank-you`, robots: "noindex, nofollow" },
  signup: { title: "Sign Up & Choose Your Welcome Offer | LoomIQ", description: "Review LoomIQ pricing and conditions before creating an account.", canonical: `${siteUrl}${basePath}signup`, robots: "noindex, nofollow" },
  payment: { title: "Secure Membership Checkout | LoomIQ", description: "Choose your LoomIQ ERP membership, share your business details, and continue to secure payment.", canonical: `${siteUrl}${basePath}payment`, robots: "noindex, nofollow" },
  account: { title: "Your Account | LoomIQ", description: "Manage your LoomIQ account, onboarding and invoices.", canonical: `${siteUrl}${basePath}account`, robots: "noindex, nofollow" },
  "404": { title: "Page Not Found | LoomIQ", description: "The page you requested could not be found. Explore LoomIQ ERP features and request a walkthrough.", canonical: null, robots: "noindex, follow" },
};

function applyMetadata(metadata: PageMetadata) {
  document.title = metadata.title;
  setMeta("description", metadata.description);
  setMeta("robots", metadata.robots);
  setMeta("og:title", metadata.title, "property");
  setMeta("og:description", metadata.description, "property");
  setMeta("og:url", metadata.canonical || `${siteUrl}${basePath}`, "property");
  setMeta("og:type", "website", "property");
  setMeta("og:site_name", "LoomIQ", "property");
  setMeta("og:image", imageUrl, "property");
  setMeta("og:image:alt", "LoomIQ ERP platform overview", "property");
  setMeta("twitter:card", "summary_large_image");
  setMeta("twitter:title", metadata.title);
  setMeta("twitter:description", metadata.description);
  setMeta("twitter:image", imageUrl);
  setCanonical(metadata.canonical);
}

export function applyPageSeo(route: PageRoute) {
  applyMetadata(routeMetadata[route]);
}

export function applyManagedPageSeo(page: { title: string; description?: string; seo?: { title?: string; description?: string; canonical?: string; robots?: string } }) {
  const pathname = window.location.pathname.replace(/\/$/, "") || "/";
  const fallbackCanonical = `${siteUrl}${pathname === "/" ? basePath : pathname}`;
  const requestedCanonical = page.seo?.canonical;
  const canonical = requestedCanonical && new URL(requestedCanonical, siteUrl).origin === siteUrl ? requestedCanonical : fallbackCanonical;
  applyMetadata({
    title: page.seo?.title || page.title,
    description: page.seo?.description || page.description || "Learn more about LoomIQ ERP for garment and textile manufacturers.",
    canonical,
    robots: page.seo?.robots || "index, follow",
  });
}
