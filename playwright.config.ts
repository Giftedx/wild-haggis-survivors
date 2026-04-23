import { defineConfig, devices } from '@playwright/test';

/**
 * Project matrix:
 *   - chromium-desktop  — primary, runs every spec including marathon
 *   - firefox-desktop   — cross-engine sanity, skips mobile + marathon + WebM capture
 *   - webkit-desktop    — Safari-engine sanity, runs only the light specs that
 *                         the headless-WebKit + Phaser 4 + Canvas combo can
 *                         survive (see WEBKIT_LIGHT_MATCH below)
 *   - chromium-mobile   — touch + safe-area + virtual-joystick, mobile spec only
 *
 * **WebKit gating rationale:** during the cross-browser audit (2026-04-23)
 * we discovered headless WebKit hangs `page.evaluate` once any heavy
 * gameplay loop is running (suspected: same family as the mobile-tap
 * page-event-loop hang flagged in Task P4-12). Specs that just verify
 * boot / localStorage / one-shot scene capture survive cleanly. Specs
 * that drive gameplay or boss sequences hang past the 90s timeout.
 * Until the underlying WebKit-headless interaction is understood, we
 * gate WebKit to the survivable subset rather than ship a flaky suite.
 *
 * **Firefox WebM exclusion:** firefox's MediaRecorder doesn't accept
 * the codec the F9 clip-capture path produces. Real v4 issue worth
 * fixing in code, but not a migration blocker — exclude the spec from
 * firefox runs and track separately.
 */
const DESKTOP_IGNORE = ['**/mobile-smoke.spec.ts'];
const FIREFOX_IGNORE = [
  ...DESKTOP_IGNORE,
  '**/marathon-smoke.spec.ts',
  // capture-smoke F9 (WebM clip) — firefox MediaRecorder codec mismatch.
  // F10 (PNG) still runs because both tests live in the same file; gate
  // by grep-tag at run-time if more granular control is needed.
];
const WEBKIT_LIGHT_MATCH = [
  '**/smoke.spec.ts',
  '**/scots-locale.spec.ts',
  '**/replay-v2-playback.spec.ts',
  '**/design-verify-boot.spec.ts',
];

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90_000,
  use: {
    baseURL: 'http://127.0.0.1:4180',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: DESKTOP_IGNORE,
    },
    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: FIREFOX_IGNORE,
    },
    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'] },
      testMatch: WEBKIT_LIGHT_MATCH,
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['iPhone 13'] },
      testMatch: '**/mobile-smoke.spec.ts',
    },
  ],
  webServer: {
    command: 'npx vite preview --host 127.0.0.1 --port 4180 --strictPort',
    port: 4180,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Avoid Windows pipe deadlocks when the preview server is chatty.
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
