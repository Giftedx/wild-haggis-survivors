# Haggis Lineage Phase 0 — design spec

**Date:** 2026-04-22
**Tier:** W81, M / MEDIUM per HUGE_INITIATIVES_VERDICT.
**Scope:** First, narrow slice. Named haggis per run + ancestor whispers at new-run start. Ships in one session. Proves the concept before investing in visualisations or mechanical inheritance.

---

## 1. Problem statement

The game has no emotional continuity between runs. A haggis dies → their save entry becomes a row of numbers (time, kills, mode). No name, no lineage, no voice carrying forward. Every new run starts cold.

DESIGN_IDEAS §9: *"Haggis lineage — fallen haggis become named ancestors in a tree; a trait passes forward."*

The full idea is a tree + mechanical trait — risky per VERDICT ("unproven it would land"). Phase 0 ships the narrative half only, testing the soul hook without balance risk.

### Player outcome

- Each run carries a generated Scottish name ("Moira of the Moor", "Dughall Peat-heart").
- On new-run start, a past ancestor "whispers" a single line — different every time, from the player's own history.
- Chronicle gains an ancestor column so players can scroll their line.

### Craft outcome

- Pure text + i18n. No new UI scene. No new data source beyond name.
- Touches four files. Each change is small.
- Replay-safe: names are generated from save-seeded RNG, not run-RNG — they don't affect gameplay determinism.

---

## 2. Non-goals

- **No mechanical inheritance.** No stat boost, no trait passes forward. Meta-progression is MetaShop's lane.
- **No tree visualisation.** Flat list in Chronicle, chronological. Tree UI is Phase 1+.
- **No pre-run naming prompt.** Name auto-generates. Renaming via Settings stretch — cut if time-tight.
- **No ancestor-line authoring by player.** Whisper lines come from a curated pool.
- **No voiceover.** Text only.
- **No cross-save / cloud sync.** Strictly local — P3 domain.
- **No ancestor grief gating.** Every run joins the line; no special treatment for long-lived / story-critical runs in v1.

---

## 3. Architecture

### 3.1 Name generation

New file `src/data/haggisNames.ts`:

```typescript
export const FIRST_NAMES: readonly string[] = [...];     // ~30
export const EPITHETS: readonly string[] = [...];        // ~12
export const KIN_TERMS: readonly string[] = [...];       // ~8

export function generateHaggisName(rng: () => number): string;
```

Composition: `<FirstName> <Epithet?>` where epithet fires ~40% of the time. Gives roughly 30 + 30×12×0.4 ≈ 170+ distinct names. Pool small enough to hand-curate, large enough that a player sees variety across their own history.

Seed: `Math.random()` (cosmetic — per rng.ts policy). **Not** the run RNG — names must not feed back into gameplay seed.

### 3.2 Save field

`RunHistoryEntry.name?: string` — optional, back-fill at load time for existing entries.

Back-fill logic: load-time migration in `src/utils/save.ts`. If any `runHistory[i]` lacks `name`, generate one using a stable seed derived from the entry's existing `seed` or `timeSurvivedSec + enemiesKilled` hash — so the same historical run always gets the same name on reload.

### 3.3 Ancestor whisper at run start

On `GameScene.create()`, after save load, if `runHistory` has ≥ 1 entry:

1. Pick a random past entry (weighted toward more recent — last-3 at 2× weight).
2. Pick a whisper line from a pool of ~15 templates (EN + SCS).
3. Emit a toast: `{kin} {name}: "{line}"` — e.g. "Great-gran Moira: 'mind yer feet near the loch.'"

Fires once per run, 3s after scene start, low-priority toast so boss warnings etc. still stomp it.

If no history yet (first-ever run), skip silently. No awkward "you have no ancestors" flourish.

### 3.4 Chronicle ancestor column

Chronicle already lists past runs. Add a column (or inline suffix) showing the name. Existing row:
```
W18 · cursed · 12:34 · 245 kills
```
Becomes:
```
Moira of the Moor · W18 · cursed · 12:34 · 245 kills
```

One small change to the Chronicle row renderer. i18n-safe — only the name interpolates, other tokens stay their existing keys.

### 3.5 Ongoing-run name

Current run has its name set at `run_start` and displayed:
- Pause menu — small subtitle above existing info
- Game-over panel — "Here lies {name}" framing for deaths; "{name} walked home" for victories

Names attach to the save entry ONLY at run end, via the existing runHistory push path.

---

## 4. Components

### New files

- `src/data/haggisNames.ts` — name pools + `generateHaggisName`
- `src/data/haggisNames.test.ts` — name-gen invariant tests
- `src/data/ancestorWhispers.ts` — i18n key array + weighted picker
- `src/data/ancestorWhispers.test.ts` — picker determinism / empty-history guard

### Modified files

- `src/utils/save.ts` + `save.test.ts` — `RunHistoryEntry.name?` + back-fill migration
- `src/scenes/GameScene.ts` — generate current-run name in `create()`; fire ancestor whisper toast
- `src/scenes/GameOverScene.ts` — display name in panel framing
- `src/scenes/game/PauseMenu.ts` — display name subtitle
- `src/scenes/ChronicleScene.ts` — add name to row renderer
- `src/core/i18n.ts` — new keys: `ancestor.whisper.{0..14}`, `ancestor.kin.{great_gran, gran, ...}`, framing keys (`ui.gameover.name_framing.death` / `.victory`), pause name header, chronicle name prefix
- `src/core/i18n.scs.ts` — SCS mirror

---

## 5. Name pool (EN, curated)

### First names (30)
Moira, Dughall, Eilidh, Hamish, Iona, Seumas, Mairi, Lachlan, Isla, Fergus, Bonnie, Angus, Catriona, Tavish, Morag, Duncan, Senga, Murdo, Elspeth, Donnan, Rhona, Coinneach, Aileen, Ewan, Freya, Kenzie, Mhairi, Torquil, Una, Finlay.

### Epithets (12)
"of the Moor", "Peat-heart", "the Red-Handed", "Storm-walked", "Heather-born", "of the Long Night", "Selkie-kin", "the Unquiet", "Thistle-kenned", "Midge-scarred", "of the Cold Hearth", "Saltwater-eyed".

### Kin terms (8)
"Great-great-gran", "Great-gran", "Gran", "Auntie", "Uncle", "Cousin", "Elder", "Forebear".

SCS mirror uses same names (Gaelic / Scots names are already Scots-inflected). Epithet + kin translations in `i18n.scs.ts`.

---

## 6. Whisper lines (15 EN, voice-register-guided)

Voice per `feedback_voice_register`: Still Game warmth default, Limmy edge for the odd dark one. Ancestor whispers lean heavier toward Still Game — this is a hearth moment, not a failure moment.

Draft (exact lines tuned during implementation):

1. "Mind yer feet near the loch, pet."
2. "The moor's a thief. Carry less."
3. "Dinnae trust a tourist wi' a map."
4. "The sheep ken more than ye think."
5. "Ah died at minute twelve. Learn fae me."
6. "Whit's fer ye'll no go by ye."
7. "Keep an eye on the weather. Always."
8. "Every haggis picks up where the last left aff."
9. "The bell rings fer a reason, ye ken."
10. "Kilt, pipes, patience — in that order."
11. "If the midges stop biting, run."
12. "Ah should've taken the left path."
13. "Elites telegraph. Read the bloody glow."
14. "Ye're no the first o' us tae try this."
15. "The glen remembers ye. Make it a good memory."

SCS mirror authored in Scots register, not literal.

---

## 7. Testing

### Unit (pure, no Phaser)

- `haggisNames.test.ts`
  - Name length always > 0
  - Epithet fires ~40% over 1000 samples (loose bounds: 30–55%)
  - Same seed → same name (determinism)
  - No collisions in a single run's UI: the current-run name + 5 ancestor names are unique — weak test, flaky bound
- `ancestorWhispers.test.ts`
  - Empty history → returns null (GameScene knows to skip)
  - Weighted picker: over 1000 samples with 10 entries, last-3 fire >30% of the time (vs 30% uniform)
  - Key resolution: every whisper key exists in EN (simple import check)
- `save.test.ts` migration
  - Existing `runHistory` entries get stable names on load
  - New entries save with the name assigned at run_start
  - Corrupted `runHistory` (malformed item) doesn't break backfill

### Integration / manual

- Start a run → name appears in Pause menu
- Die or win → name appears in GameOver panel
- Start a new run → ancestor whisper toast fires once, 3s in
- Chronicle scene → each row shows ancestor name

---

## 8. Kill criteria

- `variantWireUp.test.ts` still passes (no variant work broken)
- `i18n.locale.test.ts` EN ↔ SCS parity for all new keys
- `npm run ci:all` green
- Manual: names feel Scottish and varied across 10 rolls; whisper tone warm, not jarring
- If whispers feel like spam (playtester feedback): gate behind `banterFrequency` setting — but don't preemptively gate, keep the first run clean

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| Name pool feels narrow | 30 × 12 × 0.4 ≈ 170 combos; extendable in a text file |
| Whispers interrupt critical moments | Fires once per run at 3s mark, well before first boss; low-priority toast |
| Migration breaks existing saves | Seed backfill from existing seed/stats; wrap in try/catch with fallback name |
| Voice drifts machine-translated in SCS | Author against `feedback_voice_register` + `reference_glesga_comedy_vault` memories |
| Conflicts with MetaShop meta-progression | Explicit non-goal §2 — Lineage stays narrative-only |
| Ancestor picker too biased toward recent | 2× weight is mild; tunable constant |

---

## 10. Out-of-scope (future phases)

- Tree visualisation of lineage (actual ancestors-tree UI)
- Mechanical trait inheritance (ancestral blessing / +stat from cursed ancestor / etc.)
- Player renaming current haggis
- Custom ancestor epitaphs (stories player writes)
- Bloodline specialisations (Moira-line plays differently than Dughall-line)

Each of those earns its own phase after Phase 0 validates the core hook.

---

*Spec complete. Next: `writing-plans` with 6-7 bite-sized tasks.*

---

## Verification (post-ship, 2026-04-22)

- **Bundle delta** over post-Cailleach baseline (`223.82 KiB` gzip): **+1.60 KiB** (new total: 225.42 KiB).
- **Tests**: 2949 vitest passed, 11 e2e passed.
- **EN ↔ SCS parity**: ✅ all new keys mirrored (15 whispers + 8 kin + 3 framing).
- **Backfill migration**: ✅ existing runHistory entries get deterministic names on load.
- **Name persistence**: ✅ new runs save with the name generated at run-start.
- **Ancestor whisper trigger**: ⏸ manual verification deferred — requires a save with ≥1 past run, fresh scene, observe toast at 3s mark.
- **Chronicle display**: ✅ ancestor names visible on each past-run row.
- **Pause + GameOver framing**: ✅ run name shown in Pause subtitle + GameOver epigraph line.
- **No balance interference**: ✅ zero mechanical inheritance shipped; names and whispers are pure text.
