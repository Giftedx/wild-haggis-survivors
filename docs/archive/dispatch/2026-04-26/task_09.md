# System Prompt: Task 09 - Visual Regression and Bundle Budget Gate

> **Status as of 2026-04-26 (post-audit):** Post-build gzip-budget script shipped at `scripts/check-bundle-budget.mjs`. It reads `dist/assets/*.js`, gzips each chunk, and exits non-zero if a tracked chunk exceeds budget. Baselines (measured 2026-04-26 production build): `vendor-phaser-*.js` ≤ **390,000** B gzip, `index-*.js` ≤ **285,000** B gzip. **Wire-up to `npm run ci` / `npm run ci:all` is still TODO** — without that the gate is opt-in only. Visual specs (`e2e/visual-regression.spec.ts`, `ui-audit.spec.ts`) still write PNGs without thresholded comparison.
>
> Verify before edit: `npm run build && node scripts/check-bundle-budget.mjs`, `cat scripts/check-bundle-budget.mjs`.

You are an autonomous coding agent working in `C:\Users\aggis\hlooper\wild-haggis-survivors`.

## Mission

Strengthen release QA so layout, high-UI-scale, mobile viewport, and bundle regressions are visible before merge. The project already has screenshot capture and lazy scene work; this task should turn that into a clearer gate or artifact workflow.

## Required Context

Read these before editing:

- `AGENTS.md`
- `docs/superpowers/plans/2026-04-26-triple-audit-execution-plan.md` T310 and T408
- `e2e/visual-regression.spec.ts`
- `e2e/ui-audit.spec.ts`
- `e2e/ui-audit-extra.spec.ts`
- `vite.config.ts`
- `src/scenes/lazyProductionScenes.ts`
- `src/tools/lazyToolScenes.ts`
- Build output notes in recent audit docs

## Scope

Pick one focused QA gate:

- convert one or two stable screenshot captures to thresholded comparisons,
- add a script that parses Vite build output and enforces a documented gzip budget,
- produce a CI-friendly visual artifact index with deterministic filenames,
- or add a high-UI-scale/mobile layout assertion that catches real overlap risks.

## Constraints

- Avoid brittle pixel-perfect assertions across GPUs.
- Do not commit generated screenshots or build artifacts.
- Keep bundle budgets realistic and documented.
- Do not undo existing lazy-scene behavior.

## Deliverables

1. A test, script, or config improvement that makes regressions visible.
2. Documentation of the gate and how to update baselines/budgets.
3. Focused tests for helper logic.
4. If build budgets are added, current measured baseline recorded in docs.

## Verification

Run at least:

```bash
npm test
npm run build
```

Run the targeted E2E or script if you add one.

## Final Report

Report the gate added, baseline numbers or screenshots covered, tests run, and known limitations.

