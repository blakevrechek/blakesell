import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { config, hero } from '../content/site';

// One static Open Graph image, generated at build from the site copy.
const require = createRequire(import.meta.url);
const fontPath = (w: number) =>
  require.resolve(`@fontsource/source-serif-4/files/source-serif-4-latin-${w}-normal.woff`);

export async function GET() {
  const [regular, semibold] = await Promise.all([readFile(fontPath(400)), readFile(fontPath(600))]);
  const el = (type: string, style: object, children: unknown) => ({ type, props: { style, children } });

  const tree = el(
    'div',
    {
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      padding: '72px 80px', background: '#fbfaf7', color: '#16181b', fontFamily: 'Serif',
      borderTop: '16px solid #1d3a56',
    },
    [
      el('div', { fontSize: 30, fontWeight: 600, color: '#1d3a56' }, config.businessName),
      el('div', { fontSize: 70, fontWeight: 600, lineHeight: 1.1, maxWidth: 960 }, hero.h1),
      el('div', { fontSize: 28, color: '#4b4f56' }, config.serviceArea),
    ],
  );

  const svg = await satori(tree as never, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Serif', data: regular, weight: 400, style: 'normal' },
      { name: 'Serif', data: semibold, weight: 600, style: 'normal' },
    ],
  });
  const png = new Resvg(svg).render().asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
}
