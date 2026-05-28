import { expect, test } from './fixtures';

/**
 * M1 Moor Road multi-node — smoke: the Act 1 path is generated at run
 * start, the HUD widget reflects it, and teleporting the player to the
 * first node position fires the proximity trigger → records a
 * NodeOutcome in the append-only log.
 */

const CURRENT_SAVE_VERSION = 16;

type NodeKillSnapshot = {
  error?: string;
  killedCount?: number;
  visited0?: boolean;
  outcomeCount?: number;
  firstOutcomeKey?: string | null;
  taggedRemaining?: number;
};

test.describe('M1 Moor Road multi-node — act 1 smoke', () => {
  test('Act 1 node map generates + first-node proximity fires', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    await page.addInitScript((ver) => {
      try {
        const existingRaw = localStorage.getItem('whs_meta_save');
        const existing = (existingRaw
          ? (JSON.parse(existingRaw) as Record<string, unknown>)
          : {}) as Record<string, unknown>;
        localStorage.setItem(
          'whs_meta_save',
          JSON.stringify({ ...existing, saveVersion: ver, hasCompletedTutorial: true }),
        );
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

    // Give the scene one tick to finish wiring NodeMapSystem + generating Act 1.
    await page.waitForTimeout(400);

    const initialMap = await page.evaluate(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      if (!g) return { error: 'no-game' };
      const game = g.scene.getScene('Game') as {
        getRunActState?(): {
          currentAct: number;
          currentActNodeMap: { nodes: { key: string; type: string }[]; worldPositions: { x: number; y: number }[] } | null;
          currentNodeIndex: number;
          nodeOutcomes: { nodeKey: string }[];
        };
      } | null;
      if (!game?.getRunActState) return { error: 'no-run-act-state-hook' };
      const state = game.getRunActState();
      return {
        act: state.currentAct,
        nodeCount: state.currentActNodeMap?.nodes.length ?? 0,
        firstNodeKey: state.currentActNodeMap?.nodes[0]?.key ?? null,
        firstNodeType: state.currentActNodeMap?.nodes[0]?.type ?? null,
        firstNodePos: state.currentActNodeMap?.worldPositions[0] ?? null,
        outcomesBefore: state.nodeOutcomes.length,
      };
    });

    expect(initialMap?.act).toBe(1);
    expect(initialMap?.nodeCount).toBeGreaterThanOrEqual(3);
    expect(initialMap?.nodeCount).toBeLessThanOrEqual(5);
    // Generator always slot-0 a weighted encounter — the first pick must be an encounter
    // so the proximity test never lands on an interactive (shrine/trader/bargain) path.
    expect(initialMap?.firstNodeType).toBe('encounter');
    expect(initialMap?.firstNodePos).not.toBeNull();

    // Directly drive the NodeMapSystem tick at the first node position,
    // then verify the M1 F1 reward-on-kill gate:
    //   1. Immediately after proximity, the encounter node's enemies are
    //      spawned but the node is NOT yet visited.
    //   2. After every spawned enemy dies, the tracker's next frame
    //      finalizes the visit (adds a NodeOutcome, flips visited[0]).
    //
    // The tracker lives behind scene.update() so the test waits for a
    // real frame after killing the wave rather than driving the tick
    // directly — matches the live-run path.
    const afterProximity = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      if (!g) return null;
      const game = g.scene.getScene('Game') as {
        getPlayer?(): { setPosition(x: number, y: number): unknown; x: number; y: number };
        getRunActState?(): {
          currentActNodeMap: { worldPositions: { x: number; y: number }[]; visited: boolean[] } | null;
          nodeOutcomes: { nodeKey: string; visitedAtGameTimeSec: number }[];
        };
        getNodeMapSystem?(): { tick(pos: { x: number; y: number }): void };
      } | null;
      if (!game?.getPlayer || !game?.getRunActState || !game?.getNodeMapSystem) {
        return { error: 'no-hooks' };
      }
      const state = game.getRunActState();
      const pos = state.currentActNodeMap?.worldPositions[0];
      if (!pos) return { error: 'no-positions' };
      game.getPlayer().setPosition(pos.x, pos.y);
      game.getNodeMapSystem().tick(pos);
      await new Promise((r) => setTimeout(r, 100));
      const after = game.getRunActState();
      return {
        visited0: after.currentActNodeMap?.visited[0] === true,
        outcomeCount: after.nodeOutcomes.length,
      };
    });

    // M1 F1 — the node is NOT visited while spawned enemies are alive.
    expect(afterProximity?.visited0).toBe(false);
    expect(afterProximity?.outcomeCount).toBe(0);

    // Kill every enemy tagged for this encounter wave, then poll in
    // small page evaluations so the browser gets normal rAF turns
    // between checks. This keeps the assertion about live game state
    // while avoiding a single long in-page wait that some engines can
    // starve under full-suite load.
    const killStart = await page.evaluate((): NodeKillSnapshot => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      if (!g) return null;
      const game = g.scene.getScene('Game') as {
        getRunActState?(): {
          currentActNodeMap: { worldPositions: { x: number; y: number }[]; visited: boolean[] } | null;
          nodeOutcomes: { nodeKey: string; visitedAtGameTimeSec: number }[];
        };
        getSpawnSystem?(): { getEnemyGroup(): { getChildren(): Array<{
          active: boolean;
          nodeWaveTag: string | null;
          takeDamageWithKillEvents(amount: number): boolean;
        }> } };
      } | null;
      if (!game?.getRunActState || !game?.getSpawnSystem) return { error: 'no-hooks' };
      const taggedEnemies = game.getSpawnSystem().getEnemyGroup().getChildren()
        .filter((e) => e.active && typeof e.nodeWaveTag === 'string' && e.nodeWaveTag.length > 0);
      const killedCount = taggedEnemies.length;
      for (const e of taggedEnemies) {
        // Sheep wool armor absorbs a full hit, so a single giant damage
        // packet is not always lethal. Keep the kill path routed through
        // takeDamageWithKillEvents so the live enemy-kill cascade still
        // runs, but retry a few times until the pooled enemy goes inactive.
        for (let attempts = 0; e.active && attempts < 5; attempts++) {
          e.takeDamageWithKillEvents(999_999_999);
        }
      }
      const after = game.getRunActState();
      return {
        killedCount,
        visited0: after.currentActNodeMap?.visited[0] === true,
        outcomeCount: after.nodeOutcomes.length,
        firstOutcomeKey: after.nodeOutcomes[0]?.nodeKey ?? null,
        taggedRemaining: game.getSpawnSystem().getEnemyGroup().getChildren()
          .filter((e) => e.active && typeof e.nodeWaveTag === 'string' && e.nodeWaveTag.length > 0)
          .length,
      };
    });

    expect(killStart?.error).toBeUndefined();
    expect(killStart?.killedCount ?? 0).toBeGreaterThan(0);

    let afterKill: NodeKillSnapshot | null = killStart;
    const waitStarted = Date.now();
    while (Date.now() - waitStarted < 15_000) {
      afterKill = await page.evaluate((): NodeKillSnapshot => {
        const g = (window as unknown as { game?: {
          scene: { getScene(k: string): unknown };
        } }).game;
        if (!g) return { error: 'no-game' };
        const game = g.scene.getScene('Game') as {
          getRunActState?(): {
            currentActNodeMap: { visited: boolean[] } | null;
            nodeOutcomes: { nodeKey: string; visitedAtGameTimeSec: number }[];
          };
          getSpawnSystem?(): { getEnemyGroup(): { getChildren(): Array<{
            active: boolean;
            nodeWaveTag: string | null;
          }> } };
        } | null;
        if (!game?.getRunActState || !game?.getSpawnSystem) return { error: 'no-hooks' };
        const after = game.getRunActState();
        const taggedRemaining = game.getSpawnSystem().getEnemyGroup().getChildren()
          .filter((e) => e.active && typeof e.nodeWaveTag === 'string' && e.nodeWaveTag.length > 0)
          .length;
        return {
          visited0: after.currentActNodeMap?.visited[0] === true,
          outcomeCount: after.nodeOutcomes.length,
          firstOutcomeKey: after.nodeOutcomes[0]?.nodeKey ?? null,
          taggedRemaining,
        };
      });
      if (afterKill.visited0 === true && (afterKill.outcomeCount ?? 0) > 0) break;
      await page.waitForTimeout(100);
    }

    expect(
      afterKill?.visited0,
      `Node wave did not finalize: ${JSON.stringify(afterKill)}`,
    ).toBe(true);
    expect(afterKill?.outcomeCount).toBeGreaterThanOrEqual(1);
    expect(afterKill?.firstOutcomeKey).toBe(initialMap?.firstNodeKey);

    expect(pageErrors, 'No page errors during M1 smoke').toEqual([]);
  });
});
