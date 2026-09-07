type PageRoute = "home" | "privacy" | "terms" | "thank-you" | "404";

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
  home: {
    title: "ERP Software for Connected Business Operations | LoomIQ",
    description: "Manage orders, inventory, production, finance, and operations from one flexible ERP platform built for growing businesses.",
    canonical: `${siteUrl}/`,
  },
  privacy: {
    title: "Privacy Policy | LoomIQ",
    description: "Review how LoomIQ handles demo requests, business information, and website data for privacy and compliance purposes.",
    canonical: `${siteUrl}/privacy`,
  },
  terms: {
    title: "Terms of Service | LoomIQ",
    description: "Read the LoomIQ website terms covering demo requests, product information, and the use of this platform.",
    canonical: `${siteUrl}/terms`,
  },
  "thank-you": {
    title: "Demo Request Received | LoomIQ",
    description: "Thank you for contacting LoomIQ. Your demo request has been received and our team will follow up shortly.",
    canonical: `${siteUrl}/thank-you`,
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
  setMeta("robots", route === "404" || route === "thank-you" ? "noindex, nofollow" : "index, follow");
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
