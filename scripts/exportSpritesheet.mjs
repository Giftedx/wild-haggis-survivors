import { chromium } from 'playwright';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const outPath = path.join(repoRoot, 'wild-haggis-survivors-sprites.png');

const url = process.env.SPRITE_EXPORT_URL ?? 'http://localhost:3000/?export=sprites';

const browser = await chromium.launch();
const context = await browser.newContext({ acceptDownloads: true });
const page = await context.newPage();

page.on('console', (msg) => {
  // Forward every browser-side message — useful for diagnosing hangs in
  // the SpriteExportScene composite path.
  console.log(`[browser:${msg.type()}]`, msg.text());
});
page.on('pageerror', (err) => {
  console.log('[browser:pageerror]', err.message);
});

// 5min default — large sprite sets stall on ReadPixels GPU sync; override
// with SPRITE_EXPORT_TIMEOUT_MS for slower hardware.
const timeoutMs = Number(process.env.SPRITE_EXPORT_TIMEOUT_MS ?? 300_000);
const downloadPromise = page.waitForEvent('download', { timeout: timeoutMs });
await page.goto(url, { waitUntil: 'load' });
const download = await downloadPromise;
await download.saveAs(outPath);

await context.close();
await browser.close();

console.log(`[exportSpritesheet] saved: ${outPath}`);

