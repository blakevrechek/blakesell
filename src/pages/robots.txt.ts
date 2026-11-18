import { siteUrl } from '../content/site';

export function GET() {
  const body = `User-agent: *\nAllow: /\nDisallow: /thanks\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
}
