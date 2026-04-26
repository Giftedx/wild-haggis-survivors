# Plans Index

This directory accumulates implementation plans. Most are historical execution
records; a handful track follow-up rows that span multiple sessions.

**Convention going forward:**
- Every plan should carry a top-of-file marker. Two forms accepted:
  - `> **STATUS: ✅ SHIPPED (YYYY-MM-DD)** — <one-line provenance / ship commit ref>` for completed plans.
  - `> **STATUS:** <Draft | Open | In progress | Partial> — <one-line current state>` for active work.
- "Draft" survives in some older plans even after ship; trust this index over the file marker when they disagree.
- Files are kept in-tree (not archived) because 28 references across `docs/`, `docs/adr/`, `docs/top-10-tasks/`, `src/data/runes.ts`, and other plans link to plan paths. Moving them would ripple. Add new plans here; mark status accurately at ship time.
- For tasks that span sessions, prefer charters under `docs/top-10-tasks/` + blocked stubs under `docs/top-10-tasks/blocked/` over re-opening shipped plans.

---

## Active (open rows still tracked)

| Plan | Open work | Memory pointer |
|---|---|---|
| `2026-04-26-triple-audit-execution-plan.md` | T203 (mobile real-device), T211 (native review), T407 (DOM/focus a11y), T213/T214 (FTUE/drift) | `project_audit_followups_status` |
| `2026-04-24-a1-m5-manual-playtest-followups.md` | PEAT desktop audit (human gate) | `project_a1_m5_status` |
| `2026-04-24-m1-moor-nodes-followups.md` | Human playtest gate only | `project_m1_moor_nodes_status` |
| `2026-04-24-r1-m45-manual-playtest-followups.md` | Balance playtest deferred | `project_r1_relics_status` |
| `2026-04-24-v2-variants-followups.md` | Doric + Shetlandic native review, Burns Canongate audit | `project_v2_variants_status` |

## Shipped (historical execution records)

Group by flagship area. Each plan's body has detailed ship provenance; follow the memory pointer or commit hash for current state.

### Soul + voice + art canon
- `2026-04-09-procedural-music-engine.md` — engine in `src/systems/music/`
- `2026-04-11-soul-charter-polish-pass-completion.md` — `docs/DESIGN_SOUL.md` published
- `2026-04-12-glesga-art-rebirth.md` — sprite rewrites in `BootScene.ts`
- `2026-04-12-glesga-voice-pass.md` — `docs/VOICE_CARD.md` landed
- `2026-04-12-soul-charter-phase-6-visual-bugs-redesign.md` — findings doc; converted into subsequent plans
- `2026-04-19-art-audit-and-asset-refactor.md` — sprite audit + asset modules
- `2026-04-20-art-music-polish-pass.md` — atmosphere shift batch
- `2026-04-20-final-polish.md` — biome VFX + wildlife + victory celebration
- `2026-04-20-phase1-enemy-animation.md` — texture-swap animation for 3 archetypes
- `2026-04-21-art-music-continuity-plan.md` — verified against repo 2026-04-22
- `2026-04-21-art-music-polish-pass.md` — verified against repo 2026-04-22
- `2026-04-21-art-music-ui-consistency.md` — verified against repo 2026-04-22
- `2026-04-21-continuity-polish.md` — verified against repo 2026-04-22
- `2026-04-22-soul-pass.md` — clip audio + ambient wildlife (W27 + moor)

### Worldbuilding (W2 + Almanac + Croft + Variants + Lineage)
- `2026-04-16-w2-moor-road.md` — RunActState + ActIntermissionScene + 6 routes
- `2026-04-22-lineage-phase0.md` — named haggis + ancestor whisper
- `2026-04-22-variant-cailleach.md` — variant #10 (V2 prep)
- `2026-04-23-grans-croft.md` — H1 complete (24 commits)
- `2026-04-23-haggis-variants-pack.md` — V2 all 3 tracks
- `2026-04-23-highland-almanac.md` — C1 complete
- `2026-04-23-moor-road-nodes.md` — M1 + 8 follow-ups

### Engine + flagships (T1 replay, P3 cloud, W71 anim, Phaser 4)
- `2026-04-17-t1-deterministic-replay.md` — record-side MVP
- `2026-04-18-t1-phase3-deterministic-playback.md` — fixed-step physics + ReplayBlob v2
- `2026-04-23-phaser4-migration.md` — migrated 2026-04-23 (P4-11/12/13 closed same day)
- `2026-04-23-secondary-motion.md` — W71 Phase 2 (keyframe tail lag + tier-gated mantle)

### Captures + mobile
- `2026-04-22-w27-capture-pipeline-phase2.md` — Phase 2a/2b shipped 2026-04-22; Phase 4 (clipboard) 2026-04-26
- `2026-04-22-w95-phase0-mobile-safe-area.md` — top-10 #4 mobile rework

### Content systems (banter, lore, runes, relics, seasonal, accessibility)
- `2026-04-17-prd-sync-and-a11y-matrix.md` — PRD reconciled + a11y matrix
- `2026-04-18-moor-phase-0-prototype-plan.md` — atlas + accessory drawers + wear builds
- `2026-04-23-accessibility-foundation.md` — A1 M2-M6 (M1 PEAT human gate open)
- `2026-04-23-banter-density-push.md` — B1 P1+2+3+4+5 all shipped (P4 8-leaf Gaelic review open)
- `2026-04-23-haar-shader.md` — F1 shipped 2026-04-24 with Phaser 4 filter rebase
- `2026-04-23-relics-third-tier.md` — R1 + M4.5 (214e9ce)
- `2026-04-23-rune-upgrades.md` — U1 all milestones; M4 wired 2026-04-26 (a86afe5)
- `2026-04-23-seasonal-events-burns-night.md` — E1 all 4 milestones
- `2026-04-23-weapon-lore-pass.md` — C2 truth-up (103 EN leaves) + Burns Kinsley fixes
- `2026-04-24-relics-m45-polish.md` — 5 effect wires + T29 histogram (214e9ce)
