# M1 Moor Road multi-node — post-ship follow-ups

> **STATUS:** Open — base + 8 follow-ups (F1–F8) shipped 2026-04-24; only human playtest gate (act-completion ≥90%, no node-type skipped >80%) remains. Memory `project_m1_moor_nodes_status` is the live tracker.

**Created:** 2026-04-24. **Parent:** M1 flagship (`docs/superpowers/plans/2026-04-23-moor-road-nodes.md`) shipped same day in commit `1acf4c2`.

Scope: v1 simplifications flagged in code comments during the M1 ship window. Each lists the exact touch-point so a future session can pick one up cold.

**Shipped since kickoff:** F1 + F2 (reward-on-kill gate), F3 (mid-run gold-spend), F4 (shrine timed-buff bag), F5 (replay outcome consumption), F6 (Act 3 stretch switching), F7 (SCS node names draft), F8 (trader passive-grant) — 2026-04-24. `NodeWaveTracker` now defers encounter / elite node finalize until spawned enemies die; elite relic drops at the kill-site centroid rather than the node pip. Replay playback auto-applies recorded shrine / trader / bargain choices instead of re-opening the prompt. Act 3 stretch bank now swaps on `the_laird` / `hunter_general` kills so each beat gets its own flavoured node pool. Scots overlays authored for 71 node names + 28 prompts under `nodes.{a1,a2,a3s1,a3s2,a3s3,shrine,trader,rest,hidden,bargain,elite}.*` (draft — native review open alongside V2 Doric/Shetlandic blockers). Trader now charges the rolled `priceGold` on every pick via `RunScoreState.spendCoinGold`; balance shown in the prompt body + a persistent HUD chip; `computeGoldReward` subtracts `coinGoldSpent` so mid-run spends can't double-dip at the Golden Haggis mint. Trader passive slot grants a real unheld passive via `rollRandomUnheldPassive` + `LevelUpFlow.grantPassive`; roster-full path still refunds +40g with the legacy stub toast.

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

## ~~F4 — Shrine timed-buff system~~ ✅ shipped 2026-04-24 (5 of 8 buff keys, 3 parked)

`TempBuffBag` (`src/systems/TempBuffBag.ts`) owns `add(key, durationMs, apply)` / `tick(deltaMs)` / `clear()` / `revertAll()` / `has()` / `snapshot()`. Apply closures return their own revert closure, so the bag stays Player-agnostic. GameScene ticks the bag on `scaledDelta` each frame (so pause / HIT_FREEZE / slow-mo freeze the countdown the same way XP collection + spawn timing freeze), and calls `clear()` — not `revertAll()` — in the reset block because Player is rebuilt fresh on scene restart (reverting onto a stale instance would mis-apply).

Wired keys: `buff_damage` (+25% damage), `buff_speed` (+20% base speed), `buff_armor` (+3 flat), `buff_crit` (+15%), `buff_pickup` (+40% pickup radius). Duration is the resolver's `durationMs` (60s default). Toast format: `Shrine boon: {label} — {seconds}s` (new i18n key `nodes.ui.toast.shrine_buff_timed`, EN + SCS).

**Parked (v2 follow-up):** `buff_regen` (Player.addHpRegen is cap-clamped so revert subtracting a delta > remaining room would break negative), `buff_reflect` (setThorns is a non-additive setter), `buff_dodge` (no dodge stat on Player). These three still fall back to the pre-F4 20% heal stand-in so the pick always delivers something.

**Touch-points:** `src/systems/TempBuffBag.ts` (new) + test, `src/scenes/GameScene.ts` (`applyShrineBoon` rewrite + tick + clear), i18n EN + SCS.

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

## ~~F8 — Passives catalogue for trader~~ ✅ shipped 2026-04-24

`rollRandomUnheldPassive(rng, held)` added alongside `PASSIVE_KEYS` in `src/data/upgrades.ts` — pure filter over `PASSIVE_CARDS` returning an `UpgradeCard` (so callers get name + icon) or `null` when the roster is full. `LevelUpFlow.grantPassive(key)` wraps the existing `pushOwnedPassive` + `applyPassiveEffect` + `bumpItemAcquired` triad so external callers skip the upgrade-card toast and surface their own flavour. `GameScene.grantTraderPassive` is the new private helper called from both live + replay paths in `openTraderNode`; it falls back to the legacy +40g stub toast (`trader_no_passives`) when the roster is full so the slot is still honest at endgame. New toast key `nodes.ui.toast.trader_passive_granted` (EN + SCS) carries `{name}` for the granted item.

---

## Human gate — playtest kill criteria

Per `docs/superpowers/specs/2026-04-23-moor-road-nodes-design.md §8`:

- **Act completion rate stays ≥ 90%** (pre-M1 baseline). Node density mustn't slow runs to attrition.
- **No node-type skipped > 80% of offerings**. If a type never gets picked, cut or rebalance it.
- **Manual check:** every node type triggers correctly; HUD widget scales with uiScale; replay playback handles v1/v2/v3 blobs.
- Reviewer: needs a live session. No automated coverage replaces this.

If Act completion drops below threshold, reduce per-act node count from 3–5 to 2–3 and re-review.
