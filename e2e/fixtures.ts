import { test as base } from '@playwright/test';

/**
 * Headless Chromium often hits broken / unsupported WebGL framebuffers, which can prevent
 * Phaser from finishing boot (so `callbacks.postBoot` never runs and the canvas never gets
 * `role="application"`). Phaser honors `window.FORCE_CANVAS` during config parsing — see
 * `node_modules/phaser/src/core/Config.js` (end of constructor).
 */
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      (window as Window & { FORCE_CANVAS?: boolean }).FORCE_CANVAS = true;
    });
    await use(context);
  },
});

export { expect } from '@playwright/test';
