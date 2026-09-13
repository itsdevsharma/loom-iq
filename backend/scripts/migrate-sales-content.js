// Migrate known old sales copy only; preserve custom edits and commercial pricing.
// Stop a file-backed API before running this offline file-storage command.
const path = require('node:path');
const {fileRepository} = require('../repository');
const changes = require('../migrations/sales-funnel-content.json');
const args = process.argv.slice(2);
const fileIndex = args.indexOf('--file');
if (fileIndex < 0 || !args[fileIndex + 1]) throw new Error('Usage: node scripts/migrate-sales-content.js --file path/to/offers.json [--apply]');
const store = fileRepository(path.resolve(args[fileIndex + 1]));
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
function migrate(values) {
  const next = {...values}; let count = 0;
  for (const [key,change] of Object.entries(changes)) {
    if (same(next[key],change.before)) { next[key] = change.after; count++; }
  }
  return {values:next,count};
}
(async () => {
  const doc = await store.get('website_content','site');
  if (!doc?.published) { console.log('No published overrides; updated bundled defaults apply.'); return; }
  const preview = migrate(doc.published);
  console.log(`${preview.count} matching published fields can be updated; custom edits and prices are preserved.`);
  if (!args.includes('--apply') || !preview.count) return;
  await store.transaction(async tx => {
    const current = await tx.get('website_content','site');
    if (!same(current,doc)) throw new Error('Content changed; rerun the migration.');
    const now = Date.now(); const id = 'before-sales-audit-' + now;
    await tx.put('website_versions',id,{id,values:current.published,createdAt:now,createdBy:'local-sales-audit',reason:'Before sales funnel copy migration'});
    await tx.put('website_content','site',{...current,published:preview.values,...(current.draft?{draft:migrate(current.draft).values}:{}),publishedAt:now,revision:(current.revision||0)+1});
  });
  console.log('Updated local CMS content. Prior published values remain in website_versions for restoration.');
})().catch(error=>{console.error(error.message);process.exitCode=1});
