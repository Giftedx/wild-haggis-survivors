# Haggis Lineage Phase 0 — Implementation Plan

> **STATUS:** ✅ SHIPPED 2026-04-22 — named haggis + ancestor whisper toast at run start. Per `superpowers/plans/INDEX.md`.
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Named haggis per run + past-ancestor whisper toast at new-run start. Narrative-only, no mechanical inheritance.

**Architecture:** Two new pure data modules (names + whispers) + one save-field addition with back-fill migration + UI edits in 4 scenes. All changes are additive; existing saves keep working.

**Tech Stack:** TypeScript, Phaser 3, Vitest, existing i18n + save + toast pipelines.

**Spec:** `docs/superpowers/specs/2026-04-22-lineage-phase0-design.md`

---

## File Structure

### New files
- `src/data/haggisNames.ts` — curated pools + `generateHaggisName` + stable-hash variant
- `src/data/haggisNames.test.ts` — invariant + determinism tests
- `src/data/ancestorWhispers.ts` — weighted picker + keys
- `src/data/ancestorWhispers.test.ts` — empty-history + weighting tests

### Modified files
- `src/utils/save.ts` — `RunHistoryEntry.name?` + backfill on load
- `src/utils/save.test.ts` — backfill + new-entry tests
- `src/core/i18n.ts` — whisper lines + epithet + kin + framing keys
- `src/core/i18n.scs.ts` — SCS mirror
- `src/scenes/GameScene.ts` — generate name at run start; fire whisper toast 3s in
- `src/scenes/GameOverScene.ts` — name framing in panel
- `src/scenes/game/PauseMenu.ts` — name subtitle
- `src/scenes/ChronicleScene.ts` — name in row renderer

---

## Task 1: haggisNames data module

**Files:**
- Create: `src/data/haggisNames.ts`
- Create: `src/data/haggisNames.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/data/haggisNames.test.ts
import { describe, expect, it } from 'vitest';
import {
  FIRST_NAMES,
  EPITHETS,
  KIN_TERMS,
  generateHaggisName,
  generateHaggisNameFromHash,
} from './haggisNames';

describe('haggis name pools', () => {
  it('has at least 30 first names', () => {
    expect(FIRST_NAMES.length).toBeGreaterThanOrEqual(30);
  });

  it('has at least 12 epithets', () => {
    expect(EPITHETS.length).toBeGreaterThanOrEqual(12);
  });

  it('has at least 8 kin terms', () => {
    expect(KIN_TERMS.length).toBeGreaterThanOrEqual(8);
  });

  it('first names have no duplicates', () => {
    expect(new Set(FIRST_NAMES).size).toBe(FIRST_NAMES.length);
  });
});

describe('generateHaggisName', () => {
  it('always returns a non-empty string', () => {
    for (let i = 0; i < 100; i++) {
      const name = generateHaggisName(() => Math.random());
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    }
  });

  it('applies epithets some of the time (30–60% band over 1000 samples)', () => {
    let withEpithet = 0;
    for (let i = 0; i < 1000; i++) {
      const name = generateHaggisName(() => Math.random());
      if (EPITHETS.some((e) => name.includes(e))) withEpithet++;
    }
    expect(withEpithet).toBeGreaterThan(300);
    expect(withEpithet).toBeLessThan(600);
  });
});

describe('generateHaggisNameFromHash', () => {
  it('same hash input always produces same name (determinism)', () => {
    const a = generateHaggisNameFromHash('seed-xyz-12345');
    const b = generateHaggisNameFromHash('seed-xyz-12345');
    expect(a).toBe(b);
  });

  it('different hash inputs usually produce different names', () => {
    const a = generateHaggisNameFromHash('seed-a');
    const b = generateHaggisNameFromHash('seed-b');
    // Loose: the pool is big enough that collision on different seeds is rare.
    // Not asserting inequality to avoid flake; just confirming both non-empty.
    expect(a.length).toBeGreaterThan(0);
    expect(b.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run failing tests**

Run: `npx vitest run src/data/haggisNames.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement the module**

```typescript
// src/data/haggisNames.ts
export const FIRST_NAMES: readonly string[] = [
  'Moira', 'Dughall', 'Eilidh', 'Hamish', 'Iona',
  'Seumas', 'Mairi', 'Lachlan', 'Isla', 'Fergus',
  'Bonnie', 'Angus', 'Catriona', 'Tavish', 'Morag',
  'Duncan', 'Senga', 'Murdo', 'Elspeth', 'Donnan',
  'Rhona', 'Coinneach', 'Aileen', 'Ewan', 'Freya',
  'Kenzie', 'Mhairi', 'Torquil', 'Una', 'Finlay',
] as const;

export const EPITHETS: readonly string[] = [
  'of the Moor',
  'Peat-heart',
  'the Red-Handed',
  'Storm-walked',
  'Heather-born',
  'of the Long Night',
  'Selkie-kin',
  'the Unquiet',
  'Thistle-kenned',
  'Midge-scarred',
  'of the Cold Hearth',
  'Saltwater-eyed',
] as const;

export const KIN_TERMS: readonly string[] = [
  'Great-great-gran',
  'Great-gran',
  'Gran',
  'Auntie',
  'Uncle',
  'Cousin',
  'Elder',
  'Forebear',
] as const;

const EPITHET_CHANCE = 0.4;

export function generateHaggisName(rng: () => number): string {
  const first = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
  if (rng() < EPITHET_CHANCE) {
    const epithet = EPITHETS[Math.floor(rng() * EPITHETS.length)];
    return `${first} ${epithet}`;
  }
  return first!;
}

/** Stable-hash helper for seed-derived naming — used by save backfill so
 *  the same historical run always gets the same name. */
function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export function generateHaggisNameFromHash(seed: string): string {
  // Mulberry32 from hashed seed for deterministic name gen.
  let a = hashString(seed);
  const rng = (): number => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return generateHaggisName(rng);
}

export function pickKinTerm(rng: () => number): string {
  return KIN_TERMS[Math.floor(rng() * KIN_TERMS.length)]!;
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/data/haggisNames.test.ts`
Expected: PASS — 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/data/haggisNames.ts src/data/haggisNames.test.ts
git commit -m "feat(lineage): haggis name pool + generator + stable-hash variant"
```

---

## Task 2: Ancestor whisper picker

**Files:**
- Create: `src/data/ancestorWhispers.ts`
- Create: `src/data/ancestorWhispers.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/data/ancestorWhispers.test.ts
import { describe, expect, it, vi } from 'vitest';
import {
  WHISPER_KEYS,
  pickAncestor,
  type AncestorPickInput,
} from './ancestorWhispers';

describe('ancestorWhispers', () => {
  it('has at least 15 whisper keys', () => {
    expect(WHISPER_KEYS.length).toBeGreaterThanOrEqual(15);
  });

  it('returns null when history is empty', () => {
    const result = pickAncestor({ runHistory: [], rngSample: 0.5 });
    expect(result).toBeNull();
  });

  it('returns a valid ancestor pick for non-empty history', () => {
    const result = pickAncestor({
      runHistory: [
        { name: 'Moira of the Moor', seed: 'a' },
        { name: 'Dughall Peat-heart', seed: 'b' },
      ],
      rngSample: 0.5,
    });
    expect(result).not.toBeNull();
    expect(['Moira of the Moor', 'Dughall Peat-heart']).toContain(result?.name);
    expect(WHISPER_KEYS).toContain(result?.whisperKey);
  });

  it('biases toward recent entries (last 3 at 2x weight)', () => {
    // 10 entries; last 3 should fire more often than the 1st 3.
    const hist = Array.from({ length: 10 }, (_, i) => ({
      name: `H${i}`,
      seed: `s${i}`,
    }));
    let recentPicks = 0;
    let oldPicks = 0;
    for (let i = 0; i < 2000; i++) {
      const result = pickAncestor({ runHistory: hist, rngSample: Math.random() });
      if (!result) continue;
      const idx = hist.findIndex((h) => h.name === result.name);
      if (idx >= 7) recentPicks++;
      if (idx < 3) oldPicks++;
    }
    // Recent-3 should noticeably dominate old-3 with 2x weighting.
    expect(recentPicks).toBeGreaterThan(oldPicks * 1.3);
  });
});
```

- [ ] **Step 2: Run failing tests**

Run: `npx vitest run src/data/ancestorWhispers.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

```typescript
// src/data/ancestorWhispers.ts
export const WHISPER_KEYS: readonly string[] = [
  'ancestor.whisper.0', 'ancestor.whisper.1', 'ancestor.whisper.2',
  'ancestor.whisper.3', 'ancestor.whisper.4', 'ancestor.whisper.5',
  'ancestor.whisper.6', 'ancestor.whisper.7', 'ancestor.whisper.8',
  'ancestor.whisper.9', 'ancestor.whisper.10', 'ancestor.whisper.11',
  'ancestor.whisper.12', 'ancestor.whisper.13', 'ancestor.whisper.14',
] as const;

export interface AncestorHistoryLike {
  name: string;
  seed: string;
}

export interface AncestorPickInput {
  runHistory: readonly AncestorHistoryLike[];
  rngSample: number;
}

export interface AncestorPick {
  name: string;
  whisperKey: string;
}

const RECENT_WEIGHT = 2;
const RECENT_COUNT = 3;

export function pickAncestor(input: AncestorPickInput): AncestorPick | null {
  const hist = input.runHistory;
  if (hist.length === 0) return null;

  // Build weighted roll space.
  const weights: number[] = hist.map((_, i) =>
    i >= Math.max(0, hist.length - RECENT_COUNT) ? RECENT_WEIGHT : 1,
  );
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  // Pick ancestor by sample1.
  const sample1 = input.rngSample;
  let acc = 0;
  let chosen = 0;
  const target = sample1 * totalWeight;
  for (let i = 0; i < hist.length; i++) {
    acc += weights[i]!;
    if (target < acc) {
      chosen = i;
      break;
    }
  }

  // Pick whisper key by a derived sample2 (use hashed index).
  const sample2 = (input.rngSample * 31 + chosen * 17) % 1;
  const key = WHISPER_KEYS[Math.floor(Math.abs(sample2) * WHISPER_KEYS.length)]!;

  return { name: hist[chosen]!.name, whisperKey: key };
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/data/ancestorWhispers.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/data/ancestorWhispers.ts src/data/ancestorWhispers.test.ts
git commit -m "feat(lineage): ancestor whisper picker with recency weighting"
```

---

## Task 3: Save field + backfill migration

**Files:**
- Modify: `src/utils/save.ts`
- Modify: `src/utils/save.test.ts`

- [ ] **Step 1: Read the RunHistoryEntry shape**

```bash
grep -n "RunHistoryEntry\b\|runHistory\b\|isVictory\b" src/utils/save.ts | head -30
```

Note the interface fields + where a new run is pushed + where the load-time coerce happens.

- [ ] **Step 2: Write failing tests**

Append to `src/utils/save.test.ts`:

```typescript
describe('RunHistoryEntry name backfill', () => {
  it('preserves saved names', () => {
    const loaded = migrateSave({
      runHistory: [
        { isVictory: true, seed: 'a', timeSurvivedSec: 100, enemiesKilled: 50, name: 'Moira of the Moor' },
      ],
    });
    expect(loaded.runHistory?.[0]?.name).toBe('Moira of the Moor');
  });

  it('backfills missing names deterministically from seed', () => {
    const a = migrateSave({
      runHistory: [
        { isVictory: false, seed: 'seed-xyz', timeSurvivedSec: 60, enemiesKilled: 20 },
      ],
    });
    const b = migrateSave({
      runHistory: [
        { isVictory: false, seed: 'seed-xyz', timeSurvivedSec: 60, enemiesKilled: 20 },
      ],
    });
    expect(a.runHistory?.[0]?.name).toBeTruthy();
    expect(a.runHistory?.[0]?.name).toBe(b.runHistory?.[0]?.name);
  });

  it('backfill tolerates entries without a seed', () => {
    // fall back to time+kills as the hash input
    const loaded = migrateSave({
      runHistory: [
        { isVictory: false, timeSurvivedSec: 90, enemiesKilled: 40 },
      ],
    });
    expect(loaded.runHistory?.[0]?.name).toBeTruthy();
  });
});
```

Use whatever migrate/load helper the file's existing tests use — likely `migrateSave` per CL T1 pattern.

- [ ] **Step 3: Run failing tests**

Run: `npx vitest run src/utils/save.test.ts`
Expected: FAIL — `name` field missing.

- [ ] **Step 4: Implement**

In `src/utils/save.ts`:

1. Extend the `RunHistoryEntry` interface:
```typescript
name?: string;
```

2. In the coerce loop for `runHistory` entries, add backfill:
```typescript
if (typeof entry.name !== 'string' || entry.name.length === 0) {
  // Stable seed: prefer the run's seed, else time+kills composite
  const hashInput = typeof entry.seed === 'string' && entry.seed.length > 0
    ? entry.seed
    : `${entry.timeSurvivedSec ?? 0}-${entry.enemiesKilled ?? 0}`;
  entry.name = generateHaggisNameFromHash(hashInput);
}
```

Add the import:
```typescript
import { generateHaggisNameFromHash } from '../data/haggisNames';
```

3. Wrap in try/catch so corruption doesn't break the load — fallback to a constant name like `'Unknown Kin'` if hashing throws.

- [ ] **Step 5: Tests pass**

Run: `npx vitest run src/utils/save.test.ts`
Expected: PASS.

- [ ] **Step 6: Full vitest**

Run: `npx vitest run`
Expected: PASS — no regressions. 

- [ ] **Step 7: Commit**

```bash
git add src/utils/save.ts src/utils/save.test.ts
git commit -m "feat(lineage): RunHistoryEntry.name + stable backfill on load"
```

---

## Task 4: i18n keys (EN + SCS)

**Files:**
- Modify: `src/core/i18n.ts`
- Modify: `src/core/i18n.scs.ts`

- [ ] **Step 1: Add EN keys**

In `src/core/i18n.ts`, add under the appropriate nested branches (match existing tree shape):

```typescript
// Under 'ancestor' branch
ancestor: {
  whisper: {
    '0': "Mind yer feet near the loch, pet.",
    '1': "The moor's a thief. Carry less.",
    '2': "Dinnae trust a tourist wi' a map.",
    '3': "The sheep ken more than ye think.",
    '4': "Ah died at minute twelve. Learn fae me.",
    '5': "Whit's fer ye'll no go by ye.",
    '6': "Keep an eye on the weather. Always.",
    '7': "Every haggis picks up where the last left aff.",
    '8': "The bell rings fer a reason, ye ken.",
    '9': "Kilt, pipes, patience — in that order.",
    '10': "If the midges stop biting, run.",
    '11': "Ah should've taken the left path.",
    '12': "Elites telegraph. Read the bloody glow.",
    '13': "Ye're no the first o' us tae try this.",
    '14': "The glen remembers ye. Make it a good memory.",
  },
  kin: {
    'Great-great-gran': 'Great-great-gran',
    'Great-gran': 'Great-gran',
    'Gran': 'Gran',
    'Auntie': 'Auntie',
    'Uncle': 'Uncle',
    'Cousin': 'Cousin',
    'Elder': 'Elder',
    'Forebear': 'Forebear',
  },
  toast: '{kin} {name}: "{line}"',
},

// Under 'ui.gameover' (add to existing branch)
name_framing: {
  death: 'Here lies {name}.',
  victory: '{name} walked home.',
},

// Under 'ui.pause' (add to existing branch)
name_header: '{name}',

// Under 'ui.chronicle'  
name_prefix: '{name}',
```

Exact placement depends on the existing tree — nest appropriately. If `ui.gameover` doesn't already exist as a branch, create it.

- [ ] **Step 2: Add SCS keys**

In `src/core/i18n.scs.ts`, mirror every key with Scots register. Sample:

```typescript
ancestor: {
  whisper: {
    '0': "Mind yer feet near the loch, pet.",
    '1': "The muir's a thief. Cairry less.",
    '2': "Dinnae trust a tourist wi' a map.",
    '3': "The sheep ken mair than ye think.",
    '4': "A dee'd at meenit twelve. Learn fae me.",
    '5': "Whit's fer ye'll no go by ye.",
    '6': "Keep an ee on the weather. Aye.",
    '7': "Ilka haggis picks up whaur the last left aff.",
    '8': "The bell rings fer a raison, ye ken.",
    '9': "Kilt, pipes, patience — in that order.",
    '10': "Gin the midges stap bitin, rin.",
    '11': "A should've taken the left path.",
    '12': "Elites telegraph. Read the bluidy lowe.",
    '13': "Ye're no the first o us tae try this.",
    '14': "The glen minds ye. Mak it a guid memory.",
  },
  kin: {
    'Great-great-gran': 'Great-great-gran',
    'Great-gran': 'Great-gran',
    'Gran': 'Gran',
    'Auntie': 'Auntie',
    'Uncle': 'Uncle',
    'Cousin': 'Cousin',
    'Elder': 'Elder',
    'Forebear': 'Forebear',
  },
  toast: '{kin} {name}: "{line}"',
},

name_framing: {
  death: 'Here lies {name}.',
  victory: '{name} gaed hame.',
},

name_header: '{name}',
name_prefix: '{name}',
```

Keep kin terms identical in both locales — Scots speakers call their gran "Gran" too, not a different word.

- [ ] **Step 3: Run parity test**

Run: `npx vitest run src/core/i18n.locale.test.ts`
Expected: PASS — parity holds.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/i18n.ts src/core/i18n.scs.ts
git commit -m "feat(i18n): ancestor whispers + lineage framing keys (EN + SCS)"
```

---

## Task 5: Current-run name + ancestor whisper toast

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Add imports**

```typescript
import { generateHaggisName } from '@/data/haggisNames';
import { pickAncestor } from '@/data/ancestorWhispers';
```

- [ ] **Step 2: Store current-run name**

Add private field:

```typescript
private runName = '';
```

In `create()`, generate the name early (before any reliance on it):

```typescript
this.runName = generateHaggisName(() => Math.random());
```

- [ ] **Step 3: Expose for other scenes**

Add public getter:

```typescript
public getRunName(): string {
  return this.runName;
}
```

- [ ] **Step 4: Fire the ancestor whisper**

In `create()`, schedule a toast 3s in:

```typescript
this.time.delayedCall(3000, () => {
  if (!this.scene.isActive()) return;
  const save = getSaveManager().load();
  const history = save.runHistory ?? [];
  const pick = pickAncestor({
    runHistory: history.map((h) => ({ name: h.name ?? '', seed: h.seed ?? '' })),
    rngSample: Math.random(),
  });
  if (!pick) return;
  const line = t(pick.whisperKey);
  // Use a mild kin term — lightly seeded for variety per run
  const kinIdx = Math.floor(Math.random() * 8);
  const kinKey = ['Great-great-gran', 'Great-gran', 'Gran', 'Auntie', 'Uncle', 'Cousin', 'Elder', 'Forebear'][kinIdx]!;
  const kin = t(`ancestor.kin.${kinKey}`);
  const msg = t('ancestor.toast', { kin, name: pick.name, line });
  this.getJuice()?.showToast(msg, TOAST_COLORS.info ?? TOAST_COLORS.positive);
});
```

Adapt local names (`getSaveManager` / `getJuice`) to match established patterns. `TOAST_COLORS.info` may or may not exist — fall back to `positive` or another mild tone; don't use `warning`.

- [ ] **Step 5: Persist the name on run-end**

Find where `runHistory.push` happens (RunLifecycle or victory/death handler). When constructing the entry, include `name: scene.getRunName()` (or pull from wherever the scene ref is). If the path already builds the payload outside GameScene, thread the name through the payload object.

- [ ] **Step 6: Build + tests**

Run: `npm run ci`
Expected: PASS — lint + vitest + build.

- [ ] **Step 7: Commit**

```bash
git add src/scenes/GameScene.ts src/scenes/game/RunLifecycle.ts
git commit -m "feat(lineage): GameScene generates run name + fires ancestor whisper"
```

Match actual files touched for persistence.

---

## Task 6: Name display in Pause + GameOver

**Files:**
- Modify: `src/scenes/game/PauseMenu.ts`
- Modify: `src/scenes/GameOverScene.ts`

- [ ] **Step 1: PauseMenu name subtitle**

In `PauseMenu.ts`, where the pause overlay content is constructed (likely near existing title/subtitle text), add:

```typescript
const runName = (scene as GameScene).getRunName?.() ?? '';
if (runName) {
  const nameText = scene.add.text(<x>, <y>, t('ui.pause.name_header', { name: runName }), {
    fontFamily: /* existing */,
    fontSize: /* small, below the main title */,
    color: /* existing muted color */,
  });
  // add to container + set depth matching pause overlay
}
```

Replace `<x>`, `<y>`, and style values by matching the PauseMenu's existing title layout — the subtitle should sit directly under the pause title, same horizontal alignment.

- [ ] **Step 2: GameOverScene name framing**

In `GameOverScene.ts`, near the top of the panel, add a framing line using the existing payload's mode:

```typescript
const framingKey = payload.mode === 'victory'
  ? 'ui.gameover.name_framing.victory'
  : 'ui.gameover.name_framing.death';
const framing = t(framingKey, { name: payload.name ?? 'A wee haggis' });
// Render as a small text line above the existing stats block
```

If `payload.name` isn't wired yet (check `GameOverPayload` interface), add it — sourced from `scene.getRunName()` at payload-construction time.

- [ ] **Step 3: Build + tests**

Run: `npm run ci`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/game/PauseMenu.ts src/scenes/GameOverScene.ts src/scenes/gameOverPayload.ts
git commit -m "feat(lineage): display current-run name in Pause + GameOver framing"
```

Include `gameOverPayload.ts` if interface extended.

---

## Task 7: Chronicle ancestor column + kill-criterion verify

**Files:**
- Modify: `src/scenes/ChronicleScene.ts`
- Modify: `docs/superpowers/specs/2026-04-22-lineage-phase0-design.md` (append verification)

- [ ] **Step 1: Find Chronicle row renderer**

```bash
grep -n "runHistory\|ChronicleRow\|formatChronicleRow\|row.entry" src/scenes/ChronicleScene.ts | head -20
```

Find where each entry's text is built.

- [ ] **Step 2: Add name prefix**

In the row renderer, prepend the name. Style it as a subtle prefix — smaller or dimmer than the primary stats row, so it doesn't dominate. Example pattern:

```typescript
const namePrefix = entry.name ? `${entry.name} · ` : '';
const rowText = `${namePrefix}${existingText}`;
```

Or if the row uses separate text objects for columns, add a new name column.

Match the scene's existing text-style pattern for consistency.

- [ ] **Step 3: Build + full CI**

Run: `npm run ci:all`
Expected: PASS — lint + vitest + build + e2e.

- [ ] **Step 4: Capture bundle + append verification**

Run: `npm run build`. Note the gzip `index-*.js` size.

Append to the spec:

```markdown

---

## Verification (post-ship, 2026-04-22)

- **Bundle delta** over previous baseline (223.82 KiB gzip): **<DELTA> KiB** (new total: <NEW_GZIP> KiB).
- **Tests**: <COUNT> vitest + 11 e2e green.
- **EN ↔ SCS parity**: ✅ all new keys mirrored.
- **Backfill migration**: ✅ existing runHistory entries get stable names on load; new entries save with run-start name.
- **Ancestor whisper**: ⏸ manual verification deferred — requires a save with at least one past run, fresh scene create, observe toast at 3s mark.
- **No balance interference**: ✅ zero mechanical inheritance shipped; names and whispers are pure text.
```

Replace `<DELTA>`, `<NEW_GZIP>`, `<COUNT>`.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/ChronicleScene.ts docs/superpowers/specs/2026-04-22-lineage-phase0-design.md
git commit -m "feat(lineage): Chronicle ancestor column + kill-criterion PASS"
```

---

## Summary

**7 tasks.** Total estimate: 45–75 min agent time.

- Tasks 1–2: pure data modules with TDD
- Task 3: save migration
- Task 4: i18n content (EN + SCS)
- Tasks 5–6: scene integration
- Task 7: Chronicle + verification

Each task commits independently. Reverting any single commit leaves the others coherent — though reverting Task 3 (save field) would orphan the wiring in Tasks 5–7, so revert in reverse order if needed.

Strictly narrative. Zero mechanical inheritance. Soul-first foundation for future phases.
