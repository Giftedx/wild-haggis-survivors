import { defineConfig, devices } from '@playwright/test';

/**
 * Project matrix:
 *   - chromium-desktop  — primary, runs every spec including marathon
 *   - firefox-desktop   — cross-engine sanity, skips mobile + marathon + WebM capture
 *   - webkit-desktop    — Safari-engine sanity, full suite minus marathon (run-time)
 *                         and F9 WebM clip (codec not supported); gameplay-heavy
 *                         specs unblocked after P4-13 fix to the audio-activation
 *                         retry loop (src/systems/audioContext.ts — setTimeout,
 *                         not queueMicrotask, for post-activation callbacks).
 *   - chromium-mobile   — touch + safe-area + virtual-joystick, mobile spec only
 *
 * **Firefox WebM exclusion:** firefox's MediaRecorder doesn't accept
 * the codec the F9 clip-capture path produces. Gated inside the spec
 * via `test.skip(browserName === 'firefox', …)`; F10 (PNG) still runs.
 * Same treatment for `webkit` — codec mismatch, not a v4 blocker.
 */
const DESKTOP_IGNORE = ['**/mobile-smoke.spec.ts'];
const FIREFOX_IGNORE = [
  ...DESKTOP_IGNORE,
  '**/marathon-smoke.spec.ts',
];
const WEBKIT_IGNORE = [
  ...DESKTOP_IGNORE,
  // Marathon is a 30-min soak — keep it on the primary project only.
  '**/marathon-smoke.spec.ts',
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
      testIgnore: WEBKIT_IGNORE,
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
