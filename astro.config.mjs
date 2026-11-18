import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  // privacy.html is served at /privacy on Cloudflare Pages.
  build: { format: 'file', inlineStylesheets: 'never' },
  trailingSlash: 'never',
  devToolbar: { enabled: false },
  vite: { plugins: [tailwindcss()] },
});
