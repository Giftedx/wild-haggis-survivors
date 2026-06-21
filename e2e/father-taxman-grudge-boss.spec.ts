import { expect, test } from './fixtures';
import { CURRENT_SAVE_VERSION as META_SAVE_VERSION } from '../src/core/SaveManager';

/**
 * Father Taxman — Grudge Phase 2 wiring smoke.
 *
 * The Taxman (`key: 'taxman'`, `behaviorOverride: 'taxman_grudge'`) reads the
 * per-run GrudgeVerdict at 50% HP, plays a 1.5 s dramatic pause, then switches
 * to a verdict-keyed attack pattern. The pure state machine
 * (`simulateTaxmanGrudgeBehaviour`) is exhaustively covered by
 * `taxmanGrudgeBehaviour.test.ts`; THIS spec covers the integration the unit
 * test cannot — that `Enemy.behaviorTaxmanGrudge` is actually dispatched each
 * frame, advances phase 1 → 'transitioning' → 2 when HP crosses the threshold,
 * and that the resulting verdict-keyed attack fires without throwing.
 *
 * Drive: AUTO_BATTLE stays OFF (fixture default) so the boss takes no stray
 * weapon damage — `takeDamage(maxHp * 0.55)` lands it at ~45% HP, just under
 * the 0.50 threshold, without risking an overkill. Phase 2 latches (no path
 * back to phase 1), so the assertion is stable even if HP drifts afterwards.
 *
 * Fresh run → empty grudge ledger → `judgeGrudge` returns 'even' → the
 * exercised attack path is `fireTaxmanStandardFan`. The other four verdicts
 * are unit-tested.
 *
 * Chromium-only — FF/WK headless WebGL flakes (matches the other boss smokes).
 */

test.describe('Father Taxman — Grudge Phase 2', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'cross-browser headless WebGL flakes; chromium covers the smoke',
  );

  test('crosses to phase 2 at 50% HP and fires a verdict attack cleanly', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((ver: number) => {
      try {
        const existingRaw = localStorage.getItem('whs_meta_save');
        const existing = existingRaw
          ? (JSON.parse(existingRaw) as Record<string, unknown>)
          : {};
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...existing,
          saveVersion: ver,
          hasCompletedTutorial: true,
          hasSeenDriftTutorial: true,
          hasSeenEliteAffixTip: true,
        }));
        localStorage.removeItem('whs_save');
        // AUTO_BATTLE intentionally left at the fixture default (false): the
        // boss must take only the controlled takeDamage below so HP lands
        // precisely under the 50% phase-2 threshold.
      } catch { /* ignore */ }
    }, META_SAVE_VERSION);

    await page.goto('./');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();
    await canvas.focus();

    const booted = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { start(k: string, d?: unknown): void; isActive(k: string): boolean };
      } }).game;
      if (!g) return false;
      g.scene.start('Game', { seed: 24601 });
      const deadline = Date.now() + 30_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Game')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(booted, 'GameScene must boot').toBe(true);

    const healPlayer = async () => {
      await page.evaluate(() => {
        const g = (window as unknown as { game?: {
          scene: { scenes: Array<{ scene: { key: string } }> };
        } }).game;
        const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
          player?: { heal(n: number): void };
        } | undefined;
        gs?.player?.heal(99_999);
      });
    };

    await healPlayer();

    const spawned = await page.evaluate(() => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        getSpawnSystem?(): { spawnBossManually(key: string, x: number, y: number): void };
        player?: { x: number; y: number };
      } | undefined;
      if (!gs?.getSpawnSystem) return false;
      const px = gs.player?.x ?? 400;
      const py = gs.player?.y ?? 300;
      gs.getSpawnSystem().spawnBossManually('taxman', px + 80, py);
      return true;
    });
    expect(spawned, 'spawnBossManually must succeed').toBe(true);

    // SpawnSystem emits a ~1500 ms warning beat before the entity goes active.
    await page.waitForFunction(() => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        spawnSystem?: {
          getEnemyGroup?(): { getChildren(): Array<{ active: boolean; getEnemyKey?(): string }> };
        };
      } | undefined;
      return gs?.spawnSystem?.getEnemyGroup?.().getChildren()
        .some((e) => e.active && e.getEnemyKey?.() === 'taxman') ?? false;
    }, undefined, { timeout: 8_000 });

    await healPlayer();

    // Drop the Taxman to ~45% HP — just under the 0.50 phase-2 threshold,
    // without killing him. Phase 1 confirmed before the hit so we know the
    // transition is driven by the HP cross, not a stale state.
    const drove = await page.evaluate(() => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        spawnSystem?: {
          getEnemyGroup?(): {
            getChildren(): Array<{
              active: boolean;
              getEnemyKey?(): string;
              getMaxHp?(): number;
              getTaxmanGrudgePhase?(): 1 | 'transitioning' | 2;
              takeDamage?(n: number): boolean;
            }>;
          };
        };
      } | undefined;
      const boss = gs?.spawnSystem?.getEnemyGroup?.().getChildren()
        .find((e) => e.active && e.getEnemyKey?.() === 'taxman');
      if (!boss?.getMaxHp || !boss.takeDamage || !boss.getTaxmanGrudgePhase) return null;
      const phaseBefore = boss.getTaxmanGrudgePhase();
      boss.takeDamage(Math.ceil(boss.getMaxHp() * 0.55));
      return { phaseBefore, maxHp: boss.getMaxHp() };
    });
    expect(drove, 'taxman must be found with the grudge test hooks').not.toBeNull();
    expect(drove?.phaseBefore, 'taxman must start in phase 1').toBe(1);
    expect(drove?.maxHp ?? 0, 'taxman must have a real HP pool').toBeGreaterThan(0);

    // Phase advances 1 → 'transitioning' (1.5 s pause) → 2.
    const reachedPhase2 = await page.waitForFunction(() => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        spawnSystem?: {
          getEnemyGroup?(): {
            getChildren(): Array<{
              active: boolean;
              getEnemyKey?(): string;
              getTaxmanGrudgePhase?(): 1 | 'transitioning' | 2;
            }>;
          };
        };
      } | undefined;
      const boss = gs?.spawnSystem?.getEnemyGroup?.().getChildren()
        .find((e) => e.active && e.getEnemyKey?.() === 'taxman');
      return boss?.getTaxmanGrudgePhase?.() === 2;
    }, undefined, { timeout: 6_000 });
    expect(await reachedPhase2.jsonValue(), 'taxman must reach grudge phase 2').toBe(true);

    // Let at least one phase-2 attack fire (the 'even' verdict cadence is
    // 4000 ms) and keep the player topped up. A throw in fireTaxman* lands
    // in pageErrors.
    await healPlayer();
    await page.waitForTimeout(4_500);

    expect(pageErrors, `Uncaught page errors:\n${pageErrors.join('\n')}`).toEqual([]);
  });
});
