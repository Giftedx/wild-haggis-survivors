# V2 — Haggis Variants Pack (+3 new variants) implementation plan

> **STATUS:** Draft.
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship 3 new playable haggis variants per `docs/superpowers/specs/2026-04-23-haggis-variants-pack-design.md`: **Doric Quinie** (Northeast voice), **Peerie Shetlander** (Norn-tinged), **Burns's Wee Beastie** (Burns citational, smaller sprite). Roster goes 10 → 13 and pauses for review.

**Architecture:** Each variant follows the shipped Cailleach precedent (`docs/superpowers/specs/2026-04-22-variant-cailleach-design.md`) — palette module + `VariantDef` data + kiltPalette entry + 24 EN/SCS banter keys + unlock deed. Three parallel variant tracks; one sprint per variant.

**Tech Stack:** TypeScript strict, Phaser 3.90+, Vitest, Playwright. Asset pattern matches `cailleachPalette.ts`.

**Commit cadence:** One commit per TDD cycle. `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`.

**Branch:** `master`.

**Guardrails on every task:**
- `npm test` green after each step.
- `variantWireUp.test.ts` green.
- `i18n.locale.test.ts` parity fence green.
- Native-speaker review for Doric + Shetlandic banter is a merge-blocker.
- Burns quotations verified against authoritative edition.

---

## File structure

### New files (per variant)

| Path | Purpose |
|------|----|
| `src/art/sprites/variants/doricQuiniePalette.ts` | Doric Quinie colours |
| `src/art/sprites/variants/peerieShetlanderPalette.ts` | Peerie Shetlander colours |
| `src/art/sprites/variants/burnsWeeBeastiePalette.ts` | Burns's Wee Beastie colours |

### Modified files (all variants)

| Path | Change |
|------|--------|
| `src/data/variants.ts` | 3 new `VariantDef` entries; bump `VARIANT_COUNT` 10 → 13. |
| `src/data/variants.test.ts` | Roster 13-count assertion; per-variant fence check. |
| `src/art/kiltPalette.ts` | 3 new entries. |
| `src/data/achievements.ts` | 3 new deed unlocks (`ach_doric_unlock`, `ach_peerie_unlock`, `ach_burns_beastie_unlock`). |
| `src/utils/save.ts` | Schema bump. Add unlock counters: `runsWithNoHealing`, `runsInCoastalOnly`, `burnsNightsWithEvolutions`. |
| `src/utils/save.test.ts` | Migration + counter logic tests. |
| `src/core/i18n.ts` + `.scs.ts` | 3 × 24 banter + 3 × ~10 meta keys × 2 locales ≈ 200 keys. |

---

## Milestone plan

Three parallel variant tracks, one per sprint. Each track has 4 tasks. Order: Doric Quinie first (most-ready voice research), Peerie Shetlander second, Burns's Wee Beastie third (most complex — sprite-scale work).

- **Track 1 — Doric Quinie** (tasks 1–4).
- **Track 2 — Peerie Shetlander** (tasks 5–8).
- **Track 3 — Burns's Wee Beastie** (tasks 9–12).

Each track ends with variant-specific ship gate.

---

## Track 1 — Doric Quinie

### Task 1: Palette + VariantDef

**Files:** Create `src/art/sprites/variants/doricQuiniePalette.ts`; modify `src/data/variants.ts`.

- [ ] **Step 1:** Failing test: `VARIANTS.doric_quinie` exists; has stat profile matching spec.
- [ ] **Step 2:** Author palette per spec (granite body, silver-blue accent, grey-blue kilt).
- [ ] **Step 3:** Register `VariantDef` with stat deltas (-5% speed, +8 HP, +15% pickup, +5% dmg), starter passive (`arbroath_smokie` flavoured), palette reference.
- [ ] **Step 4:** `variantWireUp.test.ts` passes with 11-variant roster.
- [ ] **Step 5:** Commit: `feat(variants): Doric Quinie — palette + data`.

### Task 2: Unlock deed — runsWithNoHealing counter

**Files:** `src/utils/save.ts`, `src/utils/save.test.ts`, `src/data/achievements.ts`.

- [ ] **Step 1:** Failing test: `runsWithNoHealing` default 0; increments on run-end if healing circles not entered.
- [ ] **Step 2:** Add field; write migration default 0.
- [ ] **Step 3:** Wire increment in `RunHistoryRecorder.onRunEnd` (needs healing-circle-touch telemetry from `HazardZones`).
- [ ] **Step 4:** Register deed `ach_doric_unlock` triggering when `runsWithNoHealing >= 1`.
- [ ] **Step 5:** Retroactive seed on save-load (scan runHistory).
- [ ] **Step 6:** Commit: `feat(variants): Doric Quinie unlock counter + deed`.

### Task 3: i18n banter — 24 EN + 24 SCS

**Files:** `src/core/i18n.ts`, `src/core/i18n.scs.ts`.

- [ ] **Step 1:** Author 24 EN lines under `ui.banter.doric_quinie.*` across 6 sub-pools (run_start, combat_win, combat_hurt, boss_warn, victory, death). Doric vocabulary throughout (fit like, quinie, loon, min).
- [ ] **Step 2:** Pair 24 SCS lines.
- [ ] **Step 3:** **Native-speaker review** (merge-blocker). Doric-speaking reviewer confirms authenticity.
- [ ] **Step 4:** Parity fence green.
- [ ] **Step 5:** Commit: `content(banter): Doric Quinie 24 EN + 24 SCS`.

### Task 4: Doric Quinie ship gate

- [ ] **Step 1:** Verify `variantWireUp.test.ts` — 11-variant roster passes all fences.
- [ ] **Step 2:** Verify unlock works: play a run avoiding healing circles → deed fires → variant unlocked in picker.
- [ ] **Step 3:** Manual visual check: variant selectable, sprite reads distinct (granite + silver + blue accent).
- [ ] **Step 4:** `npm run ci:all` green.
- [ ] **Step 5:** Commit: `feat(variants): Doric Quinie shipped (variant #11)`.

---

## Track 2 — Peerie Shetlander

### Task 5: Palette + VariantDef

- [ ] **Step 1:** Failing test for 12-variant roster with `peerie_shetlander` entry.
- [ ] **Step 2:** Author palette per spec (North Sea grey-blue body, bleached-driftwood accent, rust-red kilt stripe — Viking echo).
- [ ] **Step 3:** Register with stats: +5% speed, -10 HP, cold-hazard resist 50%, +5% crit, -10% drift.
- [ ] **Step 4:** New `ColdResistance` system (or extend existing hazards) — 50% damage reduction from cold-biome sources.
- [ ] **Step 5:** Commit: `feat(variants): Peerie Shetlander — palette + data + cold resist`.

### Task 6: Unlock deed — runsInCoastalOnly counter

- [ ] **Step 1:** Failing test: `runsInCoastalOnly` counter increments when run completed without entering Moor biome (only coastal/loch biomes).
- [ ] **Step 2:** Add field + migration.
- [ ] **Step 3:** Wire increment in `RunHistoryRecorder` with biome-visited set.
- [ ] **Step 4:** Deed `ach_peerie_unlock` on `runsInCoastalOnly >= 1`.
- [ ] **Step 5:** Commit.

### Task 7: i18n banter — 24 EN + 24 SCS

- [ ] **Step 1:** Author 24 EN lines in Shetlandic voice (du, dee, peerie, voe, mirry, skerry vocabulary).
- [ ] **Step 2:** Pair 24 SCS/Shetlandic lines.
- [ ] **Step 3:** **Native-speaker review** — Shetlandic dialect now has its own ISO 639-3 code (scz); treat as distinct language. Shetland ForWirds may advise.
- [ ] **Step 4:** Parity fence green.
- [ ] **Step 5:** Commit: `content(banter): Peerie Shetlander 24 EN + 24 SCS`.

### Task 8: Peerie Shetlander ship gate

- [ ] **Step 1:** `variantWireUp.test.ts` — 12-variant roster.
- [ ] **Step 2:** Unlock works: coastal-only run → deed → unlock.
- [ ] **Step 3:** Cold-hazard resist tested: variant takes 50% damage from fire/cold.
- [ ] **Step 4:** `npm run ci:all` green.
- [ ] **Step 5:** Commit: `feat(variants): Peerie Shetlander shipped (variant #12)`.

---

## Track 3 — Burns's Wee Beastie

### Task 9: Sprite scale + palette + VariantDef

- [ ] **Step 1:** Failing test: `VARIANTS.burns_wee_beastie.spriteScale === 0.85`.
- [ ] **Step 2:** Author palette (mouse-brown body, poet-cream accent, aged-ink kilt with Ayrshire red stripe).
- [ ] **Step 3:** Register with stats: -15 HP, +20% crit, +10% speed, +15% XP, sprite scale 0.85×.
- [ ] **Step 4:** `VariantDef` supports `spriteScale` field (extend if needed).
- [ ] **Step 5:** Commit: `feat(variants): Burns's Wee Beastie — palette + data + sprite scale`.

### Task 10: Hitbox scaling + regression tests

**Files:** `src/entities/Player.ts`, `src/entities/Player.test.ts`.

- [ ] **Step 1:** Failing tests: at sprite-scale 0.85×, hitbox radius scales accordingly. Weapons, hazards, enemies still hit correctly.
- [ ] **Step 2:** Verify `setCircle` passes unscaled radius per CLAUDE.md Phaser gotcha.
- [ ] **Step 3:** Regression test against all weapons, hazards, enemy-hit math.
- [ ] **Step 4:** Commit: `fix(player): hitbox scales correctly with spriteScale`.

### Task 11: Unlock deed — burnsNightsWithEvolutions counter

- [ ] **Step 1:** Failing test: counter increments when a Burns Night window run is completed with all 8 weapons reaching L5.
- [ ] **Step 2:** Add field + migration. Depends on E1 Seasonal Events infra; if E1 not shipped, gate deed-grant on a placeholder flag until E1 lands.
- [ ] **Step 3:** Deed `ach_burns_beastie_unlock` on `burnsNightsWithEvolutions >= 1`.
- [ ] **Step 4:** Commit.

### Task 12: i18n banter — 24 EN + 24 SCS + Burns quotation audit

- [ ] **Step 1:** Author 24 EN lines — each a Burns quotation or close paraphrase.
- [ ] **Step 2:** Each direct quotation **verified against authoritative Burns edition** — `docs/research/SCOTTISH_RESEARCH_DEEP.md §15.3` references The Canongate Burns. Merge-blocker.
- [ ] **Step 3:** SCS lines are direct Burns Scots (already in Scots for most); modernised EN adjacency where comprehension requires.
- [ ] **Step 4:** Parity fence green.
- [ ] **Step 5:** Commit: `content(banter): Burns's Wee Beastie 24 EN + 24 SCS (citational)`.

### Task 13: Burns's Wee Beastie ship gate

- [ ] **Step 1:** `variantWireUp.test.ts` — 13-variant roster passes.
- [ ] **Step 2:** Visual check: sprite renders at 0.85× scale; reads "wee" vs other variants.
- [ ] **Step 3:** Unlock works (simulated via test-harness Burns Night + evolutions).
- [ ] **Step 4:** `npm run ci:all` green.
- [ ] **Step 5:** Commit: `feat(variants): Burns's Wee Beastie shipped (variant #13)`.

---

## Final ship gate (V2 complete)

- [ ] All 3 variants shipped; 13-variant roster.
- [ ] All 3 unlocks tested.
- [ ] All dialect consultations confirmed.
- [ ] `docs/BANTER_GAPS.md` updated.
- [ ] `npm run ci:all` green.
- [ ] Ship commit: `feat(variants): V2 — Haggis Variants Pack complete (Doric + Peerie + Burns's Wee Beastie)`.

---

## Risk-watch

| Signal | Response |
|---|---|
| Doric/Shetlandic reviewer unavailable | Hold that variant; ship remaining two. |
| Sprite-scale breaks weapon collision | Regression tests gate merge. |
| Any variant's unlock rate <5% in first month telemetry | Lower gate rather than ship weak variant. |
| Voice collision (Doric vs Glaswegian both "sharp") | Reviewer cross-checks against Glaswegian pool for distinction. |
