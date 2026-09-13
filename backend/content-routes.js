
const { fail } = require('./account-service');

function registerContentRoutes(app, { store, PUBLIC_SITE_URL }) {
  async function publicPages() {
    const docs = await store().list('pages');
    const published = [];
    for (const doc of docs) {
      if (doc.status !== 'published' || !doc.publishedVersionId) continue;
      try {
        const version = await store().get('page_versions', doc.publishedVersionId);
        if (!version || !version.payload) continue;
        published.push({
          id: doc._id,
          title: version.payload.title,
          slug: version.payload.slug,
          description: version.payload.description || '',
          seo: version.payload.seo || {},
          publishedAt: doc.publishedVersionId ? (version.createdAt || 0) : 0,
        });
      } catch (e) { /* skip */ }
    }
    published.sort(function(a, b) { return b.publishedAt - a.publishedAt; });
    return published;
  }

  app.get('/api/content/pages', async function(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const size = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const pages = await publicPages();
      const total = pages.length;
      const start = (page - 1) * size;
      res.json({ items: pages.slice(start, start + size), page: page, limit: size, total: total });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      throw error;
    }
  });

  app.get('/api/content/pages/:slug', async function(req, res) {
    const slug = (req.params.slug || '').toLowerCase();
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) throw fail(400, 'Invalid slug.');
    let doc = null;
    for (const page of await store().list('pages')) {
      if (page.status !== 'published' || !page.publishedVersionId) continue;
      const release = await store().get('page_versions', page.publishedVersionId);
      if (release?.payload?.slug === slug) { doc = page; break; }
    }
    if (!doc || doc.status !== 'published' || !doc.publishedVersionId) throw fail(404, 'Page not found.');
    const version = await store().get('page_versions', doc.publishedVersionId);
    if (!version || !version.payload) throw fail(404, 'Page content not found.');
    const payload = version.payload;
    const meta = {
      id: doc._id,
      title: version.payload.title,
      slug: version.payload.slug,
      description: version.payload.description || '',
      seo: version.payload.seo || {},
      publishedAt: version.createdAt || 0,
      publishedVersionId: version._id,
      sections: payload.sections || [],
      breadcrumb: payload.breadcrumb || null,
    };
    res.json(meta);
  });

  app.get('/api/content/preview/:token', async function(req, res) {
    const tokenDoc = await store().get('preview_tokens', req.params.token);
    if (!tokenDoc || tokenDoc.expiresAt <= Date.now()) throw fail(401, 'Preview token is invalid or expired.');
    const version = tokenDoc.snapshot || await store().get('page_versions', tokenDoc.versionId);
    if (!version) throw fail(404, 'Preview version not found.');
    const payload = version.payload || {};
    const doc = await store().get('pages', version.pageId);
    res.json({
      pageId: version.pageId,
      slug: doc ? doc.slug : null,
      title: doc ? doc.title : payload.title || '',
      versionId: version._id,
      payload: payload,
      createdAt: version.createdAt,
      createdBy: version.createdBy,
      reason: version.reason,
    });
  });
}

module.exports = { registerContentRoutes };
