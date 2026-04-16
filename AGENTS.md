# AGENTS.md — Working Agreement for AI Agents

This repo is **Wild Haggis Survivors**, a Phaser 3 + TypeScript browser game bundled with Vite.

## How to run / verify
- **Dev**: `npm run dev`
- **Test**: `npm test` (Vitest)
- **Lint**: `npm run lint`
- **Build**: `npm run build` (TypeScript typecheck + Vite build)
- **Preview build**: `npm run preview`
- **E2E (Playwright, production preview)**: `npm run test:e2e` (requires a prior `npm run build` unless the preview server already serves `dist/`)
- **Full local gate (matches GitHub Actions)**: `npm run ci:all` — lint, Vitest, build, then E2E

Before claiming anything is “fixed” or “done”, run at least `npm test` and `npm run build`. For changes that touch UI, boot, or CI, prefer **`npm run ci:all`** once dependencies are installed (and Playwright browsers are available: `npx playwright install chromium`).

**Windows / Git:** If almost every file shows as modified but diffs are only `100755` ↔ `100644`, run `git config core.filemode false` in the repo root (local setting).

## Player experience & tone
- **Soul charter & UX weave**: `docs/DESIGN_SOUL.md` — handcrafted warmth, compassionate failure, celebratory progression, haggis fantasy at the center; use it when changing menus, HUD, toasts, game-over, or copy.

## Architecture quick map
- **Scenes**: `src/scenes/BootScene.ts` → `MenuScene.ts` → `GameScene.ts` → `ShopScene.ts`. `ActIntermissionScene.ts` is a paired modal for W2 Moor Road between-act route picks.
- **Core systems** (instantiated by `GameScene`): `SpawnSystem`, `WeaponSystem`, `XPSystem`, `GrowthSystem`, `JuiceSystem`, `AudioSystem`, `ProceduralMusicEngine`. Per-run state holders live under `src/scenes/game/`: `RunScoreState`, `RunActState`, `RunLifecycle`, etc.
- **Persistence**: `src/utils/save.ts` uses `localStorage` (key `whs_save`) with schema migration. Current schema is v4 — `RunHistoryEntry.routes` carries W2 picker history.
- **Data files**: `src/config.ts`, `src/data/{weapons,enemies,upgrades,permanentUpgrades,variants,routes,banter,curses,biomes,eliteAffixes}.ts`
- **W2 Moor Road**: act gating via `dispatchActComplete.ts` (gordon → act 1, tour_bus → act 2; taxman rides the victory path). Routes are data-driven with `modifierDeltas` applied at pick-resolve time + optional `onResume(ctx)` for side-effect callbacks (heals, spawn tilts, timed releases). `DEFAULT_ROUTE_ON_SKIP` backs the Skip Intermissions setting.

## High-risk Phaser correctness gotchas (treat as rules)
- **Scene instances are reused**: `scene.start('Game')` reuses the same `GameScene` instance; `create()` must reset all transient state.
- **`scene.time` keeps running during `physics.pause()`**: guard timer callbacks or defer work via flags.
- **`delta` is wall-clock**: cap large deltas to avoid “tab background” time-warps.
- **`delayedCall` respects `timeScale`**: at `timeScale = 0` it will not advance; use real timers only when you explicitly need wall-clock behavior. `TimeManager.scheduleRealTime(ms, cb)` is the prescribed wall-clock scheduler — W2 route `onResume` callbacks use it for timed-release effects so they don't stall during hit-freeze.
- **Phaser `ScenePlugin` vs `SceneManager`**: `this.scene` inside a Scene is the per-scene `ScenePlugin` (has `launch`, `pause`, `stop` operating on the owning scene). `game.scene` is the global `SceneManager` (has `start`, `run`, `getScene` by key — but no `launch`). Tests or external code that need `launch(key, data)` must go via `game.scene.getScene('Game').scene.launch(...)`.
- **Phaser imports break node-env vitest**: `phaser` touches `window` at module eval. Scene `.ts` files that import Phaser cannot be imported into vitest tests under the default node env. Extract testable logic into pure helper modules (e.g. `ActIntermissionScene.ts` delegates to `actIntermissionResolve.ts`; tests hit the helper directly).

## Repo hygiene (CRITICAL)
**This is a Source Repo.** Build artifacts are produced, not committed.

Unless the user explicitly requests otherwise:
- **Never commit `node_modules/`** (vendor blobs).
- **Never commit `dist/`** (build output).
- **Never commit `.env*`** (secrets).
- Keep `.gitignore` enforcing these rules.

If you are asked to commit `node_modules/` or `dist/`, do it, but call out the consequences (huge diffs, slow clones, merge pain).

## Editing guidelines
- Prefer **minimal, high-confidence fixes** for bug work (avoid broad refactors in the same change).
- Keep gameplay logic in systems/entities; keep UI logic in `src/ui/`.
- Keep balance changes in data/config files when possible.
- Avoid new cross-system reach-through (`as any` to access scene internals). Prefer explicit, typed interfaces passed into systems/entities.

## Commit conventions
- Follow existing commit style (examples in `git log`): `fix: ...`, `feat: ...`, `refactor: ...`, `docs: ...`, `chore: ...`
- Keep commit messages concise and intent-focused.

## Documentation
- `CLAUDE.md` contains deeper project notes and “gotchas” — keep it accurate (e.g., it should mention Vitest exists).

