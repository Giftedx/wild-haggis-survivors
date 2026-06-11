import { expect, test } from './fixtures';

/**
 * Perf smoke — frame-rate regression gate.
 *
 * WHY: Bundle budgets and the flash budget exist; an FPS budget did not.
 * Deep-review surfaced "no shader/perf gate" as a top red-team risk after
 * the Phaser 4 filter render-node infra (Haar fog), Round 4 sprite lifts,
 * and chunk splitting all landed without a steady-state FPS gate. This
 * spec catches a future change that causes sustained jank — say a shader
 * that re-uploads a uniform per-frame, an atlas page that misses the
 * cache, or a particle emitter with the wrong cap.
 *
 * METHOD:
 *  - Boot through the production build (Menu → Game scene activated).
 *  - Force-equip all 8 weapons (mirrors marathon-smoke) so projectile,
 *    aura, AoE, trail, and bouncing pipelines all run continuously.
 *  - Skip the first ~5s as warmup (shader compile, atlas upload, first
 *    wave spawn cost — not steady state).
 *  - Sample `window.game.loop.actualFps` ~1 Hz for ~25 s of steady-state
 *    play. Phaser's `actualFps` is the rolling-average reciprocal of
 *    delta and is what the engine itself reports as health.
 *  - Total wall-clock: ~30s of in-game time + boot.
 *
 * THRESHOLD CHOICE — ≥90% of steady-state samples ≥ 50 FPS.
 *  - `physics.fps: 60, fixedStep: true` (T1 replay contract) means the
 *    engine targets 60 Hz; sustained dips below 50 indicate the renderer
 *    or scene update is missing the budget by ~20% — a real regression,
 *    not jitter. We use a percentile gate (90% of samples) rather than
 *    median because a regression that drops 1-in-5 frames is still a
 *    regression that median would mask.
 *  - The 50 FPS bound is well above the marathon FPS_FLOOR (12) — that
 *    test is shaped around mid-run survival, not steady-state quality.
 *  - Headless Chromium under Playwright on a CI machine is hardware-
 *    dependent. We've sized the threshold against the developer-laptop
 *    measured baseline (see comment below) with ~10-15% headroom.
 *
 * MEASURED BASELINE (developer machine, headless chromium, dist build):
 *  - Median actualFps in steady state: ~60.0
 *  - 10th percentile (worst tenth): ~58.5
 *  - Worst single sample: ~55.0
 *  - 50 FPS floor leaves comfortable ~8 FPS of headroom for slower CI
 *    runners. If CI hardware proves tighter, drop to 45 — do NOT raise
 *    above 55. A flaky perf gate is worse than no perf gate.
 *
 * SCOPE — chromium-desktop only. Cross-engine perf would need a per-
 * browser baseline calibration; firefox/webkit headless renderer paths
 * differ enough to make a single threshold misleading. Engine-specific
 * perf characterization can be a follow-up if a cross-engine GPU
 * regression ever surfaces.
 */

test.setTimeout(90_000);

const CURRENT_SAVE_VERSION = 9;

// Steady-state floor. ≥90% of post-warmup samples must be ≥ this FPS.
const FPS_FLOOR = 50;
// Fraction of samples that must clear the floor.
const PASS_RATIO = 0.9;
// Warmup before sampling — covers shader compile, atlas upload, first
// wave spawn allocation.
const WARMUP_MS = 5_000;
// Steady-state sampling window.
const SAMPLE_WINDOW_MS = 25_000;
// Sample interval — ~1 Hz.
const SAMPLE_INTERVAL_MS = 1_000;

test.describe('Perf smoke (chromium-only)', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'Perf threshold calibrated against chromium-desktop only — see header comment',
  );

  test('steady-state FPS holds above floor with all weapons firing', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((ver) => {
      try {
        const raw = localStorage.getItem('whs_meta_save');
        const existing = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...existing,
          saveVersion: ver,
          hasCompletedTutorial: true,
        }));
        // Skip level-up modal so frames keep rendering steady-state.
        (window as unknown as { AUTO_BATTLE: boolean }).AUTO_BATTLE = true;
      } catch {
        /* ignore */
      }
    }, CURRENT_SAVE_VERSION);

    await page.goto('./');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();
    await canvas.focus();

    const booted = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { start(k: string): void; isActive(k: string): boolean };
      } }).game;
      if (!g) return false;
      g.scene.start('Game');
      const start = Date.now();
      while (Date.now() - start < 30_000) {
        if (g.scene.isActive('Game')) return true;
        await new Promise((r) => setTimeout(r, 100));
      }
      return false;
    });
    expect(booted, 'GameScene must boot').toBe(true);

    // Force-equip all 8 weapons so every render pipeline is exercised.
    // Mirrors marathon-smoke for parity.
    await page.evaluate(() => {
      const g = (window as unknown as { game: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      const gs = g.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        weaponSystem?: { addWeapon(k: string): boolean };
      };
      const ws = gs.weaponSystem;
      if (!ws) return;
      for (const k of [
        'thistle_shot', 'bagpipe_blast', 'caber_toss', 'scotch_mist',
        'haggis_hurler', 'nessie_tentacle', 'claymore', 'bagpipes',
      ]) {
        ws.addWeapon(k);
      }
    });

    // Run the FPS sampling loop fully inside the page so RAF timing
    // isn't perturbed by Playwright IPC roundtrips.
    const samples: number[] = await page.evaluate(
      async ({ warmupMs, windowMs, intervalMs }) => {
        const g = (window as unknown as { game: {
          loop: { actualFps: number };
        } }).game;
        // Warmup
        await new Promise((r) => setTimeout(r, warmupMs));
        const out: number[] = [];
        const deadline = Date.now() + windowMs;
        while (Date.now() < deadline) {
          out.push(g.loop.actualFps);
          await new Promise((r) => setTimeout(r, intervalMs));
        }
        return out;
      },
      { warmupMs: WARMUP_MS, windowMs: SAMPLE_WINDOW_MS, intervalMs: SAMPLE_INTERVAL_MS },
    );

    expect(samples.length, 'collected enough samples').toBeGreaterThanOrEqual(15);

    const sorted = [...samples].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
    const p10 = sorted[Math.floor(sorted.length * 0.1)] ?? 0;
    const minFps = sorted[0] ?? 0;
    const passed = samples.filter((f) => f >= FPS_FLOOR).length;
    const passRatio = passed / samples.length;

    console.log('[perf-smoke] samples:', samples.map((f) => f.toFixed(1)).join(' '));
    console.log('[perf-smoke] stats:', {
      n: samples.length,
      median: median.toFixed(2),
      p10: p10.toFixed(2),
      min: minFps.toFixed(2),
      passed,
      passRatio: passRatio.toFixed(3),
      floor: FPS_FLOOR,
    });

    expect(pageErrors, 'no uncaught page errors during perf run').toEqual([]);
    expect(
      passRatio,
      `≥${(PASS_RATIO * 100).toFixed(0)}% of steady-state samples must be ≥ ${FPS_FLOOR} FPS ` +
        `(actual ${(passRatio * 100).toFixed(1)}%, median ${median.toFixed(1)}, min ${minFps.toFixed(1)})`,
    ).toBeGreaterThanOrEqual(PASS_RATIO);
  });
});
