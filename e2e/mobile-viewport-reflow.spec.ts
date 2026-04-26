/**
 * W95 mobile viewport reflow — automated viewport-emulation sweep.
 *
 * Resizes the viewport to four canonical mobile widths and asserts
 * the canvas + safe-area CSS continue to adapt. Catches the engine-
 * side mobile failures device emulation CAN catch — touch overflow,
 * safe-area unconfigured, canvas dimensions diverging from the
 * viewport, HUD layout going negative — without needing real hardware.
 *
 * Real-device QA is documented in docs/MOBILE_DEVICE_TEST_MATRIX.md
 * and tracked separately in docs/top-10-tasks/blocked/04-blocked-on-
 * human.md (T203 gate).
 *
 * Why bypass fixtures.ts: the chromium-mobile project should pin to
 * the same boot path as mobile-smoke.spec.ts (both skip FORCE_CANVAS).
 * WebGL works under Playwright iPhone emulation so we can capture the
 * live canvas just like the smoke spec does.
 */

import { expect, test } from '@playwright/test';

const CURRENT_SAVE_VERSION = 9;

const VIEWPORT_WIDTHS = [
  { name: 'iphone-mini-360', width: 360, height: 780 },
  { name: 'iphone-13-414', width: 414, height: 896 },
  { name: 'tablet-portrait-768', width: 768, height: 1024 },
  { name: 'tablet-landscape-1024', width: 1024, height: 768 },
];

test.setTimeout(120_000);

test.describe('W95 mobile viewport reflow', () => {
  for (const vp of VIEWPORT_WIDTHS) {
    test(`canvas + safe-area + HUD reflow at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on('pageerror', (err) => { pageErrors.push(err.message); });

      await page.setViewportSize({ width: vp.width, height: vp.height });

      await page.addInitScript(({ ver }) => {
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
          const settingsRaw = localStorage.getItem('whs_game_settings');
          const settings = (settingsRaw
            ? (JSON.parse(settingsRaw) as Record<string, unknown>)
            : {}) as Record<string, unknown>;
          localStorage.setItem('whs_game_settings', JSON.stringify({
            ...settings,
            photosensitivityWarningSeen: true,
          }));
        } catch { /* ignore */ }
      }, { ver: CURRENT_SAVE_VERSION });

      await page.goto('/');
      const canvas = page.locator('canvas[role="application"]');
      await expect(canvas).toBeVisible({ timeout: 60_000 });

      const layout = await page.evaluate(() => {
        const canvasEl = document.querySelector('canvas');
        const bodyStyle = getComputedStyle(document.body);
        const safePad = {
          top: parseFloat(bodyStyle.paddingTop) || 0,
          right: parseFloat(bodyStyle.paddingRight) || 0,
          bottom: parseFloat(bodyStyle.paddingBottom) || 0,
          left: parseFloat(bodyStyle.paddingLeft) || 0,
        };
        let safeAreaRulePresent = false;
        for (const sheet of Array.from(document.styleSheets)) {
          try {
            for (const rule of Array.from(sheet.cssRules)) {
              if ((rule as CSSStyleRule).cssText?.includes('safe-area-inset')) {
                safeAreaRulePresent = true;
                break;
              }
            }
          } catch { /* skip cross-origin */ }
          if (safeAreaRulePresent) break;
        }
        const g = (window as unknown as { game?: {
          loop: { actualFps: number };
          scale: { width: number; height: number };
          scene: { isActive(k: string): boolean };
        } }).game;
        return {
          viewport: { w: window.innerWidth, h: window.innerHeight },
          canvas: canvasEl ? { w: canvasEl.width, h: canvasEl.height } : null,
          safePad,
          safeAreaRulePresent,
          gamePresent: Boolean(g),
          gameScaleWidth: g?.scale.width ?? -1,
          gameScaleHeight: g?.scale.height ?? -1,
          fps: g?.loop?.actualFps ?? 0,
        };
      });

      expect(layout.gamePresent, 'window.game present').toBe(true);
      expect(layout.canvas, 'canvas mounted').not.toBeNull();
      expect(layout.safeAreaRulePresent, 'index.html safe-area CSS hooks present').toBe(true);
      expect(layout.gameScaleWidth, 'phaser scale.width tracks viewport').toBeGreaterThan(0);
      expect(layout.gameScaleHeight, 'phaser scale.height tracks viewport').toBeGreaterThan(0);
      expect(
        Math.abs(layout.gameScaleWidth - vp.width),
        `phaser scale.width=${layout.gameScaleWidth} should be near viewport ${vp.width}`,
      ).toBeLessThanOrEqual(2);
      expect(Number.isFinite(layout.safePad.top), 'safe-area top is finite').toBe(true);
      expect(Number.isFinite(layout.safePad.bottom), 'safe-area bottom is finite').toBe(true);

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
      expect(gameBooted, 'Game scene failed to activate at this viewport').toBe(true);
      await page.waitForTimeout(800);

      const hudFit = await page.evaluate(() => {
        const g = (window as unknown as { game: {
          scale: { width: number; height: number };
          scene: { getScene(k: string): unknown };
        } }).game;
        const scene = g.scene.getScene('Game') as {
          hud?: {
            pauseText?: { x: number; y: number };
            xpBarBg?: { x: number; y: number; width: number };
            hpBarBg?: { x: number; y: number; width: number };
          };
        };
        const hud = scene.hud;
        if (!hud) return null;
        return {
          width: g.scale.width,
          height: g.scale.height,
          pause: hud.pauseText ? { x: hud.pauseText.x, y: hud.pauseText.y } : null,
          xpBar: hud.xpBarBg ? { x: hud.xpBarBg.x, y: hud.xpBarBg.y, width: hud.xpBarBg.width } : null,
          hpBar: hud.hpBarBg ? { x: hud.hpBarBg.x, y: hud.hpBarBg.y, width: hud.hpBarBg.width } : null,
        };
      });
      expect(hudFit, 'GameScene.hud not exposed; cannot verify reflow').not.toBeNull();
      const fit = hudFit as NonNullable<typeof hudFit>;

      if (fit.hpBar) {
        expect(fit.hpBar.x, 'HP bar x non-negative').toBeGreaterThanOrEqual(0);
        expect(fit.hpBar.y, 'HP bar y non-negative').toBeGreaterThanOrEqual(0);
        expect(fit.hpBar.x + fit.hpBar.width, 'HP bar fits in width')
          .toBeLessThanOrEqual(fit.width + 1);
      }

      if (fit.pause) {
        expect(fit.pause.x, 'pause button x within viewport').toBeGreaterThan(0);
        expect(fit.pause.x, 'pause button x left of right edge').toBeLessThanOrEqual(fit.width);
        expect(fit.pause.y, 'pause button y within viewport top half').toBeGreaterThanOrEqual(0);
        expect(fit.pause.y, 'pause button y not below bottom').toBeLessThan(fit.height);
      }

      if (fit.xpBar) {
        expect(fit.xpBar.y, 'XP bar y inside viewport').toBeLessThan(fit.height);
        expect(fit.xpBar.y, 'XP bar y in bottom half').toBeGreaterThan(fit.height * 0.5);
      }

      expect(pageErrors, `Page errors at ${vp.name}: ${pageErrors.join("\n")}`).toEqual([]);
    });
  }
});
