# A1 — Flash budget policy (static check)

> **Status:** Script live as `npm run flash-budget` and runnable
> standalone via `node scripts/check-flash-budget.mjs` (2026-04-26).
> Negative-control suite green at 5/5 in `src/core/flashBudgetCheck.test.ts`.
> Adding the step into the `ci` script is a follow-up — coordinate with
> whichever agent owns the next `package.json` reshape so the budget +
> bundle-budget + flash-budget steps land together. PEAT desktop
> captures still gate the human audit rows in
> `docs/status/a11y/A1_PEAT_AUDIT.md`; this static check is a
> *prevention* layer, not a substitute.

## Why a static check exists

The 25 PEAT-pending rows in `A1_PEAT_AUDIT.md` are graded by a human
running the PEAT desktop tool over OBS captures. That cycle is slow
and expensive. To keep the cycle's findings stable between runs, the
code paths that emit screen-pulse-class effects must keep routing
through the `src/core/a11yMotion.ts` ladder:

- `scaledFlashAlpha(base)` — caps flash alpha at **0.4** when
  `reduceFlashing: true`.
- `scaledFlashDurationMs(base)` — floors duration at **200ms** under
  `reduceFlashing` (turns strobes into ramps).
- `scaledParticleCount(base, min)` — caps emit-per-event count.

A future change that inlines `setAlpha(0.85)` on `flashRect` or
constructs a new full-screen pulsing rectangle without going through
the ladder would invalidate every PEAT capture upstream of it. The
static check is the cheap automated guard against that drift.

## What the checker enforces

`scripts/check-flash-budget.mjs` enforces two invariants:

### Invariant 1 — `JuiceSystem` flash methods route through the ladder

For each of `flashWhite`, `flashRed`, `flashColored`, the method body
must contain a call to BOTH `scaledFlashAlpha(...)` AND
`scaledFlashDurationMs(...)`. The brace-balanced extractor reads the
declaration body so renames or call-site shadowing don't fool it.

### Invariant 2 — full-screen flash overlay allowlist

Files that construct a viewport-sized rectangle
(`scene.add.rectangle(width/2, height/2, width, height, ...)`) AND
tween its alpha *up* past 0.4 are the canonical PEAT-failing pattern.
The set of such files is enumerated as
`FLASH_OVERLAY_ALLOWLIST` in the script. Each entry has a `kind`:

| kind                | meaning                                                                                                                                               |
|---------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| `flash`             | brightness-pulse class. MUST use `scaledFlashAlpha` and `scaledFlashDurationMs`. The script self-checks this on every run.                              |
| `fade-transition`   | one-shot dim-direction scene fade-in/out (alpha 0→1 or 1→0 on `BG_DARK`). Dim ramps, not flashes; not a PEAT failure mode.                              |
| `static-backdrop`   | file paints a constant-alpha viewport backdrop AND has unrelated tween code on a different rectangle in the same file that the whole-file scan can't separate. |

Current allowlist (2026-04-26):

- `src/systems/JuiceSystem.ts` — kind `flash`. Three full-screen flash
  methods (white/red/colored). Verified on every run.
- `src/scenes/sceneFade.ts` — kind `fade-transition`. Shared
  `addSceneFadeIn` / `startSceneFadeOut` helpers.
- `src/scenes/BootScene.ts` — kind `static-backdrop`. Highland-dawn
  splash backdrop + unrelated reveal tweens.

## Adding to the allowlist

A new `flash`-kind entry should be a deliberate, reviewed change. The
checklist:

1. Confirm the new caller routes alpha through `scaledFlashAlpha`
   and duration through `scaledFlashDurationMs`. If it doesn't, fix
   that *before* adding to the allowlist — the script's self-check
   will block it otherwise.
2. Add a row to `docs/status/a11y/A1_PEAT_AUDIT.md` describing the
   moment, the code path, and the capture scenario. Mark
   `_PEAT pending_` for both reduceFlashing OFF and ON.
3. Note the addition in the PR / commit message so the next PEAT
   re-capture cycle picks it up.
4. Add the file to `FLASH_OVERLAY_ALLOWLIST` with kind `flash`.

A new `fade-transition` or `static-backdrop` entry is reviewed for
the same shape (the colour/alpha ramp must be dim, not bright) and
needs no PEAT row.

## Running the checker

```bash
npm run flash-budget                # full check, exit 1 on violation
node scripts/check-flash-budget.mjs --verbose       # show the allowlist
node scripts/check-flash-budget.mjs --report-only   # diagnostic, exit 0
```

CI integration: pending — wire `node scripts/check-flash-budget.mjs`
into the `ci` script alongside `check-bundle-budget.mjs` next time
that script gets reshaped. The negative-control vitest suite already
runs on every `npm test`, so the script's own logic is guarded.
Local feedback: invoke `npm run flash-budget` after any change that
touches `src/systems/JuiceSystem.ts` or adds a screen overlay.

## Negative-control coverage

`src/core/flashBudgetCheck.test.ts` spawns the script against a
synthetic temp-dir repo to assert:

- happy path passes,
- a `flashWhite` that drops `scaledFlashAlpha` fails,
- a `flashRed` that drops `scaledFlashDurationMs` fails,
- a new file with a viewport-sized rect tweening to alpha 0.85 fails,
- a static dim backdrop tweening only to alpha 0.3 passes.

These tests live alongside the rest of the unit suite and run on
every `npm test` invocation.

## What this check is NOT

It cannot grade flash rate (≤3/s general, ≤3/s red), red-strobe
saturation, or 25%-screen-area thresholds. PEAT desktop runs over OBS
captures decide pass/fail on each of the 25 audit rows. The static
check protects the *prerequisites* — the code routes — between
captures.

## Cross-references

- `docs/status/a11y/A1_PEAT_AUDIT.md` — the human-graded audit.
- `docs/research/ACCESSIBILITY_RESEARCH.md` §2.5 — photosensitivity
  engineering playbook.
- `e2e/peat-reduce-flashing-pair.spec.ts` — paired OFF/ON boot harness.
- `src/core/a11yMotion.ts` — the scaling ladder this check defends.
