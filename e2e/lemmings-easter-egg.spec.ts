import { expect, test } from './fixtures';

/**
 * DESIGN_IDEAS §13 — Lemmings cliff-edge parade. Once-per-variant lifetime
 * easter egg fired by 90 s of continuous idle in the coastal biome.
 *
 * The 90 s wall-clock idle accumulation is genuinely uncoverable inside a
 * smoke-spec budget — the trigger reads scaled-delta on each tick (paused
 * frames feed 0), there is no DEBUG hook to fast-forward `idleMs`, and
 * AUTO_BATTLE has to be off (player must be still) so we cannot lean on
 * the auto-pilot to burn frames either. The covered contract instead is
 * the **lifetime-flag dormant path**: seed `lemmingsSeenForVariant:
 * ['classic']`, boot, teleport to a real coastal biome tile, idle for a
 * couple of real seconds, then assert the trigger never accumulates and
 * the orchestrator stays unfired. The 90 s timer logic itself is covered
 * by `src/entities/lemmingsTrigger.test.ts` unit tests.
 *
 * Also exercises the bumper round-trip: `bumpLemmingsSeenForVariant`
 * appends the variant key to the persisted save so a future run with the
 * same variant short-circuits the `variantAlreadyFired` gate.
 */

const CURRENT_META_SAVE_VERSION = 9;
const CURRENT_SAVE_SCHEMA_VERSION = 18;

test.describe('lemmings easter egg (DESIGN_IDEAS §13)', () => {
  test('respects lemmingsSeenForVariant lifetime flag (dormant path)', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript(({ metaVer, saveVer }) => {
      try {
        localStorage.setItem('whs_meta_save', JSON.stringify({
          saveVersion: metaVer,
          hasCompletedTutorial: true,
        }));
        // Seed the persistent save with classic already in the lifetime
        // list — the trigger MUST short-circuit and never accumulate.
        localStorage.setItem('whs_save', JSON.stringify({
          schemaVersion: saveVer,
          selectedVariant: 'classic',
          unlockedVariants: ['classic'],
          lemmingsSeenForVariant: ['classic'],
        }));
      } catch { /* ignore */ }
      // AUTO_BATTLE off — the lemmings trigger watches for player
      // stillness; auto-pilot would keep velocity > 8 px/s and never
      // let the timer accumulate even if it WAS legal to fire. Default off in `e2e/fixtures.ts`.
    }, { metaVer: CURRENT_META_SAVE_VERSION, saveVer: CURRENT_SAVE_SCHEMA_VERSION });

    await page.goto('./');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();

    const gameActive = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { start(k: string, data?: unknown): void; isActive(k: string): boolean };
      } }).game;
      if (!g) return false;
      g.scene.start('Game', { seed: 12345 });
      const deadline = Date.now() + 30_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Game')) return true;
        await new Promise((r) => setTimeout(r, 100));
      }
      return false;
    });
    expect(gameActive, 'Game scene failed to activate').toBe(true);

    const report = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      if (!g) return { error: 'no-game' };

      // Settle one frame so all run-start systems are wired.
      await new Promise((r) => setTimeout(r, 500));

      const scene = g.scene.getScene('Game') as {
        getBiomeManager?: () => { biomeAt(x: number, y: number): string } | null;
        getPlayer?: () => { x: number; y: number; setPosition?: (x: number, y: number) => void;
          body?: { x: number; y: number; velocity?: { x: number; y: number };
            position?: { x: number; y: number } } };
        lemmingsEasterEgg?: { isFired(): boolean; getProgress(): number };
        activeVariant?: { key: string };
      };

      const variantKey = scene.activeVariant?.key ?? null;
      const bm = scene.getBiomeManager?.();
      if (!bm) return { error: 'no-biome-manager' };

      // Scan a grid for a coastal tile. World is 3000x3000 (config.ts).
      let coastal: { x: number; y: number } | null = null;
      outer: for (let x = 200; x < 2900; x += 80) {
        for (let y = 200; y < 2900; y += 80) {
          if (bm.biomeAt(x, y) === 'coastal') { coastal = { x, y }; break outer; }
        }
      }
      if (!coastal) return { skipped: 'no-coastal-in-scan', variantKey };

      const player = scene.getPlayer?.();
      if (!player) return { error: 'no-player' };
      // Teleport — mirror haar-biome-ambient.spec.ts pattern. Update
      // both sprite + body + body.position so the next BiomeController
      // tick reads from the new world cell.
      player.x = coastal.x;
      player.y = coastal.y;
      const b = player.body;
      if (b) {
        b.x = coastal.x;
        b.y = coastal.y;
        if (b.position) { b.position.x = coastal.x; b.position.y = coastal.y; }
        if (b.velocity) { b.velocity.x = 0; b.velocity.y = 0; }
      }

      // Idle for 2 s real-time. If the lifetime-flag gate is wired
      // properly, `getProgress()` MUST stay 0 and `isFired()` MUST
      // stay false even after teleport into the right biome with the
      // player held still.
      await new Promise((r) => setTimeout(r, 2_000));

      const egg = scene.lemmingsEasterEgg;
      const biomeAtPlayer = bm.biomeAt(player.x, player.y);
      const persistedAfter = JSON.parse(localStorage.getItem('whs_save') ?? '{}')
        .lemmingsSeenForVariant ?? [];

      return {
        variantKey,
        biomeAtPlayer,
        progress: egg?.getProgress() ?? null,
        fired: egg?.isFired() ?? null,
        persistedAfter,
      };
    });

    if ('skipped' in report) {
      test.info().annotations.push({ type: 'skip-reason', description: String(report.skipped) });
      return;
    }

    expect(report.error, `Unexpected setup error: ${report.error}`).toBeUndefined();
    expect(report.variantKey, 'classic should be the active variant').toBe('classic');
    expect(report.biomeAtPlayer, 'teleport landed in a coastal tile').toBe('coastal');
    // Lifetime gate held: trigger never accumulated, parade never fired,
    // persisted lifetime list still contains classic.
    expect(report.progress, 'trigger must not accumulate when variant already seen').toBe(0);
    expect(report.fired, 'parade must not fire when variant already seen').toBe(false);
    expect(report.persistedAfter, 'lifetime flag must persist unchanged').toContain('classic');

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
