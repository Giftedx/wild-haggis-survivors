# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wild Haggis Survivors is a Vampire Survivors-style browser game built with **Phaser 4** and **TypeScript**, bundled with **Vite**. The player controls a wild haggis with a unique "drift" mechanic (clockwise rotation bias on movement due to uneven legs) while fighting waves of Scottish-themed enemies.

**Tone & UX north star**: `docs/DESIGN_SOUL.md` (Soul charter, weave matrix, tonal spectrum, Great Moment Recipe, Warmth Audit, Soul Check, shipping objectives).

**Companion docs**: `AGENTS.md` (cross-agent conventions), `docs/PRD.md`, `docs/VOICE_CARD.md` (voice registers, variant voices, Do/Don't examples), `docs/ART_STYLE_BIBLE.md` (palette anchors, tonal palette map, signature motifs), `docs/DESIGN_IDEAS.md` (active sketchpad). Multi-session work lives in `docs/superpowers/specs/` (design specs) and `docs/superpowers/plans/` (execution plans).

**Research foundation** (`docs/research/`): eight deep reference docs the Soul Charter, Voice Card, and Art Style Bible all draw from. Consult before writing specs/plans for new systems:
- `ROGUELITE_RESEARCH.md` — 25 games deconstructed; structural patterns; WHS gap analysis.
- `SCOTTISH_RESEARCH.md` — gazetteer-style Scottish content (folklore, geography, history, culture).
- `SCOTTISH_RESEARCH_DEEP.md` — comprehensive Scottish reference (25 parts, ~28k words).
- `GAME_FEEL_RESEARCH.md` — feel canon (Nijman/Sakurai/Thorson/Korb); moment anatomy; technical toolkit.
- `MUSIC_ART_TECH_RESEARCH.md` — Phaser 3 + Web Audio + WebGL technical layer; procedural music; shaders.
- `ACCESSIBILITY_RESEARCH.md` — accessibility engineering playbook; photosensitivity, colorblind, motor, cognitive; WHS audit.
- `CULTURAL_SENSITIVITIES_RESEARCH.md` — ethics reference for Scottish content; Gaelic/Scots, Highland Clearances, Culloden, trademark, political framing.
- `NARRATIVE_RESEARCH.md` — roguelite storytelling patterns (Hades, Hollow Knight, Dark Souls, Inscryption); loop-native narrative craft.

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
- **ActIntermissionScene** (`src/scenes/ActIntermissionScene.ts`): W2 Moor Road paired modal. `GameScene.launchActIntermission(actN)` fires on gordon/tour_bus kill — acquires a `TimeManager.ACT_INTERMISSION` token (pause + timeScale 0), renders 3 route cards from `ROUTES_BY_SLOT[slot]`, resolves via `onResolve(pick, route)` callback that advances `RunActState`, writes `RunModifiers.routePicks`, applies `modifierDeltas`, then runs `route.onResume(ctx)`. Skip Intermissions setting bypasses the scene and applies `DEFAULT_ROUTE_ON_SKIP` inline.
- **ShopScene**: Between-run shop for spending Golden Haggis on permanent upgrades.

### System Architecture (all instantiated by GameScene)
- **SpawnSystem**: Enemy wave spawning based on game time; manages enemy group and boss spawns.
- **WeaponSystem**: Manages all 8 weapon types with distinct behaviors (projectile, piercing, bouncing, aoe_pulse, trail, arc_sweep, aura_pulse). Uses a shared projectile pool (max 200). Handles weapon evolution (lv5 weapon + matching passive = legendary form for 7 of the 8 weapons; bagpipes is utility-only with no evolution).
- **XPSystem**: XP gem spawning, collection (overlap with player pickup radius), and level-up triggering.
- **GrowthSystem**: Player visual/hitbox scaling as they level up.
- **JuiceSystem**: Screen shake, kill bursts, damage numbers, particle trails, hit freeze, boss death spectacle, combo counter, toast notifications.
- **AudioSystem**: Global singleton (`audio`) for SFX. Uses shared `AudioContext` from `src/systems/audioContext.ts`.
- **ProceduralMusicEngine** (`src/systems/music/`): Game-state-reactive procedural music. Singleton `musicEngine`. Layers: Highland pad drone, FM felt piano (4-voice polyphony), heartbeat pulse, Euclidean rhythm. A `Conductor` reads game state each frame and computes mood axes (intensity, danger, chaos, triumph) that drive all layers. Lookahead scheduler replaces setTimeout/setInterval.
- **HazardsSystem** (`src/systems/HazardsSystem.ts`): Biome-conditioned environmental hazards (peat_pit / falling_slate / burn_water / loose_scree / tidal_wrack / slick_cobble / rime_patch — one per biome; B5 phases 1b–2 added the last three for coastal/haar/frost). Spawns in a 200–400px ring around the player every ~9s when biome matches. Three-gate damage check (`isHazardDamageEligible(arrivalMs, hitCooldownMs, isImmune)`): 300ms telegraph window + 1s per-hazard cooldown + hazard-immunity check via `isPlayerHazardImmune` (post-hit iframes + dash + Burn-Leap + Assist Mode invincibility — same shared predicate `HazardZones.ts:tickLavaZones` uses, no drift). Spawn position uses seeded `runRng` for replay determinism. Per-hazard procedural Web Audio chirp via `audio.playHazardSpawn(key)`. Opt-out via `disableHazards` setting. Distinct from `src/scenes/game/HazardZones.ts` (static lava/heal patches placed at run start).
- **AmbientWeatherSystem** (`src/systems/AmbientWeatherSystem.ts`): Cosmetic weather layer keyed off the active seasonal event (`samhain` → drizzle/smirr, `beltane` → sun_shaft, `hogmanay`/`burns_night` → rain, `st_andrews` → aurora/Mirrie Dancers, plus `imbolc`/`lammas`/`bracken_turn` cohort additions). Eight events total in `SEASONAL_EVENTS` (`src/systems/SeasonalEventManager.ts`): beltane, samhain, st_andrews, hogmanay, burns_night, imbolc, lammas, bracken_turn — all date-windowed via local-MM-DD, year-wrap supported. Idle outside event windows or with `disableSeasonalEvents` / `reduceParticles` enabled. Pure visual — no gameplay state effect, no replay determinism dependency. Particle cap 30 simultaneous.

### Data-Driven Design
Game balance is defined in data files, not scattered through logic:
- `src/config.ts` — Global constants (world size, player base stats, XP curve, enemy caps, colors)
- `src/data/weapons.ts` — Weapon definitions with `WeaponDef` interface (behavior, scaling per level)
- `src/data/enemies.ts` — Enemy types with `EnemyConfig` (behavior, spawn timing) and `BossConfig` (boss `warningKey` is an i18n path, resolved with `t()` in `SpawnSystem`)
- `src/data/upgrades.ts` — Level-up card pool with rarity-weighted draws and evolution recipes (`EVOLUTION_RECIPES`)
- `src/data/permanentUpgrades.ts` — Between-run upgrades bought with Golden Haggis currency
- `src/data/variants.ts` — 15-strong haggis roster (classic + 14 variants); each declares stat profile, palette, voice register, unlock condition. Lives behind `selectedVariant` save key. Includes Cailleach, Glaswegian, Doric Quinie, Peerie Shetlander, Burns's Wee Beastie, Witch's Hare (15th, shipped 2026-04-28).
- `src/data/curses.ts` — opt-in run modifiers + bonus gold. `CurseDef` exported.
- `src/data/biomes.ts` — `BiomeId` union (bog/loch/pine/heather/coastal/haar/frost) + per-biome `BIOMES` defs (tint, weights, modifier, mood, ambientHaarDensity).
- `src/data/eliteAffixes.ts` — elite enemy modifier roster.
- `src/data/hazards.ts` — environmental footing hazards (7 keys, biome-routed). See HazardsSystem entry above for runtime.
- `src/data/relics.ts` — R1 third-tier item bag (18 handcrafted relics, 3-slot cap). Drops from elites/bosses/legendary chests.
- `src/data/runes.ts` — U1 30-rune rule-stack catalogue; condition + effect evaluators in `src/systems/runeConditions.ts` + `src/systems/runeEffects.ts`.
- `src/data/nodeBanks.ts` + `src/data/nodeTypes.ts` — M1 Moor Road node graph (7 node types × 56 def entries across 3 act banks).
- `src/data/routes.ts` — W2 Moor Road routes. `RouteDef` = `modifierDeltas` (applied at pick-resolve time) + optional `onResume(ctx: RouteResumeContext)` for side-effect callbacks (heal bursts, forced chests, timed spawn releases). `ROUTES_BY_SLOT` splits into picker A (act 1) and B (act 2). `DEFAULT_ROUTE_ON_SKIP` is the Skip-Intermissions fallback per slot.
- `src/core/i18n.ts` + `src/core/i18n.scs.ts` — Bilingual copy (English reference, Scots overlay). `t(key)` resolves dot-paths against the active locale and falls back to EN. SCS is code-split via `ensureLocaleReady('scs')` and lazy-loaded — English-only players never download it. **Two parity fences in `src/core/i18n.locale.test.ts`**: (1) SCS→EN one-way subset (no orphan overlays), (2) EN→SCS scoped to `ui.banter.*` (W18 Phase B completion — adding a banter leaf without a Scots translation fails CI). Banter authoring recipes live in `docs/BANTER_AUTHORING.md`.

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
- **Moor Road acts (W2)**: Boss kills on `gordon` and `tour_bus` complete acts 1 and 2 respectively (see `dispatchActComplete.ts` pure mapping). `taxman` triggers the existing victory path and is NOT routed through `onActComplete`. `RunActState` tracks act counter + `pickerHistory`; the array is snapshot into `RunHistoryEntry.routes` by `RunHistoryRecorder`.

### Path Alias
`@/*` maps to `./src/*` (configured in both `tsconfig.json` and `vite.config.ts`).

### Rendering
Pixel art mode enabled (`pixelArt: true`, `roundPixels: true`, no antialiasing). Uses Phaser's Arcade Physics with zero gravity (top-down).

## Phaser 4 Gotchas

- **Scene reuse**: `scene.start('Game')` reuses the same instance — `create()` must reset ALL transient state (field initializers only run at construction). See the reset block at top of `GameScene.create()`.
- **`scene.time` vs `physics.pause()`**: `scene.time` timers keep running when physics is paused. Use guards like `if (this.scene.physics.world.isPaused) return` in timer callbacks, or defer work via flags (see `pendingChest` pattern).
- **`delta` is raw wall-clock time**: Not scaled by timeScale. Cap it (`Math.min(delta, 100)`) to prevent time warps from tab-backgrounding.
- **`body.velocity +=` bypasses mass**: Phaser's mass only affects collision resolution. For knockback, divide force by `body.mass` manually.
- **`clearTint()` removes ALL tints**: Including persistent ones (boss red, hazard orange). Use a `baseTint` field and restore it after damage flashes.
- **Circle body radius and sprite scale**: Phaser auto-scales circular hitboxes via `updateBounds()`. Pass unscaled radius to `setCircle()` — see comment in `Player.onLevelUp`.
- **`scene.time.delayedCall` respects `timeScale`**: At `timeScale = 0` (hit freeze), delayed calls never fire. Use real `setTimeout` for wall-clock-timed operations that must execute regardless of timeScale. `TimeManager.scheduleRealTime(ms, cb)` wraps this with reset-cancellation — route `onResume` callbacks use it for timed-release effects (e.g. kirkyard's 90s spawn-density window).
- **Phaser ScenePlugin vs SceneManager**: `this.scene` inside a Scene is the `ScenePlugin` (has `launch`, `pause`, `stop` operating on the owning scene). `game.scene` is the `SceneManager` (has `start`, `run` operating on any scene by key). Tests or external code wanting `launch(key, data)` must go through `game.scene.getScene('Game').scene.launch(...)` — see `e2e/w2-moor-road.spec.ts`.
- **Phaser imports break in node-env vitest**: `Phaser` module touches `window` at eval time. Scene files that import Phaser cannot be imported into vitest tests under the default node env. Extract testable logic into pure helper modules alongside the scene (e.g. `actIntermissionResolve.ts` exports `resolveDefaultRoute` + `buildRoutePick`; the scene class delegates to them). Tests import the helpers directly.
- **Bag-vs-cached-field divergence**: Systems that cache a `RunModifiers` multiplier into a private field at run-start (e.g. `SpawnSystem.spawnIntervalMult`, `WeaponSystem.curseCooldownMul`) will NOT see mid-run writes to the bag — the cache was the single read. W2 routes that mutate the bag through `applyRouteModifierDeltas` must resync the cache via the system's setter (`setSpawnIntervalMult`, `setCurseCooldownMul`) in the same resolver pass. `RouteDef.modifierDeltas` is typed as `Partial<Pick<RunModifiers, RouteModifierDeltaKey>>` to lock the safe-to-mutate field set at compile time; adding a new field there requires adding the matching setter call in `GameScene.launchActIntermission.onResolve`.
- **Arcade fixed-step (T1 replay contract)**: `src/main.ts` configures `physics.arcade` with `fps: 60, fixedStep: true`. Physics integration decouples from RAF jitter — critical for `ReplayRecorder` / `ReplayInput` byte-accurate playback (ADR-0002 Phase 3). Don't revert to variable-delta without updating the determinism regression in `src/replay/replayDeterminism.test.ts` and the Phase 3 addendum. Scene `update(time, delta)` still receives raw RAF delta for time-scale + hit-freeze paths; only integration is fixed-step.

## Common Patterns

- **Timer overshoot carry-over**: Use `remaining += cooldownMs` (not `= cooldownMs`) for accurate timing, but cap with `Math.max(remaining, -cooldownMs)` to prevent burst-firing after lag spikes.
- **Audio throttling**: AoE weapons hit many targets per frame. Throttle sound effects via `AudioContext.currentTime` comparison (see `lastHitTime` in AudioSystem).
- **Dedicated state flags**: Don't reuse `iFrames` for unrelated invincibility (e.g., victory). Use separate flags with clear ownership (`victoryPending`).
- **Percentage bonuses should use base config values** (`PLAYER.SPEED`, `PLAYER.MAX_HP`), not current computed stats — prevents order-dependent bonus amounts.
- **Shared AudioContext**: SFX (`AudioSystem`) and music (`ProceduralMusicEngine`) share one `AudioContext` via `src/systems/audioContext.ts`. Never call `ctx.suspend()` on it — that silences both systems. A `DynamicsCompressorNode` on the output prevents clipping.
- **Overlay input blocking**: All full-screen overlays (level-up, pause, death, victory) must have `.setInteractive()` to prevent the mobile virtual joystick from activating through them.
- **Stale callback guards**: `setTimeout`/`delayedCall` callbacks from a prior run can fire after scene restart (same instance reused). Guard with reference identity checks (capture object ref at creation, compare to current before acting).
- **New-system safety pattern checklist**: When authoring a new system that touches existing gameplay surfaces, match these sibling patterns or break the contract: (a) damage paths must respect player hazard immunity — use `isPlayerHazardImmune(postHitIframed, dashInvincible, hazardLeaping, assistInvincible)` from `src/systems/isPlayerHazardImmune.ts` rather than inlining the OR chain. Both HazardZones and HazardsSystem now share this predicate; pre-2026-04-28 they drifted (HazardsSystem missed post-hit iframes + Assist Mode); (b) any spawn position that affects game state must use seeded `runRng` not `Math.random()` for T1 replay determinism (ADR-0002 Phase 3, see `feedback_test_runner_vs_tsc.md`); (c) every `scene.add.image`/`sprite` should be `textures.exists()`-guarded so unit-test stubs that skip BootScene baking don't render the magenta missing-texture placeholder; (d) per-frame `update(delta)` calls must sit AFTER `GameScene.ts:1713` `isGameplayPaused()` early-return so pause-aware systems aren't ticked during level-up / intermission.

## Soul checks & Feel Pass (before shipping player-facing work)

Technical correctness is necessary but not sufficient. Every player-facing change should also pass a lightweight design review:

- **Run the Soul Check** from `docs/DESIGN_SOUL.md` — six quick questions on warmth, clarity, tone, voice, moment-stack, kindness.
- **Cite relevant research** in the PR/spec. If the change touches feel (VFX, SFX, hit-stop, camera), cite `GAME_FEEL_RESEARCH.md` sections. If it's content (new enemy, weapon, biome, event), cite the relevant Scottish doc. If it's audio or shader-level, cite `MUSIC_ART_TECH_RESEARCH.md`.
- **Voice check** — if the change ships copy, run it past `docs/VOICE_CARD.md`. Does it sit in Hearth or Edge? Does it avoid the anti-patterns?
- **Palette check** — if the change ships visuals, confirm it sits in one of the five tonal palettes from `docs/ART_STYLE_BIBLE.md` (Hearth/Wild/Fey/Grave/Wild Comedy).
- **Moment check** — if the change is a "moment" (evolution pickup, boss kill, act complete, first-time event), verify it covers the 7-ingredient Great Moment Recipe.

None of this replaces shipping discipline (`npm test`, `npm run build`). It augments it. The masterpiece bar requires both.
