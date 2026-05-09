# Sporran Deck — design spec

**Date:** 2026-05-09
**Initiative:** S1 (new). Pulled from DESIGN_IDEAS §1 Sporran Deck.
**Status:** Phase 0 + Phase 1 + Phase 1.5 (`quirk_haggis_blooded` lifted from Phase 2 deferral via `extraDamageMultiplier` post-spawn hook) shipped 2026-05-09→10 (Phase 0 commit `eabe2a6`; Phase 1 commit `6275720`; Phase 1.5 commit `a5043e5`). Pool now 12 cards (was 11). Phase 2 (chronicle persistence — `RunHistoryEntry.sporranPicks` + schema bump v18→v19 + replay-side pick replay) + Phase 3 (rare/seasonal/variant-keyed pool expansion) deferred. Phase 1.5 a11y follow-up still open: DOM-focus mirror parity with CurseScene's T407 layer.
**Word count:** ~2,000
**Prerequisite:** None. Sits alongside CurseScene + RunModifiers, replaces nothing.

---

## 1. Problem statement

The 25-minute run is dense — 11 weapons / 10 evolutions, 4 skill-expression mechanics (Drift Mastery G, Whisky Breath F, Stance Q, Shinty Parry E), 18 relics, 30 runes, 7 nodes, 13 seasonals, 7 boss tier, 7 biomes, hazard layer, banter pool. Mid-run depth is saturated.

Pre-run depth is thin. The only player-driven shape is variant + (optional) curse + (date-gated) seasonal blessing. Each is a single binary axis. Two players starting the same seed with the same variant + curse get near-identical opening pressure.

The Soul Charter (`docs/DESIGN_SOUL.md`) calls for runs that *feel different* on the way in. Sporran Deck is the missing pre-run shape — a 7-card draft, keep 3, that lets the player commit to a posture before the moor opens.

Folkloric anchor: the *sporran* is the Highland-dress purse worn at the front of the kilt. Traditionally it holds small charms, herbs, and emergency oatcakes. Drawing a hand of cards from the sporran sits naturally inside the game's existing iconography — sister to the clootie wager, the cairn stack, and the first-foot gift.

### Player outcome

Same seed + same variant should now produce **wildly different** opening postures depending on draft. Triple-curse runs feel different from triple-boon runs without changing a line of weapon code. Mixed picks emerge as the natural middle path. Nothing is forced — the deck has at least one safe pick per draw.

---

## 2. Design risks

**Risk 1 — Breaks existing single-curse invariant.**
`src/data/curses.ts` documents a hard "one curse per run (no stacking in v1)" rule. Sporran Deck explicitly permits stacking up to three curses. Mitigation: Sporran cards do NOT route through the existing CurseScene. They lift to their own resolver (`applySporranPicks`) that mutates `RunModifiers` independently. The CurseScene remains the single-curse path; players opting INTO Sporran skip the CurseScene entirely. The two systems are disjoint at runtime.

**Risk 2 — Replay determinism.**
The deck draw consumes RNG. To preserve T1 replay determinism (ADR-0002 Phase 3), the draw must (a) happen at a known point in the run-start sequence, (b) consume a known number of RNG calls in a fixed order, and (c) the *picks* (3 of 7) must be recorded deterministically — either as recorded human picks (Phase 1+ UI) or auto-pick (Phase 0). Mitigation: `drawSporran(rng, pool)` does fixed Fisher-Yates shuffle then takes first N. Phase 0 auto-picks first 3 drawn. Phase 1+ records the 3 picked-card IDs in a per-run array; replay reads that array instead of re-rolling.

**Risk 3 — Card-pool synergy explosion.**
Three cards picked from a 12-card pool = 220 unordered combinations. Each combination must produce a *playable* run. Mitigation: Phase 0 cards are all *small* deltas (single-axis, magnitude bounded). Triple-curse adds three penalties + three gold bonuses (compounded multiplicatively, the worst case stays within tested ranges). Triple-boon stays at small positive aggregate. Phase 0 ships zero "large multiplier" cards — those are deferred to Phase 2 balance pass once telemetry exists.

**Risk 4 — Save schema bloat.**
Adding `sporranPicks: string[]` to `RunHistoryEntry` (for chronicle replay) bumps schema. Mitigation: Phase 0 does NOT touch `RunHistoryEntry`. The picks live in `RunModifiers` (per-run, non-persistent). Schema bump deferred to Phase 1 (UI + chronicle integration).

**Risk 5 — UI complexity.**
Drawing 7 cards on screen + tap-to-pick + visual confirm + accessibility (keyboard nav, screen reader) is a real UI lift. Mitigation: Phase 0 ships ZERO UI — the system is invisible to the player. Phase 1 adds the UI in a separate session with full a11y coverage.

---

## 3. Card pool (Phase 0)

12 cards across 3 families. Names below are i18n-key roots; copy lands with the helper.

### Curses (5) — wraps existing CURSES with `kind: 'curse'`

| ID | Source | Effect | Gold bonus |
|---|---|---|---|
| `curse_heavy_legs` | curses.ts | ×0.88 moveSpeedMult | ×1.30 |
| `curse_thin_hide` | curses.ts | ×1.25 damageTakenMult | ×1.40 |
| `curse_restless_spirits` | curses.ts | ÷1.20 spawnIntervalMult (faster spawns) | ×1.35 |
| `curse_empty_larder` | curses.ts | ×0.80 startHpRatio | ×1.25 |
| `curse_windless_pipes` | curses.ts | ×1.18 weaponCooldownMult | ×1.35 |

Each curse card delegates to `CURSES[i].apply(m)` from `src/data/curses.ts`. No reimplementation.

### Boons (4) — small positive, no gold change

| ID | Effect | Hook |
|---|---|---|
| `boon_shortbread` | +20 starting HP heal | post-spawn `player.heal(20)` |
| `boon_whisky` | ×1.05 spawnIntervalMult (slower spawns) | mutates RunModifiers |
| `boon_coal` | ×0.97 damageTakenMult | mutates RunModifiers |
| `boon_silver` | ×1.10 goldMult | mutates RunModifiers |

These are deliberately *smaller* than first-footing boons (which are date-gated rewards for being there during Hogmanay). The boon cards are everyday picks; first-footing remains the seasonal special.

### Quirks (3) — bidirectional, no gold

| ID | Positive | Negative |
|---|---|---|
| `quirk_haggis_blooded` | +12 % damage (post-spawn `Player.addDamageMultiplier(0.12)`) | ×1.12 damageTakenMult |
| `quirk_light_step` | ×1.05 moveSpeedMult | ×1.05 damageTakenMult |
| `quirk_hardy_breath` | ×1.10 startHpRatio | ×0.97 moveSpeedMult |

Phase 0 shipped 2 quirks; Phase 1.5 (commit `a5043e5`) lifted `quirk_haggis_blooded` by routing the +damage delta through a new `extraDamageMultiplier` field on `SporranCardApplyResult` / `SporranDraftResult` / `SporranRunStartPlan` instead of through the bag — sidesteps the missing `RunModifiers.damageMult` lever. The post-spawn helper calls `Player.addDamageMultiplier(amount)` alongside the existing `Player.heal(amount)` hook, sister-shape to seasonalRunStart's `addDamageMultiplier`. Total pool: **5 + 4 + 3 = 12 cards**.

---

## 4. Mechanic

```
Pre-run (Phase 1+ UI; Phase 0 auto):
  1. Player chooses variant + curse (existing CurseScene flow)
     OR opts into Sporran Deck (alternative pre-run path)
  2. drawSporran(runRng, ALL_SPORRAN_CARDS) returns 7 cards
  3. Player picks 3 (Phase 0: first 3 drawn)
  4. applySporranPicks(picks, modifiers) mutates the bag + reports
     extra HP heal needed
  5. GameScene starts run with mutated bag + heal applied to player
```

Replay-determinism:
- `runRng` is seeded at run start. Sporran draw is the FIRST consumer.
- Drawing consumes a known number of `rng.int()` / `rng.shuffle()` calls (fixed Fisher-Yates over 11 cards).
- Picks: Phase 0 auto-picks indices [0, 1, 2] of the drawn array. Deterministic.
- Phase 1+ records `pickedIds: string[]` (length 3) at draft-confirm time. Replay reads `pickedIds`, skipping the human-pick step.

---

## 5. Implementation map (Phase 0)

### Files

- **`src/systems/sporranDeck.ts`** (new) — pure helper. `drawSporran`, `applySporranPicks`, types.
- **`src/data/sporranCards.ts`** (new) — `ALL_SPORRAN_CARDS: SporranCard[]` const.
- **`src/systems/sporranDeck.test.ts`** (new) — vitest unit suite.

### Existing files NOT touched in Phase 0

- `src/data/curses.ts` — Sporran wraps CURSES, doesn't modify.
- `src/scenes/CurseScene.ts` — Sporran is a sibling path, not a replacement.
- `src/scenes/Game.ts` (if it exists) — no init payload change.
- `src/utils/save/schema.ts` — no schema bump.
- `src/core/RunModifiers.ts` — no new field. Mutation flows through existing levers.
- `src/core/i18n*` — copy keys reserved but not authored. Phase 1 ships the i18n.

### Type shape

```ts
export type SporranCardKind = 'curse' | 'boon' | 'quirk';

export interface SporranCard {
  readonly id: string;
  readonly kind: SporranCardKind;
  readonly nameKey: string;
  readonly descKey: string;
  readonly apply: (m: RunModifiers) => SporranCardApplyResult;
}

export interface SporranCardApplyResult {
  readonly extraStartingHpHeal: number;
}

export function drawSporran(
  rng: RNG,
  pool: readonly SporranCard[],
  drawCount?: number,
): SporranCard[];

export function applySporranPicks(
  picks: readonly SporranCard[],
  modifiers: RunModifiers,
): SporranDraftResult;

export interface SporranDraftResult {
  readonly extraStartingHpHeal: number;
  readonly appliedIds: readonly string[];
}
```

### Test coverage (Phase 0)

- `drawSporran` returns exactly `drawCount` distinct cards (no duplicates).
- `drawSporran` is deterministic given a seeded RNG (same seed = same draw).
- `drawSporran` distribution covers the full pool over many seeds (sanity, not statistical).
- `applySporranPicks` accumulates heals across picks (e.g., shortbread + shortbread = 40 — though duplicate picks are not possible from a single draw, the helper is still pure under that input).
- `applySporranPicks` mutates the bag (curse-card delegation works).
- Triple-curse picks compound gold bonus correctly (×1.30 × ×1.40 × ×1.35 ≈ ×2.46).
- Triple-boon picks stay within bounded positive aggregate.
- `ALL_SPORRAN_CARDS` has stable IDs (no collisions).

---

## 6. Phase roadmap

| Phase | Scope | Ships |
|---|---|---|
| **0** (this spec) | Pure helper + tests + design lock | Same session |
| 1 | UI lift (draft scene), wire `?sporran=1` URL flag → auto-draft, GameScene init payload extension | Next session |
| 2 | Chronicle integration (RunHistoryEntry sporranPicks), schema bump v18→v19, replay-side pick replay | After Phase 1 telemetry |
| 3 | Pool expansion: rare cards (deed-gated), seasonal cards (date-gated), variant-keyed cards | After Phase 2 |

Phase 0 produces invisible-to-player code. Honest scoping. Phase 1 makes it playable.

---

## 7. Soul checks (gate before ship)

- **Warmth** — the deck is the haggis's pocket. Hearth tone. Cards have folkloric names, not RPG numbers.
- **Clarity** — cards declare their effect plainly. No "mystery card" archetype in Phase 0.
- **Tone** — curse / boon / quirk maps to Edge / Hearth / Wild Comedy registers per Voice Card.
- **Voice** — copy lands in Phase 1 with i18n; the spec reserves keys.
- **Moment** — Phase 1 will design the draft moment per Great Moment Recipe (anticipation → reveal → choice → confirm → run-start).
- **Kindness** — auto-pick mode (Phase 0) means players who don't engage still get a balanced run. The system never punishes ignoring it.

---

*Spec lock. Phase 0 implementation follows.*
