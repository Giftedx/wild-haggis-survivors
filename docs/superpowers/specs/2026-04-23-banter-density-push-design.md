# B1 — Banter Density Push design spec

**Date:** 2026-04-23
**Initiative:** B1 (`docs/HUGE_INITIATIVES_MASTER_PLAN.md`)
**Status:** Draft
**Prerequisite:** W18 Phase B shipped (bilingual banter pool + parity fences). BanterSystem + locale infra already in place.

---

## 1. Problem statement

Banter is shipped infrastructure but thin in content. `docs/BANTER_GAPS.md` records the current state: 294 leaf keys across the Phase B pool covering UI shell + decision moments + variant-scoped voices. The *ambient* banter — the lines that fire between decision moments as the player traverses the moor — is much smaller than our Hades/DRG:S-adjacent aspiration would require.

`NARRATIVE_RESEARCH.md §6.1` scoped a 300–500 line target across nine contexts. `ROGUELITE_RESEARCH.md §Tier S5` flagged this as the single highest-ROI investment WHS can make — "every banter line is a tiny soul transfer." `VOICE_CARD.md` (refreshed 2026-04-23) now has concrete voice guidance for every register this push will use.

### Player outcome

Every run feels *populated* with voice. Gran's commentary lands at run start, mid-run moments, death screens, and victory screens. The haggis has an inner monologue. Enemies flavour themselves with short lines. Seasonal events gain their narrative beat. First-time events are reserved and memorable.

### Why now

The infrastructure is mature (parity fences, priority system, throttle cycle, locale split). Voice-register docs are freshly updated. Research doc cross-references every line category. The gap is writing — and writing Scots-voiced banter is the same skill for 50 lines or 500. Time to fill the vessel.

---

## 2. Scope — the nine pools

| Pool | Target lines | Priority slot | Trigger context | Voice register |
|---|---|---|---|---|
| **Gran's croft commentary** | 40 EN + 40 SCS | 30 `gran_commentary` (new) | Run start, run end (both outcomes), moor-moment surface, seasonal event narration | Hearth (Gran-voice — see `VOICE_CARD.md` §Gran) |
| **Haggis inner monologue** | 50 EN + 50 SCS | 25 `haggis_ambient` (new) | Quiet moor stretches (no enemies near, HP full) every 45s±15s | Hearth (wee-beastie simple) |
| **Enemy flavour lines** | 100 EN + 100 SCS, 2–5 per enemy | 40 `enemy_ambient` (new) | First-time encounter + occasional on re-kill | Mixed — matches enemy family (Fae warm-tricksy, Urban sharp, Weather elemental) |
| **Cailleach whispers** | 20 EN + 20 SCS | 55 `cailleach_whisper` (new) | Act intermissions (rare), low-HP (rare), Bargain events | Cailleach (Gaelic-inflected; see `VOICE_CARD.md`) |
| **Burns citational** | 20 EN + 20 SCS | 45 `burns_citation` (new) | Seasonal (Burns Night), lineage moments, rare moor moments, specific evolutions | Burns citational (quotations or close paraphrase; see `VOICE_CARD.md`) |
| **Moor moments expansion** | 40 EN + 40 SCS | 35 `moor_moment` (existing pool expanded) | Existing moor-moment triggers (peat glint, heather rest, etc.) | Hearth |
| **Death-cause reflections** | 30 EN + 30 SCS, grouped by cause | 75 `death_reflection` (existing; expand) | Death screens, per `DeathCauseTracker` classification | Hearth (warmly-framed per DESIGN_SOUL §Warmth Audit) |
| **First-time reserved** | 30 EN + 30 SCS | 110 `first_time` (new; beats boss_warn at 100) | First-ever trigger of: each boss kill, each evolution pickup, first combo 100, first Moor Road route, first variant unlock, first daily clear, first Ironmoor victory | Edge or Hearth per event — reserved & unique |
| **Seasonal event pool** | 10 EN + 10 SCS per event × 3 events (Burns Night, Hogmanay, Samhain) = 60 EN + 60 SCS | 65 `seasonal_event` (new) | Active seasonal window (see E1 flagship) | Context-appropriate (Burns for Burns Night, Gran for Hogmanay, Cailleach for Samhain) |

**Totals:** **~390 EN + 390 SCS ≈ 780 leaf keys** (upper end of the 300–500 *per locale* target).

Bilingual parity fence (`src/core/i18n.locale.test.ts`, `ui.banter.*` scope) enforces EN ↔ SCS mirroring at CI. Adding an EN line without SCS is a build-break.

---

## 3. Voice register enforcement

Each pool has an explicit register (see table). Violations (wrong voice in wrong pool) are caught by manual review, not automated — but a per-pool authoring header comment documents the register expectation so casual contributors can self-check.

### Register cross-reference (`VOICE_CARD.md`)

- **Hearth (Gran-voice):** longer hold-time, warmer punctuation, arm-around-shoulder energy. Use for Gran pool, most moor moments, warm death reflections.
- **Edge (Limmy-bite):** shorter, clipped, em-dashes. Use for boss warnings, certain first-time reserved lines (combo 1000 ALL CAPS), some Glaswegian variant banter.
- **Cailleach:** Gaelic-inflected, stern-but-fond, elder-motherly. Her pool only.
- **Burns citational:** quotations or close paraphrase of Burns's work. Context-justified (never random).
- **Enemy families:** each family carries a tonal colour — Fae warm-tricksy, Urban sharp-comic, Weather elemental-thin.

### Authoring guardrails (per `docs/BANTER_AUTHORING.md`)

- Every new leaf key lands in both `src/core/i18n.ts` (EN) AND `src/core/i18n.scs.ts` (SCS).
- Scots orthography follows the existing Phase B conventions (yir / nae / dinnae / tae / wee / ken).
- Gaelic fragments are reviewed by a native speaker before merge. Never machine-translated.
- No tourist-Scots ("och aye the noo"), no over-dense dialect ("och wee braw bairn!"), no sectarian references, per `VOICE_CARD.md` anti-patterns.

---

## 4. Non-goals

- **Not voice acting.** All banter is text-only. A future voice-over pass is a separate flagship.
- **Not dynamic templating.** Lines are authored strings, not runtime-composed from tokens. Dynamic interpolation of values (kill count, weapon name) is a separate future feature.
- **Not new trigger contexts without engine review.** The nine pools above map to existing or lightly-extended trigger hooks. Entirely-new contexts (e.g., "enemy-adjacent-idle-3s") require a `BanterSystem` change and should land as their own small ticket.
- **Not gender-specific variant voice lines.** Haggis is a creature; variants are neutral. Pools are register-driven not gender-driven.
- **Not licensed-IP references.** No Buckfast / Irn-Bru / Celtic / Rangers / living-person-quoted lines (per `CULTURAL_SENSITIVITIES_RESEARCH.md §5`).
- **Not Gaelic-only lines.** Any Gaelic phrase pairs with English context (subtitle or adjacent clause).

---

## 5. Architecture

### Files to create

- *(None — all changes land in existing files.)*

### Files to modify

- `src/core/i18n.ts` — add EN strings for 9 pool expansions. Authoring leafs added alphabetically within each sub-object.
- `src/core/i18n.scs.ts` — add matching SCS strings. Parity fence enforces.
- `src/data/banter.ts` — add pool definitions (priority slots, trigger wiring, throttle rules) for five new pools: `gran_commentary`, `haggis_ambient`, `enemy_ambient`, `cailleach_whisper`, `burns_citation`, `first_time`, `seasonal_event`. Existing `moor_moment` and `death_reflection` pools accept expansion without schema change.
- `src/systems/BanterSystem.ts` — no structural change expected; pool-registration hook consumes the new contexts.
- `docs/BANTER_GAPS.md` — update after each authoring pass. "What shipped in Phase C" section.

### Trigger wiring

Most new pools fire off existing events. Specifically new wire-ups:

- `gran_commentary` — fires on: `run:start`, `run:end` (both outcomes), `moor_moment_surfaced`, `seasonal_event_start`. New subscription in `BanterSystem.wireGran()`.
- `haggis_ambient` — fires on a `Scene.time` interval (45s ± 15s random) when player is *not* in combat (no enemy within 200px for 10s) and HP > 75%.
- `enemy_ambient` — fires on enemy-spawn if first-time encountered (save flag `seenEnemies`), then 1 in 20 re-spawns afterwards. Throttled by existing BanterSystem cooldown.
- `cailleach_whisper` — fires on `low_hp_threshold_crossed` (25%), `act_intermission_start`, `bargain_event_opened`. Priority 55 lets it interrupt moor_moment (35) but yield to `boss_warn` (100).
- `burns_citation` — fires on `seasonal_event_burns_night_active`, `lineage_moment`, specific weapon evolutions (evolution key matches an author-curated list), specific moor_moment triggers (author-tagged).
- `first_time` — priority 110 (higher than `boss_warn`). Checks against save-tracked `firstTimeEventsFired` set. Once fired, marks the event seen; never replays.
- `seasonal_event` — priority 65. Fires on event-start, event-end, and during event for specific triggers (Burns Night: on each haggis self-pickup, on each kilt/tartan pickup).

### Save-state adds

- `whs_save.firstTimeEventsFired: Set<string>` — new field, migration default empty set. Tracks which first-time banter lines have already fired so they never repeat.
- `whs_save.seenEnemies: Set<string>` — if not already present (audit). Allows per-enemy first-encounter flavour.

Schema version bumps from **v6** to **v7**. Migration adds default empty sets if fields missing.

### Tests / fences

- `i18n.locale.test.ts` — EN ↔ SCS parity over `ui.banter.*` scope continues to enforce. New leaves without SCS fail CI.
- `banter.test.ts` — add unit tests for each new pool's trigger wiring.
- `banterSystem.firstTime.test.ts` — new test: `first_time` events fire exactly once per save.
- Save migration test for schema v6 → v7.

### Content-authoring workflow

Per `docs/BANTER_AUTHORING.md` recipes 1 and 2. No engine changes needed for content authors once the pool infrastructure lands.

---

## 6. Phased delivery

**Phase 1 — Infrastructure (1 sprint):**
- Save schema v7 migration.
- New pool definitions in `banter.ts`.
- New trigger wiring in `BanterSystem.ts`.
- New empty i18n leaf structure in both locales.
- Parity fence test extension.
- Ship with 0 lines authored — infra only.

**Phase 2 — Core authoring (2 sprints):**
- Gran pool (40 × 2).
- Haggis inner monologue (50 × 2).
- Moor moment expansion (40 × 2).
- Death reflections (30 × 2).

**Phase 3 — Flavour authoring (2 sprints):**
- Enemy flavour (100 × 2).
- First-time reserved (30 × 2).

**Phase 4 — Specialist voices (1 sprint):**
- Cailleach whispers (20 × 2).
- Burns citations (20 × 2).

**Phase 5 — Seasonal tie-in (1 sprint, coordinated with E1 Burns Night flagship):**
- Burns Night + Hogmanay + Samhain pools (60 × 2).

Each phase ships when its pools are complete, SCS-paired, and CI green.

---

## 7. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Authoring backlog on Scots translation blocks English | Phase per pool. Ship English + Scots together per pool, not per line. Parity fence catches drift at CI. |
| Voice drift across 780 lines | All authored by same writer per pool. Voice-register header comment per pool. Periodic read-aloud review. |
| Dialect over-density fatigues players | `banterFrequency` setting already ships (Wheesht / Sparing / Natural / Gabby). Players self-throttle. |
| First-time events repeat due to save-schema bug | `whs_save.firstTimeEventsFired` set is append-only; migration test enforces. Unit tests cover edge cases. |
| Enemy flavour fires too often | Existing `BanterSystem` throttle (`lineage_moment` cooldown) + new per-enemy cooldown (60s). Audit during playtest. |
| Gaelic lines go untranslated / mistranslated | Native-speaker review mandatory before merge. `CULTURAL_SENSITIVITIES_RESEARCH.md §3.1` documents consultation path. Budget allocation per session. |
| Burns quotations risk misattribution / wrong context | Every citation is a direct Burns quote with verified provenance. Context-justified (referenced trigger) — never decorative. |

---

## 8. Kill criteria

- **EN ↔ SCS parity fence remains green** after every authoring session. Blocking CI for >2 weeks = pause English pool and catch SCS up.
- **Each phase ships when its pool is complete + paired + tested.** Phase cannot merge with <50% pool populated.
- **`npm run ci:all`** green (lint + vitest + build + e2e) at each phase ship.
- **Manual read-through check** per pool by a second reviewer before ship.
- **If banter fatigue complaints spike** in playtests (>3/10 testers cite "too much talking"), lower default `banterFrequency` to Sparing and re-test.

If Phase 1 infrastructure fails CI, revert to W18 Phase B shipped state — game is unaffected.

---

## 9. Cross-references

- `docs/DESIGN_SOUL.md` — Warmth Audit, Soul Check, tonal spectrum.
- `docs/VOICE_CARD.md` — every voice register used here.
- `docs/BANTER_AUTHORING.md` — line-level authoring recipes.
- `docs/BANTER_GAPS.md` — coverage tracking.
- `docs/research/NARRATIVE_RESEARCH.md §6.1` — line-count targets and context design.
- `docs/research/ROGUELITE_RESEARCH.md §Tier S5` — strategic rationale.
- `docs/research/SCOTTISH_RESEARCH_DEEP.md §§11.5, 14, 15.3` — wild-haggis lore, dialect vocabulary, Burns canon.
- `docs/research/CULTURAL_SENSITIVITIES_RESEARCH.md §§3.1, 4, 5.6` — Gaelic consultation, dialect ethics, likeness.

---

*Spec complete. Plan to follow (`docs/superpowers/plans/2026-04-23-banter-density-push.md`) will break Phase 1 into bite-sized tasks.*
