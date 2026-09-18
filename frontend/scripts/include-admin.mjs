import { cp, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Both apps ship in one Vercel artifact; only compiled public assets are copied.
const source = new URL('../../admin/dist/', import.meta.url);
const destination = new URL('../dist/admin/', import.meta.url);
await access(new URL('index.html', source));
await access(new URL('../dist/index.html', import.meta.url));
await cp(fileURLToPath(source), fileURLToPath(destination), { recursive: true });
console.log('Admin included at /admin/');
