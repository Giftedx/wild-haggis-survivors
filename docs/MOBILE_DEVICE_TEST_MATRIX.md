# W95 Mobile Device Test Matrix

> Tracks the human-gated portion of T203 (`docs/archive/superpowers/plans/2026-04-
> 26-triple-audit-execution-plan.md`). Engine-side automation lives in
> `e2e/mobile-viewport-reflow.spec.ts` + `e2e/mobile-smoke.spec.ts`. This
> file is the playtest manifest for hardware QA.

## How to use

For each row: run a 30-minute session that completes:

1. Open the live site (`https://wild-haggis-survivors.pages.dev`).
2. Boot → MainMenu (engine ticks > 30 fps).
3. Start a run → reach W2 act 1 (defeat gordon).
4. Visit Croft hub between runs (Gran scene loads).
5. Open Almanac, browse one entry.
6. Open Settings, toggle UI scale + colorblind mode.
7. (If P3 cloud saves shipped) sign in / sign out.
8. Force-quit the tab mid-run, reopen, confirm resume works.

For each row, fill `Status` with one of:

- ✓ — passes acceptance criteria
- ✗ — fails (file follow-up to `docs/MOBILE_PLAYTEST_LOG.md` and link)
- ! — passes with caveat (note in `Quirks`)

## iOS

| Device | iOS | Browser | Status | Quirks |
|---|---|---|---|---|
| iPhone 13 / 14 / 15 (notched) | latest stable | Safari | _pending_ | |
| iPhone 13 / 14 / 15 (notched) | latest stable | Chrome (WebKit shell) | _pending_ | |
| iPhone Mini-class (smaller viewport) | latest stable | Safari | _pending_ | |
| iPad (any current) | latest stable | Safari | _pending_ | |
| iPad (any current) | latest stable | Chrome | _pending_ | |
| iPhone 13 / 14 / 15 | latest stable - 1 | Safari | _pending_ | |

## Android

| Device | Android | Browser | Status | Quirks |
|---|---|---|---|---|
| Pixel 6a (baseline mid-range) | latest stable | Chrome | _pending_ | |
| Pixel 6a (baseline mid-range) | latest stable | Samsung Internet | _pending_ | |
| Pixel 7 Pro (large + curved edges) | latest stable | Chrome | _pending_ | |
| Samsung Galaxy S22+ (dynamic island analog) | latest stable | Samsung Internet | _pending_ | |
| Samsung Galaxy S22+ | latest stable | Chrome | _pending_ | |
| Android tablet (10"+) | latest stable | Chrome | _pending_ | |

## Acceptance criteria (per charter §Acceptance criteria)

- All scenes lay out correctly at the device's portrait + landscape widths
- All interactive elements ≥44pt tap target (chromium-mobile spec covers
  the pause button case automatically; remainder is human-eyeball)
- Safe-area insets respected on iPhone notch + Dynamic Island
- Joystick reachable one-thumb on iPhone Mini and Pixel 7 Pro alike
- 60 fps sustained on Pixel 6a baseline 30-min run
- Battery drain ≤20% per 30-min run on locked screen mid-brightness
- No iOS Safari WebGL crashes (audio-context unlock, AudioContext.resume
  is the most common offender — see `src/systems/audioContext.ts`)
- Resume-mid-run works after force-quit and tab restore

## Anti-patterns to flag

(From charter §Anti-patterns — re-list here so reviewers don't have to
crossref.)

- Two HUDs (one for desktop, one for mobile)
- Forked mobile build
- Disabled hover effects on touch (should convert to tap-and-hold, not remove)
- Killed desktop input (mouse / keyboard / gamepad must remain first-class)

## Cross-references

- `docs/archive/top-10-tasks/04-w95-mobile-rework.md` — full charter
- `docs/archive/top-10-tasks/blocked/04-blocked-on-human.md` — items requiring hardware
- `docs/MOBILE_QUIRKS.md` — running notebook of mobile-only behaviour
- `docs/archive/superpowers/plans/2026-04-22-w95-phase0-mobile-safe-area.md` — shipped Phase 0
- `e2e/mobile-viewport-reflow.spec.ts` — automated engine-side coverage
