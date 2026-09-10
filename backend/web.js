const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
function registerWebsite(app, directory) {
  const index = path.join(directory, 'index.html');
  if (!fs.existsSync(index)) throw new Error('Build the frontend before starting with SERVE_FRONTEND=true.');
  app.use('/api', (_req, res) => res.status(404).json({ message: 'API route not found.' }));
  app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' https://checkout.razorpay.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.razorpay.com https://*.google-analytics.com https://*.googletagmanager.com; connect-src 'self' https://*.razorpay.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; frame-src https://*.razorpay.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
    next();
  });
  app.use('/assets', express.static(path.join(directory, 'assets'), { maxAge: '1y', immutable: true, fallthrough: false }));
  app.use(express.static(directory, { index: false, redirect: false, maxAge: 0 }));
  const routes = new Set(['/', '/privacy', '/terms', '/refunds', '/signup', '/payment', '/thank-you', '/account', '/forgot-password', '/reset-password', '/verify-email']);
  app.get('/{*path}', (req, res) => {
    const route = req.path.replace(/\/$/, '') || '/';
    res.setHeader('Cache-Control', 'no-store');
    if (!['/', '/privacy', '/terms', '/refunds'].includes(route)) res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.status(routes.has(route) ? 200 : 404).sendFile(index);
  });
}
module.exports = { registerWebsite };
