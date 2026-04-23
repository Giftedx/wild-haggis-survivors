# U1 — Rune upgrades (rule-stack card tier) design spec

**Date:** 2026-04-23
**Initiative:** U1 (`docs/HUGE_INITIATIVES_MASTER_PLAN.md`)
**Status:** Draft
**Prerequisite:** None strict. Benefits from R1 Relics shipping first (some runes reference Relic slots).

---

## 1. Problem statement

WHS's upgrade-card pool is built almost entirely of *flat stat buffs*: +10% damage, +15% HP, +20% pickup radius. These are legible and balanced, but they're *arithmetic*, not *strategic*. Most cards read: *a bigger number*.

The canonical masterpiece roguelites (Balatro, Binding of Isaac, Slay the Spire, Hades duo-boons) all layer in *conditional rules* on top of stats. `ROGUELITE_RESEARCH.md §Tier S4` and §Pattern-2 (The Rule-Stack) make the case: conditional upgrades *stack* in ways stat buffs cannot. A +10% damage card is the same on turn 1 or turn 20. "Bagpipe hits grant +1 pickup radius for 3s" composes with every other card and with biome context.

### Player outcome

A new card rarity (**Rune**, between Rare and Legendary) introduces *rules* rather than numbers. Players build emergent synergies. Late-run runs develop *identity* — "this is a fog-build", "this is a critical-chain run" — not just "this is a stat-heavy run."

### Why now

Card-pool architecture is mature. `buildCardPool()` already handles rarity + synergy bump + luck. Adding a new rarity tier is a data-and-evaluation concern, not a structural one. Runes land as an extension of existing card flow — no new level-up UI.

---

## 2. Runes are rules, not stats

### What a Rune looks like

A Rune card has:
- A name (e.g., *Haar Rune*).
- A condition (e.g., "enemies in fog").
- An effect when condition met (e.g., "+100% damage").
- Flavour text (Dark-Souls-style, small lore).

Rendering:
- Card border: *carved stone* texture (distinct from paper weapon/passive cards).
- Icon: stylised rune-glyph matching the theme.
- Name in slight-mystical font weight.
- Condition + effect text in the card body (one sentence).

### The 30 launch Runes

Grouped by condition-type. Each has placeholder effect sizes for balance; exact numbers pinned during playtest.

#### 10 biome-conditional runes

| Rune | Condition | Effect |
|---|---|---|
| Haar Rune | Enemies in fog | +100% damage |
| Peat Rune | Enemies in bog tiles | +40% damage, -20% speed |
| Heather Rune | Kills made in heather | Spawn 1 extra gem |
| Loch Rune | Adjacent to water hazard | +10% max HP |
| Cairn Rune | Within 200px of a standing stone | +15% luck |
| Gloaming Rune | Combat during dusk palette | +8% crit chance |
| Frost Rune | Cold-biome combat | Enemies slowed 15% |
| Sea-Wrack Rune | Coastal biome | Pickup-chain timer doubled |
| Kirkyard Rune | In post-bell escalation | Kill-on-hit if enemy HP < 20% |
| Edinburgh Rune | Urban biome | +25% gold drops |

#### 10 state-conditional runes

| Rune | Condition | Effect |
|---|---|---|
| Thirst Rune | HP below 30% | +30% damage |
| Flush Rune | HP above 90% | +15% crit |
| Drover Rune | Holding full 3 Relics (R1 prereq) | +10% all stats |
| Piper Rune | Bagpipes weapon equipped | Bagpipes aura radius +25% |
| Trek Rune | Within 60s of run start | +25% speed (fades at 60s) |
| Warden Rune | Late game (past 20 min) | +40% damage |
| Combo Rune | Combo ≥ 50 | +1 pickup per kill |
| Lucky Streak Rune | 3+ unopened chests on map | Next kill drops a chest |
| Fast-Burn Rune | Dash used within last 2s | +50% damage for 1s |
| Evolved Rune | Hold 2+ evolved weapons | Evolution ability cooldowns −20% |

#### 10 action-chain runes (most synergy-rich)

| Rune | Condition | Effect |
|---|---|---|
| Echo Rune | Every 10th kill | Spawn a healing thistle |
| Cascade Rune | Kill within 0.5s of previous | +5% damage stacking (caps at 10 stacks) |
| Chorus Rune | 3 different enemy types killed in 5s | Grant 1 free card reroll |
| Storm Rune | Crit on weakened (burning/frozen) enemy | Lightning-chain to 3 nearest |
| Ceilidh Chain Rune | Pickup every 0.3s for 5s | +20% max HP (run-long) |
| Drift Rune | Dashed 5s ago | First shot after dash has +100% damage |
| Laird's Rune | Kill a named-elite | Grant a free Shrine buff |
| Thistle-Crown Rune | Kill while standing on thistle | Drop a thistle bomb (AoE 60dmg) |
| Song Rune | Music-bass-layer active | Attack speed matches bass tempo |
| Pilgrim Rune | Visit 3 Moor Road nodes this run | +50% XP for rest of run |

### Appearance rate

Runes appear at **~7% of card-draw slots** (between Rare at 13% and Legendary at 4%).

**Gating:**
- Runes unlock via progression — specifically, **killing any boss** in a run unlocks the Rune tier for that run. (Early-game stays stat-heavy; runes emerge once the build is forming.)
- **Meta-unlock:** each rune type must be *seen once* in a run (even if not picked) to enter the permanent pool for future runs. Encourages replay — can't collect all 30 in one run.

### Synergy emergence

A well-built run combines multiple runes. Example:
- Haar Rune + Peat Rune + Cairn Rune = biome-opportunist build; player actively herds enemies into fog/bog tiles, lingers near cairns.
- Thirst Rune + Fast-Burn Rune = high-risk glass-cannon; deliberately low HP + rapid-dash cycle.
- Echo Rune + Cascade Rune + Chorus Rune = combo-extender god.

No forced pair-synergies (unlike weapon evolution). Runes just *stack* via their conditions being simultaneously true.

---

## 3. Non-goals

- **Not chaining runes.** No "2 runes combine into a 3rd effect."
- **Not upgradeable runes.** Pick-once-and-persist; cannot level up a Rune within a run.
- **Not stackable same-rune.** Offering the same Rune twice in one run is excluded by pool filtering.
- **Not runtime-editable effects.** Each Rune's condition + effect is fixed in data; no player customisation.
- **Not persistent across runs.** Like all upgrades, Runes reset at run end.
- **Not a replacement for weapon evolutions.** Evolutions stay the top-tier weapon-synergy moment.
- **Not "negative runes" (cursed).** Curses remain their own system (`CurseScene`).
- **Not unlimited runes per run.** Soft cap at ~5 runes per run (limited by card-draw count × rarity chance).

---

## 4. Architecture

### New files

- `src/data/runes.ts` — 30-rune catalogue with `RuneDef` interface.
- `src/systems/RuneConditionSystem.ts` — per-frame evaluation of active Rune conditions; applies/removes effects.
- `src/systems/runes/runeEffects.ts` — pure functions per rune's effect (testable without Phaser).
- `src/systems/runes/runeConditions.ts` — pure functions per rune's condition check.

### Files to modify

- `src/data/upgrades.ts` — add `UpgradeRarity.RUNE`; pool-builder extends.
- `src/ui/UpgradeCardsUI.ts` — render Rune cards with stone-carved border + glyph icon.
- `src/core/i18n.ts` + `src/core/i18n.scs.ts` — 30 Rune names + 30 conditions + 30 effects + 30 flavour texts × 2 locales ≈ 240 keys.
- `src/systems/Player.ts` — `applyRuneEffects()` hook, called each update.
- `src/scenes/game/buildCardPool.ts` — handle `RUNE` rarity, gate on boss-killed-this-run state.
- `src/utils/save.ts` — `SaveData.unlocks.seenRunes: Set<string>` (for meta-unlock progression). Schema bump (v7 or v8 depending on order shipped; expected **v9**).
- `src/data/banter.ts` — first-Rune-seen banter line ("A rune, hen — older than speech"). Priority 110 reserved.
- `docs/DESIGN_IDEAS.md §5` — crossref: Rune family belongs to emergent-strategy category.

### Data shape

```typescript
type RuneConditionKey =
  | 'biome_fog' | 'biome_bog' | 'biome_loch' | 'biome_heather' | 'biome_urban' | 'biome_cold' | 'biome_coastal'
  | 'hp_low' | 'hp_high'
  | 'holds_full_relics' | 'holds_weapon:bagpipes'
  | 'near_cairn' | 'during_gloaming' | 'post_bell'
  | 'within_seconds_of:dash' | 'within_seconds_of:run_start'
  | 'past_time:20min'
  | 'combo:50' | 'unopened_chests:3'
  | 'evolved_weapons:2'
  | 'every_nth_kill:10' | 'kill_cascade:500ms' | 'kill_variety:3in5s'
  | 'crit_on_status_enemy' | 'pickup_chain:0.3s_for_5s'
  | 'kill_after_dash' | 'kill_named_elite'
  | 'kill_on_thistle' | 'music_bass_active' | 'visited_nodes:3';

interface RuneDef {
  key: string;
  nameKey: string;        // i18n
  conditionKey: string;   // i18n — human-readable
  effectKey: string;      // i18n
  flavourKey: string;     // i18n
  iconGlyph: string;      // rune-glyph sprite key
  condition: (ctx: RuneCtx) => boolean;
  applyEffect: (ctx: RuneCtx) => void;
  removeEffect?: (ctx: RuneCtx) => void;   // if condition toggles off
  rarity: 'rune';
  bossGateRequired: boolean; // most runes require a boss-killed-this-run
}
```

### Evaluation hook

`RuneConditionSystem.update(delta)` runs each frame:
1. Iterate active Runes (up to 5).
2. Evaluate each condition.
3. If state transition (false → true): `applyEffect`.
4. If state transition (true → false): `removeEffect`.
5. Cheap early-exits; no Rune should cost > 0.05 ms/frame.

### Tests / fences

- `runeConditions.test.ts` — each of 30 conditions tested with positive + negative case.
- `runeEffects.test.ts` — each effect tested for application + removal.
- `RuneConditionSystem.test.ts` — transition logic, multi-rune interaction.
- `buildCardPool.test.ts` — Rune rarity appears only post-boss-kill.
- `save.test.ts` — `seenRunes` migration + round-trip.

---

## 5. Risks & mitigations

| Risk | Mitigation |
|---|---|
| 30 runes is too much balance surface | Launch with 15; stage remaining 15 in two monthly drops after telemetry. |
| Per-frame condition checks tank perf | Each condition is pure, cacheable on state-change not per-frame. Profile on mid-range mobile during CI. |
| Runes dominate card-draws and override weapon/passive pool | 7% appearance rate keeps them rare. Boss-gate means first 5 min of run is Rune-free. |
| Synergy explosions make runs trivial | Playtest telemetry; any 2-rune combo with >80% win rate rebalances. |
| i18n 240-key load | Phase alongside B1 Banter Push — same authoring pipeline. |
| Card-art cost (30 stone-carved glyphs) | Procedural glyph-drawer — geometric composition of rune strokes. Budget: +15 KB gzip. |
| Rune text readability at uiScale 0.8× | Large-font variant in card UI; auto-break on overflow. |
| Cascade Rune (combo-conditional) stacks beyond design | Hard cap of 10 stacks; cap visible in effect text. |

---

## 6. Kill criteria

- **Bundle delta** ≤ +80 KB gzip (including i18n strings).
- **`npm run ci:all`** green (lint + 2980+ vitest + build + e2e).
- **Playtest: Rune pick rate between 50–70% when offered** — too low = underpowered; too high = displaces tier-5 rare cards.
- **No single Rune wins >70% of runs it appears in.**
- **Per-frame condition cost < 0.5 ms total** (all active Runes) on target hardware.
- **Meta-unlock progression works** — players see `seenRunes` count in the Almanac / Chronicle.

If Rune pick-rate is <30% or >85%, rebalance rarity-weight within 2 weeks of launch.

---

## 7. Cross-references

- `docs/research/ROGUELITE_RESEARCH.md §Tier S4, §Pattern-2` — strategic rationale.
- `docs/research/NARRATIVE_RESEARCH.md §6.2` — flavour-text voice.
- `docs/research/GAME_FEEL_RESEARCH.md §3.13` — combo-condition runes tie into milestone celebration recipe.
- `docs/research/SCOTTISH_RESEARCH.md §1.8 (standing stones)` — cairn / stone aesthetic grounding.
- `docs/DESIGN_IDEAS.md §5` — synergy family definitions.

---

*Spec complete. Plan will break into ~3 milestones: M1 data + condition eval, M2 UI + pool integration, M3 playtest + launch.*
