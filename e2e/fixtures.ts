import { test as base } from '@playwright/test';

/**
 * Headless Chromium often hits broken / unsupported WebGL framebuffers, which can prevent
 * Phaser from finishing boot (so `callbacks.postBoot` never runs and the canvas never gets
 * `role="application"`). Phaser honors `window.FORCE_CANVAS` during config parsing — see
 * `node_modules/phaser/src/core/Config.js` (end of constructor).
 *
 * A1 M5 — the first-launch photosensitivity warning splash blocks the
 * BootScene → MainMenu transition until dismissed. Every existing spec
 * assumes "established player" state (tutorial already skipped, etc.),
 * so the fixture merges `photosensitivityWarningSeen: true` into the
 * `whs_game_settings` blob before the page runs. Specs that genuinely
 * want to test the first-launch splash (`photosensitivity-warning.spec.ts`)
 * override by clearing the key in their own `page.addInitScript`, which
 * runs after this context-level script.
 */
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      (window as Window & { FORCE_CANVAS?: boolean }).FORCE_CANVAS = true;
      try {
        const raw = localStorage.getItem('whs_game_settings');
        const existing = raw && raw.length > 0
          ? (JSON.parse(raw) as Record<string, unknown>)
          : {};
        localStorage.setItem('whs_game_settings', JSON.stringify({
          ...existing,
          photosensitivityWarningSeen: true,
        }));
      } catch {
        /* ignore — bare storage environments fall through unchanged. */
      }
    });
    await use(context);
  },
});

export { expect } from '@playwright/test';
