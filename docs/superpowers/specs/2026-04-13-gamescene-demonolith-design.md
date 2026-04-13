# GameScene De-Monolith — Design Spec (revised)

**Date:** 2026-04-13
**Supersedes:** Phase C of `2026-04-13-scene-refactor-biomes-endless-design.md`. Biomes and Endless have shipped; the seams they revealed now drive this refactor.

## Problem

`src/scenes/GameScene.ts` is **3,088 lines** (up from 2,898 when Phase C was first scoped). It orchestrates physics wiring, level-up card flow, pause/victory/death state machine, overlay z-ordering, post-bell endless gating, mid-run persistence, map hazards, biome ticking, and the scene reset block — in one file. Phaser scene-reuse means every one of those concerns has to reset cleanly on `scene.start()`, and the bugs in that zone (chest pickup during pause, stale delayedCalls, overlay-on-overlay lock leaks) have all been hit before.

## Goal

Shrink `GameScene.ts` to a thin orchestrator by extracting five cohesive modules under `src/scenes/game/`. **Zero behavior change.** All 444 existing tests pass. The game ships after each commit.

## Non-goals

- Fixing any bug or changing any behavior. Pure extraction.
- Rewriting `timeManager`, `TutorialSystem`, `BiomeController`, or any already-extracted system.
- Introducing new abstractions beyond the five named modules.
- Touching `BootScene.ts`, `WeaponSystem.ts`, or any entity file.

## Modules

All under `src/scenes/game/`. Each takes a constructor handle to `GameScene` (or a narrow slice interface where clean) and exposes a small method surface.

### 1. ~~`SceneResetter.ts`~~ → in-class `resetTransientRunState()` method

**Revised during execution.** Extracting the reset block into a separate file would require dropping `private` on 25+ fields or leaning on `any` casts — both worse than what they replace. Instead, the reset block becomes a single private method on `GameScene`, called from `create()`. Gains indentation-level clarity in `create()` without privacy contortions. Net GameScene line reduction: modest (~5 lines), but worth doing for readability.

**Surface:** `private resetTransientRunState(pendingSeed: number | null): void`
**Risk:** Lowest. Pure move inside the same class.

### 2. `PauseMenu.ts` *(was OverlayStack — revised during execution)*

The 140-line `toggleUiPause` body is the real monolith here, not a generic overlay-stack abstraction. `timeManager` already handles modal mutual exclusion via lock keys; the `pauseElements` array already has a clean teardown pattern. Wrapping that with a "stack" layer is ceremony. Instead, extract the full pause UI construction — backdrop, quip, stats block, resume/quit buttons, sfx/music toggles, passive summary — into `PauseMenu`. Tracks its own display objects and tears them down in `close()`.

**Surface:** `open(): void`, `close(): void`, `isOpen(): boolean`
**Risk:** Low-medium. The pointer handlers for sfx/music toggles and quit-to-menu keep the same scene callbacks; PauseMenu just owns the construction.

### 3. `CollisionRouter.ts`
Houses all `physics.add.overlap` / `physics.add.collider` setup and the bodies of their callbacks (chest, golden chest, coin, health orb, player-enemy collider, map-zone ticking). Tracks colliders it creates and removes them on scene shutdown to kill the known leak path.

**Surface:** `wire(): void`, `tickMapZones(dtMs: number): void`, `shutdown(): void`
**Risk:** Medium. Callbacks read/write many GameScene fields (`pendingChests`, `activeChestSprites`, `chestDurationBonusMs`, `iFrames`). Keep those fields on GameScene; router mutates them through it.

### 4. `LevelUpFlow.ts`
`onXpLevelUp`, level-milestone screen clear, `rerollUpgradeCards`, `applyUpgrade`, evolution eligibility (`findEligibleChestEvolution`), `announcedEvolutionReady` set.

**Surface:** `handleLevelUp()`, `reroll()`, `apply(card)`
**Risk:** Medium-high. Touches `upgradeUI`, `weaponSystem`, `player.heal()`, `timeManager` LEVEL_UP lock, permanent-upgrade integration. Must preserve the empty-pool fallback that calls `xpSystem.processNextLevelUp()`.

### 5. `RunLifecycle.ts`
`toggleUiPause`, `handlePlayerDeathOrRevive`, `handleVictory`, `handlePlayerDeath`, post-bell opt-in gate, mid-run persistence hooks (`persistActiveRunToMeta`, `registerMidRunPersistenceHooks`), deferred result tickers (`victoryResultRemainingMs`, `deathResultRemainingMs`).

**Surface:** `togglePause()`, `onPlayerHit()`, `onPlayerKilled()`, `onVictory()`, `isPostBell()`
**Risk:** Highest. Owns the pause/victory/death state machine. Raw-delta tickers must continue to bypass `timeScale = 0`. One-shot revival gate must not regress.

## What stays in GameScene

- `init` / `create` / `update` wiring
- `ISceneContext` getter methods (already tiny)
- System construction order (Player, SpawnSystem, WeaponSystem, XPSystem, JuiceSystem, etc.)
- Per-frame orchestration (calling system `update`s, updating music state scratch, camera follow)
- Biome + terrain creation (already small — `BiomeController` does the heavy lifting)
- DI — fields like `updateTickers`, `runStatsTracker`, `captionManager` remain on GameScene; modules read them via constructor-injected scene reference

Target: **≤1,200 lines** (not 400; the earlier estimate didn't account for system construction, mid-run persistence hooks, biome wiring, or caption plumbing that have all been added since the spec was written).

## Execution order (one commit per module)

1. **SceneResetter** — safest; pure move.
2. **OverlayStack** — low risk; establishes a pattern for modules 4 and 5 to use.
3. **CollisionRouter** — largest line win; isolated surface.
4. **LevelUpFlow** — depends on OverlayStack existing (cleaner commit).
5. **RunLifecycle** — last because it coordinates with all prior modules.

After each commit: `npm test` green, `npm run build` clean, git commit with clear scope.

## Test strategy

- **Regression net:** 444 existing tests, with `SpawnSystem.*`, `HUD`, `UpgradeCards`, `SettingsManager.a11y`, and scene-reuse tests doing most of the catch work.
- **No new tests required.** This is pure extraction. If a module's extraction reveals a testable seam (e.g., `LevelUpFlow.apply(card)` as a pure method over a mock scene), add a unit test opportunistically — but don't block commits on new coverage.
- **Manual smoke:** After commit 5, walk the flow mentally (can't run a browser here): start run → level-up → reroll → evolution → pause → chest during pause → unpause → boss → victory → post-bell → death. Cross-check against CLAUDE.md's Phaser gotchas list.

## Risks

| Risk | Mitigation |
|---|---|
| Stale `delayedCall` / `setTimeout` references after extraction | Keep callback references on GameScene fields; modules schedule via scene, don't own timers |
| Scene-reuse leaks (modules hold state across runs) | Each module has an explicit `reset()` called from `SceneResetter.resetForNewRun` |
| Overlay-on-overlay during pause+death edge case | OverlayStack tracks all Graphics in one Set; `destroyAll()` is single source of truth |
| CollisionRouter missing a collider on shutdown → leak | Explicit `shutdown()` removes all tracked colliders; called from scene `shutdown` event |
| LevelUpFlow breaks evolution announce-once semantics | `announcedEvolutionReady` Set stays on LevelUpFlow; cleared by SceneResetter |

## Rollback

Each commit is a pure move with tests green. To roll back module N: `git revert HEAD~(k)` where k is the commits since. No data migration, no save compat concern.

## Out of scope (follow-ups)

- Removing the remaining `as any` uses (4 in GameScene, 4 in WeaponSystem).
- Adding unit tests for the extracted modules as isolated units.
- Further splitting `BootScene.ts` (5,790 lines — a whole separate project).
