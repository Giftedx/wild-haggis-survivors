# M1 — Moor Road multi-node expansion implementation plan

> **STATUS:** SHIPPED 2026-04-24 — base + all 8 follow-ups (F1–F8) shipped same week per memory `project_m1_moor_nodes_status`. Only human playtest gate open.
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Ship 7 node types placed 3–5 per act as a micro-map per `docs/superpowers/specs/2026-04-23-moor-road-nodes-design.md`. 5 milestones. Extends shipped W2; does not replace act-end pickers.

**Architecture:** New `NodeMapSystem` generates per-act node paths from bank-constrained rolls (deterministic given run seed — replay-safe). Pure-function `nodeEvents/*.ts` per event type. HUD widget shows current path. Proximity detection triggers events. Replay blob schema widens to v3 to record `nodeOutcomes`.

**Tech Stack:** TypeScript strict, Phaser 3.90+, Vitest, Playwright.

**Commit cadence:** One commit per TDD cycle. `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`.

**Branch:** `master`.

**Guardrails on every task:**
- `npm test` green after each step.
- `npm run lint` after multi-file changes.
- No `as any`. Zero TODO/FIXME.
- Replay-determinism preserved (v1/v2 replays must continue to play).
- Per-frame node-system cost negligible.

---

## File structure

### New files

| Path | Purpose |
|------|---|
| `src/data/nodeTypes.ts` | 7 node-type defs + data shape. |
| `src/data/nodeBanks.ts` | Per-act node banks. |
| `src/data/nodeTypes.test.ts` + `nodeBanks.test.ts` | Shape assertions; bank-validity. |
| `src/systems/NodeMapSystem.ts` | Node-map state + generation + trigger routing. |
| `src/systems/NodeMapSystem.test.ts` | Generation constraints, trigger logic. |
| `src/systems/nodeEvents/encounterEvent.ts` | Encounter wave-pulse. |
| `src/systems/nodeEvents/shrineEvent.ts` | Buff pick-3-of-3. |
| `src/systems/nodeEvents/weeTraderEvent.ts` | Mid-run merchant. |
| `src/systems/nodeEvents/hiddenEvent.ts` | Stumble-reveal cairn. |
| `src/systems/nodeEvents/bargainEvent.ts` | Cailleach HP-for-boon trade. |
| `src/systems/nodeEvents/restEvent.ts` | Heal + reroll. |
| `src/systems/nodeEvents/eliteEvent.ts` | Forced elite + guaranteed Relic. |
| Test files for each `nodeEvent` | Pure-function coverage. |
| `src/ui/NodeMapUI.ts` | HUD widget. |
| `src/ui/NodePromptUI.ts` | Interactive-node prompt UI. |
| `e2e/moor-road-nodes.spec.ts` | Playwright smoke. |

### Modified files

| Path | Change |
|------|--------|
| `src/scenes/game/RunActState.ts` | Extend with `currentActNodeMap`, `currentNodeIndex`, `nodeOutcomes`. |
| `src/scenes/GameScene.ts` | Call `NodeMapSystem.tick(delta)` in update. |
| `src/systems/SpawnSystem.ts` | `forceNodeEncounter(enemyMix, duration)` method. |
| `src/data/routes.ts` | Routes can reference node-map effects. |
| `src/replay/ReplayBlob.ts` | Schema v3 with `nodeOutcomes[]`. Union type extends. |
| `src/utils/save.ts` | `RunHistoryEntry.nodeOutcomes[]` field. Schema bump. |
| `src/scenes/ChronicleScene.ts` | Show node outcomes per past run. |
| `src/core/i18n.ts` + `.scs.ts` | ~120 keys × 2 locales (node names, prompts, banter, flavour). |

---

## Milestone plan

- **M1 — Data + bank scaffolding** (tasks 1–8). 7 node type defs + 3-act banks + `NodeMapSystem` generation. Ship gate: generation produces valid paths in unit tests.
- **M2 — Node-map UI + proximity** (tasks 9–14). HUD widget + next-node indicator + proximity trigger detection. Ship gate: UI visible in test scene.
- **M3 — Per-node-type events** (tasks 15–28). 7 events, one per sub-milestone. Ship gate: each event triggers correctly.
- **M4 — Save-schema + replay** (tasks 29–33). `nodeOutcomes` persisted + replay v3 blob format. Ship gate: replay v1/v2/v3 all play.
- **M5 — Balance + launch** (tasks 34–38). Playtest + polish + i18n + Chronicle display. Ship gate: act completion rate ≥90% pre-M1 baseline.

---

## M1 — Data + bank scaffolding

### Task 1: `NodeDef` + `NodeType` types

**Files:** `src/data/nodeTypes.ts` + test.

- [ ] **Step 1:** Failing test: `NODE_TYPES` includes all 7 types.
- [ ] **Step 2:** Define `NodeType` + `NodeDef` interface.
- [ ] **Step 3:** Commit: `feat(nodes): NodeDef types`.

### Task 2: Act 1 node bank

**Files:** `src/data/nodeBanks.ts` + test.

- [ ] **Step 1:** Failing test: `ACT_1_BANK` contains ≥20 entries of varied types.
- [ ] **Step 2:** Author 20+ Act 1-appropriate nodes (mostly encounters + shrines, few electives).
- [ ] **Step 3:** Commit.

### Task 3: Act 2 + Act 3 banks

- [ ] **Step 1:** Failing tests per bank: Act 2 has more electives; Act 3 has multiple sub-banks (3 stretches).
- [ ] **Step 2:** Author banks.
- [ ] **Step 3:** Commit per bank.

### Task 4: Path generation with constraints

**Files:** `src/systems/NodeMapSystem.ts`.

- [ ] **Step 1:** Failing test: generated path has at least 1 Encounter; ≤1 Elite; Bargain + Rest mutually exclusive.
- [ ] **Step 2:** Implement generation with seeded RNG + constraint solver.
- [ ] **Step 3:** Commit.

### Task 5: World-position placement

- [ ] **Step 1:** Failing test: nodes placed 2–3 min of combat apart (≈ 1000 px separation given combat pacing).
- [ ] **Step 2:** Implement placement around player spawn position.
- [ ] **Step 3:** Commit.

### Task 6: `RunActState` extension

**Files:** `src/scenes/game/RunActState.ts`.

- [ ] **Step 1:** Failing test: `RunActState.currentActNodeMap` nullable; `currentNodeIndex: number`; `nodeOutcomes: NodeOutcome[]`.
- [ ] **Step 2:** Add fields. Reset on `reset()`.
- [ ] **Step 3:** Commit.

### Task 7: Save-schema bump for `RunHistoryEntry.nodeOutcomes`

- [ ] **Step 1:** Failing test: v{N} → v{N+1} migration.
- [ ] **Step 2:** Add field + migration.
- [ ] **Step 3:** Commit.

### Task 8: M1 ship gate

- [ ] Generation produces valid paths deterministically.
- [ ] Banks validated.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(nodes): M1 — data + bank + generation complete`.

---

## M2 — Node-map UI + proximity

### Task 9: `NodeMapUI` HUD widget

**Files:** `src/ui/NodeMapUI.ts`.

- [ ] **Step 1:** Failing smoke test: widget renders current position + remaining-nodes icons.
- [ ] **Step 2:** Implement compact icon-only form (expanded on click).
- [ ] **Step 3:** Commit.

### Task 10: uiScale compatibility

- [ ] **Step 1:** Failing test: widget scales with `uiScale`.
- [ ] **Step 2:** Implement scaling.
- [ ] **Step 3:** Commit.

### Task 11: Proximity detection for node trigger

**Files:** `src/systems/NodeMapSystem.ts`.

- [ ] **Step 1:** Failing test: player within 80px of node position → trigger fires.
- [ ] **Step 2:** Implement proximity check in `tick()`.
- [ ] **Step 3:** Commit.

### Task 12: Next-node direction indicator

- [ ] **Step 1:** Failing smoke test: faint compass trail shows direction to next node.
- [ ] **Step 2:** Implement subtle visual cue (heather-trail motif per ART_STYLE_BIBLE).
- [ ] **Step 3:** Commit.

### Task 13: Interaction prompt for interactive nodes

**Files:** `src/ui/NodePromptUI.ts`.

- [ ] **Step 1:** Failing smoke: near Shrine/Trader/Bargain/Hidden, prompt appears.
- [ ] **Step 2:** Implement prompt overlay.
- [ ] **Step 3:** Commit.

### Task 14: M2 ship gate

- [ ] HUD widget works at all uiScales.
- [ ] Proximity triggers fire.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(nodes): M2 — UI + proximity complete`.

---

## M3 — Per-node-type events

One task per event type (7 events → 7 tasks). Each:
- [ ] **Step 1:** Failing test for event's pure-function logic.
- [ ] **Step 2:** Implement pure-function event.
- [ ] **Step 3:** Wire trigger hook in NodeMapSystem.
- [ ] **Step 4:** Commit.

### Task 15: Encounter event (wave-pulse)

**Files:** `src/systems/nodeEvents/encounterEvent.ts`.

- [ ] Pure: `encounterEvent(enemyMix, duration)` returns wave specification for SpawnSystem.
- [ ] Wire: triggers `SpawnSystem.forceNodeEncounter(wave, duration)`.

### Task 16: Shrine event (buff pick)

- [ ] Pure: `shrineEvent(rng)` returns 3 buff candidates.
- [ ] UI wire: prompt 3-of-3 choice; applies 60s buff.

### Task 17: Wee Trader event

- [ ] Pure: `weeTraderEvent(rng)` returns 3-item offer (random Relic + passive + reroll token).
- [ ] UI wire: merchant UI with gold spend.

### Task 18: Hidden event

- [ ] Pure: `hiddenEvent(rng)` returns reward type (rare Relic | lore fragment).
- [ ] UI wire: subtle cue + interact prompt.

### Task 19: Bargain event

- [ ] Pure: `bargainEvent(rng)` returns trade offer (HP-for-buff/Relic).
- [ ] UI wire: Cailleach-voice + HP-cost + accept/refuse.

### Task 20: Rest event

- [ ] Pure: `restEvent()` returns 30% heal + 1 reroll token.
- [ ] UI wire: heal animation.

### Task 21: Elite event

- [ ] Pure: `eliteEvent(rng)` returns elite definition for SpawnSystem to force-spawn.
- [ ] Wire: force-spawn + guaranteed Relic on kill (R1 dependency).

### Task 22: M3 ship gate

- [ ] All 7 events trigger correctly in test harness.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(nodes): M3 — all 7 node events shipped`.

---

## M4 — Save-schema + replay

### Task 23: `RunHistoryEntry.nodeOutcomes` persistence

- [ ] **Step 1:** Failing test: outcomes round-trip through save.
- [ ] **Step 2:** Wire save in `RunHistoryRecorder.onRunEnd`.
- [ ] **Step 3:** Commit.

### Task 24: Replay blob v3 schema

**Files:** `src/replay/ReplayBlob.ts`.

- [ ] **Step 1:** Failing test: blob v3 includes `nodeOutcomes` + v1/v2/v3 union type.
- [ ] **Step 2:** Add schema. Update `ReplayBlobAny` union.
- [ ] **Step 3:** Commit.

### Task 25: ReplayInput reconstructs nodes

- [ ] **Step 1:** Failing test: v3 replay reconstructs node events from metadata.
- [ ] **Step 2:** ReplayInput reads `nodeOutcomes` and fires corresponding events without RNG roll.
- [ ] **Step 3:** Commit.

### Task 26: Backward compatibility — v1/v2 still play

- [ ] **Step 1:** Failing test: v1/v2 replays continue to play (old W2 flow without nodes).
- [ ] **Step 2:** Verify graceful absence of nodes.
- [ ] **Step 3:** Commit.

### Task 27: `replayDeterminism.test.ts` update

- [ ] **Step 1:** Failing test: determinism regression covers v3.
- [ ] **Step 2:** Extend test fixtures.
- [ ] **Step 3:** Commit.

### Task 28: M4 ship gate

- [ ] All 3 replay versions play.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(nodes): M4 — replay v3 + save persistence`.

---

## M5 — Balance + launch

### Task 29: i18n authoring (120 keys × 2)

- [ ] **Step 1:** Author node names, prompts, banter flavour.
- [ ] **Step 2:** Pair SCS. Parity fence green.
- [ ] **Step 3:** Commit.

### Task 30: ChronicleScene display

- [ ] **Step 1:** Failing smoke test: past runs show node-outcome log expandable.
- [ ] **Step 2:** Wire display.
- [ ] **Step 3:** Commit.

### Task 31: Internal playtest

- [ ] **Step 1:** 3 playtesters × 10 runs each. Record: act completion rate, per-node-type skip rate, node-UI confusion rate.
- [ ] **Step 2:** Rebalance based on findings.

### Task 32: `e2e/moor-road-nodes.spec.ts`

- [ ] **Step 1:** Playwright: act start → encounter node → shrine node → picker; HUD widget tracks progress.
- [ ] **Step 2:** Commit.

### Task 33: M5 ship gate + launch

- [ ] Act completion rate ≥90% pre-M1 baseline.
- [ ] No node-type skipped >80% of offerings.
- [ ] Bundle delta ≤ +60 KB gzip.
- [ ] `npm run ci:all` green.
- [ ] Ship commit: `feat(nodes): M1 — Moor Road multi-node expansion shipped`.

---

## Final ship gate (M1 complete)

- [ ] All 5 milestones passed.
- [ ] Replay fully backward-compatible.
- [ ] Node density adds decision points without slowing act completion.
- [ ] Ship commit.

---

## Risk-watch

| Signal | Response |
|---|---|
| Act completion slows <90% | Reduce per-act nodes from 3–5 to 2–3; reassess. |
| Specific node type skipped >80% | Cut or rebalance. |
| Replay determinism break | v3 blob records `nodeOutcomes`; ReplayInput reconstructs. v1/v2 play with no nodes. |
| HUD widget confuses players | Default minimised icon-only; expand only on click. |
| Bargain event readability issue | Timer pauses for Bargain; captioned per accessibility. |
