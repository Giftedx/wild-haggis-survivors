# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wild Haggis Survivors is a Vampire Survivors-style browser game built with **Phaser 3** (v3.90+) and **TypeScript**, bundled with **Vite**. The player controls a wild haggis with a unique "drift" mechanic (clockwise rotation bias on movement due to uneven legs) while fighting waves of Scottish-themed enemies.

**Tone & UX north star**: `docs/DESIGN_SOUL.md` (Soul charter, weave matrix, shipping objectives).

**Companion docs**: `AGENTS.md` (cross-agent conventions), `docs/PRD.md`, `docs/VOICE_CARD.md`. Multi-session work lives in `docs/superpowers/specs/` (design specs) and `docs/superpowers/plans/` (execution plans).

## Commands

- `npm run dev` — Start Vite dev server on port 3000 (auto-opens browser)
- `npm test` — Run unit tests (Vitest)
- `npm run lint` — ESLint on `src/`, `e2e/`, and config entrypoints
- `npm run build` — Type-check with `tsc --noEmit` then build with Vite to `dist/`
- `npm run preview` — Serve the production build locally (Playwright E2E uses `vite preview` on port 4180 via `playwright.config.ts`)
- `npm run test:e2e` — Playwright smoke against the production build (run `npm run build` first, or rely on an existing `dist/`)
- `npm run ci` — Lint + Vitest + build (no E2E)
- `npm run ci:all` — Full gate: `ci` then E2E (matches `.github/workflows/ci.yml` after `playwright install`)

Vitest is configured (see `src/utils/save.test.ts`).

### Windows: Git “everything modified” (file mode only)
If `git status` lists a huge set of files with **no line changes**—often `old mode 100755` / `new mode 100644` in `git diff`—that is **executable-bit noise** on Windows. In this repo run once:

`git config core.filemode false`

(Local config only; stops Git from treating mode flips as edits.)

## Architecture

### Scene Flow
`BootScene` → `MenuScene` → `GameScene` → `ShopScene` (between runs)

- **BootScene** (`src/scenes/BootScene.ts`): Generates ALL sprite textures programmatically using Phaser Graphics — there are no external image assets. Every entity, projectile, and effect is drawn in code here.
- **MenuScene**: Title screen and run start.
- **GameScene**: Core gameplay loop — orchestrates all systems, handles collisions, level-ups, pause, and game-over.
- **ShopScene**: Between-run shop for spending Golden Haggis on permanent upgrades.

### System Architecture (all instantiated by GameScene)
- **SpawnSystem**: Enemy wave spawning based on game time; manages enemy group and boss spawns.
- **WeaponSystem**: Manages all 8 weapon types with distinct behaviors (projectile, piercing, bouncing, aoe_pulse, trail, arc_sweep, aura_pulse). Uses a shared projectile pool (max 200). Handles weapon evolution (lv5 weapon + matching passive = legendary form for 7 of the 8 weapons; bagpipes is utility-only with no evolution).
- **XPSystem**: XP gem spawning, collection (overlap with player pickup radius), and level-up triggering.
- **GrowthSystem**: Player visual/hitbox scaling as they level up.
- **JuiceSystem**: Screen shake, kill bursts, damage numbers, particle trails, hit freeze, boss death spectacle, combo counter, toast notifications.
- **AudioSystem**: Global singleton (`audio`) for SFX. Uses shared `AudioContext` from `src/systems/audioContext.ts`.
- **ProceduralMusicEngine** (`src/systems/music/`): Game-state-reactive procedural music. Singleton `musicEngine`. Layers: Highland pad drone, FM felt piano (4-voice polyphony), heartbeat pulse, Euclidean rhythm. A `Conductor` reads game state each frame and computes mood axes (intensity, danger, chaos, triumph) that drive all layers. Lookahead scheduler replaces setTimeout/setInterval.

### Data-Driven Design
Game balance is defined in data files, not scattered through logic:
- `src/config.ts` — Global constants (world size, player base stats, XP curve, enemy caps, colors)
- `src/data/weapons.ts` — Weapon definitions with `WeaponDef` interface (behavior, scaling per level)
- `src/data/enemies.ts` — Enemy types with `EnemyConfig` (behavior, spawn timing) and `BossConfig` (boss `warningKey` is an i18n path, resolved with `t()` in `SpawnSystem`)
- `src/data/upgrades.ts` — Level-up card pool with rarity-weighted draws and evolution recipes (`EVOLUTION_RECIPES`)
- `src/data/permanentUpgrades.ts` — Between-run upgrades bought with Golden Haggis currency

### Player Stats Model
Player stats use a layered calculation: **base value × level scaling + upgrade bonuses**. Bonuses accumulate and are never wiped. The `recalcStats()` method in `Player.ts` is the single source of truth for final stat computation.

### Key Mechanics
- **The Drift**: A constant clockwise rotational offset on input (configurable in `PLAYER.DRIFT_DEGREES`). Reduced by leveling and upgrades. Core identity of the game.
- **Weapon Evolution**: 7 of the 8 weapons have a paired passive item. Max-level weapon + passive = legendary evolution card appearing in the level-up pool. Bagpipes is utility-only with no evolution.
- **Soft World Boundaries**: No hard walls — player slows near edges with a gentle push-back force.
- **Persistence**: `localStorage` via `src/utils/save.ts` (key: `whs_save`). Stores gold, permanent upgrades, settings, and run stats.
- **Elite Enemies**: 10% spawn chance after 2 minutes. Golden glow, 2× HP, 1.3× speed, 3× XP. Marked via `Enemy.markAsElite()`. Never applied to bosses or hazards.
- **Card Reroll**: 1 free reroll per level-up. Managed by `UpgradeCardsUI.grantReroll()` / `rerollsLeft` counter.
- **Minimap** (`src/ui/Minimap.ts`): Corner radar showing enemy dots, elite (gold), boss (diamond), player (green), camera viewport.
- **Hit Freeze**: 20ms `timeScale = 0` on kills via `JuiceSystem.hitFreeze()`. Uses real `setTimeout` (not delayedCall). Skipped during slow-motion.

### Path Alias
`@/*` maps to `./src/*` (configured in both `tsconfig.json` and `vite.config.ts`).

### Rendering
Pixel art mode enabled (`pixelArt: true`, `roundPixels: true`, no antialiasing). Uses Phaser's Arcade Physics with zero gravity (top-down).

## Phaser 3 Gotchas

- **Scene reuse**: `scene.start('Game')` reuses the same instance — `create()` must reset ALL transient state (field initializers only run at construction). See the reset block at top of `GameScene.create()`.
- **`scene.time` vs `physics.pause()`**: `scene.time` timers keep running when physics is paused. Use guards like `if (this.scene.physics.world.isPaused) return` in timer callbacks, or defer work via flags (see `pendingChest` pattern).
- **`delta` is raw wall-clock time**: Not scaled by timeScale. Cap it (`Math.min(delta, 100)`) to prevent time warps from tab-backgrounding.
- **`body.velocity +=` bypasses mass**: Phaser's mass only affects collision resolution. For knockback, divide force by `body.mass` manually.
- **`clearTint()` removes ALL tints**: Including persistent ones (boss red, hazard orange). Use a `baseTint` field and restore it after damage flashes.
- **Circle body radius and sprite scale**: Phaser auto-scales circular hitboxes via `updateBounds()`. Pass unscaled radius to `setCircle()` — see comment in `Player.onLevelUp`.
- **`scene.time.delayedCall` respects `timeScale`**: At `timeScale = 0` (hit freeze), delayed calls never fire. Use real `setTimeout` for wall-clock-timed operations that must execute regardless of timeScale.

## Common Patterns

- **Timer overshoot carry-over**: Use `remaining += cooldownMs` (not `= cooldownMs`) for accurate timing, but cap with `Math.max(remaining, -cooldownMs)` to prevent burst-firing after lag spikes.
- **Audio throttling**: AoE weapons hit many targets per frame. Throttle sound effects via `AudioContext.currentTime` comparison (see `lastHitTime` in AudioSystem).
- **Dedicated state flags**: Don't reuse `iFrames` for unrelated invincibility (e.g., victory). Use separate flags with clear ownership (`victoryPending`).
- **Percentage bonuses should use base config values** (`PLAYER.SPEED`, `PLAYER.MAX_HP`), not current computed stats — prevents order-dependent bonus amounts.
- **Shared AudioContext**: SFX (`AudioSystem`) and music (`ProceduralMusicEngine`) share one `AudioContext` via `src/systems/audioContext.ts`. Never call `ctx.suspend()` on it — that silences both systems. A `DynamicsCompressorNode` on the output prevents clipping.
- **Overlay input blocking**: All full-screen overlays (level-up, pause, death, victory) must have `.setInteractive()` to prevent the mobile virtual joystick from activating through them.
- **Stale callback guards**: `setTimeout`/`delayedCall` callbacks from a prior run can fire after scene restart (same instance reused). Guard with reference identity checks (capture object ref at creation, compare to current before acting).
