import { expect, test } from './fixtures';

/**
 * T1 replay loop E2E — verifies the record → save → Chronicle → Watch
 * path end-to-end in a production build.
 *
 * Phaser renders to a canvas, so rather than clicking visible HTML
 * elements, we drive the scene manager directly (same pattern as
 * w2-moor-road.spec.ts / resume.spec.ts). Load-bearing assertions:
 *
 *   1. `whs_replay_mode=record` flag → Game scene constructs a
 *      `ReplayRecorder` (checked on the scene reference).
 *   2. Killing the player produces a run-history entry with a valid
 *      `replay` blob.
 *   3. Relaunching Game with `{ replay: blob }` constructs a
 *      `ReplayInput`, skips the recorder, and the HUD replay chip is
 *      visible.
 *   4. Blob exhaustion transitions back to Chronicle automatically.
 */

const META_SAVE_VERSION = 9;

test.describe('T1 replay loop', () => {
  test('record → blob persisted → playback chip visible → exhaustion returns to Chronicle', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    // Tutorial + record flag primed before page load.
    await page.addInitScript((saveVer) => {
      try {
        const existingRaw = localStorage.getItem('whs_meta_save');
        const existing = (existingRaw
          ? (JSON.parse(existingRaw) as Record<string, unknown>)
          : {}) as Record<string, unknown>;
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...existing,
          saveVersion: saveVer,
          hasCompletedTutorial: true,
        }));
        localStorage.setItem('whs_replay_mode', 'record');
        // Clear any existing main save so we have a predictable
        // run-history after the test run.
        localStorage.removeItem('whs_save');
      } catch {
        /* ignore */
      }
    }, META_SAVE_VERSION);

    await page.goto('/');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();
    await canvas.focus();

    // Launch a Game with a known seed + kill the player to force run-end.
    const recordPhase = await page.evaluate(async () => {
      interface GameHandle {
        scene: {
          start(k: string, data?: unknown): void;
          stop(k: string): void;
          isActive(k: string): boolean;
          getScene(k: string): unknown;
        };
      }
      const g = (window as unknown as { game?: GameHandle }).game;
      if (!g) return { err: 'no game' };
      g.scene.stop('MainMenu');
      g.scene.stop('Menu');
      g.scene.start('Game', { seed: 4242 });

      // Wait for Game to tick.
      const start = Date.now();
      while (Date.now() - start < 20_000) {
        if (g.scene.isActive('Game')) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      const gameScene = g.scene.getScene('Game') as {
        scene: { isActive(): boolean };
        replayRecorder: { getFrameCount(): number } | null;
        player: { takeDamage(n: number): boolean };
        runLifecycle: { onPlayerHitZero(): void };
      };
      if (!gameScene.scene.isActive()) return { err: 'game not active' };
      if (!gameScene.replayRecorder) return { err: 'recorder missing — record mode did not activate' };

      // Let frames accrue.
      await new Promise((r) => setTimeout(r, 500));
      const framesBefore = gameScene.replayRecorder.getFrameCount();

      // Force run-end: drop HP then fire the lifecycle death hook directly
      // (raw `takeDamage` only mutates HP; the death pipeline needs
      // `onPlayerHitZero` to run, same entry point HazardZones + enemy
      // collisions use).
      gameScene.player.takeDamage(9999);
      gameScene.runLifecycle.onPlayerHitZero();

      // Wait for GameOver to activate (runLifecycle transitions via ticker).
      const endStart = Date.now();
      while (Date.now() - endStart < 15_000) {
        if (g.scene.isActive('GameOver')) break;
        await new Promise((r) => setTimeout(r, 100));
      }

      // Save write happens inside the run-end flow; poll for the blob to
      // materialise before asserting, rather than reading once.
      let save: { schemaVersion?: number; runHistory?: Array<{ replay?: { seed: number; variantKey: string; frameCount: number } }> } = {};
      const saveStart = Date.now();
      while (Date.now() - saveStart < 5_000) {
        save = JSON.parse(localStorage.getItem('whs_save') ?? '{}');
        if ((save.runHistory?.length ?? 0) > 0) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      const last = (save.runHistory ?? [])[save.runHistory?.length ? save.runHistory.length - 1 : -1];
      return {
        framesBefore,
        schemaVersion: save.schemaVersion,
        historyLen: save.runHistory?.length ?? 0,
        hasReplay: !!last?.replay,
        replaySeed: last?.replay?.seed,
        replayVariant: last?.replay?.variantKey,
        replayFrameCount: last?.replay?.frameCount,
      };
    });

    expect(recordPhase.schemaVersion, 'save should migrate to v6').toBe(6);
    expect(recordPhase.historyLen, 'one run should be recorded').toBe(1);
    expect(recordPhase.hasReplay, 'blob should attach to the entry').toBe(true);
    expect(recordPhase.replaySeed, 'blob should carry the launch seed').toBe(4242);
    expect(recordPhase.replayVariant, 'blob should carry the live variant').toBe('classic');
    expect(recordPhase.replayFrameCount ?? 0).toBeGreaterThan(0);

    // Playback phase — launch with the recorded blob, confirm the
    // playback driver + chip render, and that blob exhaustion returns
    // to Chronicle.
    const playbackPhase = await page.evaluate(async () => {
      interface GameHandle {
        scene: {
          start(k: string, data?: unknown): void;
          stop(k: string): void;
          isActive(k: string): boolean;
          getScene(k: string): unknown;
        };
      }
      const g = (window as unknown as { game?: GameHandle }).game;
      if (!g) return { err: 'no game' };
      const save = JSON.parse(localStorage.getItem('whs_save') ?? '{}') as {
        runHistory?: Array<{ replay?: unknown }>;
      };
      const replay = save.runHistory?.[save.runHistory.length - 1]?.replay;
      if (!replay) return { err: 'no replay blob to play' };

      g.scene.stop('GameOver');
      g.scene.start('Game', { replay });

      const start = Date.now();
      while (Date.now() - start < 20_000) {
        if (g.scene.isActive('Game')) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      const gs = g.scene.getScene('Game') as {
        replayInput: { getFrameCount(): number; getFrameIndex(): number; isExhausted(): boolean } | null;
        replayRecorder: unknown;
        hud?: { replayChipText?: { visible: boolean } };
      };
      const playbackStart = {
        replayInputPresent: !!gs.replayInput,
        recorderPresent: !!gs.replayRecorder,
        chipVisible: gs.hud?.replayChipText?.visible ?? false,
        totalFrames: gs.replayInput?.getFrameCount() ?? 0,
      };

      // Wait for blob exhaustion → Chronicle.
      const exhaustStart = Date.now();
      while (Date.now() - exhaustStart < 60_000) {
        if (g.scene.isActive('Chronicle')) break;
        await new Promise((r) => setTimeout(r, 200));
      }

      return {
        ...playbackStart,
        chronicleActiveAfterExhaust: g.scene.isActive('Chronicle'),
      };
    });

    expect(playbackPhase.replayInputPresent, 'ReplayInput should drive Player').toBe(true);
    expect(playbackPhase.recorderPresent, 'recorder must be off during playback').toBe(false);
    expect(playbackPhase.chipVisible, 'persistent REPLAY chip should render').toBe(true);
    expect(playbackPhase.totalFrames ?? 0).toBeGreaterThan(0);
    expect(
      playbackPhase.chronicleActiveAfterExhaust,
      'blob exhaustion should return to Chronicle',
    ).toBe(true);

    expect(
      pageErrors,
      `Uncaught page errors during replay loop:\n${pageErrors.join('\n')}`,
    ).toEqual([]);
  });
});
