// Cloudflare Pages build hook. Production builds must pass the launch gate;
// preview builds skip it so placeholders can be reviewed on a preview URL.
import { spawnSync } from 'node:child_process';

const PRODUCTION_BRANCH = process.env.PRODUCTION_BRANCH || 'main';
if (process.env.CF_PAGES_BRANCH === PRODUCTION_BRANCH) {
  const r = spawnSync('node', ['scripts/prelaunch.mjs'], { stdio: 'inherit' });
  process.exit(r.status ?? 1);
}
console.log(`cf-gate: branch "${process.env.CF_PAGES_BRANCH ?? 'local'}" is not production, prelaunch skipped`);
