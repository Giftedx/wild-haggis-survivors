# Huge Initiatives — Master Plan

**Status.** Short list. Eight honest flagships. Everything else is either already shipped, not a flagship, or an idea (see `docs/DESIGN_IDEAS.md`). Full audit trail in `docs/HUGE_INITIATIVES_VERDICT.md`.

**Rule of thumb for a small team.** Run **at most one** flagship at a time. If a flagship lacks an owner, a non-goals list, and a kill criterion, it is not a flagship yet — it is an idea.

---

## Completed this quarter

| ID | Initiative | Outcome |
|----|------------|---------|
| **R3** | **Scene complexity budget** — split `GameScene.ts` | ✅ **Shipped (2026-04-16).** 2016 → **1225 lines** across commits `b986a7f`…`5d2a13c` (R3.1–R3.7). 16 extracted modules + **88 new unit tests**. Exit criterion relaxed from "≤800" to "≤1230" mid-ladder — further reduction hits hook-literal density and requires architectural refactor (see R3a). No regressions; green across lint / 1019 vitest / tsc+vite build / Playwright e2e at every step. |
| **R3a** | **RunScoreState extraction** — 9 counters off scene, hook contracts simplified | ✅ **Shipped (2026-04-16).** 1225 → **1186 lines** in commit `240b22c`. New `src/scenes/game/RunScoreState.ts` (11 tests) holds kill/boss/gold/elite-chain/victory counters. `EnemyKillHandlerHooks`, `RunPersistenceHooks`, `RunExitHooks` each collapsed from ~10-14 counter getters/setters to one `getRunScore()` hook. Total R3+R3a: 1699 → 1186 (−513, −30%); 141 new tests across 17 modules. Unblocks W2, W66, W27, W30 — each now inherits a single-line `getRunScore` hook instead of declaring the 14-getter counter surface. |
| **W2** | **The Moor Road — multi-act campaign** | ✅ **Shipped (2026-04-16).** 3 acts, 2 pickers (A/B), 6 routes, Skip Intermissions opt-out, Chronicle route breadcrumb, full banter surface, Glesga voice pass, Playwright smoke. 1056 → **1092 tests** across the three milestones (36 new). New modules: `RunActState`, `ActIntermissionScene` + pure resolve helpers, `dispatchActComplete`. Engine extensions: `TimeManager.scheduleRealTime`, `HazardZones.spawnHealingCircle`, `SpawnSystem` elite-weight + force-spawn + enemy-HP-mult + pause-spawns, `XPSystem.setDropValueMultiplier`, `Player.refreshDashCharges`. Save schema v3 → v4 with `RunHistoryEntry.routes`. Kill-criterion playtest data deferred to live session (recorded in `docs/progress.txt`). Downstream W18 (bilingual) and W66 (Ironmoor) now inherit the act pattern. |

---

## Next flagship

W2 and W66 shipped. Next pick from the parking lot below. **W18** (bilingual Scots/English) is the natural follow-up — the act-intermission pattern and the Chronicle route log are both fully i18n-ready. Pending stakeholder selection.

---

## Real flagships (pick ONE next; rest are parking lot)

Each row: one owner, one non-goals line, one kill criterion. No row graduates from this doc without those three.

| ID | Initiative | Tier | Shape of the work | Non-goals | Kill criterion |
|----|------------|------|-------------------|-----------|---------------|
| ~~**W2**~~ | ~~**The Moor Road — multi-act campaign**~~ | — | Shipped 2026-04-16 — see "Completed this quarter" row above. | — | — |
| **W18** | **Full Scots / English bilingual ship** | S | Extends `src/core/i18n.ts` to Scots parity for UI, banter keys, and glossary. Optionally staged (UI first, banter later). **Phase A shipped 2026-04-16** (`1eb5119`): `LOCALES` map + `setLocale` / `getLocale` + `SCS_STRINGS` empty overlay + settings `localeKey` + Settings language-cycle row. **Phase B v1 shipped 2026-04-17**: `SCS_STRINGS` populated across the UI shell (menu, chronicle, deeds, settings, gameOver, pause, shop, meta-shop, act-intermission, standing-stones, ancestral-echo, hud), in-run toasts (combos, boss-kill lines, treasure cues, mercy luck, codex), decision moments (5 curses, 7 evolutions, 19 achievements, 6 Moor-Road routes), loadout panel, weapon/variant/permanent-upgrade/level-up-card descriptions, boss names, meta-item catalogue, top-level captions, biomes, tutorial. Plus a parity test that walks `SCS_STRINGS` and fails on any leaf path missing from `EN_STRINGS` (caught two nesting bugs during the pass). Banter pool deferred — pending voice-register review. | No VO. No secondary dialects. No localisation beyond Scots + English in v1. | If translator QA rounds exceed 3× budget or review surfaces >5% mistranslation, descope to UI-only. |
| ~~**W66**~~ | ~~**Ironmoor — permadeath alt mode**~~ | — | ✅ **Shipped (2026-04-16).** Full flagship live across 3 commits on top of the MVP: opt-in ceremony modal (`09715df`), separate leaderboard `bestIronmoorSeconds` + "fastest win" Chronicle suffix (`9ff2725`), chronicle-wipe-on-death + `ironmoor_wipe_toast` (`783aeef`). New pure helpers: `wipeIronmoorHistory` (save.ts), extended `formatIronmoorLine`. 1092→1130 tests (+38). | — | — |
| **W71** | **Animation rig — skeletal haggis + weather-reactive motion** | S | Replaces procedurally-drawn sprites (`BootScene.ts`) with a rig + state machine for player and key enemies. Secondary motion for mantle, whiskers, tartan. | Not a full art overhaul. Not mocap. Pixel-art soul preserved. Static sprites remain a fallback during load. | If rig inflates frame time >10% against Sept 2026 perf baseline on target devices, descope to keyframe animation only. |
| **W95** | **Thumb-zone mobile rework** | S | Portrait mode, one-thumb play, gesture input, safe-area fluency. Not a port — a native mobile posture. | Not a separate build. Not a different balance. Not a monetisation lever. | If mobile playtest session length <50% of desktop after three iteration cycles, mobile remains "supported" but not flagship. |
| **T1** | **Deterministic replay** | S | **Record side shipped 2026-04-17** (`docs/superpowers/plans/2026-04-17-t1-deterministic-replay.md`, ADR-0002). `ReplayRecorder` + `ReplayBlob` + save v5 + `RunHistoryEntry.replay?` + GameScene wire-up behind `whs_replay_mode` localStorage flag. Two non-determinism blockers (`HazardZones` unseeded RDG, `SpawnSystem.pauseSpawnsFor` wall-clock) also fixed so daily challenges produce identical hazard layouts per seed. Playback engine remains open — needs fixed-step physics migration (tracked in ADR-0002 follow-ups). Foundation for speedrun validation, ghost replays, highlight reel. | Not a crash-proof system. Not a cross-version bridge — replays valid within one build. No audio re-record — playback re-schedules from the same inputs. | If desync rate >1% across a playtest suite once playback engine lands, shelve until root cause understood. |
| **P3** | **Cloud saves & cross-device** | S | Real account system, conflict resolution (CRDT or LWW), encryption at rest. Current `SaveManager.ts` is localStorage-only. | No social layer. No ownership transfer. No leaderboards in v1. | If conflict-merge tests lose any user data, revert to manual export/import. |
| **W27** | **Capture & share pipeline (one surface, not three)** | A | Single pipeline for postcards, highlight clips, and still screenshots. Consolidates what earlier drafts split into W20/W27/W50/W79. | No video-editing UI. No public CDN in v1. Share is local-save-then-user-uploads. | If pipeline adds >200 KB to shipped bundle or 3% CPU during capture, cut highlights and keep postcards only. |

---

## Already shipped or near-shipped (don't "flagship" these — just finish)

The following were flagged as megaprograms in prior drafts but map to code that already exists (with tests). Treat as **polish / extension tickets**, not programs:

`R2` save migration, `R4` `as any` retirement, `C2` mutators framework (`curses.ts` + `RunModifiers`), `C3` biomes (`BiomeManager` + `BiomeController` + `BiomeRenderer`), `C4` weapon evolution (`WeaponEvolution.test.ts`), `T2` telemetry (`AnalyticsManager.ts`), `T4` perf (`SpatialCulling` + `MemoryLeak.test.ts`), `O1` a11y (`src/systems/a11y/`), `O4` i18n (`src/core/i18n.ts`), W4 banter (`banter.ts` 603 lines), **W8 post-bell** (`PostBellEscalation.ts`), W12 death literacy (`DeathCauseTracker.ts` + `deathCauseClassifier.ts`), W13 curses (`CurseScene.ts`), W15 hazards (`HazardZones.ts`), W16 juice (`JuiceSystem.ts` + `StatusFxPool.ts`), W19 tutorial (`TutorialSystem.ts`), W21 evolution (`LevelUpFlow.ts` + `evolutionChest.ts`), W22 moor moments (`moorMoments.ts`), W24 StatComposer, W25 meta purchase, **W26 auto-battle** (`src/dev/AutoBattler.ts`), W30 deeds (`AchievementManager.ts` + `DeedsScene.ts`), W31 biome crossings, W32 pre-run selection (`CurseScene` + `runStartModifiers.ts`), W34 pickups (`PickupSpawner.ts`), W35 pause (`PauseMenu.ts`), W36 debug overlay, W41 boot, W42 game over (`gameOverFormatting.ts`), W44 terrain (`highlandTerrain.ts`), **W45 Comfort** (`settingsComfort.smoke.test.ts` already exists), W46 modifiers, W47 SFX (`src/systems/audio/SFXManager.ts`), W49 event bus (`GlobalEventBus.ts`), W52 RNG (`rng.ts` + determinism tests), W56 visibility, W58 frustration, W82 "offline-first" (already true — Phaser static site + localStorage).

If one of these needs deeper authoring (banter content, more moor moments, better copy), file it as a content ticket. **Not a flagship.**

---

## Deleted outright

The following were in prior drafts and have been cut:

- **Nonsense:** A2 (WebGPU for pixel art), A4 (WASM), B1 (E2E encrypted saves in a browser survivor), G1 (monorepo for one game), G4 (plugin API), H3 (academic partnership as a product row), I-moonshots (PvP, 3D, LLM narrative), **W33** (Voronoi-explainer is a tooltip, not a flagship), **W68** (companion app is a different product), **W97** (diegetic patch notes = bad UX), **W100** ("Moor Library" is a rollup of 17 other systems and cannot legally PDF-export licensed music/VO), **M20** (enemies slowing to 60% breaks the survivors genre).
- **Duplicates:** **E2** (dupe of W13 curses), **W37** (dupe of W15 hazards), **W60** (dupe of W5 bestiary codex + O3 live ops), most of the "share surface" rows (W20/W50/W79/W90 collapsed into **W27**), most of the "hub expansion" rows (W11/W84/W85/W86/W89 collapsed into an idea entry — not yet a flagship).
- **Framing-wrong (moved to ideas):** W1 Soul Weave (an ADR, not a program), W69 A11y-as-Aesthetic (a naming exercise, needs disability consult before shipping), W80 Ethics Charter (an ADR — without an external auditor, a charter is blog copy).

---

## Parking lot (ideas, not flagships)

See `docs/DESIGN_IDEAS.md` for creative reference material that was previously dressed up as flagship rows: signature mechanics, playable roster concepts, enemy/boss bestiary sketches, biome and weapon expansion catalogues. Useful as a designer's sketchpad; **not** a prioritisation backlog.

Multiplayer (P1, W67 couch co-op), modding (T3), and store integration (PB1, PB2) stay on the parking lot until the product thesis explicitly demands them.

---

## Next steps when elevating a new flagship

Every candidate that graduates must carry:

1. **Problem statement** — player outcome + business/art outcome.
2. **Non-goals** — what v1 will not solve.
3. **Spike plan** — 1–2 weeks, exit criteria.
4. **Verification** — tests, metrics, or review gates.
5. **Dependency map** — links to sibling rows and `src/` surfaces.
6. **Kill criterion** — one falsifiable outcome that would stop the program.

Without those six, the row is an idea, not a flagship.

---

*Previous drafts bloated to 100+ W-rows, 20 M-rows, 14 H-rows, a broken scoring rubric, and ~40 synonym clusters. The audit trail is in `docs/HUGE_INITIATIVES_VERDICT.md`; the creative reference salvaged from the cut is in `docs/DESIGN_IDEAS.md`. This file stays short on purpose.*
