import { expect, test } from './fixtures';

/**
 * W82 Phase 3 — boss-kill highlight save link.
 *
 * Drives the full Game → Game Over flow:
 *   1. Boot into Game scene (auto-battle, with a meta save seeded to
 *      skip the splash/tutorial).
 *   2. Inject a synthetic boss-kill highlight directly onto
 *      `GameScene.bossKillHighlight` — the same shape the
 *      `onBossKilled` callback produces at run time. Using a
 *      synthetic Blob keeps the test deterministic in headless CI
 *      where real `MediaRecorder` output would be flaky (codec
 *      negotiation, audio device availability).
 *   3. Launch the GameOver scene with a synthetic payload carrying a
 *      bossKillCount > 0.
 *   4. Find the save-highlight link in the GameOver scene's
 *      children list, assert its label contains the resolved boss
 *      display name, and emit `pointerdown` to trigger the
 *      download.
 *   5. Register a download listener and verify the suggested
 *      filename matches the highlight prefix.
 *
 * Why `emit('pointerdown')` instead of a canvas click: GameOver
 * link rows are pure Phaser text objects without a DOM-focus
 * mirror (the focus layer covers only the three primary action
 * buttons by design — see `game-over-dom-focus.spec.ts`). Emitting
 * directly bypasses canvas hit-test coordinate math while still
 * exercising the same handler chain the click event would.
 */

const CURRENT_SAVE_VERSION = 9;

interface PhaserGameLike {
  scene: {
    start(k: string, data?: unknown): void;
    isActive(k: string): boolean;
    getScene(k: string): unknown;
  };
}

test.describe('W82 boss-kill highlight save link', () => {
  test.setTimeout(60_000);

  test('renders the save-highlight link and downloads the snapshot', async ({ page, browserName }) => {
    // Firefox + WebKit have codec mismatches with the WebM container
    // ClipRecorder writes. The highlight link is codec-agnostic but
    // `ClipRecorder.isAvailable()` returns false on those browsers,
    // so the snapshot path never primes the field. Cover the link
    // on Chromium only (mirrors capture-smoke.spec.ts).
    test.skip(browserName === 'firefox', 'WebM codec mismatch on Firefox MediaRecorder');
    test.skip(browserName === 'webkit', 'WebM not supported by WebKit MediaRecorder');

    await page.addInitScript((ver) => {
      try {
        const raw = localStorage.getItem('whs_meta_save');
        const existing = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...existing,
          saveVersion: ver,
          hasCompletedTutorial: true,
        }));
        (window as unknown as { AUTO_BATTLE: boolean }).AUTO_BATTLE = true;
      } catch { /* ignore */ }
    }, CURRENT_SAVE_VERSION);

    await page.goto('/');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();
    await canvas.focus();

    // Start Game so `clipRecorder` initialises + the highlight
    // field exists on the live scene instance.
    const gameActive = await page.evaluate(async () => {
      const g = (window as unknown as { game?: PhaserGameLike }).game;
      if (!g) return false;
      g.scene.start('Game');
      const deadline = Date.now() + 30_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Game')) return true;
        await new Promise((r) => setTimeout(r, 100));
      }
      return false;
    });
    expect(gameActive, 'Game scene failed to activate').toBe(true);

    // Inject the synthetic highlight. Boss key = 'gordon' so the
    // i18n-resolved label is "Gordon" (EN) / "Gòrdon" (SCS) — both
    // contain the substring "Gordon"/"gordon" we assert below.
    const injected = await page.evaluate(() => {
      const g = (window as unknown as { game?: PhaserGameLike }).game;
      if (!g) return false;
      const gs = g.scene.getScene('Game') as unknown as {
        clipRecorder?: { isAvailable(): boolean } | null;
        bossKillHighlight: unknown;
      };
      if (!gs || !gs.clipRecorder || !gs.clipRecorder.isAvailable()) return false;
      gs.bossKillHighlight = {
        bossKey: 'gordon',
        blob: new Blob(['stub-highlight-bytes'], { type: 'video/webm' }),
        extension: 'webm',
        capturedAtSec: 312,
      };
      return true;
    });
    expect(injected, 'failed to inject boss-kill highlight onto GameScene').toBe(true);

    // Boot GameOver with a synthetic payload. The link only renders
    // when (a) captureEnabled is true (default — see SettingsManager)
    // and (b) the highlight accessor on GameScene returns non-null.
    const overReady = await page.evaluate(async () => {
      const g = (window as unknown as { game?: PhaserGameLike }).game;
      if (!g) return false;
      const payload = {
        mode: 'death' as const,
        isVictory: false,
        summary: {
          timeSurvivedSec: 600,
          enemiesKilled: 420,
          bossGold: 100,
          coinGold: 400,
          coinGoldSpent: 0,
          bestCombo: 64,
          victory: false,
        },
        runResult: {
          save: {},
          goldEarned: 500,
          newlyUnlockedVariants: [],
        },
        xpLevel: 18,
        bossKillCount: 1,
        ownedPassiveCount: 4,
        weaponCount: 5,
        evolvedCount: 1,
        buildSummary: 'Tartan Toss / Whisky Glass / Bagpipes',
        variantLabel: 'Wild Haggis',
        variantKey: 'haggis',
        weaponDamage: { tartan_toss: 12_400 },
        seedCode: 'TEST-1234-MIST',
        runSeed: 1234,
        ironmoor: false,
        isDaily: false,
      };
      g.scene.start('GameOver', payload);
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('GameOver')) return true;
        await new Promise((r) => setTimeout(r, 100));
      }
      return false;
    });
    expect(overReady, 'GameOver scene failed to activate').toBe(true);

    // Wait for link tweens to finish (delay up to 1.3s + 0.26s fade).
    await page.waitForTimeout(1_800);

    // Read the GameOver scene's children list, find the link by its
    // resolved label fragment ("kill" matches the EN "Save Gordon
    // kill" and SCS "Keep the Gòrdon kill"). Assert the boss name
    // is present, then emit `pointerdown` to trigger the download
    // handler chain.
    const linkLabel = await page.evaluate(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene: (k: string) => unknown };
      } }).game;
      if (!g) return null;
      type TextLike = { text?: string; type?: string; emit?: (k: string) => void };
      const over = g.scene.getScene('GameOver') as { children?: { list?: TextLike[] } } | undefined;
      const children = over?.children?.list ?? [];
      const hit = children.find((c) =>
        typeof c?.text === 'string'
        && /\bkill\b/i.test(c.text)
        && /gordon/i.test(c.text),
      );
      return hit?.text ?? null;
    });
    expect(linkLabel, 'save-highlight link not found in GameOver children').toBeTruthy();
    expect(linkLabel!.toLowerCase()).toContain('gordon');

    // Register the download listener before triggering. The link's
    // pointerdown handler calls URL.createObjectURL → a.click()
    // synchronously, so the download event fires within the same
    // microtask.
    const downloadPromise = page.waitForEvent('download', { timeout: 10_000 });
    const emitted = await page.evaluate(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene: (k: string) => unknown };
      } }).game;
      if (!g) return false;
      type TextLike = { text?: string; type?: string; emit?: (k: string) => void };
      const over = g.scene.getScene('GameOver') as { children?: { list?: TextLike[] } } | undefined;
      const children = over?.children?.list ?? [];
      const hit = children.find((c) =>
        typeof c?.text === 'string'
        && /\bkill\b/i.test(c.text)
        && /gordon/i.test(c.text),
      );
      if (!hit || typeof hit.emit !== 'function') return false;
      hit.emit('pointerdown');
      return true;
    });
    expect(emitted, 'failed to emit pointerdown on highlight link').toBe(true);

    const download = await downloadPromise;
    // Filename: `whs_highlight_<variant>_<boss>_<mm-ss>_<date>[_<seed>].<ext>`
    // — variant slug "wild-haggis", boss slug "gordon", mm-ss derived
    // from capturedAtSec=312 (05m12s), extension webm on Chromium.
    expect(download.suggestedFilename()).toMatch(
      /^whs_highlight_wild-haggis_gordon_05m12s_\d{4}-\d{2}-\d{2}(?:_[A-Za-z0-9-]+)?\.(webm|mp4)$/,
    );
  });
});
