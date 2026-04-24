# M1 Moor Road multi-node — post-ship follow-ups

**Created:** 2026-04-24. **Parent:** M1 flagship (`docs/superpowers/plans/2026-04-23-moor-road-nodes.md`) shipped same day in commit `1acf4c2`.

Scope: v1 simplifications flagged in code comments during the M1 ship window. Each lists the exact touch-point so a future session can pick one up cold.

**Shipped since kickoff:** F1 + F2 (reward-on-kill gate) — 2026-04-24. `NodeWaveTracker` now defers encounter / elite node finalize until spawned enemies die; elite relic drops at the kill-site centroid rather than the node pip.

---

## ~~F1 — Encounter wave-completion gate~~ ✅ shipped 2026-04-24

Encounter node now registers spawned enemies with `NodeWaveTracker` (pure helper, `src/systems/nodeEvents/NodeWaveTracker.ts`). Finalize fires on the first frame after every tagged enemy dies. Pool-reuse safe: `Enemy.spawn()` clears the wave tag, so a recycled pool entry reads as "not this wave" even if the same object is reacquired. Ticks in `GameScene.updateInner` before the pause-early-return so countdown / HIT_FREEZE don't strand pending waves.

---

## ~~F2 — Elite on-kill relic drop~~ ✅ shipped 2026-04-24

Same tracker handles elite nodes. Relic roll stays at trigger-time (determinism), but the pickup materialises at the elite's last-known position on death. If `forceSpawn` returns null (pool saturated), the zero-member path still finalizes + drops at the node pip.

---

## F3 — Trader mid-run gold-spend

**Current behaviour (`openTraderNode`)**: trader items show `priceGold` in the label but the actual pick is free. Rationale — no mid-run gold-spend plumbing exists (gold is only earned + surfaced in `RunScoreState.coinGoldEarned`; `ShopScene` operates between-runs).

**Target:** add `RunScoreState.spendCoinGold(n): boolean` (returns false when insufficient), wire the trader's option handler to call it before applying the reward, and disable the option button when the player can't afford it (mirror the bargain flow's `canAfford` gate). Also expose current-gold on the HUD chip so the player knows their budget.

**Touch-points:** `src/scenes/game/RunScoreState.ts`, `src/scenes/GameScene.ts` (`openTraderNode` + `applyTraderRelic`), `src/ui/HUD.ts` (gold chip).

---

## F4 — Shrine timed-buff system

**Current behaviour (`applyShrineBoon`)**: the 3 picked candidates apply as *immediate* rewards (heal 20% for combat buffs; +50g for gold; XP gem for xp; one-shot relic for luck). Resolver-side `durationMs: 60000` is unused.

**Target:** real temporary-buff system. A `TempBuffBag` class holding `{ key, remainingMs, apply, revert }` entries, ticking down in `update()`; `Player` / `WeaponSystem` consumers read from it via composition so multipliers stack cleanly with existing relic effects. First-pass palette: damage mult, speed mult, armor (damage-taken mult), regen (HP/sec), crit chance, reflect %, dodge %, pickup radius. Kill-criterion: shrine-picked buffs should *feel* different from relic effects (shorter, more intense) — tune multipliers once the bag exists.

**Touch-points:** `src/systems/TempBuffBag.ts` (new), `src/entities/Player.ts` (read from bag in `recalcStats`), `src/systems/WeaponSystem.ts` (cooldown + damage mult read-through), `src/scenes/GameScene.ts` (instantiate + tick + swap `applyShrineBoon`).

---

## F5 — ReplayInput nodeOutcomes consumption

**Current behaviour (`src/replay/ReplayInput.ts`)**: during playback, the scene still runs the live listener — interactive prompts re-open, player has to manually pick every shrine/trader/bargain the original run resolved. Scene isn't aware it's in replay mode for node purposes.

**Target:** when a v3 blob's `nodeOutcomes` is non-empty, suppress the NodePromptUI and auto-apply the recorded `chosenRewardKey`. Playback flow: tick fires the listener → scene checks replay-mode flag → pops next expected outcome from the v3 metadata → forwards the chosenRewardKey to the event's apply path, skipping the modal entirely. Passive outcomes need no change (they're deterministic given rng).

**Touch-points:** `src/replay/ReplayInput.ts` (expose `pendingNodeOutcomes` queue + `popNext()`), `src/scenes/GameScene.ts` (check `this.replayInput` before each `open*Node` call; short-circuit on match).

---

## F6 — Act 3 sub-stretch switching on boss kills

**Current behaviour (`initNodeMapForAct`)**: at Act 3 start, `getActBank(3)` returns `ACT_3_STRETCH_1_BANK` — the same 10-entry pre-Laird bank regardless of progress. The other two stretch banks (`ACT_3_STRETCH_2_BANK`, `ACT_3_STRETCH_3_BANK`) are authored but never loaded.

**Target:** hook `dispatchActComplete` (or the `onActComplete` callback in `SpawnSystem`) for Laird + Hunter-General kills; each should re-roll the Act 3 path from the next stretch's bank and reset `RunActState.currentNodeIndex` to 0. Keeps Laird → Hunter-General → Taxman beats distinct in terms of node flavour.

**Touch-points:** `src/scenes/game/dispatchActComplete.ts` (extend mapping), `src/scenes/GameScene.ts` (add `onBossMidActKill` hook), `src/data/nodeBanks.ts` (`getAct3Bank(stretch)` already exists — just wire it).

---

## F7 — SCS node-name pass

**Current state**: `src/core/i18n.scs.ts` carries Scots overlays for the HUD progress template, prompt titles, toast strings, boon labels, offer descriptors. **56 node names fall through to EN** under the SCS→EN subset fence (EN→SCS is only locked on `ui.banter.*`, so nodes.* is legal to partial-translate).

**Target:** author Scots equivalents for the 56 `nodes.{a1,a2,a3s1,a3s2,a3s3,shrine,trader,rest,hidden,bargain,elite}.*.name` keys. Voice: same Still Game warmth as routes (e.g. "Standing stone" → "Staundin stane", "Fairy ring" → "Fairy rink"). Prompt-bodies for interactive nodes are already in SCS; names close the parity.

**Touch-points:** `src/core/i18n.scs.ts` only.

---

## F8 — Passives catalogue for trader

**Current behaviour (`openTraderNode`)**: the trader spec always offers a relic + passive + reroll in its first 3 slots. The 'passive' pick branch is a stub — it gives 40g instead of an actual passive item because no mid-run passive-grant API exists.

**Target:** wire a `PassiveCatalogue.rollRandomUnheld(rng)` that returns an item the player doesn't already own, then grant it via the existing level-up card hookup. Same pattern as evolution cards — reuses `LevelUpFlow.apply(card)`.

**Touch-points:** `src/data/passives.ts` (add roll helper), `src/scenes/game/LevelUpFlow.ts` (expose apply by key), `src/scenes/GameScene.ts` (`openTraderNode` passive branch).

---

## Human gate — playtest kill criteria

Per `docs/superpowers/specs/2026-04-23-moor-road-nodes-design.md §8`:

- **Act completion rate stays ≥ 90%** (pre-M1 baseline). Node density mustn't slow runs to attrition.
- **No node-type skipped > 80% of offerings**. If a type never gets picked, cut or rebalance it.
- **Manual check:** every node type triggers correctly; HUD widget scales with uiScale; replay playback handles v1/v2/v3 blobs.
- Reviewer: needs a live session. No automated coverage replaces this.

If Act completion drops below threshold, reduce per-act node count from 3–5 to 2–3 and re-review.
