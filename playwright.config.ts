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
 *   - chromium-mobile   — touch + safe-area + virtual-joystick, mobile specs only
 *
 * **Firefox WebM exclusion:** firefox's MediaRecorder doesn't accept
 * the codec the F9 clip-capture path produces. Gated inside the spec
 * via `test.skip(browserName === 'firefox', …)`; F10 (PNG) still runs.
 * Same treatment for `webkit` — codec mismatch, not a v4 blocker.
 */
// W95 — mobile-only specs are excluded from the desktop projects so the
// touch / safe-area / HUD-reflow checks stay scoped to the iPhone runner.
const DESKTOP_IGNORE = [
  '**/mobile-smoke.spec.ts',
  '**/mobile-viewport-reflow.spec.ts',
];
const FIREFOX_IGNORE = [
  ...DESKTOP_IGNORE,
  '**/marathon-smoke.spec.ts',
  // A1 M3 input-remap relies on precise `KeyboardEvent.keyCode` routing
  // into Phaser's scene-level Key poll; only chromium reliably dispatches
  // it headless. Cross-engine rebind coverage lives in the unit tests on
  // InputMapper / applyKeyRebind.
  '**/input-remap.spec.ts',
];
const WEBKIT_IGNORE = [
  ...DESKTOP_IGNORE,
  // Marathon is a 30-min soak — keep it on the primary project only.
  '**/marathon-smoke.spec.ts',
  // Same rationale as firefox — headless keyboard injection is chromium-only
  // for keyCode-dependent paths.
  '**/input-remap.spec.ts',
];

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  // Retry once everywhere, including local. GitHub Actions runs the full
  // Playwright matrix for pushes and pull requests to `main`. Local
  // `npm run ci:all` is the pre-push gate. The suite carries known transient races
  // (headless keyboard vs Phaser's per-frame key poll; cross-engine WebGL
  // boot timing) that single-shot `retries: 0` turned into hard-red on a busy
  // dev box, so the gate read perpetually broken and stopped being trusted.
  // Playwright still flags a retried pass as "flaky" (visible, non-blocking),
  // and a genuine regression fails all attempts — so this hides nothing.
  retries: 1,
  workers: 1,
  timeout: 90_000,
  use: {
    // App is served under the /wild/ base (matches production ha.ggis.xyz/wild).
    // Specs navigate with relative paths ('./', './?run=…') that resolve against
    // this — an absolute '/' would drop the sub-path.
    baseURL: 'http://127.0.0.1:4180/wild/',
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
      testMatch: ['**/mobile-smoke.spec.ts', '**/mobile-viewport-reflow.spec.ts'],
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
