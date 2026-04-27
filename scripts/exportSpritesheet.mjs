import { chromium } from 'playwright';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const outPath = path.join(repoRoot, 'wild-haggis-survivors-sprites.png');

const url = process.env.SPRITE_EXPORT_URL ?? 'http://localhost:3000/?export=sprites';

const browser = await chromium.launch();
const context = await browser.newContext({ acceptDownloads: true });
const page = await context.newPage();

page.on('console', (msg) => {
  // Keep a tiny bit of signal for debugging if this fails in CI/local.
  const t = msg.type();
  if (t === 'error' || t === 'warning') console.log(`[browser:${t}]`, msg.text());
});

const downloadPromise = page.waitForEvent('download', { timeout: 60_000 });
await page.goto(url, { waitUntil: 'load' });
const download = await downloadPromise;
await download.saveAs(outPath);

await context.close();
await browser.close();

console.log(`[exportSpritesheet] saved: ${outPath}`);

