# Specs Index

This directory accumulates design specs. Each spec is paired with an implementation plan under `docs/superpowers/plans/<same-date>-<same-slug>.md` (less the `-design` suffix). Specs describe **what** to build and **why**; plans describe **how** to ship it.

> **Convention.** Specs are evergreen reference once shipped — they describe intent at design time. Live shipping status lives in [`../plans/INDEX.md`](../plans/INDEX.md) and per-initiative `project_*_status` memory entries. When this INDEX disagrees with plans INDEX about ship state, trust plans INDEX.

> **Discovery rule.** To find all artifacts for an initiative: search by slug across `specs/`, `plans/`, `status/<domain>/`, and `adr/`. Slugs are stable across the trio (e.g. `accessibility-foundation` appears in spec, plan, and `status/a11y/A1_*`).

---

## By initiative (live-or-recent)

Each row links spec ↔ plan ↔ status doc(s) ↔ ADR(s). "Live" means there is open work. "Shipped" means closed in master.

| Initiative | Spec | Plan | Status / ADR |
|---|---|---|---|
| **A1** Accessibility foundation | [2026-04-23-accessibility-foundation-design](2026-04-23-accessibility-foundation-design.md) | [2026-04-23-accessibility-foundation](../plans/2026-04-23-accessibility-foundation.md) | [status/a11y/](../../status/a11y/) (6 trackers) — M2-M6 shipped, M1 PEAT human-gated |
| **B1** Banter density push | [2026-04-23-banter-density-push-design](2026-04-23-banter-density-push-design.md) | [2026-04-23-banter-density-push](../plans/2026-04-23-banter-density-push.md) | [BANTER_GAPS.md](../../BANTER_GAPS.md) — shipped 2026-04-26 |
| **C1** Highland Almanac | [2026-04-23-highland-almanac-design](2026-04-23-highland-almanac-design.md) | [2026-04-23-highland-almanac](../plans/2026-04-23-highland-almanac.md) | shipped 2026-04-24 |
| **C2** Weapon lore pass | [2026-04-23-weapon-lore-pass-design](2026-04-23-weapon-lore-pass-design.md) | [2026-04-23-weapon-lore-pass](../plans/2026-04-23-weapon-lore-pass.md) | [C2_VOICE_AUDIT.md](../../C2_VOICE_AUDIT.md), [C2_BURNS_PROVENANCE.md](../../C2_BURNS_PROVENANCE.md), [C2_DIALECT_REVIEW.md](../../C2_DIALECT_REVIEW.md) — Native + Burns review open |
| **E1** Seasonal events / Burns Night | [2026-04-23-seasonal-events-burns-night-design](2026-04-23-seasonal-events-burns-night-design.md) | [2026-04-23-seasonal-events-burns-night](../plans/2026-04-23-seasonal-events-burns-night.md) | [adr/0004](../../adr/0004-seasonal-event-calendar-gating.md) — shipped 2026-04-24 |
| **F1** Haar shader + ShaderRegistry | [2026-04-23-haar-shader-design](2026-04-23-haar-shader-design.md) | [2026-04-23-haar-shader](../plans/2026-04-23-haar-shader.md) | [adr/0003](../../adr/0003-shader-registry-phaser-postfx-pipeline.md) — shipped 2026-04-24 |
| **H1** Gran's Croft | [2026-04-23-grans-croft-design](2026-04-23-grans-croft-design.md) | [2026-04-23-grans-croft](../plans/2026-04-23-grans-croft.md) | shipped 2026-04-24 |
| **M1** Moor Road multi-node | [2026-04-23-moor-road-nodes-design](2026-04-23-moor-road-nodes-design.md) | [2026-04-23-moor-road-nodes](../plans/2026-04-23-moor-road-nodes.md) + [2026-04-24-m1-moor-nodes-followups](../plans/2026-04-24-m1-moor-nodes-followups.md) | shipped 2026-04-24 |
| **P3** Cloud saves | [2026-04-26-cloud-save-conflict-ux-design](2026-04-26-cloud-save-conflict-ux-design.md) | (cross-cuts; no single plan file) | [adr/0006-cloud-save-backend.draft](../../adr/0006-cloud-save-backend.draft.md) + [P3_BACKEND_DECISION_MATRIX.md](../../P3_BACKEND_DECISION_MATRIX.md) — DRAFT, awaiting stakeholder approval |
| **R1** Relics (third tier) | [2026-04-23-relics-third-tier-design](2026-04-23-relics-third-tier-design.md) | [2026-04-23-relics-third-tier](../plans/2026-04-23-relics-third-tier.md) + [2026-04-24-relics-m45-polish](../plans/2026-04-24-relics-m45-polish.md) | shipped 2026-04-24 (R1 + M4.5) |
| **U1** Rune upgrades | [2026-04-23-rune-upgrades-design](2026-04-23-rune-upgrades-design.md) | [2026-04-23-rune-upgrades](../plans/2026-04-23-rune-upgrades.md) | shipped 2026-04-25; M4 wired 2026-04-26 |
| **V2** Haggis variants pack | [2026-04-23-haggis-variants-pack-design](2026-04-23-haggis-variants-pack-design.md) | [2026-04-23-haggis-variants-pack](../plans/2026-04-23-haggis-variants-pack.md) + [2026-04-24-v2-variants-followups](../plans/2026-04-24-v2-variants-followups.md) | [status/cultural/](../../status/cultural/) — 14-roster shipped 2026-04-24; Witch's Hare 15th 2026-04-28; native + Burns review open |
| **W2** Moor Road (multi-act campaign) | [2026-04-16-moor-road-w2-design](2026-04-16-moor-road-w2-design.md) | [2026-04-16-w2-moor-road](../plans/2026-04-16-w2-moor-road.md) | shipped 2026-04-16 |
| **W18** Moor renders itself (Phase 0 prototype) | [2026-04-18-moor-renders-itself-design](2026-04-18-moor-renders-itself-design.md) | [2026-04-18-moor-phase-0-prototype-plan](../plans/2026-04-18-moor-phase-0-prototype-plan.md) | shipped — see [status/engine/PHASE_0_GATE_NOTES.md](../../status/engine/PHASE_0_GATE_NOTES.md) |
| **W27** Capture pipeline Phase 2 | [2026-04-22-w27-capture-pipeline-phase2-design](2026-04-22-w27-capture-pipeline-phase2-design.md) | [2026-04-22-w27-capture-pipeline-phase2](../plans/2026-04-22-w27-capture-pipeline-phase2.md) | shipped 2026-04-22; charter [stale](../../top-10-tasks/blocked/07-charter-stale.md) |
| **W71** Animation rig (Phase 0 + 2) | [2026-04-13-gamescene-demonolith-design](2026-04-13-gamescene-demonolith-design.md) (predecessor) | [2026-04-23-secondary-motion](../plans/2026-04-23-secondary-motion.md) | [adr/0005](../../adr/0005-skeletal-animation-rig.md) + [PHASE_0_GATE_NOTES.md](../../PHASE_0_GATE_NOTES.md) — Phase 0+2 shipped, Phase 1 partial |
| **W95** Mobile (Phase 0 safe-area) | (no spec; plan-only slice) | [2026-04-22-w95-phase0-mobile-safe-area](../plans/2026-04-22-w95-phase0-mobile-safe-area.md) | [MOBILE_DEVICE_TEST_MATRIX.md](../../MOBILE_DEVICE_TEST_MATRIX.md), [MOBILE_QUIRKS.md](../../MOBILE_QUIRKS.md) — Phase 0 shipped, T203 device-pass open |
| **Phaser 4 migration** | (no spec; plan-only) | [2026-04-23-phaser4-migration](../plans/2026-04-23-phaser4-migration.md) | shipped 2026-04-23 |
| **B5** Biomes charter (post-2026-04-23 cohort) | [2026-04-28-five-missing-biomes-design](2026-04-28-five-missing-biomes-design.md) | (no plan; landed via charter dispatches) | shipped 2026-04-29/30 (Seawrack `a160662`, Haar `4c97626`, Frost `24c9301`, Bodach Glas Phase 2); Phase 3 Edinburgh blocked on cultural consultation |
| **Boss Tier 2 mythos** | [2026-04-28-boss-tier-2-mythos-design](2026-04-28-boss-tier-2-mythos-design.md) | (no plan yet) | DRAFT — design only |
| **Save v18 boundary** | [2026-04-28-save-v18-boundary-sketch](2026-04-28-save-v18-boundary-sketch.md) | (no plan yet) | DRAFT — sketches the v18 schema migration boundary |
| **Codebase restructure** | (no spec; plan-only) | [2026-04-30-codebase-restructure](../plans/2026-04-30-codebase-restructure.md) | Phase 0 + 1 shipped 2026-05-07; Phases 2–6 open |

---

## Older specs (pre-2026-04-23 batch)

| Spec | What |
|---|---|
| [2026-04-09-procedural-music-engine-design](2026-04-09-procedural-music-engine-design.md) | Procedural music engine + Conductor — shipped, lives at `src/systems/music/` |
| [2026-04-11-soul-charter-polish-pass-completion-design](2026-04-11-soul-charter-polish-pass-completion-design.md) | Soul Charter polish pass — shipped; `docs/DESIGN_SOUL.md` is the artifact |
| [2026-04-12-glesga-voice-pass-design](2026-04-12-glesga-voice-pass-design.md) | Glesga voice rewrite — shipped; `docs/VOICE_CARD.md` is the artifact |
| [2026-04-13-accessible-highlands-design](2026-04-13-accessible-highlands-design.md) | Earlier accessibility design — superseded by 2026-04-23 A1 spec |
| [2026-04-13-gamescene-demonolith-design](2026-04-13-gamescene-demonolith-design.md) | R3 GameScene split — shipped 2026-04-16 (R3 + R3a) |
| [2026-04-13-scene-refactor-biomes-endless-design](2026-04-13-scene-refactor-biomes-endless-design.md) | Phase A biomes + Phase B endless — see [status/engine/SCENE_REFACTOR_GAP_AUDIT.md](../../status/engine/SCENE_REFACTOR_GAP_AUDIT.md) for line-by-line shipped-vs-pending |
| [2026-04-21-art-music-continuity-design](2026-04-21-art-music-continuity-design.md) | Continuity polish — shipped 2026-04-21 |
| [2026-04-21-art-music-ui-consistency-design](2026-04-21-art-music-ui-consistency-design.md) | UI consistency pass — shipped 2026-04-21 |
| [2026-04-22-lineage-phase0-design](2026-04-22-lineage-phase0-design.md) | Lineage Phase 0 — shipped 2026-04-22 |
| [2026-04-22-soul-pass-design](2026-04-22-soul-pass-design.md) | Soul Pass (clip audio + ambient wildlife) — shipped 2026-04-22 |
| [2026-04-22-variant-cailleach-design](2026-04-22-variant-cailleach-design.md) | Variant #10 Cailleach — shipped 2026-04-22 |

---

## Discovery cheat-sheet for AI agents

When asked to work on initiative `<X>`:

1. **Spec** — search this index for the matching row; it links the spec.
2. **Plan** — same row links the implementation plan; check its `STATUS:` marker.
3. **Status / open work** — same row links any `status/<domain>/` trackers.
4. **ADR** — if there's a load-bearing decision, same row links the ADR.
5. **Memory** — `~/.claude/projects/.../memory/MEMORY.md` has `project_<x>_status.md` entries that snapshot ship state outside the repo.
6. **Code** — grep `src/` for the slug or feature name; commits with the matching feat-prefix.

If a row claims "shipped" but the code doesn't match: the memory + git log + the file's actual state always win over this index.
