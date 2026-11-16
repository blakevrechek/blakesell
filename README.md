# blakesell

One-page marketing site plus `/privacy` and `/terms`. Built from
`agency-site-build-spec.md`. Astro (static output), Tailwind CSS 4, Cloudflare Pages,
one Pages Function for the inquiry form.

**Status:** scaffold complete. Every `[BRACKET]` value is an unfilled placeholder
and renders visibly on purpose. Production deploys are blocked until
`npm run prelaunch` passes.

## Local development

Requires Node 22 or newer.

```bash
npm install
```

```bash
npm run dev
```

The site runs at http://localhost:4321. The inquiry form posts to a Pages Function,
which `astro dev` does not run. To test the form locally, put the function's
secrets in a `.dev.vars` file (gitignored, one `NAME=value` per line), then build
and serve with Wrangler:

```bash
npm run build && npx wrangler pages dev dist --kv RATE_LIMIT
```

Build, then run the launch gate:

```bash
npm run build && npm run prelaunch
```

## Editing copy

**All words live in `src/content/site.ts`.** Layout files never contain copy.

- Section 0 values (business name, entity, domain, email, booking link, prices,
  case study) are at the top, in `config`.
- To hide a price line, set it to `null`. The page never says "contact for pricing."
- To remove the Proof section, set `config.caseStudy.show` to `false`.
- If case-study permission is `'NO'`, the card shows `anonymizedName` instead of the
  client's name.
- Set `config.insurancePolicyBound` to `true` only once the professional liability
  and cyber policy is bound. That adds the insurance clause to FAQ 4.
- When the legal pages have been reviewed, set `legalDraftBanner` to `''`.

Copy rules: no em-dashes; no "expert," "guru," "leading," "world-class,"
"cutting-edge," "unlock," "seamless," "leverage," or "game-changer"; no invented numbers,
clients, testimonials, or results.

Design tokens (colors, fonts, measure) live in `src/styles/global.css` under `@theme`.

## Environment variables

Set in Cloudflare Pages → your project → Settings → Variables and Secrets. Set
them for both Production and Preview.

| Name | Type | Used by | Value |
|---|---|---|---|
| `PUBLIC_TURNSTILE_SITE_KEY` | plain, **build time** | page | Turnstile site key. Without it, builds use Cloudflare's always-pass test key and `prelaunch` fails |
| `TURNSTILE_SECRET_KEY` | secret | function | Turnstile secret key |
| `RESEND_API_KEY` | secret | function | Resend API key |
| `INQUIRY_TO` | plain | function | The inbox that receives inquiries (the site's contact email) |
| `INQUIRY_FROM` | plain | function | Sender on your verified Resend domain, e.g. `Site form <form@yourdomain>` |
| `RATE_LIMIT_SALT` | secret | function | Any long random string |
| `NODE_VERSION` | plain, build time | build | `22` (also pinned in `.node-version`) |

**KV binding:** create a KV namespace and bind it to the project as `RATE_LIMIT`
(Settings → Bindings). The form returns an error, never a silent pass, if the
binding or salt is missing.

No key ever goes in this repo.

## Deploy (Cloudflare Pages)

One-time setup, about 30 minutes:

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git →
   `blakevrechek/blakesell`.
2. Production branch: `main`. Build command: `npm run build:cf`. Output directory:
   `dist`.
3. Add the variables and the KV binding above.
4. Turnstile → Add site → your domain plus the `*.pages.dev` preview host. Copy
   both keys into the variables.
5. Resend → Domains → add your domain and add its DNS records. The form cannot send
   until the domain verifies.
6. Web Analytics → enable for the Pages project (automatic setup). It is cookieless.
7. Custom domain → add it under the Pages project once the launch gate is clear.

After that:

- **Every branch push gets a preview URL.** Preview builds add `X-Robots-Tag: noindex`
  (see `scripts/postbuild.mjs`) and skip the launch gate, so placeholders are
  visible for review.
- **Pushes to `main` deploy to production** and run `prelaunch`. A failing gate
  fails the deploy.

## Launch gate

`npm run prelaunch` checks the built site and lists every failure:

- No `[BRACKET]` or `[TODO]` placeholders anywhere in built output
- `noindex` on `/thanks` only
- Every canonical and `og:url` starts with `https://` plus the configured domain
- No `github.io`, `pages.dev`, or `localhost` strings
- No em-dashes in page text
- All internal links and anchors resolve
- Legal pages no longer show the DRAFT banner
- Production Turnstile key, not the test key
- `_headers` present and non-empty

Manual checks before DNS cutover (from the spec, Section 9):

- [ ] Blake confirmed every factual sentence in About and Proof
- [ ] Case study permission exists in writing, or the section is removed
- [ ] Insurance clause in FAQ 4 stays off unless the policy is bound
- [ ] Entity name matches the formed LLC exactly
- [ ] A test submission arrives at the contact email, and a forced failure shows the inline error
- [ ] Employer's written approval for the outside business is on file
- [ ] Legal pages reviewed and edited by Blake

## Security notes

Reviewed against `web-security-baseline` (blake-stack). Uploads and payments: not
applicable. XSS and headers:

- Headers in `public/_headers`: CSP, HSTS, nosniff, Referrer-Policy,
  Permissions-Policy, X-Frame-Options.
- The only raw-HTML hatch is `set:html` for JSON-LD in `src/layouts/Base.astro`. The data
  comes from `site.ts`, never from visitors, and `<` is escaped.
- The form script writes messages with `textContent` only.
- The form handler caps the body at 16 KB before parsing, strips HTML and control
  characters, validates every field, and logs error types only.

**Accepted exceptions:**

- CSP uses a `'self'` allowlist, not nonces with `strict-dynamic`. The site is
  static with no inline scripts, so there is nothing for a nonce to protect, and
  nonces would need a server on every request.
- CSP is enforced from the first deploy instead of starting in Report-Only.
  Preview deploys are the report-only stage. Check the browser console there.
- Turnstile's script cannot use Subresource Integrity. Cloudflare serves it
  dynamically and it must not be pinned. It is listed explicitly in the CSP and
  loads only when the contact form comes near the viewport.

## Assumptions this spec did not settle

1. **Astro 7.4, not Astro 5.** The spec said Astro 5. The current major is 7 and
   static output is unaffected. Pin 5.18 if you want the spec followed exactly.
2. **Email provider: Resend.** I believe MailChannels ended its free sending for
   Cloudflare Workers in 2024. Not verified.
3. **Rate limiting stores a hashed IP in KV for one hour.** "Store nothing" and "5 per
   hour per IP" conflict; Cloudflare's built-in rate limiter only counts over 10- or
   60-second windows. The privacy draft discloses the hash.
4. **A 3 KB form script.** Turnstile and the `aria-live` inline errors both need
   JavaScript. Without JS the form still posts, and errors come back as a plain page
   with the email address.
5. **Turnstile loads lazily,** to protect the Lighthouse Best Practices score.
6. **Fonts:** Source Serif 4 (headings and body) and Public Sans (labels and
   buttons), both variable, self-hosted, Latin and Latin Extended only, OFL-1.1.
7. **Accent color:** ink blue `#1d3a56` on warm paper `#fbfaf7`. Contrast is
   computed in `global.css`.
8. **Pricing renders as three cards,** not a literal table, so it holds up at
   phone width.
9. **The Problem section heading** ("Where the work goes") and **the contact
   heading** ("Start with a call") are mine. The spec gave none.
10. **FAQ 4 insurance clause is off** until `insurancePolicyBound` is set.
11. **The About copy is the spec draft verbatim.** Open edits are not applied:
    "closed" (your role in the transactions), "leaked file," and full name.
12. **The booking button says "20-minute call".** Your Cal.com link offers 15, 30,
    and 60 minutes. Change one or the other.
13. **The privacy and terms drafts have effective-date placeholders,** and the
    terms page uses your LLC name, so neither page can launch before the LLC exists.
14. **Cloudflare preview URLs** might already get a `noindex` header from Cloudflare
    itself. Not verified. `postbuild.mjs` adds it either way.
