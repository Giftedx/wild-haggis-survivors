# M1 Moor Road multi-node — post-ship follow-ups

**Created:** 2026-04-24. **Parent:** M1 flagship (`docs/superpowers/plans/2026-04-23-moor-road-nodes.md`) shipped same day in commit `1acf4c2`.

Scope: v1 simplifications flagged in code comments during the M1 ship window. Each lists the exact touch-point so a future session can pick one up cold.

**Shipped since kickoff:** F1 + F2 (reward-on-kill gate), F3 (mid-run gold-spend), F5 (replay outcome consumption), F6 (Act 3 stretch switching), F7 (SCS node names draft) — 2026-04-24. `NodeWaveTracker` now defers encounter / elite node finalize until spawned enemies die; elite relic drops at the kill-site centroid rather than the node pip. Replay playback auto-applies recorded shrine / trader / bargain choices instead of re-opening the prompt. Act 3 stretch bank now swaps on `the_laird` / `hunter_general` kills so each beat gets its own flavoured node pool. Scots overlays authored for 71 node names + 28 prompts under `nodes.{a1,a2,a3s1,a3s2,a3s3,shrine,trader,rest,hidden,bargain,elite}.*` (draft — native review open alongside V2 Doric/Shetlandic blockers). Trader now charges the rolled `priceGold` on every pick via `RunScoreState.spendCoinGold`; balance shown in the prompt body + a persistent HUD chip; `computeGoldReward` subtracts `coinGoldSpent` so mid-run spends can't double-dip at the Golden Haggis mint. Passive stub still refunds +40g until F8 lands.

---

## ~~F1 — Encounter wave-completion gate~~ ✅ shipped 2026-04-24

Encounter node now registers spawned enemies with `NodeWaveTracker` (pure helper, `src/systems/nodeEvents/NodeWaveTracker.ts`). Finalize fires on the first frame after every tagged enemy dies. Pool-reuse safe: `Enemy.spawn()` clears the wave tag, so a recycled pool entry reads as "not this wave" even if the same object is reacquired. Ticks in `GameScene.updateInner` before the pause-early-return so countdown / HIT_FREEZE don't strand pending waves.

---

## ~~F2 — Elite on-kill relic drop~~ ✅ shipped 2026-04-24

Same tracker handles elite nodes. Relic roll stays at trigger-time (determinism), but the pickup materialises at the elite's last-known position on death. If `forceSpawn` returns null (pool saturated), the zero-member path still finalizes + drops at the node pip.

---

## ~~F3 — Trader mid-run gold-spend~~ ✅ shipped 2026-04-24

`RunScoreState` gained `coinGoldSpent` + `getGoldBalance()` + `spendCoinGold(n): boolean`. `IRunState` + `RunSummary` both carry `coinGoldSpent?: number` so resume + run-end pipelines round-trip the counter. `computeGoldReward` subtracts spent from the coin pool before minting (clamped at zero so boss gold is never refunded by an over-spend). Trader modal now gates each option on `balance >= priceGold` (disabled sub-label `({price}g — short)`), and `spendCoinGold` fires before apply on both live + replay paths so RNG consumption stays byte-identical. HUD gains a `gold_chip` line (`{gold}g`) under the level readout, refreshed every frame via `this.hud.setGold(this.runScore.getGoldBalance())` with a `prevGold` cache so setText only fires on change. The passive trader slot still grants the +40g stub toast until F8 lands.

---

## F4 — Shrine timed-buff system

**Current behaviour (`applyShrineBoon`)**: the 3 picked candidates apply as *immediate* rewards (heal 20% for combat buffs; +50g for gold; XP gem for xp; one-shot relic for luck). Resolver-side `durationMs: 60000` is unused.

**Target:** real temporary-buff system. A `TempBuffBag` class holding `{ key, remainingMs, apply, revert }` entries, ticking down in `update()`; `Player` / `WeaponSystem` consumers read from it via composition so multipliers stack cleanly with existing relic effects. First-pass palette: damage mult, speed mult, armor (damage-taken mult), regen (HP/sec), crit chance, reflect %, dodge %, pickup radius. Kill-criterion: shrine-picked buffs should *feel* different from relic effects (shorter, more intense) — tune multipliers once the bag exists.

**Touch-points:** `src/systems/TempBuffBag.ts` (new), `src/entities/Player.ts` (read from bag in `recalcStats`), `src/systems/WeaponSystem.ts` (cooldown + damage mult read-through), `src/scenes/GameScene.ts` (instantiate + tick + swap `applyShrineBoon`).

---

## ~~F5 — ReplayInput nodeOutcomes consumption~~ ✅ shipped 2026-04-24

`ReplayInput` now exposes `peekNextNodeOutcome` / `consumeNodeOutcome` / `getRemainingNodeOutcomeCount`. `GameScene.finalizeNodeVisit` consumes the matching recorded outcome on every finalize (passive, early-out, interactive), keeping the cursor aligned one-per-trigger. `openShrineNode` / `openTraderNode` / `openBargainNode` each short-circuit before the modal when `peekReplayChoiceFor(node.key)` returns the recorded `chosenRewardKey` — the apply path runs inline so RNG consumption (e.g. shrine `buff_luck`, trader relic roll, bargain relic offer) stays byte-identical to the live run. Mismatches log a console.warn and fall through to live prompt for safety. 11 new ReplayInput tests.

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
