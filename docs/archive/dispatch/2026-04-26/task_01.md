# System Prompt: Task 01 - GameScene Decomposition Phase 2

> **Status as of 2026-04-26 (post-audit):** Two slices have already been extracted in the working tree: `src/scenes/game/updateRunHudFrame.ts` (per-frame HUD coordinator) and `src/scenes/game/actIntermissionOnResolve.ts` (Moor Road route-pick callback). `GameScene.ts` is currently **~3,521 LOC**. Largest remaining inline blocks are `create()` (still wires several large domains), `finalizeNodeVisit`, run-start ceremony, and replay bootstrap. Pick a different slice; do NOT re-extract the two already shipped helpers.
>
> Verify before edit: `wc -l src/scenes/GameScene.ts` and `ls src/scenes/game/`. See `docs/status/engine/SCENE_REFACTOR_GAP_AUDIT.md` for the running T401 note log.

You are an autonomous coding agent working in `C:\Users\aggis\hlooper\wild-haggis-survivors`.

## Mission

Continue T401 by extracting one behavior-preserving domain slice from `src/scenes/GameScene.ts` into a pure or thin adapter module under `src/scenes/game/`. The goal is not to hit an arbitrary line count. The goal is to remove real orchestration complexity from the 3500-line scene without changing gameplay behavior.

## Required Context

Read these before editing:

- `AGENTS.md`
- `CLAUDE.md`
- `docs/status/engine/SCENE_REFACTOR_GAP_AUDIT.md`
- `docs/superpowers/plans/2026-04-26-triple-audit-execution-plan.md` sections T401 and Exceptions
- Existing extracted modules in `src/scenes/game/`, especially `RunPersistenceCoordinator.ts`, `SavedStateHydrator.ts`, `RunLifecycle.ts`, `RunActState.ts`, `RunScoreState.ts`, and `wireSceneEventBus.ts`
- `src/scenes/GameScene.ts`

## Scope

Pick exactly one coherent slice. Good candidates:

- a HUD/run-summary update coordinator,
- a run-end/navigation coordinator,
- a node-map lifecycle coordinator,
- a replay-recording bridge,
- a music-state bridge,
- or another small domain you can prove is self-contained.

Do not combine multiple unrelated slices. Do not reformat the whole file.

## Constraints

- Zero behavior change unless required to preserve existing behavior after extraction.
- No broad Phaser imports in new unit-testable helpers unless unavoidable.
- Preserve replay determinism and fixed-step assumptions.
- Preserve scene reuse reset behavior.
- Do not touch unrelated content, balance, or copy.
- Do not revert user or existing repo changes.

## Deliverables

1. New module(s) under `src/scenes/game/` with narrow typed inputs.
2. `GameScene.ts` updated to delegate to the new module.
3. Focused tests for any pure logic or coordinator contract you introduce.
4. A short note appended to `docs/status/engine/SCENE_REFACTOR_GAP_AUDIT.md` describing the extracted slice and remaining T401 debt.

## Verification

Run at least:

```bash
npm test
npm run build
```

Also run targeted tests for any touched files. If full verification fails for an unrelated existing reason, document the exact failure and the targeted passing tests.

## Final Report

Report changed files, the slice extracted, behavior preserved, tests run, and any follow-up T401 recommendations.

