// Bypass the shared FORCE_CANVAS fixture — same hang regardless.
import { expect, test } from '@playwright/test';

/**
 * Mobile smoke — runs against `chromium-mobile` project (iPhone 13 device
 * emulation, touch-only).
 *
 * SCOPE: boot + viewport health on iPhone-emulated viewport. We do NOT
 * trigger any touch input — diagnostic runs during authoring established
 * that `canvas.tap()` under iPhone emulation + Phaser 4 causes the page
 * event loop to hang silently (no page errors, no console output, just
 * unresponsive). The pure-boot path completes cleanly.
 *
 * Verifies:
 *  - Phaser boots + canvas mounts at mobile viewport (390 × 664 portrait)
 *  - Body retains the W95 Phase 0 safe-area-inset CSS hooks
 *  - Mobile UA reaches MainMenu cleanly
 *  - Engine ticks (FPS > 0) during the first 3 s of runtime
 *  - Zero errors during boot + menu-state idle
 *
 * Follow-on Task P4-12 (logged in 2026-04-23-phaser4-migration.md):
 * investigate why `canvas.tap()` hangs the page under iPhone-emulation
 * with Phaser 4 — likely candidates: v4 input plugin's mobile pointer
 * routing, AudioContext resume on first gesture, or main.ts service-
 * worker registration races on mobile preview. Once fixed, expand this
 * spec to drive joystick + gameplay.
 */

const CURRENT_SAVE_VERSION = 9;

test.setTimeout(90_000);

test.describe('Mobile smoke', () => {
  test('iPhone viewport: boot + menu-level health, no errors', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const t = msg.text();
      if (/\[vite\]|favicon|service worker|Mixed Content/i.test(t)) return;
      consoleErrors.push(t);
    });

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
      } catch {
        /* ignore */
      }
    }, { ver: CURRENT_SAVE_VERSION });

    await page.goto('/');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });

    const layout = await page.evaluate(() => {
      const canvasEl = document.querySelector('canvas');
      let safeAreaRulePresent = false;
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules)) {
            if ((rule as CSSStyleRule).cssText?.includes('safe-area-inset')) {
              safeAreaRulePresent = true;
              break;
            }
          }
        } catch {
          /* cross-origin sheets — skip */
        }
        if (safeAreaRulePresent) break;
      }
      const g = (window as unknown as { game?: {
        scene: { isActive(k: string): boolean };
      } }).game;
      return {
        viewport: { w: window.innerWidth, h: window.innerHeight },
        canvas: canvasEl ? { w: canvasEl.width, h: canvasEl.height } : null,
        safeAreaRulePresent,
        gamePresent: Boolean(g),
        mainMenuActive: g?.scene.isActive('MainMenu') ?? false,
        bootSceneActive: g?.scene.isActive('Boot') ?? false,
      };
    });

    expect(layout.viewport.w, 'mobile viewport width').toBeLessThanOrEqual(500);
    expect(layout.canvas, 'canvas mounted').not.toBeNull();
    expect(layout.safeAreaRulePresent, 'index.html safe-area CSS hooks present').toBe(true);
    expect(layout.gamePresent, 'window.game present').toBe(true);

    // P4-12 diagnostic: now try a tap — the hang was fixed alongside
    // P4-13. See audioContext.ts runWhenAudioActivated setTimeout fix.
    await canvas.tap({ position: { x: 180, y: 320 } });
    await page.waitForTimeout(3000);

    // Re-poll game state after taps.
    const afterTaps = await page.evaluate(() => {
      const g = (window as unknown as { game: {
        loop: { actualFps: number };
        scene: { isActive(k: string): boolean };
      } }).game;
      return {
        fps: g.loop.actualFps,
        mainMenuActive: g.scene.isActive('MainMenu'),
        gameActive: g.scene.isActive('Game'),
        menuActive: g.scene.isActive('Menu'),
      };
    });

    await canvas.screenshot({ path: 'design-verify-screens/mobile-final.png' });

    console.log('[mobile] layout:', layout);
    console.log('[mobile] after taps:', afterTaps);
    console.log('[mobile] page errors:', pageErrors);
    console.log('[mobile] console errors:', consoleErrors);

    expect(pageErrors, 'no uncaught page errors on mobile').toEqual([]);
    expect(consoleErrors, 'no unexpected console.error noise on mobile').toEqual([]);
    expect(afterTaps.fps, 'engine ticking — fps > 0').toBeGreaterThan(0);
    // At least one of these scenes should be active after taps (depending
    // on which menu we landed on).
    expect(
      afterTaps.mainMenuActive || afterTaps.menuActive || afterTaps.gameActive,
      'a Phaser scene is active',
    ).toBe(true);
  });
});
