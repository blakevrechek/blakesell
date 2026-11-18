/**
 * POST /api/inquiry  (Cloudflare Pages Function)
 *
 * Order: honeypot, rate limit, Turnstile, validation, send.
 * Stores nothing except a one-hour hashed-IP counter in KV for rate limiting.
 * Never logs message bodies.
 *
 * Environment (set in Cloudflare Pages > Settings > Variables and Secrets):
 *   TURNSTILE_SECRET_KEY  secret   Turnstile secret key
 *   RESEND_API_KEY        secret   Resend API key
 *   INQUIRY_TO            plain    Inbox that receives inquiries (the site's [EMAIL])
 *   INQUIRY_FROM          plain    Verified Resend sender, e.g. "Site form <form@yourdomain>"
 *   RATE_LIMIT_SALT       secret   Any long random string, used to hash IPs
 * Binding:
 *   RATE_LIMIT            KV namespace
 */

interface KV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

interface Env {
  TURNSTILE_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  INQUIRY_TO?: string;
  INQUIRY_FROM?: string;
  RATE_LIMIT_SALT?: string;
  RATE_LIMIT?: KV;
}

interface Ctx {
  request: Request;
  env: Env;
}

const LIMITS = { name: 100, email: 254, organization: 150, message: 1000 };
const TYPES = ['Business', 'Professional firm', 'Nonprofit', 'Individual'];
const MAX_BODY_BYTES = 16 * 1024;
const RATE_MAX = 5;
const RATE_WINDOW_SECONDS = 3600;
const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[a-z]{2,}$/i;

type Failure = { status: number; code: string };

/** Strip tags and control characters, collapse runs of blank lines, trim. */
function clean(v: FormDataEntryValue | null, max: number, multiline = false): string {
  if (typeof v !== 'string') return '';
  let s = v.replace(/<[^>]*>/g, '').replace(/[<>]/g, '');
  s = multiline
    ? s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n')
    : s.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ');
  return s.trim().slice(0, max);
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function rateLimited(env: Env, ip: string): Promise<boolean> {
  if (!env.RATE_LIMIT || !env.RATE_LIMIT_SALT) {
    // Missing config must not silently disable the limit in production.
    throw new Error('rate limit not configured');
  }
  const key = `rl:${await sha256(`${env.RATE_LIMIT_SALT}:${ip}`)}`;
  const count = Number((await env.RATE_LIMIT.get(key)) || '0');
  if (count >= RATE_MAX) return true;
  await env.RATE_LIMIT.put(key, String(count + 1), { expirationTtl: RATE_WINDOW_SECONDS });
  return false;
}

async function verifyTurnstile(env: Env, token: string, ip: string): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY || !token) return false;
  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET_KEY);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  if (!r.ok) return false;
  const j = (await r.json()) as { success?: boolean };
  return j.success === true;
}

async function sendEmail(env: Env, f: Record<string, string>): Promise<boolean> {
  if (!env.RESEND_API_KEY || !env.INQUIRY_TO || !env.INQUIRY_FROM) return false;
  const text = [
    `Name: ${f.name}`,
    `Email: ${f.email}`,
    `Organization: ${f.organization || '(none given)'}`,
    `Type: ${f.type}`,
    '',
    "What's stalling?",
    f.message,
  ].join('\n');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.INQUIRY_FROM,
      to: [env.INQUIRY_TO],
      reply_to: f.email,
      subject: `Site inquiry: ${f.name}${f.organization ? `, ${f.organization}` : ''}`.slice(0, 200),
      text,
    }),
  });
  return r.ok;
}

function wantsJson(req: Request): boolean {
  return (req.headers.get('Accept') || '').includes('application/json');
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function failure(req: Request, env: Env, { status, code }: Failure): Response {
  if (wantsJson(req)) {
    return Response.json({ ok: false, code }, { status });
  }
  // No-JS fallback: a plain page with the email address, never a silent failure.
  const email = escapeHtml(env.INQUIRY_TO || '');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Message not sent</title></head><body><h1>Your message did not send.</h1><p>Please email <a href="mailto:${email}">${email}</a> directly.</p><p><a href="/#contact">Back to the form</a></p></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export async function onRequestPost({ request, env }: Ctx): Promise<Response> {
  try {
    const ip = request.headers.get('CF-Connecting-IP') || '';

    // Cap the body before parsing. Legitimate submissions are a few KB.
    const declared = Number(request.headers.get('Content-Length') || '0');
    if (declared > MAX_BODY_BYTES) return failure(request, env, { status: 413, code: 'too_large' });
    const raw = await request.arrayBuffer();
    if (raw.byteLength > MAX_BODY_BYTES) return failure(request, env, { status: 413, code: 'too_large' });
    const data = await new Request(request.url, {
      method: 'POST',
      body: raw,
      headers: { 'Content-Type': request.headers.get('Content-Type') || '' },
    }).formData();

    // 3. Honeypot. Answer like a success so bots learn nothing.
    if (typeof data.get('website') === 'string' && (data.get('website') as string).length > 0) {
      return wantsJson(request) ? Response.json({ ok: true }) : Response.redirect(new URL('/thanks', request.url).toString(), 303);
    }

    // 4. Rate limit by IP.
    if (await rateLimited(env, ip)) return failure(request, env, { status: 429, code: 'rate_limited' });

    // 1. Turnstile, verified server-side.
    const token = typeof data.get('cf-turnstile-response') === 'string' ? (data.get('cf-turnstile-response') as string) : '';
    if (!(await verifyTurnstile(env, token, ip))) return failure(request, env, { status: 403, code: 'turnstile' });

    // 2. Validate and length-limit every field. Strip HTML.
    const f = {
      name: clean(data.get('name'), LIMITS.name),
      email: clean(data.get('email'), LIMITS.email),
      organization: clean(data.get('organization'), LIMITS.organization),
      type: clean(data.get('type'), 40),
      message: clean(data.get('message'), LIMITS.message, true),
    };
    if (!f.name || !f.message || !EMAIL_RE.test(f.email) || !TYPES.includes(f.type)) {
      return failure(request, env, { status: 400, code: 'invalid' });
    }

    // 5. Send one plain-text email with Reply-To set to the submitter.
    if (!(await sendEmail(env, f))) return failure(request, env, { status: 502, code: 'send_failed' });

    // 6. Success.
    return wantsJson(request) ? Response.json({ ok: true }) : Response.redirect(new URL('/thanks', request.url).toString(), 303);
  } catch (err) {
    // Log the error type only. Never the request body.
    console.error('inquiry error:', err instanceof Error ? err.message : 'unknown');
    return failure(request, env, { status: 500, code: 'server_error' });
  }
}

export function onRequest(): Response {
  return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
}
