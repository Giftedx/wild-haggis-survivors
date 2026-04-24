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

### Task 1: `RelicDef` + 8 common Relics ✅ shipped (`861e32c`)

**Files:** Create `src/data/relics.ts`, `src/data/relics.test.ts`.

- [x] **Step 1:** Failing test: `RELICS.sporran_of_holding.rarity === 'common'`; `RELICS.sporran_of_holding.dropAffinity.includes('elite')`.
- [x] **Step 2:** Define `RelicDef` interface; author 8 common relics per spec §3 with nameKey, effectKey, flavourKey, dropAffinity.
- [x] **Step 3:** Green.
- [x] **Step 4:** Commit: `feat(relics): data for 8 common Relics`.

### Task 2: 7 uncommon Relics ✅ shipped (`fc4c207`)

- [x] **Step 1:** Failing test: 7 uncommon relics present.
- [x] **Step 2:** Author per spec.
- [x] **Step 3:** Commit.

### Task 3: 3 rare Relics ✅ shipped (`5ef9ec7`)

- [x] **Step 1:** Failing test: 3 rare relics present.
- [x] **Step 2:** Author per spec (Gran's Teapot, Fingal's Horn, Stone of Destiny shard).
- [x] **Step 3:** Commit.

### Task 4: Rarity distribution assertion ✅ shipped (`ceab0ca`, fix `ff007a5`)

- [x] **Step 1:** Failing test: 8 + 7 + 3 = 18 total; `RARITY_DROP_WEIGHTS` = `{ common: 50, uncommon: 35, rare: 15 }` sums to 100. (Counts 8/7/3 are the *catalogue split*; 50/35/15 are the *drop-pool weights* M2 consumes.)
- [x] **Step 2:** Implement via `test.ts` computation.
- [x] **Step 3:** Commit.

### Task 5: `RunHistoryEntry.relics` schema ✅ shipped (`1ba20d3`)

**Files:** `src/utils/save.ts`, `src/utils/save.test.ts`.

> **Correction:** Plan originally said v7 → v8. Actual bump is v8 → v9 — C1 Highland Almanac already used v8 before this plan shipped.

- [x] **Step 1:** Failing tests: v7→v9 + v8→v9 migrations set `relics: []`; stale-key filter drops unknown keys; `applyRunSummary` with `context.relics` threads through; default-empty when context omits.
- [x] **Step 2:** Bumped `SAVE_SCHEMA_VERSION` 8→9; added optional field; `migrateV8ToV9` pure version bump; switch `case 8`; `coerceRunHistoryEntry` filters via `RELIC_KEYS.includes`.
- [x] **Step 3:** Green.
- [x] **Step 4:** Commit: `feat(save): schema v9 — RunHistoryEntry.relics`.

### Task 6–9: Pure-function effect implementations (8 common) ✅ shipped (`376c58c`, `0e2f279`, `bd239ab`, `3b4d588`)

One task per 2 relics. Each task:
- [x] **Step 1:** Failing test per relic (normal / edge / boundary cases; stateful helpers thread state through input+output).
- [x] **Step 2:** Implement as pure function in `src/systems/relics/relicEffects.ts`. Stateful helpers (`applyBronzeClaspFirstHit`, `applyWhiskyDramActivation`) expose `Object.freeze`d `initial<Name>State` exports.
- [x] **Step 3:** Green.
- [x] **Step 4:** Commit per pair: `feat(relics): effects — {relic_a} + {relic_b}`.

### Task 10: M1 ship gate

- [x] 18 relics defined; 8 common effects implemented + unit-tested (10 uncommon + rare deferred to M2/M3 per spec §6); schema migrated v8→v9.
- [x] `npm run ci` green (lint + 3243 vitest + tsc + vite build). E2E deferred to M2 ship gate once `e2e/relic-pickup.spec.ts` lands.
- [x] Commit: `feat(relics): M1 — data + schema + pure effects complete`.

---

## M2 — Drop-roll + pickup

### Task 11: `RelicSystem` skeleton ✅ shipped (`2bfad02`)

**Files:** `src/systems/RelicSystem.ts` + test.

- [x] **Step 1:** Failing test: `RelicSystem.playerSlots.length === 3` on init.
- [x] **Step 2:** Implement slot model.
- [x] **Step 3:** Commit.

### Task 12: Drop-roll math ✅ shipped (`f923951`)

- [x] **Step 1:** Failing test: `rollDrop('elite', rng)` returns a `RelicDef` ~15% of the time weighted 50/35/15 across rarities.
- [x] **Step 2:** Implement with seeded RNG from run-wide state.
- [x] **Step 3:** Commit.

### Task 13: Elite-kill drop hook ✅ shipped (`c3b1c54`, wiring `5bfb1a7`)

**Files:** `src/scenes/game/EnemyKillHandler.ts` (plan cited `SpawnSystem`; the elite-kill cascade lives in `EnemyKillHandler`).

- [x] **Step 1:** Failing test: on-elite-death event fires `onEliteKilled(x, y)` hook.
- [x] **Step 2:** Wire hook through to `GameScene.rollAndSpawnRelic('elite', x, y)`.
- [x] **Step 3:** Commit.

### Task 14: Boss drop hook ✅ shipped (`c3b1c54`, wiring `5bfb1a7`)

**Files:** `src/scenes/game/EnemyKillHandler.ts` (plan cited `handleBossDeath.ts`; the boss path lives inline in `EnemyKillHandler`).

- [x] **Step 1:** Failing test: Tier-2+ bosses (tour_bus, the_laird, hunter_general, taxman) guarantee drop; gordon doesn't — whitelist in `data/relicDrops.ts`.
- [x] **Step 2:** Wire `onBossKilled(bossKey, x, y)` + GameScene routing.
- [x] **Step 3:** Commit.

### Task 15: Chest override ✅ shipped (`7cc19a6`, wiring `5bfb1a7`)

**Files:** `src/scenes/game/LevelUpFlow.ts` (plan cited `evolutionChest.ts`; the chest evolution flow lives on `LevelUpFlow.offerChestEvolution`).

- [x] **Step 1:** Hook `tryChestLegendaryRelicOverride?()` added on `LevelUpFlowHooks` — returns true to suppress the evolution card.
- [x] **Step 2:** `GameScene.tryRelicChestOverride` rolls 25% and spawns a Relic pickup next to the player.
- [x] **Step 3:** Commit.

### Task 16: Pickup entity ✅ shipped (`868c83d`)

**Files:** `src/entities/RelicPickup.ts` + `src/entities/relicPickupMath.ts` + test.

- [x] **Step 1:** Failing test: pickup radius, 60s lifetime, within-range predicate.
- [x] **Step 2:** Implement `RelicPickupSpawner` — programmatic gem tinted by `particleColour`; unique iconSprite textures land in BootScene at M3.
- [x] **Step 3:** Commit. (Walk-over pickup matches existing collectable vocabulary; spec's "press action key" treated as label, not a keypress gate.)

### Task 17: 4th-relic discard UI ✅ shipped (`2890fd3`)

**Files:** `src/ui/RelicPickupPrompt.ts` + `src/ui/relicCollect.ts` + test.

- [x] **Step 1:** Pure `decideRelicCollect` routes to `add` / `discard_ui` / `skip_duplicate`.
- [x] **Step 2:** `openRelicPickupPrompt` renders the 4-card modal (3 held + incoming) with Escape + click-incoming reject. GameScene drives `RELIC_DISCARD` time token.
- [x] **Step 3:** Commit. (i18n `ui.relics.sporran_full.*` + relic name/effect keys fall through to pretty-printed placeholders; full authoring lands at M4 Task 25.)

### Task 18: M2 ship gate + `e2e/relic-pickup.spec.ts` ✅ shipped (`5414c26`)

- [x] `e2e/relic-pickup.spec.ts`: spawn Relic at player pos → overlap → `DEBUG.getHeldRelicKeys` reflects pickup. Deterministic via DEBUG seam; probabilistic drop math covered by unit tests.
- [x] `npm run ci` green (lint + 3299 vitest + tsc + vite build). Full Playwright suite green (52 passed, 4 skipped) across chromium/firefox/webkit + mobile.
- [x] Commit: `feat(relics): M2 — drop-roll + pickup + discard UI complete`.

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
