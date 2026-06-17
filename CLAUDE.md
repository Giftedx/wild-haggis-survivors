# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## How agents touch this codebase

[`CONTRIBUTING.md`](CONTRIBUTING.md) is the working agreement. One headline question — *"Can a real human play this change without a contributor walking them through it?"* — plus the CI gates that make it self-enforcing (TypeScript, vitest, ESLint, i18n parity, replay determinism, save migration, bundle + flash budgets, e2e). Cross-cutting chains (save / i18n / damage / RNG / new-mechanic / accessibility) walk in lockstep when their surface is touched.

Read it before non-trivial work. Trade-offs declared via the template, not buried.

## Project Overview

Wild Haggis Survivors is a Vampire Survivors-style browser game built with **Phaser 4** and **TypeScript**, bundled with **Vite**. The player controls a wild haggis with a unique "drift" mechanic (clockwise rotation bias on movement due to uneven legs) while fighting waves of Scottish-themed enemies.

**Player-facing tone & visuals**: `docs/DESIGN_SOUL.md` (soul charter principles + a11y matrix), `docs/VOICE_CARD.md` (Hearth + Edge registers, Do/Don't, vocabulary), `docs/ART_STYLE_BIBLE.md` (palette hex, signature motifs, silhouette test).

**Companion docs**: `AGENTS.md` (cross-agent conventions), `docs/PRD.md`, `docs/DESIGN_IDEAS.md` (active sketchpad), `docs/BANTER_AUTHORING.md` (banter recipes). Multi-session work lives in `docs/superpowers/specs/` (design specs) and `docs/superpowers/plans/` (execution plans).

**Research reference** (`docs/research/`): eight deep docs (~150k words) you can consult when a design genuinely benefits from one. Not a citation mandate.
- `ROGUELITE_RESEARCH.md` — 25 games deconstructed; structural patterns; WHS gap analysis.
- `SCOTTISH_RESEARCH.md` — gazetteer-style Scottish content (folklore, geography, history, culture).
- `SCOTTISH_RESEARCH_DEEP.md` — comprehensive Scottish reference (25 parts, ~28k words).
- `GAME_FEEL_RESEARCH.md` — feel canon; moment anatomy; technical toolkit.
- `MUSIC_ART_TECH_RESEARCH.md` — Phaser + Web Audio + WebGL; procedural music; shaders.
- `ACCESSIBILITY_RESEARCH.md` — a11y engineering playbook.
- `CULTURAL_SENSITIVITIES_RESEARCH.md` — ethics reference for Scottish content.
- `NARRATIVE_RESEARCH.md` — roguelite storytelling patterns; loop-native narrative craft.

## Commands

- `npm run dev` — Start Vite dev server on port 3000 (auto-opens browser)
- `npm test` — Run unit tests (Vitest)
- `npm run lint` — ESLint on `src/`, `e2e/`, and config entrypoints
- `npm run build` — Type-check with `tsc --noEmit` then build with Vite to `dist/`
- `npm run preview` — Serve the production build locally (Playwright E2E uses `vite preview` on port 4180 via `playwright.config.ts`)
- `npm run test:e2e` — Playwright smoke against the production build (run `npm run build` first, or rely on an existing `dist/`)
- `npm run ci` — Lint + Vitest + build + bundle budget + flash budget + LOC report (no E2E)
- `npm run ci:all` — Full gate: `ci` then E2E (matches `.github/workflows/ci.yml` after `playwright install`)

**E2E harness** — `e2e/fixtures.ts` (Playwright `test.extend`) runs a context-level `addInitScript` before every navigation: `FORCE_CANVAS` for headless WebGL stability, splash flags in `whs_game_settings`, and **`AUTO_BATTLE = false`**. Per-spec `page.addInitScript` hooks run **after** that; specs that need auto-picks / soak throughput (e.g. marathon, grudge ledger, `ui-audit` `seedFullProgress`) set `AUTO_BATTLE = true` locally. See `CONTRIBUTING.md` (Playwright row).

Vitest is configured (see `src/utils/save.test.ts` and the suites under `src/utils/save/`).

### Windows: Git “everything modified” (file mode only)
If `git status` lists a huge set of files with **no line changes**—often `old mode 100755` / `new mode 100644` in `git diff`—that is **executable-bit noise** on Windows. In this repo run once:

`git config core.filemode false`

(Local config only; stops Git from treating mode flips as edits.)

## Architecture

### Scene Flow
`BootScene` → (first-launch splashes) → `MainMenuScene` → `MenuScene` (variant loadout) → `CroftScene` (hub) → `CurseScene` / `SporranScene` → `GameScene` → `GameOverScene` → `ShopScene` / `MetaShopScene`

- **BootScene** (`src/scenes/BootScene.ts`): Generates ALL sprite textures programmatically using Phaser Graphics — there are no external image assets. Every entity, projectile, and effect is drawn in code here.
- **MainMenuScene**: Post-boot hub — meta stats, daily/shared run, resume, routes to loadout and reflection screens.
- **MenuScene**: Variant carousel / loadout selection; Play routes to Croft (not straight into a run).
- **CroftScene**: Between-runs hub (Gran's Croft); first run can skip curse and start Game directly.
- **GameScene**: Core gameplay loop — orchestrates all systems, handles collisions, level-ups, pause, and game-over.
- **ActIntermissionScene** (`src/scenes/ActIntermissionScene.ts`): W2 Moor Road paired modal. `GameScene.launchActIntermission(actN)` fires on gordon/tour_bus kill — acquires a `TimeManager.ACT_INTERMISSION` token (pause + timeScale 0), renders 3 route cards from `ROUTES_BY_SLOT[slot]`, resolves via `onResolve(pick, route)` callback that advances `RunActState`, writes `RunModifiers.routePicks`, applies `modifierDeltas`, then runs `route.onResume(ctx)`. Skip Intermissions setting bypasses the scene and applies `DEFAULT_ROUTE_ON_SKIP` inline.
- **ShopScene**: Between-run shop for spending Golden Haggis on permanent upgrades.

### System Architecture (all instantiated by GameScene)
- **SpawnSystem**: Enemy wave spawning based on game time; manages enemy group and boss spawns.
- **WeaponSystem**: Manages `WEAPON_DEFS` (`src/data/weapons.ts`), currently 36 `WeaponKey` entries guarded by `src/data/weapons.test.ts`: 29 non-evolved base/pick-only defs plus 7 evolved defs. 8 `WeaponBehavior` variants: projectile, piercing, bouncing, aoe_pulse, trail, arc_sweep, aura_pulse, lob_puddle. Shared projectile pool size comes from `BALANCE.weapons.projectilePoolMax` (`src/core/BalanceConfig.ts`; 350 at the time of writing). Weapon evolution (lv5 weapon + matching passive = legendary form): 20 paired-passive recipes via `EVOLUTION_RECIPES`; 9 non-evolved defs are pick-only / non-recipe utility weapons (bagpipes remains utility-only). `BURNS_EVOLUTION_THRESHOLD` is hand-pinned at 10, intentionally decoupled from `EVOLUTION_RECIPES.length`, and re-exported from `src/utils/save/schema.ts` for back-compat.
- **XPSystem**: XP gem spawning, collection (overlap with player pickup radius), and level-up triggering.
- **Player growth**: Visual/hitbox scaling on level-up via `Player.onLevelUp` and `playerGrowthScale` (no standalone GrowthSystem class).
- **JuiceSystem**: Screen shake, kill bursts, damage numbers, particle trails, hit freeze, boss death spectacle, combo counter, toast notifications.
- **AudioSystem**: Global singleton (`audio`) for SFX. Uses shared `AudioContext` from `src/systems/audioContext.ts`.
- **ProceduralMusicEngine** (`src/systems/music/`): Game-state-reactive procedural music. Singleton `musicEngine`. Layers: Highland pad drone, FM felt piano (4-voice polyphony), heartbeat pulse, Euclidean rhythm. A `Conductor` reads game state each frame and computes mood axes (intensity, danger, chaos, triumph) that drive all layers. Lookahead scheduler replaces setTimeout/setInterval.
- **HazardsSystem** (`src/systems/HazardsSystem.ts`): Biome-conditioned environmental hazards (25 `HazardKey` values — original 7: peat_pit / falling_slate / burn_water / loose_scree / tidal_wrack / slick_cobble / rime_patch; expanded through B12 with one hazard per biome). Spawns in a 200–400px ring around the player every ~9s when biome matches. Three-gate damage check (`isHazardDamageEligible(arrivalMs, hitCooldownMs, isImmune)`): 300ms telegraph window + 1s per-hazard cooldown + hazard-immunity check via `isPlayerHazardImmune` (post-hit iframes + dash + Burn-Leap + Assist Mode invincibility — same shared predicate `HazardZones.ts:tickLavaZones` uses, no drift). Spawn position uses seeded `runRng` for replay determinism. Per-hazard procedural Web Audio chirp via `audio.playHazardSpawn(key)`. Opt-out via `disableHazards` setting. Distinct from `src/scenes/game/HazardZones.ts` (static lava/heal patches placed at run start).
- **AmbientWeatherSystem** (`src/systems/AmbientWeatherSystem.ts`): Cosmetic weather layer keyed off the active seasonal event (`samhain` → drizzle/smirr, `beltane` → sun_shaft, `hogmanay` → stonehaven_fireballs, `burns_night` → rain, `st_andrews` → aurora/Mirrie Dancers, `imbolc` → lambing_motes, `lammas` → harvest_drift, `bracken_turn` → bracken_drift, `bannockburn` → bannockburn_dust, `glorious_twelfth` → grouse_feather_drift, `tartan_day` → tartan_thread_drift, `simmer_dim` → simmer_dim_gloam, `up_helly_aa` → up_helly_aa_embers, `culloden` → drizzle, `highland_games` → highland_games_sun). **Fifteen events total** in `SEASONAL_EVENTS` (`src/systems/SeasonalEventManager.ts`): beltane, samhain, st_andrews, hogmanay, burns_night, imbolc, lammas, bracken_turn, bannockburn, glorious_twelfth, tartan_day, simmer_dim, up_helly_aa, culloden, highland_games — all date-windowed via local-MM-DD, year-wrap supported. All 15 have ambient overlays. Idle outside event windows or with `disableSeasonalEvents` / `reduceParticles` enabled. Pure visual — no gameplay state effect, no replay determinism dependency. Particle cap 30 simultaneous. **Run-start blessings** live separately under `src/scenes/game/seasonalRunStart.ts` — each event applies one distinct mechanical slot: hogmanay (first-footing gold/heal/spawn-rate), beltane (gold), samhain (spawn-pressure), st_andrews (damage-taken), burns_night (cooldown), imbolc (speed), lammas (XP), bracken_turn (crit-CHANCE), bannockburn (lifesteal), glorious_twelfth (AoE), tartan_day (pickup-radius), simmer_dim (crit-DAMAGE), up_helly_aa (damage-mult — first slot to touch generic damage-mult), culloden (memorial toast only — no buff, no fanfare), highland_games (+20 max-HP + run-start heal — first slot to touch max HP, via `Player.addMaxHp`).

### Data-Driven Design
Game balance is defined in data files, not scattered through logic:
- `src/config.ts` — Global constants (world size, player base stats, XP curve, enemy caps, colors)
- `src/data/weapons.ts` — Weapon definitions with `WeaponDef` interface (behavior, scaling per level)
- `src/data/enemies.ts` — Enemy types with `EnemyConfig` (behavior, spawn timing) and `BossConfig` (boss `warningKey` is an i18n path, resolved with `t()` in `SpawnSystem`)
- `src/data/upgrades.ts` — Level-up card pool with rarity-weighted draws and evolution recipes (`EVOLUTION_RECIPES`)
- `src/data/permanentUpgrades.ts` — Between-run upgrades bought with Golden Haggis currency
- `src/data/variants.ts` — 28-strong haggis roster (classic + 27 variants); each declares stat profile, palette, voice register, unlock condition. Lives behind `selectedVariant` save key. Full roster: classic, moor_runner, iron_belly, glen_forager, surefoot, pipe_breath, wee_ghostie, laird, glaswegian, anticlockwise, cailleach, doric_quinie, peerie_shetlander, burns_wee_beastie, witch_hare, selkie, morningside, drouthy, pibroch, orcadian, hebridean, iron_brew, grans_best, the_pict, jacobite, tam_o_shanter, engineer, tufted.
- `src/data/curses.ts` — opt-in run modifiers + bonus gold. `CurseDef` exported.
- `src/data/biomes.ts` — `BiomeId` union (25 biomes total: bog/loch/pine/heather/coastal/haar/frost + 18 named biomes through B12) + per-biome `BIOMES` defs (tint, weights, modifier, mood, ambientHaarDensity).
- `src/data/eliteAffixes.ts` — elite enemy modifier roster.
- `src/data/hazards.ts` — environmental footing hazards (25 `HazardKey` values, biome-routed — one hazard per biome through B12). See HazardsSystem entry above for runtime.
- `src/data/relics.ts` — R1 third-tier item bag (19 handcrafted relics, 3-slot cap). Drops from elites/bosses/legendary chests. `stormcrown` is a restricted boss-key drop (Cailleach Gauntlet win only).
- `src/data/runes.ts` — U1 30-rune rule-stack catalogue; condition + effect evaluators in `src/systems/runeConditions.ts` + `src/systems/runeEffects.ts`.
- `src/data/nodeBanks.ts` + `src/data/nodeTypes.ts` — M1 Moor Road node graph (7 node types × 72 def entries across 5 sub-banks: a1, a2, a3s1, a3s2, a3s3).
- `src/data/routes.ts` — W2 Moor Road routes. `RouteDef` = `modifierDeltas` (applied at pick-resolve time) + optional `onResume(ctx: RouteResumeContext)` for side-effect callbacks (heal bursts, forced chests, timed spawn releases). `ROUTES_BY_SLOT` splits into picker A (act 1) and B (act 2). `DEFAULT_ROUTE_ON_SKIP` is the Skip-Intermissions fallback per slot.
- `src/core/i18n.ts` + `src/core/i18n.scs.ts` — Bilingual copy (English reference, Scots overlay). `t(key)` resolves dot-paths against the active locale and falls back to EN. SCS is code-split via `ensureLocaleReady('scs')` and lazy-loaded — English-only players never download it. **Two parity fences in `src/core/i18n.locale.test.ts`**: (1) SCS→EN one-way subset (no orphan overlays), (2) EN→SCS scoped to `ui.banter.*` (W18 Phase B completion — adding a banter leaf without a Scots translation fails CI). Banter authoring recipes live in `docs/BANTER_AUTHORING.md`.

### Player Stats Model
Player stats use a layered calculation: **base value × level scaling + upgrade bonuses**. Bonuses accumulate and are never wiped. The `recalcStats()` method in `Player.ts` is the single source of truth for final stat computation.

### Key Mechanics

Index. One-line-per-mechanic; deeper notes live as docstrings on the helper file or in the cited research doc.

**Core systems (engine-shipped):**

| Mechanic | File / key | Note |
|---|---|---|
| The Drift | `PLAYER.DRIFT_DEGREES` | Constant clockwise rotational input offset; reduced by leveling and upgrades. Core identity. |
| Weapon Evolution | `EVOLUTION_RECIPES` (`BalanceConfig.ts`) | 20 paired-passive recipes are guarded by `src/core/BalanceConfig.evolution.test.ts`; `BURNS_EVOLUTION_THRESHOLD` is hand-pinned at 10, not derived from recipe count. |
| Soft World Boundaries | gentle push-back near edges | No hard walls. |
| Persistence (3 stores) | `whs_save` v23 + `whs_meta_save` v12 + `whs_game_settings` v1 | See `src/utils/save/`, `core/SaveManager.ts`, `core/SettingsManager.ts`. Overlap by design — see ADR-0007. |
| Elite Enemies | `Enemy.markAsElite()` | 10% chance >2min; 2× HP, 1.3× speed, 3× XP. |
| Card Reroll | `UpgradeCardsUI.grantReroll()` | 1 free per level-up. |
| Minimap | `src/ui/Minimap.ts` | Enemy / elite / boss / player / viewport. |
| Hit Freeze | `JuiceSystem.hitFreeze()` | 20 ms `timeScale = 0` on kills via real `setTimeout`. |
| Moor Road acts (W2) | `dispatchActComplete.ts` | gordon → act 1, tour_bus → act 2, taxman → victory path. |

**Skill-expression layer (player input → state):**

| Mechanic | File | Input | Note |
|---|---|---|---|
| Drift Mastery | `entities/driftMastery.ts` | G | Counter-rotate accumulates Grip pips; consume → drift-cancel + speed burst. Refs SCOTTISH_RESEARCH_DEEP §11.5. |
| Whisky Breath | `entities/whiskyBreath.ts` | F | Kill-stack AOE + burn-puddle DoT; needs ≥8 stacks. Refs §13.6. |
| Stance Toggle | `entities/stanceToggle.ts` | Q | Cycle loose/braced/reeling — speed × drift muls; persistent posture. |
| Shinty Parry | `entities/shintyParry.ts` | E | 350 ms negate window vs enemy projectiles; whiff is free. Refs §15. |

**Landmarks (walk-through interactions):**

| Mechanic | File | Note |
|---|---|---|
| Reliquary | `scenes/game/Reliquary.ts` | First-tier landmark, original sister pattern. |
| Cairn Stacking | `scenes/game/CairnStackingScheduler.ts` | Pickup → 3 stones → heal + magnet boon. |
| Clootie Rag Wager | `entities/clootieRagWager.ts` + `scenes/game/clootieTree.ts` | 12% max-HP cost → run-long boon (wrath/patience/haste). Refs §22.4. |
| Cairn-of-Echoes (The Moor Remembers) | `scenes/game/CairnOfEchoesScheduler.ts` + `utils/save/fallenCairns.ts` | Death → persistent meta-save cairn (cap 50, FIFO). Walk-over → past-self whisper + 1% inherited buff. 1% rare → grandfather voice unfolds 25-leaf Almanac arc. Schema v9→v10. Spec 2026-05-22. |
| Cailleach Gauntlet (Moor Remembers V2) | `scenes/game/CailleachGauntletScheduler.ts` + `scenes/game/cailleachGauntlet.ts` | Touch 7 cairns by 14:00 → candle ring lights at 14:00, Cailleach boss (`cailleach_boss` with `wail` behaviour) spawns at 15:00. Win wreathes the 7 cairns (gold visual + doubled +2 % buff) + drops Stormcrown relic (restricted boss-key drop) + unlocks `cailleach_mantle` tartan. Lose extinguishes the candles (cairns abide). Schema v10→v11 adds per-cairn `wreathedAt` / `extinguishedAt` (wreath wins precedence over extinguish). Spec 2026-05-22 V2. |

**Run-shape systems:**

| Mechanic | File | Note |
|---|---|---|
| Sporran Deck | `systems/sporranDeck.ts` + `scenes/SporranScene.ts` + `scenes/game/sporranRunStart.ts` | Pre-run 7-card draft, keep 3. Spec `docs/archive/superpowers/specs/2026-05-09-sporran-deck-design.md`. |
| Race the Beithir | `entities/raceTheBeithir.ts` + `data/enemies.ts` (beithir) | Venom fang opens 8 s heal-or-kill race; expire = 30% max-HP. Refs SCOTTISH_RESEARCH §1.2. |
| Taxman Grudge Ledger | `entities/grudgeLedger.ts` | Silent per-run finish tracker; verdict drives Taxman victory line. |
| Lemmings Easter Egg | `entities/lemmingsTrigger.ts` + `scenes/game/lemmingsEasterEgg.ts` | 90 s coastal idle → DMA Design 1991 homage. Once-per-variant. Refs SCOTTISH_RESEARCH_DEEP §21. |

**Recent weapon ships (2026-05-09 sprint — shipped without integration coverage; e2e backfill in progress per `docs/REVIEW.md` C3):**

| Weapon | Evolution | Behaviour | Note |
|---|---|---|---|
| Sgian Dubh | Sgian Geal | tightest `arc_sweep` + Whetstone passive (+10% crit) → forced-crit on evolution. Refs §15. |
| Shinty Stick | Caman Storm | Bouncing fork (cream-leather ball) sister to Shinty Parry mechanic. Refs §15. |
| Stag Antler | Monarch's Charge | Per-weapon dash-strike fork; evolution = 360° crown sweep + freeze stun. |

**Cross-cutting design notes:**

- **Sister-system patterns.** Reliquary ↔ Clootie ↔ Cairn share spawn/tick/commit/destroy/getMinimapMarker shape; Drift ↔ Whisky ↔ Stance ↔ Parry share pure-helper + scene-orchestrator + Player wire shape. New mechanics match the sister.
- **RNG-stream order in `resetTransientRunState`:** reliquary → clootie → ... — append-only contract.
- **Bag-vs-cached-field divergence:** systems caching `RunModifiers` multipliers at run-start need explicit setter resync when W2 routes mutate the bag mid-run (see `SpawnSystem.spawnIntervalMult`, `WeaponSystem.curseCooldownMul`).
- **Banter pool priorities** (live arbitration): see `reference_banter_arbitration` memory + `data/banter.ts`. Critical wins: `first_time` 110 > `boss_warn` 100 > `taxman_grudge_phase2` 96 > `cailleach_gauntlet` 95 > `beithir_sting` 90 > `taxman_grudge` 85 > `low_hp` 80 > `death_reflection` 75 > `taxman_retinue_wave` 72 > `boss_down` 70.

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

## Before shipping player-facing work

The headline question in [`CONTRIBUTING.md`](CONTRIBUTING.md) is the filter: *can a real human play this change without a contributor walking them through it?* If yes, ship. If no, fix the legibility first.

New copy → match the register in [`docs/VOICE_CARD.md`](docs/VOICE_CARD.md). New sprite work → palette and silhouette guidance in [`docs/ART_STYLE_BIBLE.md`](docs/ART_STYLE_BIBLE.md). Both lead with concrete examples — use them at the site of work, not as ceremonial gates.
