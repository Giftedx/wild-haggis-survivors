# Cross-Browser E2E Calibration

**Last full cross-browser run:** 2026-04-28 — comfort-smoke spec validated on Firefox + WebKit (both pass in ~15s wall-clock each).

## Why this exists

`playwright.config.ts` defines four projects:
- `chromium-desktop` — primary, runs every spec including marathon
- `firefox-desktop` — cross-engine sanity, skips mobile + marathon + input-remap (key-event divergence)
- `webkit-desktop` — Safari-engine sanity, same scope as Firefox
- `chromium-mobile` — touch + safe-area + virtual joystick, mobile-only specs

GitHub Actions CI installs and runs **chromium only** (see `.github/workflows/ci.yml` — `npx playwright install --with-deps chromium`). This is by design: the cross-browser projects exist to catch engine-level divergence (rendering, audio activation, codec support, keyboard event routing) but running them in CI would multiply runner time and flake surface.

The trade-off: cross-browser regressions can slip in between manual sweeps. This doc names the manual cadence + protocol.

## Manual run protocol

### One-off (before merging engine-touching work)

```bash
# Build first — e2e drives the production preview build
npm run build

# Cross-browser sweep
npm run test:e2e:cross-browser
```

This runs every spec in `firefox-desktop` and `webkit-desktop` projects (codec exclusions inside the specs themselves still apply — e.g. `capture-smoke` skips WebM on Firefox + WebKit via `test.skip(browserName === ...)`).

### Per-engine focus

When chasing a Firefox-specific bug:
```bash
npm run test:e2e:firefox
```

When chasing a WebKit-specific bug:
```bash
npm run test:e2e:webkit
```

### Cadence recommendation

- **Before any release.** Both sweeps must pass.
- **After audio / shader / Phaser-version changes.** Engine-level surface most prone to regression.
- **After playwright config changes.** Catches accidental project-list shifts.
- **Before refactoring `safeAddImage` / texture-existence guards.** WebKit headless texture state can differ from Chromium.

## Known cross-browser exclusions

These are intentional, documented in code:

| Spec | Exclusion | Reason |
|------|-----------|--------|
| `capture-smoke.spec.ts` | Firefox + WebKit | WebM codec mismatch in MediaRecorder |
| `marathon-smoke.spec.ts` | Firefox + WebKit | 30-min soak — chromium-only by config |
| `input-remap.spec.ts` | Firefox + WebKit | KeyboardEvent.keyCode dispatch divergence; covered by InputMapper unit tests |
| `mobile-smoke.spec.ts` | Desktop projects | mobile-only via `chromium-mobile` testMatch |
| `mobile-viewport-reflow.spec.ts` | Desktop projects | mobile-only |
| `sprite-export.spec.ts` | Firefox + WebKit | Dev tool, not gameplay surface |
| `visual-regression.spec.ts` | WebKit (mobile slice) | iPhone emulation only on chromium |
| `perf-smoke.spec.ts` | Firefox + WebKit | Threshold calibrated against chromium-desktop only — see header comment |

Adding a new exclusion is fine when there's a real engine-specific reason. Document the reason inline (`test.skip(browserName === '...', 'reason')`) AND update the table above.

## Calibration status

Last sampled (2026-04-28):
- `comfort-smoke.spec.ts`: Firefox PASS (~15s), WebKit PASS (~14s)
- Other specs: not run in this calibration sweep — full sweep recommended before next release

## Adding new cross-browser-eligible specs

A new spec is cross-browser-eligible if it:
- Doesn't depend on a specific codec (WebM, OGG, etc.)
- Doesn't require chromium-only headless GPU paths
- Doesn't poll `KeyboardEvent.keyCode` for character-precision input
- Isn't a 5+ minute long-soak (those run chromium-only by convention)

If it doesn't satisfy these, gate with `test.skip(browserName === '...')` per the table above.

## Future work (deferred)

- **Periodic CI sweep**: a scheduled GitHub Actions job (e.g. weekly cron) running `test:e2e:cross-browser` against `master`. Out of scope for this calibration but tracked as a follow-up.
- **Visual regression baselines**: WebKit has its own rendering quirks; if VR baselines expand to non-chromium projects, calibrate per-engine threshold first.
- **Mobile cross-browser**: `chromium-mobile` is the only mobile project. Adding `webkit-mobile` (iOS Safari emulation) requires its own test set + baseline calibration.
