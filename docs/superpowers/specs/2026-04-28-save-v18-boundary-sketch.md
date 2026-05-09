# Save Schema — v18 Migration Boundary Sketch

**Date:** 2026-04-28
**Initiative:** Preventive sketch (no urgency; activates when next save bump lands)
**Status:** Note — schema bumped v17 → v18 on 2026-05-09 alongside the lemmings easter egg ship (`58664e7`). The bump landed via the existing inline-migration pattern, NOT the per-version-module boundary this sketch proposed. The boundary is therefore deferred to v19; the sketch's argument still applies. v18 itself added a single field (`lemmingsSeenForVariant: string[]`) — see migration chain in `src/utils/save/migrations.ts`.
**Word count:** ~1,000

---

## 1. Current State

Two save schemas live in the codebase:

| Schema | Version | Source | Migration shape |
|--------|---------|--------|-----------------|
| Save data (run state, history, achievements) | **v18** *(was v17 at sketch time)* | `src/utils/save/schema.ts` `SAVE_SCHEMA_VERSION = 18` | Migration chain in `src/utils/save/migrations.ts` (post 2026-05-07 split — see `project_restructure_status`) |
| Meta save (per-version branches) | **v9** | `src/core/SaveManager.ts` `CURRENT_SAVE_VERSION = 9` | Long inline if-ladder in `SaveManager.migrateAndCoerce()` |

The meta-save migration in particular is a 7-branch `if (v === N) { return { ... explicit field defaults ... } }` ladder. Each branch repeats every field with version-appropriate defaults. The pattern has worked through nine bumps but has three real costs:

1. **Audit trail weak.** Reading the file tells you "what does v3 look like" but not "what changed *between* v3 and v4 specifically". The diff lives in git history, not the source.
2. **Repetition fatigue.** Each new version branch re-lists every field with a default. Adding a field requires touching every branch (or accepting that older saves get the field's `coerce` default rather than an explicit version-aware default).
3. **Refactor risk.** A future maintainer pruning "obviously dead" v1-v3 branches could subtly change rehydration behavior for legacy saves still in the wild. The blast radius isn't bounded by the file structure.

**This is fine for now.** The cost is manageable at 9 versions; the pattern works. The deep-review red-team #1 risk ("save v17 inline coercion, no per-version migration files") flagged this as preventive: when v18 lands, *that* is the moment to introduce a boundary so the next nine bumps don't compound the cost.

This sketch documents what that boundary looks like so the v18-shipping author doesn't have to redesign the pattern under deadline.

---

## 2. Goal

When v18 ships:
- Each version's migration logic lives in its own module (`src/core/migrations/v18.ts` or similar).
- The dispatcher in `SaveManager` becomes a small switch / map call, not a 200-line if-ladder.
- Existing v1-v17 logic stays intact in its current shape — *no rewrite of working code*. Only NEW migrations land in the per-version pattern.
- The pattern is documented inline so the v19 author follows it.

This is a *boundary* introduction, not a rewrite. The cost is one new directory + one dispatcher tweak + one v18 file. Future v19, v20, v21 each ship a single new file.

---

## 3. Proposed Pattern

### 3.1 Per-version migration module

```ts
// src/core/migrations/v18.ts
//
// v17 → v18 migration. Adds `<new field>` (defaulted to <value>) and
// reshapes `<existing field>` to <new shape>. Older saves that pass
// through here are upgraded to v18; the dispatcher will then chain
// through v19, v20, ... up to CURRENT_SAVE_VERSION.

import type { ISaveData } from '../SaveManager';
import { CURRENT_SAVE_VERSION } from '../SaveManager';

export function migrateV17ToV18(input: Record<string, unknown>): Record<string, unknown> {
  // Returns the v18 *shape* — not necessarily the final coerced ISaveData.
  // The dispatcher will continue to apply v19, v20, ... if any exist.
  return {
    ...input,
    saveVersion: 18,
    // explicit additions / transformations
  };
}
```

### 3.2 Dispatcher in SaveManager

```ts
import { migrateV17ToV18 } from './migrations/v18';
// future: import { migrateV18ToV19 } from './migrations/v19'; ...

const NEW_MIGRATIONS: Record<number, (i: Record<string, unknown>) => Record<string, unknown>> = {
  17: migrateV17ToV18,
  // 18: migrateV18ToV19,
  // ...
};

private migrateAndCoerce(input: unknown): ISaveData {
  // [existing top-of-function obj/v guards retained as-is]

  // Existing v1..v16 inline branches retained verbatim — they handle
  // ancient saves (rare in the wild) with a one-shot jump straight to
  // CURRENT_SAVE_VERSION. Don't touch them.
  if (v === 1) { /* ...existing... */ }
  // ... through v17 ...

  // NEW per-version chain: applies migrations sequentially from the
  // save's version up to CURRENT_SAVE_VERSION.
  let working = obj;
  let workingV = v;
  while (workingV < CURRENT_SAVE_VERSION) {
    const fn = NEW_MIGRATIONS[workingV];
    if (!fn) break; // No registered migration — fall through to coercion
    working = fn(working);
    workingV = working.saveVersion as number;
  }

  // Existing field-by-field coercion runs against `working`.
  // [unchanged]
}
```

### 3.3 Test pattern

Each migration file ships with a sibling `vN.test.ts` that asserts:
- Input save shape (the smallest valid v17 blob) → output save shape (valid v18)
- All NEW fields default correctly
- Existing fields are preserved by the migration (regression guard)

---

## 4. What v18 Itself Probably Adds

Speculative — the actual v18 ships when one of these lands:

- **B5 Phase 1+ biome IDs in run history** — if `RunHistoryEntry` starts capturing the visited-biome list per run for the Almanac (currently `routes` is captured but not biomes), adding the field will need a default for legacy entries.
- **Variant unlock state changes** — if V2 follow-up lifts add new variant gating, save schema may need to track which gating events have been seen.
- **Edinburgh consultation outcome** — if cultural review forces narrative beats stored client-side per-account, that's a save-schema change.

None of these are imminent. v18 lands when a feature requires it.

---

## 5. Migration Test Coverage Today

`src/utils/save.test.ts`, `src/core/SaveManager.test.ts`, and `src/utils/saveFailure.test.ts` cover the existing migration paths. The new pattern adds `src/core/migrations/v18.test.ts` (and on per future v19, v20, ...). Existing tests stay untouched.

---

## 6. Out of Scope

- Refactoring v1-v17 inline branches into the new pattern. *Working code stays put.* The pattern is for new versions only.
- Combining the two save schemas (utils/save.ts + SaveManager.ts) into one. They serve different purposes (per-run save data vs cross-run meta).
- Eager migration on save read (current pattern reads → coerces → writes-back-when-modified is fine).

---

## 7. When to Activate

When the next save schema bump is on the design table — likely when B5 Phase 1+ ships, or sooner if a smaller feature triggers it. The author of that bump:

1. Reads this sketch.
2. Creates `src/core/migrations/v18.ts` (or whatever version is next).
3. Wires it into `NEW_MIGRATIONS` in SaveManager.
4. Ships migration tests alongside.
5. Updates this doc's §4 with the actual v18 contents and re-files under the appropriate initiative.

---

## 8. Relationship to Deep Review Risks

Closes red-team risk #1 from the 2026-04-28 deep review preventively. The risk wasn't a current bug — it was the *audit cost compound* across future bumps. Sketching the boundary now means the next bump doesn't have to redesign the pattern under feature pressure.

---

**References:**
- `src/core/SaveManager.ts:692-921` — current inline if-ladder
- `src/utils/save.ts:35,449,534,564` — separate run-save schema
- `src/core/SaveManager.test.ts` — existing migration test surface
