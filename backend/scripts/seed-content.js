const { fileRepository } = require('../repository');
const path = require('node:path');
const fs = require('node:fs');

const OFFER_DB_PATH = process.env.OFFER_DB_PATH || path.join(__dirname, '..', 'data', 'offers.json');
const DEMO_DB_PATH = path.join(__dirname, '..', 'data', 'demo-requests.json');
const MEDIA_DIR = process.env.MEDIA_STORAGE_PATH || path.join(__dirname, '..', 'data', 'media');

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function createPage(store, data) {
  const id = data.slug;
  const doc = {
    _id: id,
    title: data.title,
    slug: data.slug,
    description: data.description || '',
    seo: data.seo || {},
    sections: data.sections || [],
    status: 'published',
    publishedVersionId: null,
    lastModifiedAt: Date.now(),
    lastModifiedBy: data.lastModifiedBy || 'system',
    createdAt: Date.now(),
    createdBy: data.createdBy || 'system',
  };
  await store.put('pages', id, doc);
  const versionId = 'seed-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  const version = {
    _id: versionId,
    pageId: id,
    payload: Object.assign({}, doc, { _id: undefined }),
    createdAt: Date.now(),
    createdBy: 'system',
    reason: 'Seeded initial version',
    published: true,
  };
  await store.put('page_versions', versionId, version);
  doc.publishedVersionId = versionId;
  await store.put('pages', id, doc);
  return version;
}

async function run() {
  const store = fileRepository(OFFER_DB_PATH, DEMO_DB_PATH);
  fs.mkdirSync(MEDIA_DIR, { recursive: true });

  const existing = await store.get('pages', 'home');
  if (existing) {
    console.log('Pages already seeded; skipping.');
    return;
  }

  await createPage(store, {
    title: 'LoomIQ',
    slug: 'home',
    description: 'AI-backed conversations at scale for revenue teams.',
    seo: {
      title: 'LoomIQ - AI-backed conversations at scale',
      description: 'LoomIQ helps revenue teams run AI-backed conversations at scale across email, social, and your website.',
      robots: 'all',
    },
    sections: [
      {
        id: 'hero-1',
        type: 'hero',
        props: {
          headline: 'AI-backed conversations at scale',
          subheadline: 'Engage, qualify, and convert your audience with intelligent, always-on conversations.',
          ctaText: 'Request a demo',
          ctaLink: '/demo',
        },
      },
      {
        id: 'features-1',
        type: 'features',
        props: {
          items: [
            { title: 'Always-on conversations', description: 'Reach visitors the moment they arrive and keep the dialogue moving.' },
            { title: 'Built-in qualification', description: 'Ask the right questions and route qualified leads to your team instantly.' },
            { title: 'One place for everything', description: 'Messaging, meetings, and follow-ups stay connected instead of scattered.' },
          ],
        },
      },
      {
        id: 'cta-1',
        type: 'cta',
        props: {
          label: 'Ready to see it in action?',
          link: '/demo',
          backgroundColor: '#0b1220',
        },
      },
    ],
    lastModifiedBy: 'system',
    createdBy: 'system',
  });

  await createPage(store, {
    title: 'Pricing',
    slug: 'pricing',
    description: 'Simple pricing for teams that want better conversations.',
    seo: {
      title: 'Pricing - LoomIQ',
      description: 'Plans built for teams that want better conversations without the complexity.',
      robots: 'all',
    },
    sections: [
      {
        id: 'pricing-intro',
        type: 'richtext',
        props: {
          body: 'Choose the plan that fits your team. Upgrade or downgrade anytime.',
        },
      },
    ],
    lastModifiedBy: 'system',
    createdBy: 'system',
  });

  await createPage(store, {
    title: 'Sample Article',
    slug: 'sample-article',
    description: 'A sample page to show how content sections work.',
    seo: {
      title: 'Sample Article - LoomIQ',
      description: 'A sample article to demonstrate the CMS section editor.',
      robots: 'all',
    },
    sections: [
      {
        id: 'article-hero',
        type: 'hero',
        props: {
          headline: 'This is a sample article',
          subheadline: 'Use this page to test the editor, preview, and publish workflow.',
          ctaText: 'Edit this page',
          ctaLink: '/admin/content/pages/sample-article',
        },
      },
      {
        id: 'article-body',
        type: 'richtext',
        props: {
          body: 'You can add more sections here, including features, testimonials, and call-to-action blocks.',
        },
      },
    ],
    lastModifiedBy: 'system',
    createdBy: 'system',
  });

  console.log('Seeded pages: home, pricing, sample-article');
}

if (require.main === module) {
  run().catch(err => { console.error(err.message); process.exit(1); });
}

module.exports = { run };
