# U1 — Rune upgrades (rule-stack card tier) implementation plan

> **STATUS:** SHIPPED 2026-04-25 — full ship; all 30 runes live. B5 Phases 0+1a+1b+2 grounded post-ship (gloaming, seawrack, haar, frost). Edinburgh rune ungrounded pending B5 Phase 3 cultural consultation.
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development.

**Goal:** Ship 30 Rune cards as a new rarity tier per `docs/superpowers/specs/2026-04-23-rune-upgrades-design.md`. 3 milestones.

**Architecture:** New `UpgradeRarity.RUNE` extends card pool (rarity weight ~7%). `RuneConditionSystem` evaluates condition state per-frame and applies/removes effects on transitions. Pure-function modules `runeConditions.ts` + `runeEffects.ts`. Boss-gate: runes appear only after first boss kill per run. Meta-unlock via `SaveData.unlocks.seenRunes: Set<string>`.

**Tech Stack:** TypeScript strict, Phaser 3.90+, Vitest, Playwright.

**Commit cadence:** One commit per TDD cycle. `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`.

**Branch:** `master`.

**Guardrails on every task:**
- `npm test` green after each step.
- Per-frame condition check cost < 0.5ms total.
- No `as any`. Zero TODO/FIXME.
- Card-pool builder must handle RUNE rarity without breaking existing logic.

---

## File structure

### New files

| Path | Purpose |
|------|---|
| `src/data/runes.ts` | 30-rune catalogue + `RuneDef` interface. |
| `src/data/runes.test.ts` | Data shape + rarity split. |
| `src/systems/RuneConditionSystem.ts` | Per-frame evaluation + apply/remove transitions. |
| `src/systems/RuneConditionSystem.test.ts` | State-transition + multi-rune tests. |
| `src/systems/runes/runeConditions.ts` | Pure condition evaluators. |
| `src/systems/runes/runeConditions.test.ts` | Per-condition tests. |
| `src/systems/runes/runeEffects.ts` | Pure effect-apply/remove functions. |
| `src/systems/runes/runeEffects.test.ts` | Per-effect tests. |

### Modified files

| Path | Change |
|------|--------|
| `src/data/upgrades.ts` | Add `UpgradeRarity.RUNE` enum member. |
| `src/ui/UpgradeCardsUI.ts` | Render Rune cards with stone-carved border + glyph icon. |
| `src/core/i18n.ts` + `.scs.ts` | 30 names + 30 conditions + 30 effects + 30 flavours × 2 locales = 240 keys. |
| `src/entities/Player.ts` | `applyRuneEffects()` hook in `update()`. |
| `src/scenes/game/buildCardPool.ts` | RUNE rarity appears only if `bossKilledThisRun`. |
| `src/utils/save.ts` | Schema bump. `unlocks.seenRunes: Set<string>`. |
| `src/utils/save.test.ts` | Migration tests. |
| `src/data/banter.ts` | First-rune-seen reserved banter. |

---

## Milestone plan

- **M1 — Data + condition eval** (tasks 1–10). 30 Rune defs + pure condition/effect functions + `RuneConditionSystem`. Ship gate: all 30 runes tested.
- **M2 — UI + pool integration** (tasks 11–16). Rune card rendering, pool gating, Player hook. Ship gate: Rune pickable in live run.
- **M3 — Playtest + launch** (tasks 17–20). Playtesting, balance, i18n authoring. Ship gate: pick-rate 50–70%; no dominance >70%.

---

## M1 — Data + condition eval

### Task 1: `RuneDef` interface + first 10 runes (biome-conditional)

**Files:** `src/data/runes.ts` + test.

- [ ] **Step 1:** Failing test: `RUNES.haar_rune.conditionKey === 'biome_fog'`.
- [ ] **Step 2:** Author 10 biome-conditional runes per spec §2.
- [ ] **Step 3:** Commit: `feat(runes): 10 biome-conditional runes`.

### Task 2: 10 state-conditional runes

- [ ] **Step 1:** Failing test: `RUNES.thirst_rune.conditionKey === 'hp_low'`.
- [ ] **Step 2:** Author 10 state-conditional runes.
- [ ] **Step 3:** Commit.

### Task 3: 10 action-chain runes

- [ ] **Step 1:** Failing test: `RUNES.echo_rune.conditionKey === 'every_nth_kill:10'`.
- [ ] **Step 2:** Author 10 action-chain runes.
- [ ] **Step 3:** Commit.

### Task 4: Rarity-weight assertion

- [ ] **Step 1:** Failing test: `RUNES` total is 30; rarity member `rune` counted correctly.
- [ ] **Step 2:** Implement assertion.
- [ ] **Step 3:** Commit.

### Task 5–7: Pure condition evaluators

**Files:** `src/systems/runes/runeConditions.ts` + test.

- [ ] **Step 1:** Failing test per condition type (biome_fog, hp_low, kill_cascade, etc.).
- [ ] **Step 2:** Implement evaluators.
- [ ] **Step 3:** Commit per 4–5 conditions (3 commits total).

### Task 8: Pure effect-apply functions

**Files:** `src/systems/runes/runeEffects.ts` + test.

- [ ] **Step 1:** Failing tests per effect.
- [ ] **Step 2:** Implement apply/remove functions.
- [ ] **Step 3:** Commit per batch.

### Task 9: `RuneConditionSystem` tick loop

**Files:** `src/systems/RuneConditionSystem.ts` + test.

- [ ] **Step 1:** Failing test: state transition false → true fires `applyEffect`; true → false fires `removeEffect`.
- [ ] **Step 2:** Implement tick loop.
- [ ] **Step 3:** Commit.

### Task 10: M1 ship gate

- [ ] 30 runes + 30 effects + 30 conditions unit tested.
- [ ] Transition logic tested.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(runes): M1 — data + condition eval complete`.

---

## M2 — UI + pool integration

### Task 11: `UpgradeRarity.RUNE` enum

**Files:** `src/data/upgrades.ts`.

- [ ] **Step 1:** Failing test: `UpgradeRarity.RUNE` exists.
- [ ] **Step 2:** Add enum member.
- [ ] **Step 3:** Commit.

### Task 12: Pool gating on boss-killed-this-run

**Files:** `src/scenes/game/buildCardPool.ts`.

- [ ] **Step 1:** Failing test: pool excludes RUNE rarity when `bossKilledThisRun === false`.
- [ ] **Step 2:** Implement gate.
- [ ] **Step 3:** Commit.

### Task 13: Rune card rendering

**Files:** `src/ui/UpgradeCardsUI.ts`.

- [ ] **Step 1:** Failing smoke test: Rune card has stone-carved border + glyph icon.
- [ ] **Step 2:** Implement distinct visual style.
- [ ] **Step 3:** Commit.

### Task 14: Player effect-application hook

**Files:** `src/entities/Player.ts`.

- [ ] **Step 1:** Failing test: `applyRuneEffects(delta)` iterates active Runes and calls `RuneConditionSystem.tick(delta)`.
- [ ] **Step 2:** Wire hook.
- [ ] **Step 3:** Commit.

### Task 15: Save schema + `seenRunes` meta-unlock

**Files:** `src/utils/save.ts`, tests.

- [ ] **Step 1:** Failing test: `seenRunes` default empty; adds key on first offer.
- [ ] **Step 2:** Implement; schema bump.
- [ ] **Step 3:** Commit.

### Task 16: M2 ship gate

- [ ] Rune card appears in live run after boss kill.
- [ ] Pickable with correct effect applied.
- [ ] Meta-unlock tracked.
- [ ] `npm run ci:all` green.
- [ ] Commit: `feat(runes): M2 — UI + pool integration complete`.

---

## M3 — Playtest + launch

### Task 17: i18n authoring (240 keys × 2)

- [ ] **Step 1:** Author 30 × 4 × 2 keys (name, condition, effect, flavour) × EN + SCS.
- [ ] **Step 2:** Parity fence green.
- [ ] **Step 3:** Commit: `content(i18n): 30 Rune card texts`.

### Task 18: First-rune banter

- [ ] **Step 1:** Reserve `first_time` banter line: "A rune, hen — older than speech."
- [ ] **Step 2:** Pair SCS.
- [ ] **Step 3:** Commit.

### Task 19: Internal playtest

- [ ] **Step 1:** 3 playtesters × 10 runs each. Record per-Rune pick rate + run-end win rate.
- [ ] **Step 2:** Rebalance:
  - Runes with pick rate <30% → boost or cut.
  - Runes with win rate >70% → nerf.
- [ ] **Step 3:** Commit rebalance changes.

### Task 20: M3 ship gate + launch

- [ ] Pick rate between 50–70% when offered.
- [ ] No single Rune dominates (<70% win rate).
- [ ] Per-frame condition cost < 0.5ms verified via `shaderPerf`-style profiler.
- [ ] Bundle delta ≤ +80 KB gzip.
- [ ] `npm run ci:all` green.
- [ ] Ship commit: `feat(runes): U1 — Rune upgrades shipped (30 runes)`.

---

## Risk-watch

| Signal | Response |
|---|---|
| Pick rate <30% | Boost rarity weight; reauthor low-appeal runes. |
| Pick rate >85% (over-dominance) | Nerf or reduce rarity weight. |
| Per-frame condition cost spikes | Cache condition state; invalidate only on state-change events, not every frame. |
| 30-rune balance load | Stage at 15 initially; add remaining 15 in post-launch drops. |
| Card text readability at small uiScale | Large-font variant; auto-break on overflow. |
