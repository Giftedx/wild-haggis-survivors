# Bundle Budget Gate

Post-build gzip ceiling for the production JS chunks. Wired into `npm run ci` and `npm run ci:all` so any CI run catches accidental bundle bloat before merge.

> **Status as of 2026-04-28**: Gate live in CI chain. Current measured baselines pass (see Baselines below). Tracking origin: T310 in `docs/archive/superpowers/plans/2026-04-26-triple-audit-execution-plan.md`. Task-09 (this dispatch slice) wired the standalone script into the CI pipeline and added `--report-only` / `--verbose` affordances.

## What it covers

`scripts/check-bundle-budget.mjs` reads `dist/assets/*.js` and filters these three production-critical chunks:

- `vendor-phaser-*.js`
- `index-*.js`
- `sprite-art-*.js`

The script gzips each chunk. It exits non-zero if any chunk exceeds its documented ceiling.

The script does **not** police:

- Lazy scene chunks (each ships individually small; growth there shows in Vite's per-chunk console output).
- The Scots `i18n.scs-*.js` chunk (lazy, English-only players never download it).
- PWA precache size (Workbox warning surfaces in build output if it crosses Workbox's own threshold).
- CSS / fonts / sprites — sprites are programmatic in `BootScene`, no asset pipeline.

If any of those become a regression vector, extend the `BUDGETS` array in the script.

## Baselines (2026-04-28)

| Chunk            | Pattern                  | Max gzip (B) | Last measured (B) | Headroom |
|------------------|--------------------------|--------------|--------------------|----------|
| `vendor-phaser`  | `^vendor-phaser-.*\.js$` | 390,000      | 374,430            | +15,570 B (+4.0%) |
| `index (app)`    | `^index-.*\.js$`         | 320,000      | 305,687            | +14,313 B (+4.5%) |
| `sprite-art`     | `^sprite-art-.*\.js$`    | 280,000      | ~161,000           | ~119,000 B (+42.5%) |

**Measurement context**: The vendor measurement comes from commit `3978c7c`. The index measurement comes from commit `2c99ab4`, which added about 20 KB. The sprite-art measurement comes from commit `ff777d2`, which split the chunk from vendor.

The Vite per-chunk warning floor is set elsewhere (see `vite.config.ts`); these gzip ceilings are the **shipping** budget, not the dev warning.

## Running locally

```bash
npm run build       # produces dist/assets/*.js
npm run budget      # alias for `node scripts/check-bundle-budget.mjs`
```

Or invoke the script directly:

```bash
node scripts/check-bundle-budget.mjs           # exit non-zero on overage (CI mode)
node scripts/check-bundle-budget.mjs --verbose # also print headroom B / %
node scripts/check-bundle-budget.mjs --report-only # print sizes, never fail
```

`--report-only` is useful for: (a) CI artifact summaries that want a size readout without short-circuiting downstream steps, (b) "what's my current headroom?" inspection without rerunning the full build chain locally.

## CI wiring

`package.json` chains it after the build step:

```json
"ci": "npm run lint && npm test && npm run build && npm run budget && npm run flash-budget && npm run loc-report",
"ci:all": "npm run ci && npm run test:e2e"
```

Both `ci` and `ci:all` enforce the gate. The check runs in <1s after the build artefacts already exist on disk — overhead is negligible vs. the 5s build itself. CI total stays under existing budget.

## What counts as breakage

The gate fails when any of these conditions occur:

1. A tracked chunk's gzip size exceeds its `maxGzipBytes`. Fix path: identify what landed in the chunk (check the latest commits' module additions; `npm run build` per-chunk readout is the first signal), revert or refactor, OR justify the growth and update the baseline (see "Updating baselines" below).
2. A tracked chunk pattern matches **zero** files in `dist/assets`. This means Vite's chunk-splitting changed and renamed something — investigate `vite.config.ts` rather than the budget itself.
3. A tracked chunk pattern matches **multiple** files. Same root cause as (2): the regex is now ambiguous.

## Updating baselines

Bump `maxGzipBytes` only when the increase is intentional and justified. Process:

1. **Land the change** that triggers the budget overage on a branch.
2. **Quantify the cost**: `npm run build && node scripts/check-bundle-budget.mjs --verbose` — quote the new gzip size and the deficit.
3. **Justify in the commit / PR**: which feature is responsible for the growth, why it can't be lazy-loaded or refactored to a cheaper form, and what the new headroom looks like (aim to keep ≥3% slack so future small changes don't immediately re-bust it).
4. **Update both** `BUDGETS` in `scripts/check-bundle-budget.mjs` AND the Baselines table above with date + commit.
5. If the new baseline pushes a chunk past a round number that warrants a perf review (e.g. `index` past 300 KB gzip), open a separate task for a chunk-split investigation rather than letting the ceiling drift indefinitely.

A baseline bump is a **deliberate budget allocation**, not a routine maintenance step. PRs that bump the baseline without the rationale above should be sent back.

## Known limitations / followups

- **No tracking of the lazy scene chunks**. Individually small now (each <30 KB), but a future scene that grows past ~50 KB gzip should probably get its own budget row.
- **No PWA precache budget**. Workbox already warns if it crosses its internal cap; if WHS hits that, add a `dist/sw.js` precache-manifest size check here.
- **Static thresholds, no trend tracking**. Each CI run is a pass/fail snapshot — there's no longitudinal series. If you want a "size over time" graph, parse `dist/assets/*.js` sizes into a JSON artefact in CI and chart externally; out of scope for this gate.

## Related docs

- `docs/archive/superpowers/plans/2026-04-26-triple-audit-execution-plan.md` — T310 (lazy-scene split that established these baselines), T408 (deferred visual regression task that originally bundled with this).
- `vite.config.ts` — chunk-splitting strategy; lazy scene loading.
- `src/scenes/lazyProductionScenes.ts` — production scene lazy-load shim. Constraint: GameScene + ActIntermissionScene must stay eager.
