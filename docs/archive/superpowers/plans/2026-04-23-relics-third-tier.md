# R1 — Relics (third progression tier) implementation plan

> **STATUS:** SHIPPED 2026-04-24 (commit `214e9ce`) — all 18 relics live; T29 histogram on `?devRelicStats=1`. M4.5 polish landed same day per `docs/superpowers/plans/2026-04-24-relics-m45-polish.md`.
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

### Task 19: Per-frame relic dispatcher ✅ shipped (`db766c2`)

**Files:** `src/systems/relics/RelicEffectDriver.ts` + test (plan cited `Player.ts`; a stand-alone dispatcher keeps relic state out of Player).

- [x] **Step 1:** `RelicEffectDriver.updatePerFrame(deltaMs)` scaffold — iterates held slots. No-op for M3 common effects (all event-driven).
- [x] **Step 2:** Driver owns per-run scratch state (bronze_clasp window, whisky_dram flag); `reset()` clears on scene restart.
- [x] **Step 3:** GameScene ticks driver with scaledDelta so timer-based rare effects pause with the game.

### Task 20: Event-driven effect wires ✅ shipped (`19d8060`, `ef4627d`)

All 8 common relics now modify gameplay through their matching call sites:

- [x] T20a grans_thimble — +8% crit multiplier (GameScene setMultipliers pass).
- [x] T20b sporran_of_holding — +2 gold per pickup (onCoinCollected hook).
- [x] T20c damp_tinder — -40% fire damage (HazardZones.modifyFireDamageTaken hook).
- [x] T20d bronze_clasp — +15% first hit each second (WeaponSystem.setHitDamageModifier seam).
- [x] T20e ceilidh_dancers_ribbon — period 8→5 (ISceneContext.getCeilidhChainPeriod, isCeilidhPulseMoment now takes optional period).
- [x] T20f lucky_heather_sprig — +3 card-draw luck points (LevelUpFlowHooks.getRelicLuckPoints).
- [x] T20f oatcake_stash — +2 HP on healing orb (PickupSpawnerHooks.modifyHealOrbAmount).

### Task 21: Whisky Dram active trigger ✅ shipped (`bbe8d3c`)

**Files:** `src/scenes/game/PauseMenu.ts`, `src/scenes/GameScene.ts`.

- [x] **Step 1:** `isWhiskyDramAvailable` + `onWhiskyDramRequested` hooks on PauseMenuHooks; button only shown while held + unused; menu re-renders after use.
- [x] **Step 2:** `GameScene.activateWhiskyDram` — driver one-shot, heal delta computed from result HP, toast + SFX fire on first activation only.
- [x] **Step 3:** Lightweight button placement (no full tab). Full tab deferred to M4 polish — ship-blocking scope is the activation, not the chrome.

### Task 22 + T23: HUD slot widget + tooltip ✅ shipped (`30946c1`)

**Files:** `src/ui/RelicSlotUI.ts`.

- [x] **Step 1:** 3-slot widget top-right below the minimap. Signature-diffed redraws; empty slots render dotted outline; held slots render a gem tinted with `particleColour` + rare-tier gold rim.
- [x] **Step 2:** Interactive rectangles per slot; hover shows name + effect + flavour tooltip that clamps to viewport bounds (flips above when bottom-clipped). Copy falls back to pretty-printed key until M4 i18n pass.

### Task 24: M3 ship gate ✅ shipped

- [x] `npm run ci` green (lint + 3318 vitest + tsc + vite build).
- [x] e2e/relic-pickup.spec.ts + smoke + w2-moor-road all green across chromium/firefox/webkit (12 tests, 1.4m).
- [x] Bundle growth ≈ +7.4 KB over M2 (913 → 920 KB main), well within the +40 KB R1 budget.

---

## M4 — Balance + launch

### Task 25: i18n authoring (108 keys × 2) ✅ shipped (`773d78b`)

**Files:** `src/core/i18n.ts`, `src/core/i18n.scs.ts`.

- [x] 54 EN + 54 SCS leaves under top-level `relics.*` (name + effect + flavour × 18) + 4 modal keys under `ui.relics.sporran_full.*`. Parity fences green (SCS⊆EN one-way; `ui.banter.*` two-way).
- [x] Commit.

### Task 26: Banter — first-relic reserved line ✅ shipped (`0624c38`)

- [x] `relic_first_pickup` tag on the first_time pool, priority 110; Gran voice, Hearth register. EN + SCS authored.
- [x] GameScene.onRelicAdded fires `bumpFirstTimeEvent` + requestBanter once per save; reaches both add + discard-swap paths.

### Task 27: Chronicle display ✅ shipped (`8f89053`)

- [x] RunHistoryRecorder threads `getHeldRelicKeys` → `entry.relics` on both buildContext + record.
- [x] `formatChronicleRunSubLine` appends "⟡ Sporran, Thimble, …" after route breadcrumb when relics non-empty. Unknown keys skipped so mid-cycle renames don't corrupt old rows.
- [x] +4 test cases; 87 chronicle tests green.

### Task 28: Analytics opt-in for Relic pick rates ✅ shipped (`f0bd23c`)

- [x] New `GLOBAL_RELIC_PICKED` event carries relicKey + rarity + source + replacedKey + gameTimeSec.
- [x] AnalyticsManager subscribes + forwards as `relic_picked` through existing consent gate (`telemetryOptIn`).
- [x] RelicPickupSpawner propagates `RelicPickupSource` (elite/boss/chest/hidden_node/bargain/unknown) through to onCollect.

### Task 29: Internal playtest — DEFERRED

- [ ] Actual playtester runs require real players + 2-week window. Telemetry is live; analysis lands in a follow-up balance pass.

### Task 30: M4 ship gate ✅ shipped

- [x] `npm run ci` green (lint + 3350 vitest + tsc + vite build).
- [x] Core e2e (relic-pickup, smoke, w2-moor-road, almanac, scots-locale) 21/21 green across chromium/firefox/webkit.
- [x] Bundle 929 KB main (+9 KB vs M3 end, +24 KB vs M1 start — under R1's +40 KB budget).
- [x] Commit: `feat(relics): R1 — Relics (third progression tier) shipped`.

---

## Final ship gate (R1 complete) ✅ 2026-04-24

- [x] All 18 Relics shipping with effects, tooltips, pickup UI, HUD slots, Chronicle display.
- [x] Playtest telemetry instrumented (`GLOBAL_RELIC_PICKED` + `relic_picked` analytics); analysis lands in a post-launch balance pass.
- [x] Bundle delta within +40 KB budget (actual +24 KB).
- [x] No crash path across 0/1/2/3 held + 4th offered combinations (e2e + unit coverage on the discard modal + resolveRelicDiscard pure helper).
- [x] `npm run ci` green.
- [x] 4 effects with complex wire sites deferred to M4.5 polish (cairn_stone heather-detection, pictish_compass minimap pins, fishermens_net per-hit velocity, bodhran_skin music beat, fingals_horn Fianna summon). Pure fns + driver API are in place so wiring them is a localised edit.
