# Huge Initiatives — Master Plan

**Status.** Short list. Eight honest flagships. Everything else is either already shipped, not a flagship, or an idea (see `docs/DESIGN_IDEAS.md`). Full audit trail in `docs/HUGE_INITIATIVES_VERDICT.md`.

**Rule of thumb for a small team.** Run **at most one** flagship at a time. If a flagship lacks an owner, a non-goals list, and a kill criterion, it is not a flagship yet — it is an idea.

---

## Urgent (this quarter)

| ID | Initiative | Tier | Why now | Exit criterion |
|----|------------|------|---------|---------------|
| **R3** | **Scene complexity budget** — split `GameScene.ts` | A | `src/scenes/GameScene.ts` is **2016 lines**. Every future feature pays compound cost until this is broken up. Undercosted in prior drafts as Tier B. | `GameScene.ts` under **800 lines**; extracted systems have their own tests; no regression in existing smoke suite. |

---

## Real flagships (pick ONE next; rest are parking lot)

Each row: one owner, one non-goals line, one kill criterion. No row graduates from this doc without those three.

| ID | Initiative | Tier | Shape of the work | Non-goals | Kill criterion |
|----|------------|------|-------------------|-----------|---------------|
| **W2** | **The Moor Road — multi-act campaign** | S | Reframes the endless loop into authored chapters with between-act choices and save-persistent modifiers. Builds on existing `RunLifecycle.ts` + `save.endless.test.ts`. | Not a replacement for the evergreen endless run. Not a linear story mode. | If act-1 playtest retention ≤ baseline endless retention after four playtest rounds, shelve the program. |
| **W18** | **Full Scots / English bilingual ship** | S | Extends `src/core/i18n.ts` to Scots parity for UI, banter keys, and glossary. Optionally staged (UI first, banter later). | No VO. No secondary dialects. No localisation beyond Scots + English in v1. | If translator QA rounds exceed 3× budget or review surfaces >5% mistranslation, descope to UI-only. |
| **W66** | **Ironmoor — permadeath alt mode** | S | Shares core loop; single life, chronicle wipes on death; opt-in ceremony; separate leaderboard. | Not a new genre. Does not touch baseline balance. Does not ship with cosmetics gated behind survival. | If completion rate <1% after three content drops, or playtest feedback reports the mode as punishing rather than proud, shelve. |
| **W71** | **Animation rig — skeletal haggis + weather-reactive motion** | S | Replaces procedurally-drawn sprites (`BootScene.ts`) with a rig + state machine for player and key enemies. Secondary motion for mantle, whiskers, tartan. | Not a full art overhaul. Not mocap. Pixel-art soul preserved. Static sprites remain a fallback during load. | If rig inflates frame time >10% against Sept 2026 perf baseline on target devices, descope to keyframe animation only. |
| **W95** | **Thumb-zone mobile rework** | S | Portrait mode, one-thumb play, gesture input, safe-area fluency. Not a port — a native mobile posture. | Not a separate build. Not a different balance. Not a monetisation lever. | If mobile playtest session length <50% of desktop after three iteration cycles, mobile remains "supported" but not flagship. |
| **T1** | **Deterministic replay** | S | Full input+RNG+audio-schedule accountability. Foundation for speedrun validation, ghost replays, highlight reel. Builds on existing `rng.determinism.test.ts`. | Not a crash-proof system. Not a cross-version bridge — replays valid within one build. | If desync rate >1% across a playtest suite, shelve until root cause understood. |
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
