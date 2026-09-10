import { writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const siteUrl = process.env.VITE_SITE_URL || 'https://www.loomiq.com';
const basePath = process.env.VITE_BASE_PATH || '/';
const normalizedBase = basePath === '/' ? '/' : basePath.replace(/\/+$/, '') + '/';

function generateSeoFiles() {
  return {
    name: 'generate-seo-files',
    writeBundle() {
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}${normalizedBase}</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}${normalizedBase}privacy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${siteUrl}${normalizedBase}terms</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${siteUrl}${normalizedBase}refunds</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
`;

      const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/
Disallow: /thank-you
Disallow: /account
Disallow: /signup
Disallow: /payment
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /verify-email
Sitemap: ${siteUrl}${normalizedBase}sitemap.xml
`;

      writeFileSync('dist/robots.txt', robots, 'utf8');
      writeFileSync('dist/sitemap.xml', sitemap, 'utf8');
      // Static previews need real entry files for direct links and refreshes.
      for (const route of ['signup', 'payment', 'thank-you', 'privacy', 'terms', 'refunds', 'account', 'forgot-password', 'reset-password', 'verify-email']) {
        mkdirSync(`dist/${route}`, { recursive: true });
        copyFileSync('dist/index.html', `dist/${route}/index.html`);
      }
      copyFileSync('dist/index.html', 'dist/404.html');
    },
  };
}

export default defineConfig({
  plugins: [react(), generateSeoFiles()],
  base: normalizedBase,
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
});
