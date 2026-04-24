# M1 Moor Road multi-node — post-ship follow-ups

**Created:** 2026-04-24. **Parent:** M1 flagship (`docs/superpowers/plans/2026-04-23-moor-road-nodes.md`) shipped same day in commit `1acf4c2`.

Scope: v1 simplifications flagged in code comments during the M1 ship window. Each lists the exact touch-point so a future session can pick one up cold.

**Shipped since kickoff:** F1 + F2 (reward-on-kill gate), F6 (Act 3 stretch switching), F7 (SCS node names draft) — 2026-04-24. `NodeWaveTracker` now defers encounter / elite node finalize until spawned enemies die; elite relic drops at the kill-site centroid rather than the node pip. Act 3 stretch bank now swaps on `the_laird` / `hunter_general` kills so each beat gets its own flavoured node pool. Scots overlays authored for 71 node names + 28 prompts under `nodes.{a1,a2,a3s1,a3s2,a3s3,shrine,trader,rest,hidden,bargain,elite}.*` (draft — native review open alongside V2 Doric/Shetlandic blockers).

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

## ~~F6 — Act 3 sub-stretch switching on boss kills~~ ✅ shipped 2026-04-24

New `dispatchStretchComplete(bossKey)` mapping (`src/scenes/game/dispatchStretchComplete.ts`) returns `2` for `the_laird` and `3` for `hunter_general`. `EnemyKillHandler` routes the kill through a new `onStretchComplete` hook (mutually exclusive with `onActComplete`). `initNodeMapForAct` extended with an optional `Act3Stretch` parameter; act=3 now reads from `getAct3Bank(stretch)`. Cursor resets to 0 on swap; nodeOutcomes from the prior stretch remain in the log. Replay-safe: deterministic RNG branch + T1 Phase 3 byte-accurate kill timing → same stretch swap reproduces on playback.

---

## ~~F7 — SCS node-name pass~~ ✅ shipped 2026-04-24 (draft, review open)

71 name keys + 28 prompt keys authored in `src/core/i18n.scs.ts` under `nodes.{a1,a2,a3s1,a3s2,a3s3,shrine,trader,rest,hidden,bargain,elite}.*`. Voice: Still Game warmth per `docs/VOICE_CARD.md` — functional phonetics (tha/ye/wi/fae/nae/auld/ken/wee), avoid caricature "och aye". Examples: "Standing stone" → "Staundin stane", "Fairy ring" → "Fairy rink", "Ghostie flit" → "Bogle flit", "Wallace-mark shrine" → "Wallace-mark shrine" (proper noun kept). Parity fence (`src/core/i18n.locale.test.ts`) holds. Native-speaker review open alongside the V2 variants blockers (Doric + Shetlandic natives, Burns Canongate audit).

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
