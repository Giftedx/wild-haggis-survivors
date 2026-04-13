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

### 3. `PickupSpawner.ts` *(was CollisionRouter — revised during execution)*

The player-enemy collider is a 1-liner; extracting it as a "CollisionRouter" would be ceremony. The real mass is in the four pickup factory methods (`spawnTreasureChest`, `spawnGoldenChest`, `spawnGoldCoin`, `spawnHealthOrb`) — ~300 lines of interleaved sprite construction, tween choreography, physics overlap wiring, despawn scheduling, and chest-sprite tracking. PickupSpawner owns all four. The player-enemy collider stays in `create()` where it reads cleanly.

**Surface:** `spawnTreasureChest(x,y)`, `spawnGoldenChest()`, `spawnGoldCoin(x,y,amt)`, `spawnHealthOrb(x,y,amt)`
**Risk:** Medium. Factories touch many scene fields (juice, xpSystem, coinGoldEarned, chestDurationBonusMs, pickupDespawnHandles) plus callbacks into GameScene (`offerTreasureEvolutionIfEligible`, chest sprite tracking). Pass GameScene directly rather than a narrow hooks interface — matches BiomeController's pattern and keeps the diff honest.

### 4. `LevelUpFlow.ts`

Shipped with a wide hooks interface (20 callbacks). Moves `onLevelUp` (banner + aura + milestone power-surge), `rerollUpgradeCards`, `applyUpgrade` (switch dispatch), `applyPassiveEffect`, `applyStatBoost` (including the banish case that iterates the enemy group), and the chest-evolution handoff. `applyPassiveEffect` is public on LevelUpFlow because `applyPermanentUpgrades` (lucky-start) and `applyResumeHydration` both need it.

**Surface:** `handleLevelUp(level)`, `reroll()`, `apply(card)`, `offerChestEvolution()`, `applyPassiveEffect(key)`
**Risk paid:** Fat hooks object. Worth it — switch dispatch + pool building + UI handoff are coherent, and it's now a single file any future "what does level-up do?" question lands in.

### 5. `RunLifecycle.ts`

Shipped. Owns `handlePlayerDeathOrRevive` (one-shot revival), `handleVictory` (ceremony + post-bell offer), `handlePlayerDeath` (particle burst + classified death cause + endless-best save + fade), plus the post-bell ENTER key binding and `postBell`/`bellTimeSec`/`postBellOfferActive` state — those fields moved off GameScene entirely. GameScene retains `getSecondsPastBell()` / `isPostBell()` as thin delegates because SpawnSystem reaches through for them.

**Surface:** `onPlayerHitZero()`, `handleVictory()`, `isPostBell()`, `getSecondsPastBell()`, `reset()`, `uninstallPostBellKeyHandler()`
**Risk paid:** Even fatter hooks (~25 callbacks including mutable-state accessors for victoryFade/deathFade/ticker state). The state machine itself is tight though — the raw-delta ticker pattern is preserved and the one-shot revival semantics are unchanged.

## What stays in GameScene

- `init` / `create` / `update` wiring
- `ISceneContext` getter methods (already tiny)
- System construction order (Player, SpawnSystem, WeaponSystem, XPSystem, JuiceSystem, etc.)
- Per-frame orchestration (calling system `update`s, updating music state scratch, camera follow)
- Biome + terrain creation (already small — `BiomeController` does the heavy lifting)
- DI — fields like `updateTickers`, `runStatsTracker`, `captionManager` remain on GameScene; modules read them via constructor-injected scene reference

Target: **≤1,200 lines** (not 400; the earlier estimate didn't account for system construction, mid-run persistence hooks, biome wiring, or caption plumbing that have all been added since the spec was written).

**Actual outcome:** 3,088 → 2,127 lines (−961, −31%) across all five extractions. The ≤1,200 target isn't reached — the scene still owns system construction, ISceneContext getters, mid-run persistence hooks, biome/terrain wiring, permanent-upgrade application, and caption plumbing. Going lower requires structural changes beyond pure relocation.

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
