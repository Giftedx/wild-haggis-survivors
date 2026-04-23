# R1 — Relics (third progression tier) implementation plan

> **STATUS:** Draft.
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the 18 Relic catalogue with 3-slot-cap pickup flow, drop-roll infrastructure, per-Relic effect application, HUD slots, and pickup UI per `docs/superpowers/specs/2026-04-23-relics-third-tier-design.md`. 4 milestones.

**Architecture:** New `RelicSystem` drives 3-slot player state. Pure-function relic effects live in `src/systems/relics/relicEffects.ts` (testable without Phaser). Drop rolls hook into `SpawnSystem` (elite deaths), `handleBossDeath` (boss drops), `evolutionChest` (legendary overrides), M1 node-system (hidden-node rewards — deferred if M1 not shipped). Save schema adds `RunHistoryEntry.relics` for Chronicle display.

**Tech Stack:** TypeScript strict, Phaser 3.90+, Vitest, Playwright. Path alias `@/*` → `./src/*`.

**Commit cadence:** One commit per TDD cycle. All commits `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`.

**Branch:** `master`.

**Guardrails on every task:**
- `npm test` green after each impl step.
- `npm run lint` after multi-file changes.
- No `as any`. Zero TODO/FIXME.
- Relic effects must be pure functions; side-effect hooks explicit.

---

## File structure

### New files

| Path | Responsibility |
|------|----------------|
| `src/data/relics.ts` | 18-relic catalogue + `RelicDef` interface. |
| `src/data/relics.test.ts` | Shape assertions (rarity distribution, drop-affinity coverage). |
| `src/systems/RelicSystem.ts` | Player slot state, drop-roll orchestration. |
| `src/systems/RelicSystem.test.ts` | Slot-cap, drop-roll-weighting, lifecycle tests. |
| `src/systems/relics/relicEffects.ts` | Pure-function effect implementations. |
| `src/systems/relics/relicEffects.test.ts` | Per-relic effect coverage. |
| `src/systems/relics/relicConditions.ts` | Shared per-frame/on-event evaluators. |
| `src/data/relicDrops.ts` | Drop-source wiring (elite rate, boss triggers, chest overrides). |
| `src/data/relicDrops.test.ts` | Drop-rate math tests. |
| `src/ui/RelicSlotUI.ts` | HUD slot widget. |
| `src/ui/RelicPickupPrompt.ts` | 4th-relic discard picker UI. |
| `e2e/relic-pickup.spec.ts` | Playwright smoke. |

### Modified files

| Path | Change |
|------|--------|
| `src/utils/save.ts` | Schema bump. Add `RunHistoryEntry.relics: RelicKey[]`. |
| `src/utils/save.test.ts` | Migration + round-trip tests. |
| `src/systems/SpawnSystem.ts` | Elite-death hook calls `RelicSystem.rollDrop('elite', pos)`. |
| `src/scenes/game/handleBossDeath.ts` | Tier-2+ bosses call `RelicSystem.dropGuaranteed(boss, pos)`. |
| `src/scenes/game/evolutionChest.ts` | Legendary chest roll 25% overrides to Relic. |
| `src/entities/Player.ts` | New `relicSlots: [Slot, Slot, Slot]`. `applyRelicEffects(delta)` each update. |
| `src/core/i18n.ts` + `.scs.ts` | ~108 keys × 2 locales. |
| `src/data/banter.ts` | `relic_pickup` pool, priority 50; first-Relic reserved line. |
| `src/scenes/game/PauseMenu.ts` | New "Relics" tab. |
| `src/scenes/ChronicleScene.ts` | Show held Relics per past run. |

---

## Milestone plan

- **M1 — Data + schema** (tasks 1–10). Relic catalogue, schema migration, pure-function effects, condition evaluators. Ship gate: all 18 effects unit-tested; save migration tested.
- **M2 — Drop-roll + pickup** (tasks 11–18). Drop-source wiring, pickup entity, 4th-relic discard UI. Ship gate: e2e smoke of drop → pickup.
- **M3 — Effect application + UI** (tasks 19–24). HUD slots, Player hook wiring per-frame, pause menu Relic tab. Ship gate: manual smoke with 3 Relics held, effects visible.
- **M4 — Balance + launch** (tasks 25–30). Playtest telemetry setup, banter authoring, i18n population, Chronicle display. Ship gate: launch telemetry enabled, flagship kill criteria met.

---

## M1 — Data + schema

### Task 1: `RelicDef` + 8 common Relics

**Files:** Create `src/data/relics.ts`, `src/data/relics.test.ts`.

- [ ] **Step 1:** Failing test: `RELICS.sporran_of_holding.rarity === 'common'`; `RELICS.sporran_of_holding.dropAffinity.includes('elite')`.
- [ ] **Step 2:** Define `RelicDef` interface; author 8 common relics per spec §3 with nameKey, effectKey, flavourKey, dropAffinity.
- [ ] **Step 3:** Green.
- [ ] **Step 4:** Commit: `feat(relics): data for 8 common Relics`.

### Task 2: 7 uncommon Relics

- [ ] **Step 1:** Failing test: 7 uncommon relics present.
- [ ] **Step 2:** Author per spec.
- [ ] **Step 3:** Commit.

### Task 3: 3 rare Relics

- [ ] **Step 1:** Failing test: 3 rare relics present.
- [ ] **Step 2:** Author per spec (Gran's Teapot, Fingal's Horn, Stone of Destiny shard).
- [ ] **Step 3:** Commit.

### Task 4: Rarity distribution assertion

- [ ] **Step 1:** Failing test: 8 + 7 + 3 = 18 total; rarities aggregate to 50/35/15 weight.
- [ ] **Step 2:** Implement via `test.ts` computation.
- [ ] **Step 3:** Commit.

### Task 5: `RunHistoryEntry.relics` schema

**Files:** `src/utils/save.ts`, `src/utils/save.test.ts`.

- [ ] **Step 1:** Failing test: save v7 → v8 migration sets `relics: []` on existing runHistory entries.
- [ ] **Step 2:** Bump `SAVE_SCHEMA_VERSION`; add field; write migration.
- [ ] **Step 3:** Green.
- [ ] **Step 4:** Commit: `feat(save): schema v8 — RunHistoryEntry.relics`.

### Task 6–9: Pure-function effect implementations (8 common)

One task per 2 relics. Each task:
- [ ] **Step 1:** Failing test per relic (e.g., `applySporranOfHolding(gold: 5)` returns `7`).
- [ ] **Step 2:** Implement as pure function.
- [ ] **Step 3:** Green.
- [ ] **Step 4:** Commit: `feat(relics): effect — {relic_key}`.

### Task 10: M1 ship gate

- [ ] 18 relics defined; 18 effects implemented + unit tested; schema migrated.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(relics): M1 — data + schema + pure effects complete`.

---

## M2 — Drop-roll + pickup

### Task 11: `RelicSystem` skeleton

**Files:** `src/systems/RelicSystem.ts` + test.

- [ ] **Step 1:** Failing test: `RelicSystem.playerSlots.length === 3` on init.
- [ ] **Step 2:** Implement slot model.
- [ ] **Step 3:** Commit.

### Task 12: Drop-roll math

- [ ] **Step 1:** Failing test: `rollDrop('elite', rng)` returns a `RelicDef` ~15% of the time weighted 50/35/15 across rarities.
- [ ] **Step 2:** Implement with seeded RNG from run-wide state.
- [ ] **Step 3:** Commit.

### Task 13: Elite-kill drop hook

**Files:** `src/systems/SpawnSystem.ts`.

- [ ] **Step 1:** Failing test: on-elite-death event fires `RelicSystem.rollDrop('elite', pos)`.
- [ ] **Step 2:** Wire hook.
- [ ] **Step 3:** Commit.

### Task 14: Boss drop hook

**Files:** `src/scenes/game/handleBossDeath.ts`.

- [ ] **Step 1:** Failing test: Tier-2+ bosses (tour_bus, laird, hunter_general, taxman) guarantee drop; Gordon doesn't.
- [ ] **Step 2:** Wire conditional drop.
- [ ] **Step 3:** Commit.

### Task 15: Chest override

**Files:** `src/scenes/game/evolutionChest.ts`.

- [ ] **Step 1:** Failing test: legendary chest roll 25% replaces weapon/evolution with Relic.
- [ ] **Step 2:** Wire override.
- [ ] **Step 3:** Commit.

### Task 16: Pickup entity

**Files:** New `src/entities/RelicPickup.ts` + test.

- [ ] **Step 1:** Failing test: spawned pickup lives 60s; pickup-prompt triggers within player range.
- [ ] **Step 2:** Implement as Phaser sprite with proximity check.
- [ ] **Step 3:** Commit.

### Task 17: 4th-relic discard UI

**Files:** `src/ui/RelicPickupPrompt.ts`.

- [ ] **Step 1:** Failing smoke test: when 3 slots full + 4th offered, UI opens with 3 held + incoming relic; player picks one to discard.
- [ ] **Step 2:** Implement modal UI.
- [ ] **Step 3:** Commit.

### Task 18: M2 ship gate + `e2e/relic-pickup.spec.ts`

- [ ] `e2e/relic-pickup.spec.ts`: kill elite → Relic drops → walk over → HUD slot filled.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(relics): M2 — drop-roll + pickup complete`.

---

## M3 — Effect application + UI

### Task 19: Player per-frame effect hook

**Files:** `src/entities/Player.ts`.

- [ ] **Step 1:** Failing test: `applyRelicEffects(delta)` iterates slots and applies per-frame effects.
- [ ] **Step 2:** Wire hook in `Player.update()`.
- [ ] **Step 3:** Commit.

### Task 20: On-event hooks (onPickupGem, onEnterHealingCircle, etc.)

- [ ] **Step 1:** Failing tests per event-hook relic effect.
- [ ] **Step 2:** Wire each to appropriate game event.
- [ ] **Step 3:** Commit per 2–3 events.

### Task 21: Active-Relic sporran-menu trigger

- [ ] **Step 1:** Failing smoke test: Whisky Dram / Fingal's Horn trigger from PauseMenu.
- [ ] **Step 2:** Add "Relics" tab to pause menu; activatable relics have "Use" button.
- [ ] **Step 3:** Commit.

### Task 22: HUD slot widget

**Files:** `src/ui/RelicSlotUI.ts`.

- [ ] **Step 1:** Failing smoke test: 3 slots render; empty slots show dotted placeholder.
- [ ] **Step 2:** Implement. Respects `uiScale`.
- [ ] **Step 3:** Commit.

### Task 23: Tooltip on hover

- [ ] **Step 1:** Failing test: hover reveals name + effect + flavour text.
- [ ] **Step 2:** Implement.
- [ ] **Step 3:** Commit.

### Task 24: M3 ship gate

- [ ] Manual smoke with 3 Relics picked up; confirm HUD, effects, pause menu.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(relics): M3 — effect application + UI complete`.

---

## M4 — Balance + launch

### Task 25: i18n authoring (108 keys × 2)

**Files:** `src/core/i18n.ts`, `src/core/i18n.scs.ts`.

- [ ] **Step 1:** 18 name + 18 effect + 18 flavour keys × 2 locales. Parity fence green.
- [ ] **Step 2:** Commit: `content(i18n): Relic names + effects + flavour`.

### Task 26: Banter — first-relic reserved line

- [ ] **Step 1:** Author first-Relic-pickup banter (Gran voice, priority 110 first-time).
- [ ] **Step 2:** SCS pair.
- [ ] **Step 3:** Commit.

### Task 27: Chronicle display

- [ ] **Step 1:** Show held Relics per past run in Chronicle row.
- [ ] **Step 2:** Commit.

### Task 28: Analytics opt-in for Relic pick rates

- [ ] **Step 1:** Record Relic pickup events in `AnalyticsManager` (consent-gated per existing telemetry pattern).
- [ ] **Step 2:** Commit.

### Task 29: Internal playtest

- [ ] **Step 1:** 3 playtesters run 10 runs each. Record: per-Relic pick rate, per-Relic win rate, discard-UI confusion rate.
- [ ] **Step 2:** Rebalance based on findings.

### Task 30: M4 ship gate

- [ ] No Relic has >70% win rate.
- [ ] No Relic has <5% pick rate (if so, cut or rework).
- [ ] Bundle delta ≤ +40 KB gzip (verify build output).
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(relics): R1 — Relics (third progression tier) shipped`.

---

## Final ship gate (R1 complete)

- [ ] All 18 Relics shipping with effects, tooltips, pickup UI, HUD slots, Chronicle display.
- [ ] Playtest telemetry shows healthy distribution (no dominance).
- [ ] Bundle delta within budget.
- [ ] No crash path across 0/1/2/3 held + 4th offered combinations.
- [ ] `npm run ci:all` green.
- [ ] Commit: ship banner.
