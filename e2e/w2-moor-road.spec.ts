import { expect, test } from './fixtures';

/**
 * W2 Moor Road E2E — verifies the ActIntermission scene can be launched
 * and resolved end-to-end inside a running Game.
 *
 * Phaser renders to a canvas, so queryable DOM text is not available.
 * The test therefore drives the scene manager directly (same pattern as
 * resume.spec.ts) and asserts observable side-effects:
 *   1. launch('ActIntermission', {...}) activates the scene.
 *   2. resolve(route) invokes onResolve synchronously with a complete
 *      RoutePick and stops the scene.
 *   3. The pick's shape matches what GameScene's onResolve closure expects.
 *
 * A second spec exercises the full boss sequence (gordon → picker A →
 * tour_bus → picker B → taxman → victory ceremony) via DEBUG.skipToMinute
 * + DEBUG.killCurrentBoss. That path proves the onActComplete dispatch +
 * resolver + victory trigger all wire up end-to-end.
 */

const CURRENT_SAVE_VERSION = 9;

test.describe('W2 Moor Road — ActIntermissionScene smoke', () => {
  test('launch → resolve contract holds in a running game', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    // Skip the FTUE tutorial so Game scene ticks without time locks.
    await page.addInitScript((ver) => {
      try {
        const existingRaw = localStorage.getItem('whs_meta_save');
        const existing = (existingRaw
          ? (JSON.parse(existingRaw) as Record<string, unknown>)
          : {}) as Record<string, unknown>;
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...existing,
          saveVersion: ver,
          hasCompletedTutorial: true,
        }));
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

    // Jump straight into Game.
    const gameActive = await page.evaluate(async () => {
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
    expect(gameActive, 'Game scene failed to activate').toBe(true);

    // Launch the picker scene via the running Game scene's ScenePlugin
    // (SceneManager doesn't expose `launch`; scene plugin instances do).
    const resolvedPick = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: {
          getScene(k: string): unknown;
          isActive(k: string): boolean;
        };
      } }).game;
      if (!g) return null;
      const gameScenePlugin = (g.scene.getScene('Game') as {
        scene: { launch(k: string, data?: unknown): void };
      } | null);
      if (!gameScenePlugin) return { error: 'no-game-scene' };

      return new Promise<unknown>((resolve) => {
        gameScenePlugin.scene.launch('ActIntermission', {
          slot: 'A',
          atGameTimeSec: 305,
          onResolve: (pick: unknown) => resolve(pick),
        });
        setTimeout(() => resolve({ timedOut: true }), 5_000);
        (async () => {
          const start = Date.now();
          while (Date.now() - start < 3_000) {
            if (g.scene.isActive('ActIntermission')) {
              const actScene = g.scene.getScene('ActIntermission') as {
                resolve?(route: unknown): void;
              };
              actScene.resolve?.({
                key: 'up_the_brae', slot: 'A',
                labelKey: 'routes.up_the_brae.label',
                descKey: 'routes.up_the_brae.desc',
                modifierDeltas: {},
              });
              return;
            }
            await new Promise((r) => setTimeout(r, 50));
          }
        })();
      });
    });

    expect(resolvedPick).not.toBeNull();
    expect(resolvedPick).toMatchObject({
      slot: 'A',
      routeKey: 'up_the_brae',
      atGameTimeSec: 305,
      defaultedBySetting: false,
    });

    expect(pageErrors, 'No page errors during picker flow').toEqual([]);
  });

  // Sets window.AUTO_BATTLE = true so UpgradeCardsUI auto-picks the
  // first card on every level-up (Phaser scene.time.delayedCall stalls
  // while the card modal is open, which previously blocked boss-spawn
  // warnings from progressing). AUTO_BATTLE is an existing dev hook
  // used by src/dev/AutoBattler.ts — we reuse it here instead of
  // inventing a test-only API.
  test('full boss sequence: gordon → picker A → tour_bus → picker B → taxman', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((ver) => {
      try {
        const existingRaw = localStorage.getItem('whs_meta_save');
        const existing = (existingRaw
          ? (JSON.parse(existingRaw) as Record<string, unknown>)
          : {}) as Record<string, unknown>;
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...existing,
          saveVersion: ver,
          hasCompletedTutorial: true,
        }));
        // AUTO_BATTLE short-circuits the level-up card modal so the
        // boss-spawn timers don't stall mid-run.
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

    // Start the Game scene and wait for it to tick.
    const gameBooted = await page.evaluate(async () => {
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
    expect(gameBooted, 'Game scene failed to activate').toBe(true);

    // Wait until the countdown finishes and gameplay is actually running.
    await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      if (!g) return;
      const gs = g.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        spawnSystem?: { getGameTimeSec?(): number };
      };
      const start = Date.now();
      while (Date.now() - start < 20_000) {
        if ((gs.spawnSystem?.getGameTimeSec?.() ?? 0) > 2) return;
        await new Promise((r) => setTimeout(r, 100));
      }
    });

    // Helper: drive DEBUG.skipToMinute + DEBUG.killCurrentBoss, then
    // observe the downstream RunActState mutation. We don't wait on the
    // picker render because launchActIntermission defers via delayedCall(0)
    // which can race with headless rAF; the act-counter change is the
    // real load-bearing assertion.
    const bossKillBumpsAct = async (
      minute: number,
      expectedAct: 1 | 2 | 3,
      expectedBossKey: 'gordon' | 'tour_bus',
    ): Promise<{
      act?: number;
      killed: boolean;
      killedKey?: string;
      picks?: number;
      pickerOpened?: boolean;
      bossKills?: number;
      lastGameTime?: number;
      bossesAlive?: string[];
      lastActiveBossKey?: string;
      paused?: boolean;
      tokens?: string[];
      targetSeen?: boolean;
    }> => {
      return page.evaluate(async ({ minute, expectedAct, expectedBossKey }) => {
        const dbg = (window as unknown as { DEBUG?: {
          skipToMinute(m: number): void;
          killCurrentBoss(): boolean;
        } }).DEBUG;
        if (!dbg) return { killed: false };

        dbg.skipToMinute(minute);

        // Poll game time and live boss identity. Timeline skips can queue
        // adjacent warnings in the same frame (e.g. each_uisge + tour_bus),
        // so only fire DEBUG.killCurrentBoss once the debug target is the
        // act-gating boss this step is meant to exercise.
        const g0 = (window as unknown as { game: {
          scene: { scenes: Array<{ scene: { key: string } }> };
        } }).game;
        const gs0 = g0.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
          spawnSystem?: { getGameTimeSec?(): number };
        };

        // Let the boss spawn then kill it.
        const bossStart = Date.now();
        let killed = false;
        let killedKey: string | undefined;
        let lastGameTime = 0;
        let bossesAlive: string[] = [];
        let lastActiveBossKey: string | undefined;
        let paused = false;
        let tokens: string[] = [];
        let targetSeen = false;
        const gsTyped = gs0 as unknown as {
          timeManager?: {
            isGameplayPaused?(): boolean;
            getActiveTokenKeys?(): string[];
          };
          spawnSystem?: {
            getGameTimeSec?(): number;
            findActiveBoss(): { getEnemyKey?(): string } | null;
            getEnemyGroup(): { getChildren(): Array<{ active: boolean; isBoss?(): boolean; getEnemyKey?(): string }> };
          };
        };
        while (Date.now() - bossStart < 30_000) {
          lastGameTime = gs0.spawnSystem?.getGameTimeSec?.() ?? 0;
          paused = gsTyped.timeManager?.isGameplayPaused?.() ?? false;
          tokens = gsTyped.timeManager?.getActiveTokenKeys?.() ?? [];
          const liveBosses = gsTyped.spawnSystem?.getEnemyGroup?.().getChildren()
            .filter((e) => e.active && e.isBoss?.())
            .map((e) => e.getEnemyKey?.() ?? '?') ?? [];
          if (liveBosses.length > 0) {
            bossesAlive = liveBosses;
          }
          const target = gsTyped.spawnSystem?.findActiveBoss?.();
          lastActiveBossKey = target?.getEnemyKey?.();
          if (liveBosses.includes(expectedBossKey) || lastActiveBossKey === expectedBossKey) {
            targetSeen = true;
          }
          killedKey = lastActiveBossKey;
          if (lastActiveBossKey === expectedBossKey && dbg.killCurrentBoss()) {
            killed = true;
            killedKey = expectedBossKey;
            break;
          }
          await new Promise((r) => setTimeout(r, 100));
        }

        // If picker opened, resolve it so the run continues. launchActIntermission
        // defers via scene.time.delayedCall(0) which may take several frames
        // under headless rAF throttling.
        const g = (window as unknown as { game: {
          scene: {
            isActive(k: string): boolean;
            getScene(k: string): unknown;
            scenes: Array<{ scene: { key: string } }>;
          };
        } }).game;
        let pickerOpened = false;
        const pickerStart = Date.now();
        while (Date.now() - pickerStart < 8_000) {
          if (g.scene.isActive('ActIntermission')) {
            pickerOpened = true;
            const actScene = g.scene.getScene('ActIntermission') as {
              launchData?: { slot: 'A' | 'B' };
              resolve?(route: unknown): void;
            };
            const slot = actScene.launchData?.slot ?? 'A';
            const routeKey = slot === 'A' ? 'up_the_brae' : 'stand_yer_ground';
            actScene.resolve?.({
              key: routeKey, slot,
              labelKey: `routes.${routeKey}.label`,
              descKey: `routes.${routeKey}.desc`,
              modifierDeltas: {},
            });
            break;
          }
          await new Promise((r) => setTimeout(r, 50));
        }

        // Wait for RunActState to catch up.
        const gs = g.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
          runActState?: { currentAct: 1 | 2 | 3; pickerHistory: unknown[] };
          runScore?: { bossKillCount: number };
        };

        const actStart = Date.now();
        while (Date.now() - actStart < 5_000) {
          if (gs.runActState?.currentAct === expectedAct) break;
          await new Promise((r) => setTimeout(r, 50));
        }

        return {
          killed,
          killedKey,
          pickerOpened,
          lastGameTime,
          bossesAlive,
          lastActiveBossKey,
          paused,
          tokens,
          targetSeen,
          act: gs.runActState?.currentAct,
          picks: gs.runActState?.pickerHistory.length,
          bossKills: gs.runScore?.bossKillCount,
        };
      }, { minute, expectedAct, expectedBossKey });
    };

    // Gordon spawns at 5:00. Skip to 6:00 so the 1.5s warning has room
    // to resolve under headless rAF throttling before we poll.
    const act1 = await bossKillBumpsAct(6, 2, 'gordon');
    expect(
      act1.killed,
      `gordon was not killed — targetSeen=${act1.targetSeen}, active=${act1.lastActiveBossKey}, alive=${JSON.stringify(act1.bossesAlive)}, paused=${act1.paused}, tokens=${JSON.stringify(act1.tokens)}, bossKills=${act1.bossKills}, gameTime=${act1.lastGameTime}`,
    ).toBe(true);
    expect(
      act1.act,
      `RunActState.current did not advance: pickerOpened=${act1.pickerOpened}, picks=${act1.picks}, bossKills=${act1.bossKills}, gameTime=${act1.lastGameTime}`,
    ).toBe(2);
    expect(act1.picks, 'No pick recorded for act 1').toBeGreaterThanOrEqual(1);

    // Let the post-resolve state settle — TimeManager release,
    // scene-stop, route onResume effects all finish async-ish.
    await page.waitForTimeout(1_000);

    // Tour bus at 10:00. Skip past so the warning has headroom.
    const act2 = await bossKillBumpsAct(11, 3, 'tour_bus');
    expect(
      act2.killed,
      `tour_bus was not killed — targetSeen=${act2.targetSeen}, active=${act2.lastActiveBossKey}, alive=${JSON.stringify(act2.bossesAlive)}, paused=${act2.paused}, tokens=${JSON.stringify(act2.tokens)}, bossKills=${act2.bossKills}, gameTime=${act2.lastGameTime}`,
    ).toBe(true);
    expect(
      act2.act,
      `RunActState.current did not advance to act 3: killedKey=${act2.killedKey}, pickerOpened=${act2.pickerOpened}, picks=${act2.picks}, bossKills=${act2.bossKills}, gameTime=${act2.lastGameTime}, alive=${JSON.stringify(act2.bossesAlive)}`,
    ).toBe(3);

    // Same settle wait before the final skip.
    await page.waitForTimeout(1_000);

    // Taxman (act 3 final) — victory path, no picker. Skip-to-minute 25
    // can leave a stale mid-run boss alive (each_uisge spawned alongside
    // tour_bus during the act-2 timeline jump but was never killed); kill
    // any non-taxman boss first to clear the stage, then wait for the
    // finale spawn before asserting victoryPending.
    const victoryReached = await page.evaluate(async () => {
      const dbg = (window as unknown as { DEBUG?: {
        skipToMinute(m: number): void;
        killCurrentBoss(): boolean;
      } }).DEBUG;
      if (!dbg) return false;
      dbg.skipToMinute(25);
      const g = (window as unknown as { game: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      const gs = g.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        runScore?: { victoryPending?: boolean };
        spawnSystem?: { findActiveBoss(): { getEnemyKey?(): string } | null };
      };
      const start = Date.now();
      while (Date.now() - start < 15_000) {
        const boss = gs.spawnSystem?.findActiveBoss?.();
        const key = boss?.getEnemyKey?.();
        if (key === 'taxman') {
          dbg.killCurrentBoss();
          break;
        }
        if (key) {
          // Stale mid-run boss from skip-jump — clear it so taxman can
          // spawn / become the active target without race-killing it.
          dbg.killCurrentBoss();
        }
        await new Promise((r) => setTimeout(r, 100));
      }
      const victoryStart = Date.now();
      while (Date.now() - victoryStart < 5_000) {
        if (gs.runScore?.victoryPending === true) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(victoryReached, 'victoryPending never flipped after taxman kill').toBe(true);

    expect(pageErrors, 'No page errors during full boss sequence').toEqual([]);
  });
});
