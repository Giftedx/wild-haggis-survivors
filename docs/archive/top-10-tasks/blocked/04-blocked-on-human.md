# W95 Mobile Rework — Blocked on Human

This file enumerates W95 sub-tasks that **cannot** be closed by automated
work and require a human with real hardware. Engine-side work is being
shipped in parallel; the items below are the human-gated remainder.

## Blocked: real-device QA matrix (T203)

The triple-audit T203 ("mobile real-device pass") closes only when the
device matrix in `docs/MOBILE_DEVICE_TEST_MATRIX.md` has a green run on
each row. Playwright + chromium-mobile emulation cannot substitute for:

- iOS Safari quirks (audio context unlock on first touch, env() inset
  values, viewport-fit=cover behaviour, momentum scroll inertia, double-
  tap-to-zoom suppression)
- Android Chrome / Samsung Internet WebView divergence
- Real touch latency on a CPU-throttled mid-range device (Pixel 6a baseline)
- Battery drain over a 30-min run on a locked screen at 50% brightness
- Real notch / Dynamic Island clipping (Playwright iPhone emulation does
  not reproduce the actual `env(safe-area-inset-*)` values that hardware
  reports)

## Blocked: 60 fps perf target on mid-range Android

Charter §Phase 3 calls for sustained 60 fps on Pixel 6a baseline. We can
profile in headless Chrome but cannot reproduce the thermal throttle and
GPU profile of an actual Pixel 6a. Requires a human with the device, a
profiling session in Chrome DevTools remote, and a logged result in
`docs/MOBILE_PLAYTEST_LOG.md`.

## Blocked: gesture-pad navigation (Android 12+)

Android 12+ gesture nav reserves the bottom inset for swipe-up. Phaser
intercepting `pointerdown` in that zone is what `clampJoystickOrigin`
already mitigates, but the actual ambiguity ("did the user mean joystick
or system back?") only manifests on hardware. T203 covers this.

## What automated work has shipped (this branch)

Listed for context — none of this closes T203, but it cuts the human
playtest scope.

1. Pause-button hit area inflated to ≥44pt (`src/utils/touchTargets.ts`
   `computeMinTapHitArea`, applied in `src/ui/HUD.ts`).
2. New Playwright spec `e2e/mobile-viewport-reflow.spec.ts` — sweeps
   360 / 414 / 768 / 1024 widths and verifies HUD reflow keeps pause /
   HP-bar / XP-bar inside the viewport. Runs in the `chromium-mobile`
   project alongside the existing mobile-smoke spec.
3. `docs/MOBILE_DEVICE_TEST_MATRIX.md` — the blank matrix the human run
   fills in.
4. `docs/MOBILE_QUIRKS.md` — known mobile-only quirks, indexed for the
   next agent or human picking up the work.

## How to close T203

Steps for the human running the device matrix:

1. Run a 30-min session per row in `docs/MOBILE_DEVICE_TEST_MATRIX.md`.
2. Append findings (✓ / ✗ / quirk note) to that file.
3. Append a one-line per device entry to `docs/MOBILE_PLAYTEST_LOG.md`
   (create on first run if it doesn't exist).
4. Once every row is green, mark T203 done in
   `docs/superpowers/plans/2026-04-26-triple-audit-execution-plan.md`.

## Risk levers (per charter §Risk + descope)

- Cut Phase 4 to iPhone + Pixel only; defer Samsung + tablets (saves ~3
  device-days but leaves Samsung Internet quirks unverified).
- Defer pinch-zoom on Almanac art (Phase 1 §3) until after T203 closes.
