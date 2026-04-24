import { expect, test } from './fixtures';

/**
 * M1 Moor Road multi-node — smoke: the Act 1 path is generated at run
 * start, the HUD widget reflects it, and teleporting the player to the
 * first node position fires the proximity trigger → records a
 * NodeOutcome in the append-only log.
 */

const CURRENT_SAVE_VERSION = 16;

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

    await page.goto('/');
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
      if (!g) return null;
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

    // Directly drive the NodeMapSystem tick at the first node position.
    // Avoids the Phaser physics-body-reset subtlety that makes
    // Player.setPosition a fragile way to verify proximity in headless.
    const afterTrigger = await page.evaluate(async () => {
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
      // Fire the tick directly so the test doesn't depend on physics-
      // body sync timing. Real-game flow goes through update() which
      // calls the same tick helper each frame.
      game.getNodeMapSystem().tick(pos);
      await new Promise((r) => setTimeout(r, 100));
      const after = game.getRunActState();
      return {
        visited0: after.currentActNodeMap?.visited[0] === true,
        outcomeCount: after.nodeOutcomes.length,
        firstOutcomeKey: after.nodeOutcomes[0]?.nodeKey ?? null,
      };
    });

    expect(afterTrigger?.visited0).toBe(true);
    expect(afterTrigger?.outcomeCount).toBeGreaterThanOrEqual(1);
    expect(afterTrigger?.firstOutcomeKey).toBe(initialMap?.firstNodeKey);

    expect(pageErrors, 'No page errors during M1 smoke').toEqual([]);
  });
});
