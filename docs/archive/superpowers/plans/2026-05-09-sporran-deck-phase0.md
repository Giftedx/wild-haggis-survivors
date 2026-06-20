# Sporran Deck — Phase 0 Implementation Plan

> **STATUS: ✅ SHIPPED (2026-05-09)** — Phase 0 helper, tests, and paired spec/plan shipped same session. Runtime wiring landed in later Sporran phases.

**Goal:** Ship the pure-helper foundation for the Sporran Deck pre-run draft system. Phase 0 delivers `drawSporran` + `applySporranPicks` + 11-card pool + tests. Zero runtime integration — system is invisible to players until Phase 1 wires UI.

**Architecture:** Pure helper `src/systems/sporranDeck.ts` mirrors `src/systems/firstFooting.ts` shape (RNG roll → result → mutates `RunModifiers`). Card pool `src/data/sporranCards.ts` mirrors `src/data/curses.ts` shape (typed entries, `apply(m)` mutator). Curse cards delegate to existing `CURSES` so the curse-balance singularity stays — Sporran's curse cards are wrappers, not reimplementations.

**Tech Stack:** TypeScript, Vitest. No Phaser. No save schema bump. No i18n keys (deferred to Phase 1).

**Spec:** `docs/archive/superpowers/specs/2026-05-09-sporran-deck-design.md`

---

## File Structure

### New files
- `src/systems/sporranDeck.ts` — pure helper, types, draw + apply
- `src/data/sporranCards.ts` — `ALL_SPORRAN_CARDS` const (11 entries)
- `src/systems/sporranDeck.test.ts` — vitest unit suite

### Modified files
- None in Phase 0. Spec file (already authored) + this plan are the only doc touches beyond the new code files.

---

## Task 1: Author the helper + types

**File:** `src/systems/sporranDeck.ts` (new)

Mirror the `firstFooting.ts` shape: top-of-file folkloric comment, exported types, pure functions.

- [ ] **Step 1:** Define `SporranCardKind`, `SporranCard`, `SporranCardApplyResult`, `SporranDraftResult` per spec §5.
- [ ] **Step 2:** Implement `drawSporran(rng, pool, drawCount = 7)`:
  - Defensive: if `pool.length < drawCount`, return whole pool.
  - Fisher-Yates shuffle a copy of `pool` using `rng.int(0, n)` swaps.
  - Take first `drawCount`.
  - Determinism contract: same seed + same pool = same draw, byte-for-byte.
- [ ] **Step 3:** Implement `applySporranPicks(picks, modifiers)`:
  - For each pick: call `card.apply(modifiers)` and accumulate `extraStartingHpHeal` from the returned `SporranCardApplyResult`.
  - Return `{ extraStartingHpHeal, appliedIds }`.
  - Pure: input `modifiers` is mutated in place (matches first-footing convention).

---

## Task 2: Author the card pool

**File:** `src/data/sporranCards.ts` (new)

11 cards: 5 curses + 4 boons + 2 quirks (per spec §3 — `quirk_haggis_blooded` deferred).

- [ ] **Step 1:** Curse cards (5) — each delegates to `CURSES[i].apply(m)` from `src/data/curses.ts`. Card IDs prefix with `curse_`. Reuse curse name/desc i18n keys (no new copy in Phase 0).
- [ ] **Step 2:** Boon cards (4) — deltas per spec §3 table. New i18n keys reserved (`sporran.boon.shortbread.name` etc.) but copy authoring deferred to Phase 1. Use placeholder English keys for now; the test suite checks ID stability not i18n resolution.
- [ ] **Step 3:** Quirk cards (2) — `quirk_light_step` + `quirk_hardy_breath` per spec §3 table.
- [ ] **Step 4:** Export `ALL_SPORRAN_CARDS: readonly SporranCard[]`. Length = 11. Order does NOT affect determinism (the helper shuffles); kept stable for test readability.

---

## Task 3: Author the test suite

**File:** `src/systems/sporranDeck.test.ts` (new)

Mirror `firstFooting.test.ts` patterns where they exist; otherwise standard vitest unit shape.

- [ ] **Step 1:** Determinism — `drawSporran(seededRng, pool)` twice with the same seed = identical card-id sequence.
- [ ] **Step 2:** Distinctness — drawn cards are unique (no duplicates).
- [ ] **Step 3:** Count — `drawSporran` returns exactly `drawCount` (default 7, smaller pools degrade to whole pool).
- [ ] **Step 4:** Apply accumulation — `applySporranPicks` of 3 cards returns sum of their heals.
- [ ] **Step 5:** Triple-curse compounding — heavy_legs + thin_hide + windless_pipes picks compound `goldMult` to ≈ ×2.46 (×1.30 × ×1.40 × ×1.35).
- [ ] **Step 6:** Triple-boon bounded — three boons applied stay within sane bounds (no positive runaway).
- [ ] **Step 7:** ID stability — every card in `ALL_SPORRAN_CARDS` has a unique non-empty id; ids match `^[a-z_]+$`.
- [ ] **Step 8:** Pool integrity — exactly 11 cards, exactly 5 curses + 4 boons + 2 quirks.

Target: 8+ test cases. All green on first run (helper is pure + deterministic; no flakiness vectors).

---

## Verify

- [ ] `npm test -- sporranDeck` passes (unit suite).
- [ ] `npm run lint` clean on the three new files.
- [ ] `npm run build` clean (TypeScript strict mode).
- [ ] No save schema bump (verify `SAVE_SCHEMA_VERSION` still 18).

---

## Out of scope (Phase 0)

- UI scene for the draft (Phase 1).
- GameScene init payload extension (Phase 1).
- `RunHistoryEntry.sporranPicks` persistence (Phase 2).
- i18n copy authoring (Phase 1).
- Replay-side pick replay (Phase 2).
- Card-pool expansion: rare / seasonal / variant-keyed (Phase 3).
- Balance tuning (Phase 2).

---

## Soul checks at ship time (Phase 0)

The Phase 0 surface is invisible to players, so the user-facing soul checks (warmth / clarity / tone / voice / palette / moment) all defer to Phase 1. The Phase 0 craft check is **engineering integrity**: pure helper, replay-deterministic, no runtime side-effects, sibling-pattern fidelity to firstFooting / curses, full unit coverage.

---

*Plan lock. Implementation follows.*
