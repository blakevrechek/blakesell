// Launch gate (build spec, Section 9). Run after `npm run build`.
// Exits non-zero if any check fails. Every failure is listed, not just the first.
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { config, legalDraftBanner } from '../src/content/site.ts';

const DIST = 'dist';
const TEST_SITEKEY = '1x00000000000000000000AA';
const failures = [];
const fail = (check, where, detail) => failures.push({ check, where, detail });

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const exists = (p) => stat(p).then(() => true, () => false);

// Visible text only: drop scripts, styles, and tags, decode common entities.
function visibleText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&mdash;|&#8212;|&#x2014;/gi, '—')
    .replace(/&amp;/g, '&');
}

if (!(await exists(DIST))) {
  console.error('prelaunch: dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

const domainOk = /^[a-z0-9.-]+\.[a-z]{2,}$/.test(config.domain);
if (!domainOk) fail('Domain', 'src/content/site.ts', `config.domain is "${config.domain}", not a bare hostname`);
const origin = `https://${config.domain}`;

const files = await walk(DIST);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const textFiles = files.filter((f) => /\.(html|xml|txt|js|json)$/.test(f));

// Internal link targets: route -> html file, plus ids per file.
const routeFile = (route) => {
  const clean = route.replace(/[?#].*$/, '');
  if (clean === '/' || clean === '') return join(DIST, 'index.html');
  return join(DIST, `${clean.replace(/^\//, '').replace(/\/$/, '')}.html`);
};

// 1. Placeholders anywhere in built output (text, attributes, JSON-LD, sitemap).
//    Uppercase-only so Tailwind arbitrary classes like max-w-[68ch] never match.
const PLACEHOLDER = /\[(?:TODO|[A-Z][A-Z0-9_]*(?:\/[A-Z0-9_]+)*|[A-Z][A-Z_ ]*[A-Z])\]/g;
for (const f of textFiles) {
  const s = await readFile(f, 'utf8');
  const hits = [...new Set(s.match(PLACEHOLDER) || [])];
  if (hits.length) fail('No [BRACKET] or [TODO] placeholders', relative(DIST, f), hits.join(' '));
}

for (const f of htmlFiles) {
  const rel = relative(DIST, f);
  const html = await readFile(f, 'utf8');
  const isThanks = rel === 'thanks.html';
  const is404 = rel === '404.html';

  // 2. noindex only on /thanks.
  const noindex = /<meta[^>]+name=["']robots["'][^>]*noindex/i.test(html);
  if (noindex && !isThanks) fail('noindex only on /thanks', rel, 'has noindex');
  if (!noindex && isThanks) fail('noindex only on /thanks', rel, '/thanks is missing noindex');

  // 3. canonical and og:url start with https://DOMAIN.
  if (!is404) {
    const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1];
    const ogUrl = html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)/i)?.[1];
    for (const [name, v] of [['canonical', canonical], ['og:url', ogUrl]]) {
      if (!v) fail('Canonical and og:url', rel, `${name} missing`);
      else if (!v.startsWith(origin)) fail('Canonical and og:url', rel, `${name} is ${v}`);
    }
  }

  // 4. No dev or staging hostnames.
  for (const bad of ['github.io', 'pages.dev', 'localhost']) {
    if (html.includes(bad)) fail('No staging hostnames', rel, bad);
  }

  // 5. No em-dashes in visible text.
  if (visibleText(html).includes('—')) fail('No em-dashes', rel, 'em-dash in page text');

  // 6. Internal links resolve.
  const ids = new Set([...html.matchAll(/\sid=["']([^"']+)["']/g)].map((m) => m[1]));
  for (const [, href] of html.matchAll(/<a\b[^>]*\shref=["']([^"']+)["']/gi)) {
    if (href.startsWith('#')) {
      if (href.length > 1 && !ids.has(href.slice(1))) fail('Internal links resolve', rel, `${href} has no target`);
    } else if (href.startsWith('/') && !href.startsWith('//')) {
      const target = routeFile(href);
      if (!(await exists(target))) { fail('Internal links resolve', rel, `${href} -> missing ${relative(DIST, target)}`); continue; }
      const hash = href.split('#')[1];
      if (hash) {
        const t = await readFile(target, 'utf8');
        if (!new RegExp(`\\sid=["']${hash}["']`).test(t)) fail('Internal links resolve', rel, `${href} has no target`);
      }
    }
  }

  // 7. Legal drafts must be reviewed and the banner removed before launch.
  if (legalDraftBanner && html.includes(legalDraftBanner)) fail('Legal pages reviewed', rel, `still shows "${legalDraftBanner}"`);

  // 8. Production Turnstile key, not the always-pass test key.
  if (html.includes(TEST_SITEKEY)) fail('Production Turnstile key', rel, 'uses the Cloudflare test site key. Set PUBLIC_TURNSTILE_SITE_KEY');
}

// 9. _headers present and non-empty.
const headers = join(DIST, '_headers');
if (!(await exists(headers)) || !(await readFile(headers, 'utf8')).trim()) fail('_headers present', '_headers', 'missing or empty');

if (failures.length) {
  console.error(`\nprelaunch: ${failures.length} failure(s)\n`);
  const byCheck = Map.groupBy ? Map.groupBy(failures, (x) => x.check) : null;
  for (const [check, list] of byCheck ?? [['', failures]]) {
    console.error(`  ✗ ${check}`);
    for (const x of list) console.error(`      ${x.where}: ${x.detail}`);
  }
  console.error('\nManual checks are listed in README.md under "Launch gate".');
  process.exit(1);
}
console.log(`prelaunch: all checks passed across ${htmlFiles.length} pages`);
