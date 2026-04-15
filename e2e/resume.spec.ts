import { expect, test } from './fixtures';

/**
 * Regression guard for the save-and-resume path.
 *
 * Commit 0ff288b shipped a `Cannot read properties of undefined` crash in
 * GameScene resume because MoorMomentScheduler was constructed after
 * applyResumeHydration called pushAfterResume on it. No test caught it —
 * unit tests never boot the scene, and the existing smoke test only
 * verifies the canvas mounts.
 *
 * This test plays a short run, reloads the page (which fires pagehide →
 * persistActiveRunToMeta), reopens the game, and verifies the resume
 * completes without uncaught exceptions. Catches the CLASS of bug, not
 * just the specific one.
 */

const CURRENT_SAVE_VERSION = 9;

test.describe('save and resume', () => {
  test('survives a full save → reload → resume cycle without uncaught errors', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];

    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Pre-seed meta-save to skip the FTUE tutorial — otherwise TutorialSystem
    // holds TUTORIAL_MOVE / TUTORIAL_GEM time locks and gameplay never ticks.
    // saveVersion is required: SaveManager.migrateAndCoerce discards blobs
    // without it and returns DEFAULT_SAVE (which re-enables FTUE).
    await page.addInitScript((ver) => {
      try {
        // addInitScript fires on every navigation including reload — MUST
        // merge into the existing save, otherwise it wipes activeRun and
        // the resume path is never exercised (test becomes a fresh-start
        // smoke in disguise).
        const existingRaw = localStorage.getItem('whs_meta_save');
        let existing: Record<string, unknown> = {};
        try {
          existing = existingRaw ? (JSON.parse(existingRaw) as Record<string, unknown>) : {};
        } catch {
          existing = {};
        }
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...existing,
          saveVersion: ver,
          hasCompletedTutorial: true,
        }));
      } catch {
        /* ignore */
      }
    }, CURRENT_SAVE_VERSION);

    // Phase 1: boot + start a run.
    await page.goto('/');

    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });

    // Headless Chromium backgrounds tabs → rAF throttles to ~1hz and the
    // countdown never finishes. Foreground + focus the canvas.
    await page.bringToFront();
    await canvas.focus();

    // Drive the scene stack directly — menu-clicking by coordinate is flaky.
    const sceneStarted = await page.evaluate(async () => {
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
    expect(sceneStarted, 'Game scene failed to activate').toBe(true);

    // Wait for the run to progress past the countdown. Polls — fps varies
    // under headless load.
    const progressed = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      if (!g) return false;
      const gameScene = g.scene.scenes.find((s) => s.scene.key === 'Game');
      if (!gameScene) return false;
      const sceneAny = gameScene as unknown as { spawnSystem?: { getGameTimeSec?(): number } };
      const start = Date.now();
      while (Date.now() - start < 20_000) {
        if ((sceneAny.spawnSystem?.getGameTimeSec?.() ?? 0) > 2) return true;
        await new Promise((r) => setTimeout(r, 200));
      }
      return false;
    });
    expect(progressed, 'Run failed to progress past countdown').toBe(true);

    // Force-persist activeRun before reload. Headless Chromium may drop
    // the pagehide/beforeunload handler before it completes, so we call
    // the save path directly — otherwise the reload becomes a fresh-start
    // smoke in disguise and bypasses the resume path this test guards.
    const saved = await page.evaluate(() => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      if (!g) return false;
      const gameScene = g.scene.scenes.find((s) => s.scene.key === 'Game');
      if (!gameScene) return false;
      const sceneAny = gameScene as unknown as {
        metaSaveManager?: { saveActiveRun?: (s: unknown) => void };
        collectRunStateForMeta?: () => unknown;
      };
      try {
        const state = sceneAny.collectRunStateForMeta?.();
        if (!state) return false;
        sceneAny.metaSaveManager?.saveActiveRun?.(state);
      } catch {
        return false;
      }
      const raw = localStorage.getItem('whs_meta_save');
      if (!raw) return false;
      try {
        return !!(JSON.parse(raw) as { activeRun?: unknown }).activeRun;
      } catch {
        return false;
      }
    });
    expect(saved, 'activeRun must be persisted before reload to exercise resume path').toBe(true);

    // Phase 2: reload. beforeunload/pagehide fires → persistActiveRunToMeta
    // writes activeRun to localStorage. On reload, MainMenuScene reads it
    // and readPendingResumeRun returns non-null. Then scene.start('Game')
    // triggers the resume path — where the 0ff288b crash lived.
    await page.reload();
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();
    await canvas.focus();

    const resumeSceneActive = await page.evaluate(async () => {
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
    expect(resumeSceneActive, 'Game scene failed to re-activate after reload').toBe(true);

    // Phase 3: let the resumed run breathe. If any ticker crashes during the
    // first few scaled/raw update ticks post-hydration, pageerror fires.
    await page.waitForTimeout(5_000);

    // Assertions: no uncaught page errors, no fatal console errors.
    expect(
      pageErrors,
      `Uncaught page errors during save/resume:\n${pageErrors.join('\n---\n')}`,
    ).toEqual([]);

    const fatalConsoleErrors = consoleErrors.filter((m) =>
      /Cannot read properties of undefined|Cannot read property|is not a function|TypeError/i.test(m),
    );
    expect(
      fatalConsoleErrors,
      `Fatal console errors during save/resume:\n${fatalConsoleErrors.join('\n---\n')}`,
    ).toEqual([]);
  });
});
