import { expect, test } from './fixtures';

/**
 * W27 Friend Challenges panel — end-to-end smoke.
 *
 * The panel renders entirely in the Phaser canvas (no DOM locators),
 * so coverage uses the window.game evaluate pattern:
 *
 *   1. Challenge records injected into whs_meta_save are visible to the
 *      MainMenuScene's saveManager — the read path that drives panel
 *      visibility and row count.
 *   2. Starting a run via a challenge row correctly wires
 *      seed / variant / curse / sharedRunMeta.challenge into GameScene —
 *      the same flow the Phaser button-click fires.
 *
 * Unit suite (friendChallenges.test.ts) covers the data model (dedup,
 * cap, coerce, isChallengeBeaten). This smoke catches wiring failures
 * between the save layer and the scene.
 */

const META_SAVE_VERSION = 12;

// A stable deterministic seed so the shared run is byte-identical across builds.
const CHALLENGE_SEED = 0xdeadbeef >>> 0;   // 3735928559

// One beaten (attempt ≥ target) and one pending challenge.
const BEATEN_RECORD = {
  id: 'deadbeef-classic-clean-300',
  seed: CHALLENGE_SEED,
  variantKey: 'classic',
  curseKey: null,
  targetTimeSec: 300,
  targetOutcome: 'victory',
  receivedAt: 1716000000,
  attempts: [{ timeSurvivedSec: 310, outcome: 'victory', ts: 1716001000 }],
};

const PENDING_RECORD = {
  id: '000001-moor_runner-heavy_legs-480',
  seed: 1,
  variantKey: 'moor_runner',
  curseKey: 'heavy_legs',
  targetTimeSec: 480,
  targetOutcome: 'death',
  receivedAt: 1716002000,
  attempts: [],
};

test.describe('W27 friend challenges panel', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'cross-browser headless WebGL flakes; chromium covers the smoke',
  );

  /**
   * Challenge records injected into whs_meta_save are visible to the
   * MainMenuScene's saveManager immediately after boot.
   */
  test('injected challenge records are visible to MainMenuScene.saveManager', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((args) => {
      const { version, beaten, pending } = args;
      try {
        localStorage.setItem('whs_meta_save', JSON.stringify({
          saveVersion: version,
          hasCompletedTutorial: true,
          friendChallenges: [beaten, pending],
        }));
        localStorage.removeItem('whs_save');
      } catch { /* ignore */ }
    }, { version: META_SAVE_VERSION, beaten: BEATEN_RECORD, pending: PENDING_RECORD });

    await page.goto('/');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();

    // Wait for MainMenuScene to become active.
    const menuActive = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { isActive(k: string): boolean };
      } }).game;
      if (!g) return false;
      const deadline = Date.now() + 30_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('MainMenu')) return true;
        await new Promise((r) => setTimeout(r, 100));
      }
      return false;
    });
    expect(menuActive, 'MainMenuScene must be active').toBe(true);

    // Read the challenge records back through the scene's saveManager.
    const result = await page.evaluate(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const scene = g?.scene.getScene('MainMenu') as {
        saveManager?: {
          getFriendChallenges(): Array<{
            id: string;
            variantKey: string;
            curseKey: string | null;
            targetTimeSec: number;
            targetOutcome: string;
            attempts: Array<{ timeSurvivedSec: number; outcome: string }>;
          }>;
        };
      } | null;
      const challenges = scene?.saveManager?.getFriendChallenges() ?? [];
      return {
        count: challenges.length,
        first: challenges[0] ? {
          id: challenges[0].id,
          variantKey: challenges[0].variantKey,
          curseKey: challenges[0].curseKey,
          targetTimeSec: challenges[0].targetTimeSec,
          hasAttempts: challenges[0].attempts.length > 0,
        } : null,
        second: challenges[1] ? {
          id: challenges[1].id,
          variantKey: challenges[1].variantKey,
          curseKey: challenges[1].curseKey,
          targetTimeSec: challenges[1].targetTimeSec,
          hasAttempts: challenges[1].attempts.length > 0,
        } : null,
      };
    });

    expect(result.count, 'saveManager must return 2 challenges').toBe(2);
    expect(result.first?.id).toBe('deadbeef-classic-clean-300');
    expect(result.first?.variantKey).toBe('classic');
    expect(result.first?.curseKey).toBeNull();
    expect(result.first?.targetTimeSec).toBe(300);
    expect(result.first?.hasAttempts, 'beaten record must have attempts').toBe(true);
    expect(result.second?.id).toBe('000001-moor_runner-heavy_legs-480');
    expect(result.second?.variantKey).toBe('moor_runner');
    expect(result.second?.curseKey).toBe('heavy_legs');
    expect(result.second?.hasAttempts, 'pending record must have no attempts').toBe(false);

    expect(pageErrors, `Uncaught errors: ${pageErrors.join('\n')}`).toEqual([]);
  });

  /**
   * Clicking a challenge row wires seed / variant / curse / challenge meta
   * correctly into GameScene — the exact data path the pointerdown handler fires.
   */
  test('starting game from a challenge row wires sharedRunMeta.challenge to GameScene', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((args) => {
      const { version, pending } = args;
      try {
        localStorage.setItem('whs_meta_save', JSON.stringify({
          saveVersion: version,
          hasCompletedTutorial: true,
          friendChallenges: [pending],
        }));
        localStorage.removeItem('whs_save');
      } catch { /* ignore */ }
    }, { version: META_SAVE_VERSION, pending: PENDING_RECORD });

    await page.goto('/');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();

    // Boot to MainMenu then start the game with challenge params — exactly
    // what the panel's pointerdown handler does.
    const gameActive = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: {
          isActive(k: string): boolean;
          start(k: string, d?: unknown): void;
          getScene(k: string): unknown;
        };
      } }).game;
      if (!g) return false;

      // Wait for MainMenu.
      const menuDeadline = Date.now() + 30_000;
      while (Date.now() < menuDeadline) {
        if (g.scene.isActive('MainMenu')) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      if (!g.scene.isActive('MainMenu')) return false;

      // Read the challenge record from the save — as the button click would.
      const scene = g.scene.getScene('MainMenu') as {
        saveManager?: { getFriendChallenges(): Array<{
          seed: number; variantKey: string; curseKey: string | null;
          targetTimeSec: number; targetOutcome: string;
        }> };
      };
      const [record] = scene.saveManager?.getFriendChallenges() ?? [];
      if (!record) return false;

      // Replicate the exact scene.start call the panel's onStartChallenge fires.
      g.scene.start('Game', {
        seed: record.seed,
        forceVariantKey: record.variantKey,
        curseKey: record.curseKey,
        sharedRunMeta: {
          seed: record.seed,
          variantKey: record.variantKey,
          curseKey: record.curseKey,
          challenge: {
            outcome: record.targetOutcome,
            timeSurvivedSec: record.targetTimeSec,
          },
        },
      });

      // Wait for Game to be active.
      const gameDeadline = Date.now() + 30_000;
      while (Date.now() < gameDeadline) {
        if (g.scene.isActive('Game')) return true;
        await new Promise((r) => setTimeout(r, 100));
      }
      return false;
    });
    expect(gameActive, 'GameScene must activate after starting challenge run').toBe(true);

    // Verify the GameScene received the correct variant, curse, and challenge meta.
    // Note: `activeSharedRun` is a TypeScript-private field; it's accessible from
    // JS at runtime (private is a compile-time-only constraint).
    const applied = await page.evaluate(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const scene = g?.scene.getScene('Game') as {
        activeVariant?: { key?: string };
        activeCurseKey?: string | null;
        activeSharedRun?: {
          challenge?: {
            outcome?: string;
            timeSurvivedSec?: number;
          } | null;
        } | null;
      };
      return {
        variantKey: scene?.activeVariant?.key ?? null,
        curseKey: scene?.activeCurseKey ?? null,
        challengeOutcome: scene?.activeSharedRun?.challenge?.outcome ?? null,
        challengeTargetSec: scene?.activeSharedRun?.challenge?.timeSurvivedSec ?? null,
      };
    });

    expect(applied.variantKey).toBe('moor_runner');
    expect(applied.curseKey).toBe('heavy_legs');
    expect(applied.challengeOutcome).toBe('death');
    expect(applied.challengeTargetSec).toBe(480);

    expect(pageErrors, `Uncaught errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
