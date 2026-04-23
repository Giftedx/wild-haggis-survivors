# B1 — Banter Density Push implementation plan

> **STATUS:** Draft.
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Content authoring is not agentic; prose phases ship via the author-review-commit workflow per `docs/BANTER_AUTHORING.md`.

**Goal:** Ship ~390 EN + ~390 SCS banter leaf keys across nine pools per `docs/superpowers/specs/2026-04-23-banter-density-push-design.md`, in five progressive phases. Each phase ships when its pool is complete, parity-fenced, and CI green.

**Architecture:** Additive content authoring atop the shipped W18 Phase B infrastructure. Five new banter pools register in `BanterSystem` with new priority slots. Existing `moor_moment` and `death_reflection` pools extend. EN ↔ SCS parity guard (`src/core/i18n.locale.test.ts`, scoped to `ui.banter.*`) enforces bilingual discipline at CI.

**Tech Stack:** TypeScript strict, Phaser 3.90+, Vitest, Playwright. Content ships via `src/core/i18n.ts` + `src/core/i18n.scs.ts` and `src/data/banter.ts`.

**Commit cadence:** One commit per authoring-review pair (write a pool's EN + SCS lines together, review, commit). Phase ship commits carry summary bodies. All commits include `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>` trailer.

**Branch:** `master`.

**Guardrails on every task:**
- `npm test` green after each authoring pass (parity fence must pass).
- `npm run lint` after multi-file changes.
- SCS pairs every EN leaf. No orphan keys.
- Native-speaker review for Gaelic fragments before merge.
- Per-pool voice register (per spec §3) read-aloud verified.

---

## File structure

### New files

*(None — pure content authoring into existing files.)*

### Modified files

| Path | Change per phase |
|------|------|
| `src/core/i18n.ts` | New EN banter leaf keys per pool. Alphabetical within each sub-object. |
| `src/core/i18n.scs.ts` | Matching SCS keys. |
| `src/data/banter.ts` | Pool definitions for 5 new pools; trigger-wiring metadata. |
| `src/systems/BanterSystem.ts` | New subscription hooks per pool. |
| `src/utils/save.ts` | Schema bump — `firstTimeEventsFired: Set<string>` + `seenEnemies: Set<string>` (if not present). |
| `src/utils/save.test.ts` | Migration tests. |
| `docs/BANTER_GAPS.md` | "What shipped in Phase C" section updated per phase. |

---

## Milestone plan

- **Phase 1 — Infrastructure** (tasks 1–8). New pool definitions, trigger wiring, save-schema bump. Ship with 0 authored lines — infra only. Ship gate: parity fence green, old banter continues firing.
- **Phase 2 — Core authoring** (tasks 9–16). Gran pool (40), haggis monologue (50), moor moment expansion (40), death reflections (30). ~160 lines × 2 locales = 320 leaves.
- **Phase 3 — Flavour authoring** (tasks 17–20). Enemy flavour (100), first-time reserved (30). ~130 lines × 2 locales.
- **Phase 4 — Specialist voices** (tasks 21–24). Cailleach whispers (20), Burns citations (20). ~40 lines × 2 locales.
- **Phase 5 — Seasonal tie-in** (tasks 25–28, coordinated with E1). Burns Night + Hogmanay + Samhain pools. ~60 lines × 2 locales.

Each phase ends with a ship gate: parity fence green, manual read-aloud pass by author + reviewer, `npm run ci:all` green.

---

## Phase 1 — Infrastructure

> **2026-04-23 status:** Tasks 1, 2, 7 shipped. Tasks 3–6 (trigger wiring) deferred to Phase 2 — wiring hooks before content is dead code and the trigger surface may reshape once authoring begins. Each hook will land alongside its pool's authored leaves.

### Task 1: Save schema bump (v6 → v7)

**Files:** `src/utils/save.ts`, `src/utils/save.test.ts`.

- [ ] **Step 1:** Write failing test for `SaveData.firstTimeEventsFired` default empty Set; `seenEnemies` default empty Set (if not present).
- [ ] **Step 2:** Add fields to `SaveData` interface + `DEFAULT_SAVE`; write migration case v6 → v7 defaulting fields to empty.
- [ ] **Step 3:** Run `npm test` — green.
- [ ] **Step 4:** Commit: `feat(save): schema v7 — banter first-time-events tracking`.

### Task 2: Pool registration in `banter.ts`

**Files:** `src/data/banter.ts`, `src/data/banter.test.ts` (if exists; else add).

- [ ] **Step 1:** Failing test: `POOL_PRIORITIES.gran_commentary === 30`, similar for `haggis_ambient: 25`, `enemy_ambient: 40`, `cailleach_whisper: 55`, `burns_citation: 45`, `first_time: 110`, `seasonal_event: 65`.
- [ ] **Step 2:** Add pool entries per spec §3.
- [ ] **Step 3:** Green.
- [ ] **Step 4:** Commit: `feat(banter): register 7 new pools (empty)`.

### Task 3: `gran_commentary` pool wiring

**Files:** `src/systems/BanterSystem.ts`.

- [ ] **Step 1:** Failing test: `BanterSystem.onRunStart()` emits attempt-fire for `gran_commentary`.
- [ ] **Step 2:** Wire emission on `run:start`, `run:end`, `moor_moment_surfaced`, `seasonal_event_start`.
- [ ] **Step 3:** Green.
- [ ] **Step 4:** Commit.

### Task 4: `haggis_ambient` interval-trigger wiring

- [ ] **Step 1:** Failing test: tick 45s with no combat → ambient pool attempts emit.
- [ ] **Step 2:** Implement interval timer (45s ± 15s random). Only fires when HP > 75% and no enemy within 200px for 10s.
- [ ] **Step 3:** Commit.

### Task 5: `enemy_ambient` first-encounter + rare-respawn wiring

- [ ] **Step 1:** Failing test: first-ever spawn of enemy type → emit; subsequent spawns only at 1/20 rate.
- [ ] **Step 2:** Implement; tracks via `SaveData.seenEnemies`.
- [ ] **Step 3:** Commit.

### Task 6: `cailleach_whisper`, `burns_citation`, `first_time`, `seasonal_event` wiring

(Consolidated — each is a thin hook; one commit per.)

- [ ] **Step 1:** Failing test per hook.
- [ ] **Step 2:** Implement hooks.
- [ ] **Step 3:** Commit per hook.

### Task 7: Parity fence scope verification

**Files:** `src/core/i18n.locale.test.ts`.

- [ ] **Step 1:** Verify fence scope already covers `ui.banter.*` — if not, extend.
- [ ] **Step 2:** Add manual-run check — add a dummy EN leaf without SCS → parity fence fails → remove dummy.
- [ ] **Step 3:** Commit if test file touched.

### Task 8: Phase 1 ship gate

- [ ] Schema migration tested.
- [ ] 7 new pools registered with trigger hooks.
- [ ] No authored content yet — fence green because no new leaves yet.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(banter): Phase 1 — infrastructure shipped (pools + hooks, 0 lines)`.

---

## Phase 2 — Core authoring (160 EN + 160 SCS)

Each authoring task = write one pool completely (EN + SCS), commit together, parity fence stays green.

### Task 9: Gran pool (40 EN + 40 SCS)

**Files:** `src/core/i18n.ts`, `src/core/i18n.scs.ts`.

- [ ] **Step 1:** Author 40 EN lines under `ui.banter.gran_commentary.*`. Per `VOICE_CARD.md` Gran section: warm, arm-around-shoulder, cuppa-energy.
- [ ] **Step 2:** Author matching 40 SCS lines. Parity fence green.
- [ ] **Step 3:** Manual read-aloud pass with reviewer.
- [ ] **Step 4:** Commit: `content(banter): Gran commentary pool — 40 EN + 40 SCS`.

### Task 10: Haggis inner monologue (50 EN + 50 SCS)

- [ ] **Step 1:** Author under `ui.banter.haggis_ambient.*`. Simple wee-beastie voice.
- [ ] **Step 2:** Pair SCS.
- [ ] **Step 3:** Read-aloud pass.
- [ ] **Step 4:** Commit: `content(banter): haggis ambient monologue — 50 EN + 50 SCS`.

### Task 11: Moor moment expansion (40 EN + 40 SCS)

- [ ] **Step 1:** Expand existing `ui.banter.moor_moment.*` pool. Targets: peat-glint, heather-rest, warm-stone, bog-stone, loch-breath, practice-chanter, whisky-nip, kite-cry, distant-sheep, wind-shift, etc.
- [ ] **Step 2:** Pair SCS.
- [ ] **Step 3:** Commit.

### Task 12: Death reflections by cause (30 EN + 30 SCS)

- [ ] **Step 1:** Per `DeathCauseTracker` categories, author ~3 variant lines per cause-group. Warm framing, never shaming.
- [ ] **Step 2:** Pair SCS.
- [ ] **Step 3:** Commit.

### Tasks 13–15: Per-pool reviewer pass + banter test updates

- [ ] **Step 1:** Reviewer reads 40 Gran lines aloud, flags any that miss voice register.
- [ ] **Step 2:** Author rewrites flagged lines.
- [ ] **Step 3:** Repeat for haggis, moor, death pools.

### Task 16: Phase 2 ship gate

- [ ] Four pools authored; all parity-fenced.
- [ ] Manual read-aloud verified by author + reviewer.
- [ ] `docs/BANTER_GAPS.md` updated "What shipped in Phase C".
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(banter): Phase 2 — core pools complete (Gran + haggis + moor + death)`.

---

## Phase 3 — Flavour authoring (130 EN + 130 SCS)

### Task 17: Enemy flavour (100 EN + 100 SCS)

- [ ] **Step 1:** Author 2–5 lines per enemy (32 shipped enemies + 5 bosses). Each banter tonally matches enemy family (Fae warm-tricksy, Urban sharp-comic, Weather elemental-thin, etc. per spec §3).
- [ ] **Step 2:** Pair SCS for each.
- [ ] **Step 3:** Commit per family (5 commits): Cryptids / Faerie Courts / Weather / Urban / Academic / Taxman.

### Task 18: First-time reserved lines (30 EN + 30 SCS)

- [ ] **Step 1:** Author reserved lines for: each boss first-kill (5), each evolution first-pickup (8), first combo 100, first Moor Road route (each), first variant unlock (13), first daily clear, first Ironmoor victory.
- [ ] **Step 2:** Flag each as `first_time` priority 110 in pool config.
- [ ] **Step 3:** Pair SCS.
- [ ] **Step 4:** Commit.

### Task 19: Reviewer pass

- [ ] **Step 1:** Read-aloud each family's pool.
- [ ] **Step 2:** Flag any voice-drift; rewrite.
- [ ] **Step 3:** Commit fixes.

### Task 20: Phase 3 ship gate

- [ ] Enemy + first-time pools complete.
- [ ] Parity fence green.
- [ ] `docs/BANTER_GAPS.md` updated.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(banter): Phase 3 — flavour pools complete (enemy + first-time)`.

---

## Phase 4 — Specialist voices (40 EN + 40 SCS)

### Task 21: Cailleach whispers (20 EN + 20 SCS)

- [ ] **Step 1:** Author per VOICE_CARD Cailleach register: Gaelic-inflected, stern-but-fond, elder-motherly. Include 3–5 Gaelic phrases with English context.
- [ ] **Step 2:** **Native-speaker review on Gaelic fragments** — merge-blocker per `CULTURAL_SENSITIVITIES_RESEARCH.md §3.1`.
- [ ] **Step 3:** Pair SCS.
- [ ] **Step 4:** Commit.

### Task 22: Burns citations (20 EN + 20 SCS)

- [ ] **Step 1:** Author citations — every line is either a direct Burns quotation (verified against authoritative edition) or a close paraphrase marked as such.
- [ ] **Step 2:** Pair SCS (Scots originals stay; English adjacency where needed for comprehension).
- [ ] **Step 3:** Commit.

### Task 23: Reviewer pass — specialist voices

- [ ] **Step 1:** Read-aloud Cailleach pool; Scottish-native check on Gaelic.
- [ ] **Step 2:** Read-aloud Burns pool; verify each quotation against source.
- [ ] **Step 3:** Commit fixes.

### Task 24: Phase 4 ship gate

- [ ] Two specialist pools complete.
- [ ] Gaelic native-speaker review confirmed.
- [ ] Burns quotations sourced.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(banter): Phase 4 — specialist voices complete (Cailleach + Burns)`.

---

## Phase 5 — Seasonal tie-in (60 EN + 60 SCS)

*Coordinated with E1 Seasonal Events flagship. If E1 ships first, this phase lands automatically; if B1 ships first, pools are authored-but-unreached until E1 lands.*

### Task 25: Burns Night pool (20 EN + 20 SCS)

- [ ] **Step 1:** Author 10 Gran-voice croft-entry lines + 5 run-start pipes-in lines + 5 haggis-platter-pickup lines. Burns-citational register per spec §3.
- [ ] **Step 2:** Pair SCS.
- [ ] **Step 3:** Commit.

### Task 26: Hogmanay pool (20 EN + 20 SCS)

- [ ] **Step 1:** Author first-footer dialogue, Auld Lang Syne-evoking lines, warm-family banter.
- [ ] **Step 2:** Pair SCS.
- [ ] **Step 3:** Commit.

### Task 27: Samhain pool (20 EN + 20 SCS)

- [ ] **Step 1:** Author veil-thinning, Cat-Sith-adjacent, Cailleach-dark-humour banter.
- [ ] **Step 2:** Pair SCS.
- [ ] **Step 3:** Commit.

### Task 28: Phase 5 ship gate

- [ ] Three seasonal pools complete.
- [ ] Parity fence green.
- [ ] `docs/BANTER_GAPS.md` "Phase C complete".
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(banter): Phase 5 — seasonal pools complete (Burns Night + Hogmanay + Samhain)`.

---

## Final ship gate (B1 complete)

- [ ] All 9 pools populated per spec targets (780+ total leaves).
- [ ] Parity fence green.
- [ ] `docs/BANTER_GAPS.md` "Phase C complete" with voice-register coverage table.
- [ ] Manual playtest: run a full Moor Road with Natural banter frequency; confirm no dead silences and no fatigue-level density.
- [ ] `npm run ci:all` green.
- [ ] Ship commit: `feat(banter): B1 — banter density push complete (780+ lines across 9 pools, EN + SCS)`.

---

## Risk-watch during execution

| Signal | Response |
|---|---|
| Parity fence red after an authoring session | Fix SCS before closing session. Never commit with red fence. |
| Banter fatigue in playtest (>3/10 testers cite) | Lower default `banterFrequency` to Sparing; re-check. |
| Gaelic review delayed > 2 weeks | Hold Cailleach pool; proceed with Burns + seasonal pools. |
| Voice drift across 780 lines | Re-read each pool by same author after 48h break; correct drift. |
| Enemy family mismatch | Reviewer cross-checks each enemy's banter against its design family tag. |
