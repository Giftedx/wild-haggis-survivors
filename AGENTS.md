# AGENTS.md — Working Agreement for AI Agents

This repo is **Wild Haggis Survivors**, a Phaser 3 + TypeScript browser game bundled with Vite.

## How to run / verify
- **Dev**: `npm run dev`
- **Test**: `npm test` (Vitest)
- **Build**: `npm run build` (TypeScript typecheck + Vite build)
- **Preview build**: `npm run preview`

Before claiming anything is “fixed” or “done”, run at least `npm test` and (for shipped changes) `npm run build`.

## Architecture quick map
- **Scenes**: `src/scenes/BootScene.ts` → `MenuScene.ts` → `GameScene.ts` → `ShopScene.ts`
- **Core systems** (instantiated by `GameScene`): `SpawnSystem`, `WeaponSystem`, `XPSystem`, `GrowthSystem`, `JuiceSystem`, `AudioSystem`, `ProceduralMusicEngine`
- **Persistence**: `src/utils/save.ts` uses `localStorage` (key `whs_save`) with schema migration.
- **Data files**: `src/config.ts`, `src/data/{weapons,enemies,upgrades,permanentUpgrades,variants}.ts`

## High-risk Phaser correctness gotchas (treat as rules)
- **Scene instances are reused**: `scene.start('Game')` reuses the same `GameScene` instance; `create()` must reset all transient state.
- **`scene.time` keeps running during `physics.pause()`**: guard timer callbacks or defer work via flags.
- **`delta` is wall-clock**: cap large deltas to avoid “tab background” time-warps.
- **`delayedCall` respects `timeScale`**: at `timeScale = 0` it will not advance; use real timers only when you explicitly need wall-clock behavior.

## Repo hygiene (CRITICAL)
This repo currently contains churn from `dist/` and `node_modules/`. Unless the user explicitly requests otherwise:
- **Do not commit `node_modules/`**.
- **Do not commit `dist/`** (prefer CI deployment / build artifacts outside normal commits).
- Add/maintain `.gitignore` accordingly.

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

