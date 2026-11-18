// Runs after `astro build`. On Cloudflare Pages preview deploys (any branch
// other than the production branch), adds X-Robots-Tag: noindex to every
// response. Production and local builds are left untouched.
import { readFile, writeFile } from 'node:fs/promises';

const PRODUCTION_BRANCH = process.env.PRODUCTION_BRANCH || 'main';
const branch = process.env.CF_PAGES_BRANCH;
const isPreview = Boolean(process.env.CF_PAGES) && branch !== PRODUCTION_BRANCH;

if (isPreview) {
  const file = 'dist/_headers';
  const src = await readFile(file, 'utf8');
  const out = src.replace(/^\/\*\n/m, '/*\n  X-Robots-Tag: noindex\n');
  if (out === src) throw new Error('postbuild: could not find the /* block in dist/_headers');
  await writeFile(file, out);
  console.log(`postbuild: preview branch "${branch}", added X-Robots-Tag: noindex`);
} else {
  console.log('postbuild: production or local build, headers unchanged');
}
