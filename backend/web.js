const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
function registerWebsite(app, directory, store) {
  const index = path.join(directory, 'index.html');
  if (!fs.existsSync(index)) throw new Error('Build the frontend before starting with SERVE_FRONTEND=true.');
  app.use('/api', (_req, res) => res.status(404).json({ message: 'API route not found.' }));
  // The script hash permits only the exact Meta Pixel snippet in frontend/index.html.
  app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'sha256-QQIGov9CWWEVvhH8ZY7yWmc+LJ/kSPS3pj0Xjiqbg8g=' https://checkout.razorpay.com https://www.googletagmanager.com https://connect.facebook.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.razorpay.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.facebook.com https://connect.facebook.net; frame-src https://*.razorpay.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
    next();
  });
  app.use('/assets', express.static(path.join(directory, 'assets'), { maxAge: '1y', immutable: true, fallthrough: false }));
  app.use(express.static(directory, { index: false, redirect: false, maxAge: 0 }));
  const routes = new Set(['/', '/garment-erp', '/demo', '/privacy', '/terms', '/refunds', '/signup', '/payment', '/thank-you', '/account', '/forgot-password', '/reset-password', '/verify-email']);
  app.get('/{*path}', async (req, res) => {
    const route = req.path.replace(/\/$/, '') || '/';
    res.setHeader('Cache-Control', 'no-store');
    let custom = null;
    if (store && !routes.has(route)) {
      for (const page of await store().list('pages')) {
        if (page.status !== 'published' || !page.publishedVersionId) continue;
        const version = await store().get('page_versions', page.publishedVersionId);
        if (version?.payload?.slug === route.slice(1)) { custom = version.payload; break; }
      }
    }
    if (!['/', '/garment-erp', '/demo', '/privacy', '/terms', '/refunds'].includes(route) && !custom) res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    let html = fs.readFileSync(index, 'utf8');
    if (store) {
      const {values} = await require('./website-content').publishedWebsite(store());
      const ids = {'/':[3,4],'/garment-erp':[3,4],'/demo':[3,4],'/privacy':[5,6],'/terms':[7,8],'/refunds':[9,10],'/signup':[13,14],'/payment':[15,16],'/account':[1,2],'/thank-you':[11,12]}[route] || [17,18];
      let title = custom ? custom.seo?.title || custom.title : values['seo.'+ids[0]];
      let description = custom ? custom.seo?.description || custom.description : values['seo.'+ids[1]];
      if (route === '/garment-erp') { title = 'Replace Excel with Garment ERP | LoomIQ'; description = 'ERP built for garment and clothing manufacturers. Explore LoomIQ, compare monthly pricing, and purchase online.'; }
      const escape = value => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
      html = html.replace(/<title>[^<]*<\/title>/, () => '<title>'+escape(title)+'</title>');
      html = html.replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, (_,a,b)=>a+escape(description)+b);
    }
    const origin = (process.env.PUBLIC_SITE_URL || 'https://loomiq.site').replace(/\/$/, '');
    const canonical = origin + route;
    const safe = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const title = html.match(/<title>(.*?)<\/title>/)?.[1] || 'LoomIQ';
    const description = html.match(/<meta\s+name="description"\s+content="([^"]*)"/)?.[1] || '';
    html = html.replace(/(<meta (?:property|name)="(?:og|twitter):title" content=")[^"]*(")/g, (_,a,b)=>a+title+b)
      .replace(/(<meta (?:property|name)="(?:og|twitter):description" content=")[^"]*(")/g, (_,a,b)=>a+description+b)
      .replace(/(<link rel="canonical" href=")[^"]*(")/, (_,a,b)=>a+safe(canonical)+b)
      .replace(/(<meta property="og:url" content=")[^"]*(")/, (_,a,b)=>a+safe(canonical)+b);
    res.status(routes.has(route) || custom ? 200 : 404).type('html').send(html);
  });
}
module.exports = { registerWebsite };
