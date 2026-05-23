import { expect, test } from './fixtures';

interface PhaserGameLike {
  scene: {
    start(k: string, data?: unknown): void;
    isActive(k: string): boolean;
    getScene(k: string): unknown;
  };
}

interface BoundsLike {
  x: number;
  y: number;
  w: number;
  h: number;
  bottom: number;
}

test.describe('GameOver action/link layout', () => {
  test('mobile uiScale 1.4 keeps action labels, share links, and Wee Tale separated', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await page.addInitScript(() => {
      try {
        localStorage.setItem('whs_meta_save', JSON.stringify({
          saveVersion: 9,
          hasCompletedTutorial: true,
        }));
        const raw = localStorage.getItem('whs_game_settings');
        const existing = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
        localStorage.setItem('whs_game_settings', JSON.stringify({
          ...existing,
          uiScale: 1.4,
          captureEnabled: true,
          reduceFlashing: true,
          photosensitivityWarningSeen: true,
          culturalContentSplashSeen: true,
        }));
      } catch { /* ignore */ }
    });

    await page.goto('/');
    await expect(page.locator('canvas[role="application"]')).toBeVisible({ timeout: 60_000 });

    const ready = await page.evaluate(async () => {
      const g = (window as unknown as { game?: PhaserGameLike }).game;
      if (!g) return false;
      const gameScene = g.scene.getScene('Game') as {
        getClipRecorder?: () => { isAvailable: () => boolean };
        getBossKillHighlight?: () => unknown;
      };
      gameScene.getClipRecorder = () => ({ isAvailable: () => true });
      gameScene.getBossKillHighlight = () => ({
        bossKey: 'gordon',
        blob: new Blob(['stub-highlight-bytes'], { type: 'video/webm' }),
        extension: 'webm',
        capturedAtSec: 312,
      });
      g.scene.start('GameOver', {
        mode: 'death',
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
        name: 'Hamish',
      });
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('GameOver')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(ready, 'GameOver scene failed to activate').toBe(true);

    await page.waitForTimeout(1_800);

    const layout = await page.evaluate(() => {
      const g = (window as unknown as { game?: PhaserGameLike }).game;
      const over = g?.scene.getScene('GameOver') as { children?: { list?: unknown[] } } | undefined;
      const children = over?.children?.list ?? [];
      const toBounds = (obj: unknown): BoundsLike | null => {
        const candidate = obj as { getBounds?: () => { x: number; y: number; width: number; height: number; bottom: number } };
        if (typeof candidate.getBounds !== 'function') return null;
        const b = candidate.getBounds();
        return { x: b.x, y: b.y, w: b.width, h: b.height, bottom: b.bottom };
      };
      const items = children.map((obj) => {
        const candidate = obj as { type?: string; text?: string; depth?: number; x?: number; y?: number };
        return {
          type: candidate.type ?? '',
          text: candidate.text ?? '',
          depth: candidate.depth ?? 0,
          x: candidate.x ?? 0,
          y: candidate.y ?? 0,
          bounds: toBounds(obj),
        };
      });
      const buttonRects = items
        .filter((item) => item.type === 'Rectangle' && item.depth === 203 && item.y > 520)
        .sort((a, b) => a.x - b.x);
      const labels = ['PLAY AGAIN', 'GOLD SHOP', "TAE GRAN'S"].map((text) => items.find((item) => item.text === text));
      const seed = items.find((item) => item.text.startsWith('Seed: TEST-1234-MIST'));
      const postcard = items.find((item) => item.text.includes('save postcard'));
      const share = items.find((item) => item.text.includes('share this run'));
      const tale = items.find((item) => item.text.includes('The boots remembered the road'));
      return { buttonRects, labels, seed, postcard, share, tale };
    });

    expect(layout.buttonRects.length, 'three action button rectangles').toBe(3);
    for (let i = 0; i < 3; i++) {
      const rect = layout.buttonRects[i]!.bounds!;
      const label = layout.labels[i];
      expect(label?.bounds, `missing action label ${i}`).toBeTruthy();
      const labelBounds = label!.bounds!;
      expect(labelBounds.x, `label ${label!.text} left edge stays in button`).toBeGreaterThanOrEqual(rect.x - 5);
      expect(labelBounds.x + labelBounds.w, `label ${label!.text} right edge stays in button`).toBeLessThanOrEqual(rect.x + rect.w + 5);
    }

    const actionTop = Math.min(...layout.buttonRects.map((rect) => rect.bounds!.y));
    const actionBottom = Math.max(...layout.buttonRects.map((rect) => rect.bounds!.bottom));
    expect(layout.seed?.bounds?.bottom, 'seed row stays above share/postcard links').toBeLessThan((layout.postcard?.bounds?.y ?? 0) - 4);
    expect(layout.share?.bounds?.bottom, 'share link stays above the action row').toBeLessThan(actionTop - 24);
    expect(layout.tale?.bounds?.y, 'Wee Tale sits below the action row').toBeGreaterThan(actionBottom + 8);
    expect(layout.tale?.bounds?.bottom, 'Wee Tale remains on-screen').toBeLessThanOrEqual(664);
  });
});
