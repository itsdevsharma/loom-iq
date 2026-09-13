const crypto = require('node:crypto');
const { fail, keyFor } = require('./account-service');

const KNOWN_SECTION_TYPES = new Set(['hero', 'features', 'testimonials', 'richtext', 'cta', 'faq']);
const KNOWN_SECTION_SHAPES = {
  hero: { required: ['headline'], props: { headline: 'string', subheadline: 'string', ctaText: 'string', ctaLink: 'string' } },
  features: { required: ['items'], props: { items: 'array' } },
  testimonials: { required: ['entries'], props: { entries: 'array' } },
  richtext: { required: ['body'], props: { body: 'string' } },
  cta: { required: ['label'], props: { label: 'string', link: 'string', linkText: 'string', backgroundColor: 'string' } },
  faq: { required: ['items'], props: { items: 'array' } },
};

function sectionId() { return crypto.randomBytes(6).toString('hex'); }

function validatePageInput(body, allowId) {
  const values = {};
  if (allowId) {
    if (typeof body.id !== 'string' || !body.id) throw fail(400, 'Page id is required.');
    values.id = body.id;
  }
  if (typeof body.title !== 'string' || !body.title.trim()) throw fail(400, 'Title is required.');
  values.title = body.title.trim();
  if (!body.slug) throw fail(400, 'Slug is required.');
  if (typeof body.slug !== 'string' || !/^[a-z0-9-]+$/.test(body.slug)) throw fail(400, 'Slug must be lowercase letters, numbers, and hyphens.');
  values.slug = body.slug.toLowerCase();
  if (typeof body.description !== 'string') values.description = '';
  else values.description = body.description.trim();

  const seo = (typeof body.seo === 'object' && body.seo) ? body.seo : {};
  values.seo = {
    title: typeof seo.title === 'string' ? seo.title.trim() : '',
    description: typeof seo.description === 'string' ? seo.description.trim() : '',
    canonical: typeof seo.canonical === 'string' ? seo.canonical.trim() : '',
    ogTitle: typeof seo.ogTitle === 'string' ? seo.ogTitle.trim() : '',
    ogDescription: typeof seo.ogDescription === 'string' ? seo.ogDescription.trim() : '',
    ogImageKey: typeof seo.ogImageKey === 'string' ? seo.ogImageKey.trim() : '',
    robots: typeof seo.robots === 'string' ? seo.robots.trim() : '',
  };

  if (!Array.isArray(body.sections)) throw fail(400, 'Sections must be an array.');
  const sections = [];
  for (const section of body.sections) {
    if (typeof section !== 'object' || !section) throw fail(400, 'Each section must be an object.');
    const type = typeof section.type === 'string' ? section.type : '';
    if (!type) throw fail(400, 'Each section must have a type.');
    if (!KNOWN_SECTION_TYPES.has(type)) throw fail(400, 'Unknown section type "' + type + '".');
    const shape = KNOWN_SECTION_SHAPES[type];
    if (!shape) throw fail(400, 'Section type "' + type + '" is not editable yet.');
    for (const key of shape.required) {
      if (section.props == null || !(key in section.props)) throw fail(400, 'Section type "' + type + '" requires props.' + key + '.');
    }
    if (typeof section.props !== 'object' || section.props === null) throw fail(400, 'Section type "' + type + '" props must be an object.');
    for (const [key, expected] of Object.entries(shape.props)) {
      const value = section.props[key];
      if (value !== undefined && (expected === 'array' ? !Array.isArray(value) : typeof value !== expected)) throw fail(400, `Invalid ${type}.${key}.`);
      if (Array.isArray(value) && value.some(item => !item || typeof item !== 'object' || Object.values(item).some(v => typeof v !== 'string'))) throw fail(400, `Invalid entries in ${type}.${key}.`);
    }
    sections.push({ id: section.id || sectionId(), type: type, props: section.props });
  }
  values.sections = sections;
  if (body.status && !['draft', 'published', 'archived'].includes(body.status)) throw fail(400, 'Status must be draft, published, or archived.');
  return values;
}

function withAdminMeta(doc, adminEmail) {
  const now = Date.now();
  return {
    ...doc,
    title: doc.title,
    slug: doc.slug,
    description: doc.description,
    seo: doc.seo,
    sections: doc.sections,
    status: doc.status || 'draft',
    publishedVersionId: doc.publishedVersionId || null,
    lastModifiedAt: now,
    lastModifiedBy: adminEmail,
    createdAt: doc.createdAt || now,
    createdBy: doc.createdBy || adminEmail,
  };
}

async function currentAdmin(req, store) {
  const cookieHeader = req.headers.cookie || '';
  const token = /(?:^|; )?loomiq_admin_session=([a-f0-9]{64})(?:;|$)/.exec(cookieHeader)?.[1];
  if (!token) throw fail(401, 'Not authenticated');
  const session = await store().get('sessions', keyFor(token));
  if (!session || session.expiresAt <= Date.now()) throw fail(401, 'Session expired');
  const admin = await store().get('admins', session.adminKey);
  if (!admin) throw fail(401, 'Admin not found');
  return { email: admin.email, roles: admin.roles || [], permissions: admin.permissions || [] };
}

function requirePermission(admin, permission) {
  if (admin.roles.includes('superadmin')) return;
  if (admin.permissions && admin.permissions.includes(permission)) return;
  throw fail(403, 'Insufficient permissions.');
}

async function listPages(store, opts) {
  const docs = await store().list('pages');
  let rows = docs.map(function(doc) { return { id: doc._id, ...doc }; });
  if (opts.search) {
    const q = opts.search.trim().toLowerCase();
    rows = rows.filter(function(row) {
      return row.title.toLowerCase().includes(q) || row.slug.toLowerCase().includes(q) || (row.description || '').toLowerCase().includes(q);
    });
  }
  if (opts.status && ['draft', 'published', 'archived'].indexOf(opts.status) !== -1) {
    rows = rows.filter(function(row) { return row.status === opts.status; });
  }
  rows.sort((a, b) => (b.lastModifiedAt || 0) - (a.lastModifiedAt || 0) || String(a.id).localeCompare(String(b.id)));
  const total = rows.length;
  const pageNum = Math.max(1, parseInt(opts.page, 10) || 1);
  const size = Math.min(100, Math.max(1, parseInt(opts.limit, 10) || 20));
  const start = (pageNum - 1) * size;
  rows = rows.slice(start, start + size).map(function(row) {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      status: row.status,
      lastModifiedAt: row.lastModifiedAt,
      lastModifiedBy: row.lastModifiedBy,
      publishedVersionId: row.publishedVersionId,
      seo: row.seo,
    };
  });
  return { items: rows, page: pageNum, limit: size, total: total };
}

async function getPage(store, id) {
  const doc = await store().get('pages', id);
  if (!doc) throw fail(404, 'Page not found.');
  const versions = await store().list('page_versions');
  const pageVersions = versions.filter(function(v) { return v.pageId === id; }).sort(function(a, b) { return b.createdAt - a.createdAt; });
  return {
    id: doc._id,
    title: doc.title,
    slug: doc.slug,
    description: doc.description,
    seo: doc.seo,
    sections: doc.sections,
    status: doc.status,
    publishedVersionId: doc.publishedVersionId,
    lastModifiedAt: doc.lastModifiedAt,
    lastModifiedBy: doc.lastModifiedBy,
    createdAt: doc.createdAt,
    createdBy: doc.createdBy,
    versions: pageVersions.map(function(v) { return { id: v._id, createdAt: v.createdAt, createdBy: v.createdBy, reason: v.reason, published: v.published }; }),
  };
}

function registerAdminContentRoutes(app, deps) {
  const store = deps.store;
  const addAudit = deps.addAudit;

  app.get('/api/admin/content/pages', async function(req, res) {
    const admin = await currentAdmin(req, store);
    requirePermission(admin, 'content.read');
    try {
      res.json(await listPages(store, { search: req.query.search, status: req.query.status, page: req.query.page, limit: req.query.limit }));
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      throw error;
    }
  });

  app.post('/api/admin/content/pages', async function(req, res) {
    const admin = await currentAdmin(req, store);
    requirePermission(admin, 'content.write');
    const values = validatePageInput(req.body || {}, true);
    await store().transaction(async function(tx) {
      if (await tx.get('pages', values.id)) throw fail(409, 'A page with this id already exists.');
      const slugDoc = (await tx.list('pages')).find(page => page.slug === values.slug);
      if (slugDoc && slugDoc._id !== values.id) throw fail(409, 'A page with this slug already exists.');
      const doc = withAdminMeta({ _id: values.id, slug: values.slug, title: values.title, description: values.description, seo: values.seo, sections: values.sections, status: 'draft' }, admin.email);
      await tx.put('pages', values.id, doc);
      await addAudit({ admin: admin.email, action: 'content.create', resource: 'pages', resourceId: values.id, success: true, value: { title: doc.title, slug: doc.slug } }, tx);
    });
    const created = await store().get('pages', values.id);
    res.status(201).json({ id: created._id, title: created.title, slug: created.slug, status: created.status, createdAt: created.createdAt });
  });

  app.get('/api/admin/content/pages/:id', async function(req, res) {
    const admin = await currentAdmin(req, store);
    requirePermission(admin, 'content.read');
    try {
      res.json(await getPage(store, req.params.id));
    } catch (error) {
      if (error.status) return res.status(error.status).json({ success: false, message: error.message });
      throw error;
    }
  });

  app.patch('/api/admin/content/pages/:id', async function(req, res) {
    const admin = await currentAdmin(req, store);
    requirePermission(admin, 'content.write');
    const body = req.body || {};
    if (Object.keys(body).length === 0) return res.status(400).json({ success: false, message: 'No updates provided.' });
    const existing = await store().get('pages', req.params.id);
    if (!existing) throw fail(404, 'Page not found.');
    validatePageInput({ ...existing, ...body, id: req.params.id }, false);
    if (body.sections !== undefined) {
      if (!Array.isArray(body.sections)) throw fail(400, 'Sections must be an array.');
      const sections = [];
      for (const section of body.sections) {
        if (typeof section !== 'object' || !section) throw fail(400, 'Each section must be an object.');
        const type = typeof section.type === 'string' ? section.type : '';
        if (!type) throw fail(400, 'Each section must have a type.');
        if (!KNOWN_SECTION_TYPES.has(type)) throw fail(400, 'Unknown section type "' + type + '".');
        if (typeof section.props !== 'object' || section.props === null) throw fail(400, 'Section props must be an object.');
        sections.push({ id: section.id || sectionId(), type: type, props: section.props });
      }
      body.sections = sections;
    }
    if (body.slug !== undefined) {
      if (typeof body.slug !== 'string' || !/^[a-z0-9-]+$/.test(body.slug)) throw fail(400, 'Slug must be lowercase letters, numbers, and hyphens.');
      body.slug = body.slug.toLowerCase();
      const slugDoc = (await store().list('pages')).find(page => page.slug === body.slug);
      if (slugDoc && slugDoc._id !== req.params.id) throw fail(409, 'A page with this slug already exists.');
    }
    if (body.status !== undefined && body.status !== existing.status) throw fail(400, 'Use the publish or unpublish action to change page status.');
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || !body.title.trim()) throw fail(400, 'Title is required.');
      body.title = body.title.trim();
    }
    if (body.description !== undefined && typeof body.description !== 'string') delete body.description;
    let seo = existing.seo || {};
    if (body.seo !== undefined) {
      if (typeof body.seo !== 'object' || body.seo === null) throw fail(400, 'Seo must be an object.');
      seo = {
        title: typeof body.seo.title === 'string' ? body.seo.title.trim() : (seo.title || ''),
        description: typeof body.seo.description === 'string' ? body.seo.description.trim() : (seo.description || ''),
        canonical: typeof body.seo.canonical === 'string' ? body.seo.canonical.trim() : (seo.canonical || ''),
        ogTitle: typeof body.seo.ogTitle === 'string' ? body.seo.ogTitle.trim() : (seo.ogTitle || ''),
        ogDescription: typeof body.seo.ogDescription === 'string' ? body.seo.ogDescription.trim() : (seo.ogDescription || ''),
        ogImageKey: typeof body.seo.ogImageKey === 'string' ? body.seo.ogImageKey.trim() : (seo.ogImageKey || ''),
        robots: typeof body.seo.robots === 'string' ? body.seo.robots.trim() : (seo.robots || ''),
      };
    }
    await store().transaction(async function(tx) {
      const current = await tx.get('pages', req.params.id);
      if (!current) throw fail(404, 'Page not found.');
      if (body.lastModifiedAt !== undefined && body.lastModifiedAt !== current.lastModifiedAt) throw fail(409, 'This page was changed by another editor. Reload before saving.');
      if ((await tx.list('pages')).some(page => page.slug === (body.slug ?? current.slug) && page._id !== req.params.id)) throw fail(409, 'A page with this slug already exists.');
      const updated = {
        ...current,
        title: body.title !== undefined ? body.title : current.title,
        slug: body.slug !== undefined ? body.slug : current.slug,
        description: body.description !== undefined ? body.description : current.description,
        seo: seo,
        sections: body.sections !== undefined ? body.sections : current.sections,
        status: body.status !== undefined ? body.status : current.status,
        lastModifiedAt: Date.now(),
        lastModifiedBy: admin.email,
      };
      await tx.put('pages', req.params.id, updated);
      await addAudit({ admin: admin.email, action: 'content.update', resource: 'pages', resourceId: req.params.id, success: true, value: { title: updated.title, slug: updated.slug, status: updated.status } }, tx);
    });
    res.json({ success: true });
  });

  app.post('/api/admin/content/pages/:id/publish', async function(req, res) {
    const admin = await currentAdmin(req, store);
    requirePermission(admin, 'content.publish');
    const body = req.body || {};
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    const existing = await store().get('pages', req.params.id);
    if (!existing) throw fail(404, 'Page not found.');
    if (existing.status === 'archived') throw fail(400, 'Cannot publish an archived page.');
    const versionId = crypto.randomBytes(6).toString('hex') + '-' + Date.now().toString(36);
    await store().transaction(async function(tx) {
      const current = await tx.get('pages', req.params.id);
      const snapshot = structuredClone(current);
      delete snapshot._id;
      const versionDoc = {
        _id: versionId,
        pageId: req.params.id,
        payload: snapshot,
        createdAt: Date.now(),
        createdBy: admin.email,
        reason: reason || 'Published',
        published: true,
      };
      await tx.put('page_versions', versionId, versionDoc);
      const published = {
        ...current,
        status: 'published',
        publishedVersionId: versionId,
        lastModifiedAt: Date.now(),
        lastModifiedBy: admin.email,
      };
      await tx.put('pages', req.params.id, published);
      await addAudit({ admin: admin.email, action: 'content.publish', resource: 'pages', resourceId: req.params.id, success: true, previousValue: { status: current.status, publishedVersionId: current.publishedVersionId }, newValue: { status: 'published', publishedVersionId: versionId, reason: reason || 'Published' } }, tx);
    });
    res.json({ success: true, publishedVersionId: versionId });
  });

  app.post('/api/admin/content/pages/:id/unpublish', async function(req, res) {
    const admin = await currentAdmin(req, store);
    requirePermission(admin, 'content.publish');
    const body = req.body || {};
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    const existing = await store().get('pages', req.params.id);
    if (!existing) throw fail(404, 'Page not found.');

    const targetStatus = body.status === 'archived' ? 'archived' : 'draft';
    await store().transaction(async function(tx) {
      const current = await tx.get('pages', req.params.id);
      const unpublished = {
        ...current,
        status: targetStatus,
        publishedVersionId: null,
        lastModifiedAt: Date.now(),
        lastModifiedBy: admin.email,
      };
      await tx.put('pages', req.params.id, unpublished);
      await addAudit({ admin: admin.email, action: 'content.unpublish', resource: 'pages', resourceId: req.params.id, success: true, previousValue: { status: current.status, publishedVersionId: current.publishedVersionId }, newValue: { status: targetStatus, reason: reason || 'Unpublished' } }, tx);
    });
    res.json({ success: true, status: targetStatus });
  });

  app.get('/api/admin/content/pages/:id/versions', async function(req, res) {
    const admin = await currentAdmin(req, store);
    requirePermission(admin, 'content.read');
    const versions = await store().list('page_versions');
    const pageVersions = versions.filter(function(v) { return v.pageId === req.params.id; }).sort(function(a, b) { return b.createdAt - a.createdAt; }).map(function(v) { return { id: v._id, createdAt: v.createdAt, createdBy: v.createdBy, reason: v.reason, published: v.published }; });
    res.json({ items: pageVersions });
  });

  app.post('/api/admin/content/pages/:id/versions/:versionId/rollback', async function(req, res) {
    const admin = await currentAdmin(req, store);
    requirePermission(admin, 'content.publish');
    const version = await store().get('page_versions', req.params.versionId);
    if (!version || version.pageId !== req.params.id) throw fail(404, 'Version not found.');
    const payload = version.payload;
    if (!payload || typeof payload !== 'object') throw fail(500, 'Version payload missing.');
    const body = req.body || {};
    const reason = typeof body.reason === 'string' ? body.reason.trim() : 'Rolled back to version ' + version._id;
    let newVersionId;
    await store().transaction(async function(tx) {
      const current = await tx.get('pages', req.params.id);
      const rollbackPayload = structuredClone(payload);
      newVersionId = crypto.randomBytes(6).toString('hex') + '-' + Date.now().toString(36);
      await tx.put('page_versions', newVersionId, {
        _id: newVersionId,
        pageId: req.params.id,
        payload: rollbackPayload,
        createdAt: Date.now(),
        createdBy: admin.email,
        reason: reason,
        published: current.publishedVersionId ? false : version.published,
      });
      const restored = {
        ...current,
        title: rollbackPayload.title,
        slug: rollbackPayload.slug,
        description: rollbackPayload.description,
        seo: rollbackPayload.seo,
        sections: rollbackPayload.sections,
        status: version.published ? 'published' : current.status,
        publishedVersionId: version.published ? newVersionId : current.publishedVersionId,
        lastModifiedAt: Date.now(),
        lastModifiedBy: admin.email,
      };
      await tx.put('pages', req.params.id, restored);
      await addAudit({ admin: admin.email, action: 'content.rollback', resource: 'pages', resourceId: req.params.id, success: true, previousValue: { publishedVersionId: current.publishedVersionId, status: current.status }, newValue: { rolledBackTo: version._id, newVersionId: newVersionId, status: restored.status } }, tx);
    });
    res.json({ success: true, newVersionId: newVersionId });
  });

  app.post('/api/admin/content/preview-token', async function(req, res) {
    const admin = await currentAdmin(req, store);
    requirePermission(admin, 'content.read');
    const body = req.body || {};
    if (!body.pageId) throw fail(400, 'pageId is required.');
    const existing = await store().get('pages', body.pageId);
    if (!existing) throw fail(404, 'Page not found.');
    const versionId = body.versionId || null;
    const version = versionId ? await store().get('page_versions', versionId) : { pageId: body.pageId, payload: existing, createdAt: Date.now(), createdBy: admin.email, reason: 'Draft preview' };
    if (!version || version.pageId !== body.pageId) throw fail(404, 'Version not found.');
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = Date.now() + 30 * 60000;
    await store().transaction(async function(tx) {
      await tx.put('preview_tokens', token, { token: token, pageId: body.pageId, versionId: versionId, snapshot: version, expiresAt: expiresAt, used: false, createdBy: admin.email, createdAt: Date.now() });
    });
    res.json({ token: token, expiresAt: expiresAt, versionId: versionId, pageId: body.pageId });
  });

  app.get('/api/admin/content/preview/:token', async function(req, res) {
    const tokenDoc = await store().get('preview_tokens', req.params.token);
    if (!tokenDoc || tokenDoc.expiresAt <= Date.now()) throw fail(401, 'Preview token is invalid or expired.');
    const version = tokenDoc.snapshot || await store().get('page_versions', tokenDoc.versionId);
    if (!version) throw fail(404, 'Preview version not found.');
    res.json({ pageId: version.pageId, versionId: version._id, payload: version.payload, createdAt: version.createdAt, createdBy: version.createdBy, reason: version.reason });
  });

  app.get('/api/content/media/:id', async function(req, res) {
    const media = await store().get('media', req.params.id);
    if (!media) throw fail(404, 'Media not found.');
    if (media.deletedAt) throw fail(410, 'Media has been removed.');
    res.json({ id: media._id, url: media.url, contentType: media.contentType, width: media.width, height: media.height, altText: media.altText, uploadedAt: media.uploadedAt, uploadedBy: media.uploadedBy, size: media.size });
  });

  const mediaDir = requireMediaStorageDir();
  const multer = requireMediaMulter(store);

  app.get('/api/admin/content/media', async function(req, res) {
    const admin = await currentAdmin(req, store);
    requirePermission(admin, 'content.read');
    const docs = await store().list('media');
    const items = docs.filter(function(m) { return !m.deletedAt; }).sort(function(a, b) { return (b.uploadedAt || 0) - (a.uploadedAt || 0); }).map(function(m) {
      return { id: m._id, filename: m.filename, url: m.url, contentType: m.contentType, width: m.width, height: m.height, size: m.size, altText: m.altText, uploadedAt: m.uploadedAt, uploadedBy: m.uploadedBy };
    });
    res.json({ items: items });
  });

  app.post('/api/admin/content/media', async (req, res, next) => {
    const admin = await currentAdmin(req, store);
    requirePermission(admin, 'content.write');
    next();
  }, multer.single('file'), async function(req, res) {
    const admin = await currentAdmin(req, store);
    requirePermission(admin, 'content.write');
    if (!req.file) throw fail(400, 'No file uploaded.');
    validateMediaFile(req.file);
    const id = crypto.randomBytes(8).toString('hex');
    const publicUrl = '/api/admin/content/media/files/' + encodeURIComponent(req.file.filename);
    const doc = {
      _id: id,
      url: publicUrl,
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      size: req.file.size,
      width: 0,
      height: 0,
      altText: '',
      uploadedAt: Date.now(),
      uploadedBy: admin.email,
    };
    await store().transaction(async function(tx) {
      await tx.put('media', id, doc);
      await addAudit({ admin: admin.email, action: 'content.media.upload', resource: 'media', resourceId: id, success: true, value: { filename: doc.filename, contentType: doc.contentType, size: doc.size } }, tx);
    });
    res.status(201).json({ id: id, url: publicUrl, contentType: doc.contentType, size: doc.size });
  });

  app.delete('/api/admin/content/media/:id', async function(req, res) {
    const admin = await currentAdmin(req, store);
    requirePermission(admin, 'content.write');
    const existing = await store().get('media', req.params.id);
    if (!existing) throw fail(404, 'Media not found.');
    await store().transaction(async function(tx) {
      await tx.put('media', req.params.id, { ...existing, deletedAt: Date.now() });
      await addAudit({ admin: admin.email, action: 'content.media.delete', resource: 'media', resourceId: req.params.id, success: true, value: { filename: existing.filename } }, tx);
    });
    res.json({ success: true });
  });

  app.patch('/api/admin/content/media/:id', async function(req, res) {
    const admin = await currentAdmin(req, store);
    requirePermission(admin, 'content.write');
    const existing = await store().get('media', req.params.id);
    if (!existing) throw fail(404, 'Media not found.');
    const body = req.body || {};
    let altText = existing.altText;
    if (body.altText !== undefined) {
      if (typeof body.altText !== 'string') throw fail(400, 'altText must be a string.');
      altText = body.altText.trim();
    }
    await store().transaction(async function(tx) {
      const updated = { ...existing, altText: altText };
      await tx.put('media', req.params.id, updated);
      await addAudit({ admin: admin.email, action: 'content.media.update', resource: 'media', resourceId: req.params.id, success: true, value: { altText: updated.altText } }, tx);
    });
    res.json({ success: true, altText: altText });
  });

  app.use('/api/admin/content/media/files', require('express').static(mediaDir, { maxAge: '1y', setHeaders: function(res) { res.setHeader('X-Content-Type-Options', 'nosniff'); } }));
}

function validateMediaFile(file) {
  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']);
  if (!allowed.has(file.mimetype)) throw fail(400, 'Unsupported file type.');
  if (file.size > 20 * 1024 * 1024) throw fail(400, 'File too large.');
}

function requireMediaStorageDir() {
  const dir = process.env.MEDIA_STORAGE_PATH || require('node:path').join(__dirname, 'data', 'media');
  try { require('node:fs').mkdirSync(dir, { recursive: true }); } catch (e) {}
  return dir;
}

function requireMediaMulter() {
  const multer = require('multer');
  const extensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'video/mp4': '.mp4', 'video/webm': '.webm' };
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, requireMediaStorageDir()),
    filename: (_req, file, cb) => cb(null, crypto.randomBytes(16).toString('hex') + extensions[file.mimetype]),
  });
  return multer({ storage, limits: { fileSize: 20 * 1024 * 1024, files: 1 }, fileFilter: (_req, file, cb) => {
    if (!extensions[file.mimetype]) return cb(fail(400, 'Unsupported file type.'));
    cb(null, true);
  } });
}

module.exports = { registerAdminContentRoutes, currentAdmin, requirePermission };
