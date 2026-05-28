import { expect, test } from './fixtures';

/**
 * P4-11 regression: ?export=sprites composites every game texture into one
 * PNG download. Previously broke under Phaser 4 — `tex.source[0].image`
 * widened to accept ImageBitmap / OffscreenCanvas, not just HTML elements.
 * This spec catches future Phaser-source-shape changes.
 *
 * Runs on chromium-desktop only — dev tool, not cross-browser surface.
 */
test.describe('SpriteExportScene', () => {
  test('?export=sprites produces a downloaded PNG', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Dev tool — chromium-only regression check');
    test.setTimeout(60_000);

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.goto('./?export=sprites');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 20_000 });

    const download = await page.waitForEvent('download', { timeout: 30_000 });
    expect(download.suggestedFilename()).toMatch(/\.png$/);

    // PNG magic bytes: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A.
    const stream = await download.createReadStream();
    const first8 = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (c: Buffer) => {
        chunks.push(c);
        if (Buffer.concat(chunks).length >= 8) {
          stream.destroy();
          resolve(Buffer.concat(chunks).subarray(0, 8));
        }
      });
      stream.on('error', reject);
    });
    expect(first8[0]).toBe(0x89);
    expect(first8[1]).toBe(0x50);
    expect(first8[2]).toBe(0x4E);
    expect(first8[3]).toBe(0x47);

    expect(pageErrors, `page errors:\n${pageErrors.join('\n')}`).toEqual([]);
  });
});
