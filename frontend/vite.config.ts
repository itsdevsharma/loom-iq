import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

type StaticRoute = { path: string; title: string; description: string; robots: string; canonical?: string | null };

const staticRoutes: StaticRoute[] = [
  { path: 'garment-erp', title: 'Replace Excel with Garment ERP | LoomIQ', description: 'Explore LoomIQ ERP for garment and clothing manufacturers: production, inventory, orders, billing, and business management.', robots: 'index, follow' },
  { path: 'demo', title: 'Request a LoomIQ Walkthrough', description: 'Request a LoomIQ walkthrough for your garment or textile manufacturing workflow.', robots: 'index, follow' },
  { path: 'privacy', title: 'Privacy Policy | LoomIQ', description: 'Review how LoomIQ handles demo requests, business information, and website data for privacy and compliance purposes.', robots: 'index, follow' },
  { path: 'terms', title: 'Terms of Service | LoomIQ', description: 'Read the LoomIQ website terms covering demo requests, product information, and the use of this platform.', robots: 'index, follow' },
  { path: 'refunds', title: 'Refund & Cancellation Policy | LoomIQ', description: 'Review LoomIQ membership renewal, cancellation, access, and refund information.', robots: 'index, follow' },
  { path: 'signup', title: 'Sign Up & Choose Your Welcome Offer | LoomIQ', description: 'Review LoomIQ pricing and conditions before creating an account.', robots: 'noindex, nofollow' },
  { path: 'payment', title: 'Secure Membership Checkout | LoomIQ', description: 'Choose your LoomIQ ERP membership, share your business details, and continue to secure payment.', robots: 'noindex, nofollow' },
  { path: 'thank-you', title: 'Thank You | LoomIQ', description: 'Review your LoomIQ confirmation and next steps.', robots: 'noindex, nofollow' },
  { path: 'account', title: 'Your Account | LoomIQ', description: 'Manage your LoomIQ account, onboarding and invoices.', robots: 'noindex, nofollow' },
  { path: 'forgot-password', title: 'Reset Your Password | LoomIQ', description: 'Reset your LoomIQ password.', robots: 'noindex, nofollow' },
  { path: 'reset-password', title: 'Reset Your Password | LoomIQ', description: 'Reset your LoomIQ password.', robots: 'noindex, nofollow' },
  { path: 'verify-email', title: 'Verify Your Email | LoomIQ', description: 'Verify your LoomIQ email address.', robots: 'noindex, nofollow' },
];

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));
}

function routeHtml(html: string, route: StaticRoute, siteUrl: string, normalizedBase: string) {
  const canonical = route.canonical === null ? null : route.canonical || `${siteUrl}${normalizedBase}${route.path}`;
  const image = `${siteUrl}${normalizedBase}og-image.svg`;
  const replaceMeta = (name: string, value: string, attribute: 'name' | 'property' = 'name') => html = html.replace(new RegExp(`(<meta\\s+${attribute}="${name}"\\s+content=")[^"]*(")`), `$1${escapeHtml(value)}$2`);

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(route.title)}</title>`);
  replaceMeta('description', route.description);
  replaceMeta('robots', route.robots);
  replaceMeta('og:title', route.title, 'property');
  replaceMeta('og:description', route.description, 'property');
  replaceMeta('og:url', canonical || `${siteUrl}${normalizedBase}`, 'property');
  replaceMeta('og:image', image, 'property');
  replaceMeta('twitter:title', route.title);
  replaceMeta('twitter:description', route.description);
  replaceMeta('twitter:image', image);
  html = canonical
    ? html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${escapeHtml(canonical)}$2`)
    : html.replace(/\s*<link rel="canonical" href="[^"]*"\s*\/>/, '');

  // The Organization, WebSite, and SoftwareApplication graph describes the homepage only.
  return html.replace(/\s*<script type="application\/ld\+json" id="loomiq-app-schema">[\s\S]*?<\/script>/, '');
}

function generateSeoFiles(siteUrl: string, normalizedBase: string) {
  return {
    name: 'generate-seo-files',
    writeBundle() {
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}${normalizedBase}</loc>
  </url>
  <url>
    <loc>${siteUrl}${normalizedBase}garment-erp</loc>
  </url>
  <url>
    <loc>${siteUrl}${normalizedBase}demo</loc>
  </url>
  <url>
    <loc>${siteUrl}${normalizedBase}privacy</loc>
  </url>
  <url>
    <loc>${siteUrl}${normalizedBase}terms</loc>
  </url>
  <url>
    <loc>${siteUrl}${normalizedBase}refunds</loc>
  </url>
</urlset>
`;

      const robots = `User-agent: *
Allow: /
Sitemap: ${siteUrl}${normalizedBase}sitemap.xml
`;

      writeFileSync('dist/robots.txt', robots, 'utf8');
      writeFileSync('dist/sitemap.xml', sitemap, 'utf8');
      // Static metadata is available to crawlers before the SPA bootstraps.
      const indexHtml = readFileSync('dist/index.html', 'utf8');
      for (const route of staticRoutes) {
        mkdirSync(`dist/${route.path}`, { recursive: true });
        writeFileSync(`dist/${route.path}/index.html`, routeHtml(indexHtml, route, siteUrl, normalizedBase), 'utf8');
      }
      writeFileSync('dist/404.html', routeHtml(indexHtml, { path: '', title: 'Page Not Found | LoomIQ', description: 'The page you requested could not be found. Explore LoomIQ ERP features and request a walkthrough.', robots: 'noindex, follow', canonical: null }, siteUrl, normalizedBase), 'utf8');
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'PUBLIC_');
  const siteUrl = (env.PUBLIC_SITE_URL || 'https://loomiq.site').replace(/\/$/, '');
  const basePath = env.PUBLIC_BASE_PATH || '/';
  const normalizedBase = basePath === '/' ? '/' : basePath.replace(/\/+$/, '') + '/';

  return {
    envPrefix: 'PUBLIC_',
    plugins: [react(), generateSeoFiles(siteUrl, normalizedBase)],
    base: normalizedBase,
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          // Keep the browser host for the backend's same-origin login checks.
          changeOrigin: false,
        },
      },
    },
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
  };
});
