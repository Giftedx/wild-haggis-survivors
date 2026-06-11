# Prompt #9 — U1 Runes M4: Wire Offers + Consumers

> **STATUS:** ✅ SHIPPED 2026-04-26 (`a86afe5`). `RUNE_CARD_OFFERS_ENABLED` flipped true; runeBag read by 11 files; runeConsumer + runeConditions tied into Player / WeaponSystem / XPSystem / SpawnSystem. See [`blocked/09-shipped.md`](blocked/09-shipped.md) for the closure record. The original-charter framing below is preserved as historical context.

## Goal

Flip `RUNE_CARD_OFFERS_ENABLED = true` and wire the rune-effect consumers across Player / WeaponSystem / XPSystem / SpawnSystem so the 30 rule-stack runes shipped in U1 (2026-04-25) actually do something. Currently the data + condition system + tests exist (memory: "SHIPPED 2026-04-25: 30 rule-stack cards, 3 milestones, save v17, +8.13 KB gzip, 4047 vitest"), but per triple-audit T111 product decision = B (keep gated) — the offers don't appear in the level-up card pool, and no system reads the equipped rune bag.

Estimated 1–2 person-weeks. This is the smallest of the top 10 because the heavy lifting (data + condition system + tests) is done.

## Why this is #9

`docs/HUGE_INITIATIVES_MASTER_PLAN.md` §U1 marks runes as A-tier progression depth. Without M4 wire-up:
- 30 cards of designed-but-dead content sit in the bundle.
- Players never encounter the rule-stack mechanic Balatro / Isaac built their replayability on (per `ROGUELITE_RESEARCH.md` §1.5 conditional rule-stacking).
- Triple-audit T111 deferred this with explicit re-entry criteria — this prompt closes T111.

It's behind the bigger flagships because it's a single feature flip + cross-system wiring, not a flagship in itself.

## Source documents

1. `docs/superpowers/specs/2026-04-23-rune-upgrades-design.md` — design spec, all milestones.
2. `docs/superpowers/plans/2026-04-23-rune-upgrades.md` — execution plan; M4 was deferred per triple-audit.
3. `docs/superpowers/plans/2026-04-26-triple-audit-execution-plan.md` §T111 (decision = B, keep gated).
4. `docs/research/ROGUELITE_RESEARCH.md` §1.5 — conditional rule-stacking precedent.
5. `src/data/runes.ts` (or `src/data/runeUpgrades.ts` — find via grep).
6. `src/core/RuneConditionSystem.ts` (or equivalent — find via grep for "rune" + "condition").
7. `src/data/upgrades.ts` — level-up card pool (where rune offers will surface).
8. `src/scenes/Player.ts`, `src/systems/WeaponSystem.ts`, `src/systems/XPSystem.ts`, `src/systems/SpawnSystem.ts` — consumers.

## Scope

### Phase 1 — Decision review
Memory says T111 = B (keep gated). This prompt assumes that decision is being **re-opened** because the player-facing surface is missing. Confirm with stakeholder before proceeding. If decision stands, prompt instead is "remove or hide messaging that promises runes" — much smaller. Default: re-open and ship.

### Phase 2 — Offer wiring
1. Flip `RUNE_CARD_OFFERS_ENABLED = true`.
2. Add rune cards to the level-up card pool with appropriate rarity weighting (per design spec — runes are typically Rare or Legendary tier).
3. Adjust pool weights so runes don't crowd weapons/passives. Test: 30+ level-up panels per balance run; runes should appear ~15–20% of cards on average.
4. Save schema — runes already in `whs_save` v17 per memory; confirm payload shape matches what consumers will read.

### Phase 3 — Consumer wiring per system
The condition system handles "when is this rune active?" — consumers handle "what does it do when active?". For each system:

#### 3.1 Player
- HP / max HP / regen / armour / dash etc. modifiers from `RuneEffect` types.
- Damage taken multiplier.
- Speed / drift modifiers (yes — runes can tighten or loosen the drift mechanic).
- Magnet pickup radius.

#### 3.2 WeaponSystem
- Per-weapon damage / cooldown / projectile-count / pierce-count modifiers.
- Crit chance + crit multiplier.
- Evolution-eligibility hints (some runes lower evolution requirements).

#### 3.3 XPSystem
- XP-gem value multiplier.
- XP-gem magnet boost.
- Level-up card-count + reroll-count modifiers.

#### 3.4 SpawnSystem
- Spawn density modifiers (some runes intentionally inflate threat for risk/reward).
- Elite-spawn-chance modifiers.
- Boss-warning-time modifiers.

#### 3.5 Cross-system (CurseSystem, MetaProgress, etc.)
- Curse stack count modifiers.
- Gold drop multiplier.
- Almanac discovery rate (lore-flavoured runes).

Important: respect the **bag-vs-cached-field divergence** rule from CLAUDE.md. Any system that snapshots `RunModifiers` at run-start must re-sync via setter when rune effects change mid-run. Add setters where missing; document each touch site.

### Phase 4 — Conditions + test coverage
1. Each rune's condition (`onlyInBiome=Moor`, `whileHpBelow=0.5`, `afterMinute=10`, etc.) already wired per data; confirm consumer reads the *active state* not the *equipped state* — runes off-condition do nothing.
2. Add integration tests per consumer: equip rune → enter condition → verify effect applied → exit condition → verify effect removed.
3. Balance pass — 5+ playtests sampling rune combos; flag dominant single-rune picks (>60% pick rate = re-balance).

### Phase 5 — UI surfacing
1. **Level-up card** shows rune name + condition + effect (already designed per spec).
2. **HUD chip** shows currently-equipped runes during run (small icons, hover for full text).
3. **Run summary** at end shows runes equipped + which conditions fired.
4. **Almanac entry** for each rune — pulls from C1 framework.
5. **Banter integration** — first-rune-equipped triggers a B1 first-time banter leaf (coordinate with #6 if banter expansion lands first).

## Sub-tasks

1. Stakeholder check on T111 reversal (15 min).
2. Flip `RUNE_CARD_OFFERS_ENABLED` + adjust card-pool weights.
3. Player consumers (audit + wire effects).
4. WeaponSystem consumers.
5. XPSystem consumers.
6. SpawnSystem consumers.
7. Cross-system effects (Curse, Gold, Almanac).
8. Bag-vs-cache resync points.
9. Integration tests per system.
10. Balance pass (5–10 runs).
11. UI surfacing (HUD chip, run summary, Almanac).
12. T29 dev histogram (memory: shipped for relics; reuse pattern for runes).
13. PR with cite of `ROGUELITE_RESEARCH.md` §1.5 + Soul Check + Voice Card.

## Acceptance criteria

- Rune offers appear in level-up card pool at expected rate (~15–20% of cards).
- All 30 runes have working consumers — none are dead code.
- Conditions fire correctly: rune active when condition met, inactive otherwise.
- Bag-vs-cache resync verified per touched system.
- Balance: no single rune >60% pick rate across 10 runs.
- HUD + run summary + Almanac surface runes correctly.
- Save v17 round-trip tests cover rune state.
- `npm run ci:all` green; new integration tests for consumers.

## Anti-patterns to avoid

- **Don't leave dead code.** Every rune in the bundle must have a working consumer or be removed.
- **Don't skip bag-vs-cache resync.** Per CLAUDE.md memory note, this is the most common Phaser 4 footgun in this codebase. SpawnSystem `spawnIntervalMult` and WeaponSystem `curseCooldownMul` are documented examples — runes will hit similar fields.
- **Don't read condition state inside the physics step.** ADR-0002 fixed-step contract; condition evaluation must happen on update or animation tick, not in physics integration.
- **Don't ship without balance pass.** A dominant rune ruins the rule-stack feel — feels like one right answer instead of a stack.
- **Don't break determinism.** Replay v3 schema includes rune state; integration tests must verify replay round-trip.
- **Don't auto-equip runes on save migration.** Existing save v17 may have empty rune bag; respect that. Don't gift unlocks to existing saves silently.

## Verification path

```
npm run lint
npm run build
npm test                # rune integration + condition + consumer tests
npm run test:e2e        # smoke covering rune appearance + effect activation
npm run preview         # 5–10 run balance pass with runes equipped
```

Plus:
- Replay determinism regression `src/replay/replayDeterminism.test.ts` after wire-up.
- T29 histogram reading (`?devRuneStats=1` or equivalent) for pick-rate distribution.
- Soul Check pass on level-up card copy.

## CLAUDE.md gotchas relevant here

- **Bag-vs-cached-field divergence.** Most relevant gotcha; document every system touch.
- **`scene.time.delayedCall` respects timeScale.** Time-based rune conditions (e.g. "after minute 10") must use real-time tracking that survives intermissions.
- **Arcade fixed-step contract.** Don't break replay determinism.
- **Phaser ScenePlugin vs SceneManager.** UI surfacing in run-end summary scene goes through scene manager.

## Soul checks

- Voice Card: rune card copy + condition descriptions in Hearth-with-bite (Edge if rune is risky / curse-flavoured).
- `DESIGN_SOUL.md` Soul Check on each rune card preview — does it feel like a meaningful choice?
- `ROGUELITE_RESEARCH.md` §1.5 — emphasize *conditional* not flat. Card text must surface the condition prominently or the mechanic feels random.

## Risk + descope levers

If T111 re-open is denied:
- Pivot prompt to "remove rune-promising messaging from menus + Almanac". Half-day work. Ship clean.

If balance pass reveals dominance:
- Drop the dominant rune's effect by 25%, re-test. Iterate.
- Do not ship with one-shot solutions in the pool.

If timeline slips:
- Consumer wiring per system can ship phased — ship Player + WeaponSystem first (covers ~70% of effects), defer XPSystem + SpawnSystem to next sprint.
