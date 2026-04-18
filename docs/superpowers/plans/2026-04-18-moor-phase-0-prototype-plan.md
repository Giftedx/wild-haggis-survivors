# Moor Phase 0 — Prototype + Style Bible + Dev Affordances

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the procedural-art path can hit the handcrafted craft bar the existing enemy sprites set (dean_apparition, tome_wraith, redcap, ceilidh_caller), by shipping one animated classic haggis + one accessory (tam-o-shanter) + the infrastructure Phases 1-4 depend on. Ships when Gate A (charter + 24 h cooldown self-review) and Gate B (external review by ≥ 2 non-developers) both pass.

**Architecture:** Texture-swap atlases — procedural drawers run once at boot to `generateTexture` per (variant × state × frame); runtime Player/Enemy swap sprite textures via `setTexture` on state/frame boundary. No per-frame `Graphics` allocation. State machine + 24 fps frame clock drive transitions purely from game signals, preserving T1 replay determinism.

**Tech Stack:** Phaser 3.90, TypeScript 6, Vitest 3, Vite 6. Path alias `@/*` → `./src/*`. Vitest runs in node env — Phaser-importing modules cannot be unit-tested under the default env, so pure logic is extracted into helper modules tested separately; Phaser-bound classes are integration-smoke-tested only.

**Reference:** Design spec at `docs/superpowers/specs/2026-04-18-moor-renders-itself-design.md` (v3). All §refs below cite that spec.

---

## File structure

```
NEW:
  src/animation/
    ├── animationStates.ts             · pure FSM: evaluate(current, signals) → next state
    ├── animationStates.test.ts
    ├── frameClock.ts                  · pure 24 fps clock: advance(accMs, scaledDelta, state) → { accMs, frameIndex }
    ├── frameClock.test.ts
    ├── textureAtlas.ts                · pure key mapping: atlasKey(variant, state, frame) → string
    ├── textureAtlas.test.ts
    ├── AnimationController.ts         · per-entity state + frame-index owner; calls setTexture
    ├── AnimationController.test.ts
    └── frameDrawers/
        ├── haggisFrames.ts            · procedural drawers for classic haggis per (state, frame)
        └── haggisFrames.test.ts       · smoke: drawers run without error, keys registered

  src/art/
    ├── palettes.ts                    · curated hex palette anchors + VariantPalette type
    └── palettes.test.ts               · smoke: no duplicate names, all hex valid

  src/entities/haggisComposition/
    ├── HaggisContainer.ts             · Container with body sprite + 4 accessory layer sprites
    ├── HaggisContainer.test.ts        · smoke
    ├── AccessoryDrawer.ts             · AccessoryDrawer interface + DrawCtx type
    ├── accessoryRegistry.ts           · id → drawer map
    ├── accessoryRegistry.test.ts
    └── drawers/
        ├── tamOShanter.ts             · tam drawer for (idle + walking) × (2 + 4) frames
        └── tamOShanter.test.ts        · smoke

  src/scenes/dev/
    ├── CombinationsPreviewScene.ts    · minimal Phase 0 dev scene (classic + tam grid)
    └── debugHotkeys.ts                · force-equip, force-state, screenshot, combinations toggle

  docs/
    └── ART_STYLE_BIBLE.md             · palette anchors + light model + composition + references

  .superpowers/captures/               · debug screenshot output (gitignored)

MODIFIED:
  src/scenes/BootScene.ts              · call atlas pre-bake, measure + log wall time
  src/entities/Player.ts               · mount HaggisContainer + AnimationController; retire wobblePhase
  src/scenes/GameScene.ts              · wire debug hotkeys in dev mode
  src/main.ts                          · register CombinationsPreviewScene (dev only)
  .gitignore                           · add .superpowers/captures/
```

---

## Task 1: Create ART_STYLE_BIBLE.md (doc-only)

**Files:**
- Create: `docs/ART_STYLE_BIBLE.md`

- [ ] **Step 1: Write the bible**

```markdown
# Art Style Bible — Wild Haggis Survivors

Non-negotiable bar for every new procedural drawer in the Moor-Renders-Itself push (spec `docs/superpowers/specs/2026-04-18-moor-renders-itself-design.md`). NEW drawers adhere; EXISTING sprites retrofit opportunistically when touched — not blocking.

## Palette anchors

Curated from the existing sprite hex inventory. Canonical source: `src/art/palettes.ts`. Use these, no stray hex.

### Peat browns
- `0x3a2818` — shadow peat
- `0x5a3e20` — mid peat
- `0x4a2e18` — warm peat

### Heather purples
- `0x8060a0` — dark heather
- `0x9070b0` — mid heather
- `0xb090d0` — bright heather

### Loch blues
- `0x2a4a6a` — deep loch
- `0x4a7090` — mid loch
- `0x6a90b0` — cool mist

### Whisky golds
- `0xc8a040` — aged gold
- `0xd4b055` — warm gold
- `0xffc840` — bright gold

### Stone greys
- `0x2a2a30` — shadow stone
- `0x4a4a50` — mid stone
- `0x8a8a90` — highlight stone

### Scots-red accents
- `0xaa2020` — deep blood
- `0xc42828` — arterial
- `0x901818` — dried blood

## Light model

Every NEW drawer:
- Primary light: upper-left, full strength.
- Fill light: upper-right, 50% strength.
- Ambient occlusion: underside of body, subtle dark wash.

Existing sprites are inconsistent on this; retrofit when touched, don't block forward progress.

## Stroke / line weight

- No strokes on procedural sprites; mass via tonal layering.
- Exception: 1 px gold trim (`0xc8a040`) on ceremonial items (dean_apparition gown, auditor_priest staff tip).

## Composition rules

- Head: upper 1/3 of silhouette.
- Body: mid 1/3.
- Ground/shadow anchor: lower 1/6.
- Centre x. Bias y downward (ground anchor).

## Focal hierarchy

- One primary focal point (eyes / hat / weapon).
- One secondary (tint detail / stripe / motion).
- Tertiary is texture.

## Character pose

Every sprite has posture. Tilt, lean, stance. Not neutral mannequin.

## Squash/rest proportions

Defer: per-variant body-shape differences beyond palette are Phase 2.5. MVP variants share body shape; accessory + palette differentiate.

## Inspiration wall

Procedural or not, these anchor the voice:

- **Charles Rennie Mackintosh** — rose motifs, Glasgow Style, stark geometric floral. https://en.wikipedia.org/wiki/Charles_Rennie_Mackintosh
- **The Glasgow Boys** — late-19th-century painters, peat-palette muted naturalism. https://en.wikipedia.org/wiki/Glasgow_Boys
- **Limmy's Show** — surreal Glaswegian title cards, high-contrast flat palette.
- **Still Game** — warm-hearth character posters, exaggerated posture.
- **Trainspotting (1996)** — opening kinetic typography, sodium-orange and black.
- **Celtic illumination** — Book of Kells knotwork, densely layered detail.

## Reference files

Screenshots of existing bar-setting sprites live in `docs/art_refs/` (add as needed):
- `dean_apparition.png`
- `tome_wraith.png`
- `redcap.png`
- `ceilidh_caller.png`

New drawers compare side-by-side against these before Gate A passes.
```

- [ ] **Step 2: Commit**

```bash
git add docs/ART_STYLE_BIBLE.md
git commit -m "docs: ART_STYLE_BIBLE — palette, light model, composition, inspiration"
```

---

## Task 2: Create palettes.ts

**Files:**
- Create: `src/art/palettes.ts`
- Test: `src/art/palettes.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/art/palettes.test.ts
import { describe, expect, it } from 'vitest';
import { PALETTE, PALETTE_GROUPS } from './palettes';

describe('PALETTE', () => {
  it('exposes named hex anchors grouped by family', () => {
    expect(PALETTE.peat.shadow).toBe(0x3a2818);
    expect(PALETTE.heather.bright).toBe(0xb090d0);
    expect(PALETTE.gold.aged).toBe(0xc8a040);
  });

  it('every value is a 24-bit integer (0..0xffffff)', () => {
    for (const group of Object.values(PALETTE)) {
      for (const hex of Object.values(group)) {
        expect(hex).toBeGreaterThanOrEqual(0);
        expect(hex).toBeLessThanOrEqual(0xffffff);
      }
    }
  });

  it('PALETTE_GROUPS enumerates every family name', () => {
    const keys = Object.keys(PALETTE).sort();
    expect([...PALETTE_GROUPS].sort()).toEqual(keys);
  });

  it('has no duplicate hex across the whole palette', () => {
    const all: number[] = [];
    for (const group of Object.values(PALETTE)) {
      for (const hex of Object.values(group)) all.push(hex);
    }
    expect(new Set(all).size).toBe(all.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --run src/art/palettes.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// src/art/palettes.ts
/**
 * Curated palette anchors per `docs/ART_STYLE_BIBLE.md`. Single source of
 * truth for procedural drawer colour choices. No stray hex constants in
 * drawer code — pull from here or extend this module.
 *
 * Families chosen from the existing sprite inventory (dean_apparition,
 * tome_wraith, redcap, etc.) and grouped so a drawer can pick an anchor
 * + a lighter / darker sibling without hunting across the codebase.
 */

export const PALETTE = {
  peat: {
    shadow: 0x3a2818,
    mid: 0x5a3e20,
    warm: 0x4a2e18,
  },
  heather: {
    dark: 0x8060a0,
    mid: 0x9070b0,
    bright: 0xb090d0,
  },
  loch: {
    deep: 0x2a4a6a,
    mid: 0x4a7090,
    cool: 0x6a90b0,
  },
  gold: {
    aged: 0xc8a040,
    warm: 0xd4b055,
    bright: 0xffc840,
  },
  stone: {
    shadow: 0x2a2a30,
    mid: 0x4a4a50,
    highlight: 0x8a8a90,
  },
  red: {
    deep: 0xaa2020,
    arterial: 0xc42828,
    dried: 0x901818,
  },
} as const;

export const PALETTE_GROUPS = Object.keys(PALETTE) as Array<keyof typeof PALETTE>;

/**
 * Per-variant tint applied by HaggisContainer body-sprite drawer. Phase 0
 * ships `classic` only; remaining 8 variants land in Phase 1 alongside
 * per-variant atlas bake.
 */
export interface VariantPalette {
  readonly body: number;
  readonly bodyShadow: number;
  readonly bodyHighlight: number;
  readonly accent: number;
}

export const CLASSIC_VARIANT: VariantPalette = {
  body: PALETTE.peat.mid,
  bodyShadow: PALETTE.peat.shadow,
  bodyHighlight: PALETTE.peat.warm,
  accent: PALETTE.gold.aged,
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- --run src/art/palettes.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/art/palettes.ts src/art/palettes.test.ts
git commit -m "feat(art): palettes.ts — curated hex anchors + VariantPalette type"
```

---

## Task 3: animationStates.ts — pure FSM

**Files:**
- Create: `src/animation/animationStates.ts`
- Test: `src/animation/animationStates.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/animation/animationStates.test.ts
import { describe, expect, it } from 'vitest';
import {
  evaluateAnimationState,
  type AnimationState,
  type AnimationSignals,
} from './animationStates';

const NEUTRAL_SIGNALS: AnimationSignals = {
  velocityMag: 0,
  hurtEdge: false,
  attackEdge: false,
  celebrateEdge: false,
  hp: 100,
};

describe('evaluateAnimationState', () => {
  it('stays idle when velocity is below threshold and no edges fire', () => {
    const next = evaluateAnimationState('idle', NEUTRAL_SIGNALS);
    expect(next).toBe('idle');
  });

  it('transitions idle → walking when velocity crosses threshold', () => {
    const next = evaluateAnimationState('idle', { ...NEUTRAL_SIGNALS, velocityMag: 50 });
    expect(next).toBe('walking');
  });

  it('transitions walking → idle when velocity drops below threshold', () => {
    const next = evaluateAnimationState('walking', NEUTRAL_SIGNALS);
    expect(next).toBe('idle');
  });

  it('hurtEdge interrupts any state to hurt', () => {
    const states: AnimationState[] = ['idle', 'walking', 'attacking', 'celebrating'];
    for (const s of states) {
      const next = evaluateAnimationState(s, { ...NEUTRAL_SIGNALS, hurtEdge: true });
      expect(next).toBe('hurt');
    }
  });

  it('dying is terminal — no signal escapes it', () => {
    const next = evaluateAnimationState('dying', {
      velocityMag: 100,
      hurtEdge: true,
      attackEdge: true,
      celebrateEdge: true,
      hp: 50,
    });
    expect(next).toBe('dying');
  });

  it('hp <= 0 transitions any non-dying state to dying', () => {
    const states: AnimationState[] = ['idle', 'walking', 'attacking', 'hurt', 'celebrating'];
    for (const s of states) {
      const next = evaluateAnimationState(s, { ...NEUTRAL_SIGNALS, hp: 0 });
      expect(next).toBe('dying');
    }
  });

  it('attackEdge transitions non-hurt/dying to attacking', () => {
    const next = evaluateAnimationState('walking', { ...NEUTRAL_SIGNALS, attackEdge: true });
    expect(next).toBe('attacking');
  });

  it('hurt takes priority over attack edge when both fire', () => {
    const next = evaluateAnimationState('idle', {
      ...NEUTRAL_SIGNALS,
      hurtEdge: true,
      attackEdge: true,
    });
    expect(next).toBe('hurt');
  });

  it('celebrateEdge transitions idle/walking to celebrating', () => {
    expect(evaluateAnimationState('idle', { ...NEUTRAL_SIGNALS, celebrateEdge: true })).toBe('celebrating');
    expect(evaluateAnimationState('walking', { ...NEUTRAL_SIGNALS, celebrateEdge: true })).toBe('celebrating');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --run src/animation/animationStates.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// src/animation/animationStates.ts
/**
 * Pure animation state machine. Evaluated per tick in AnimationController
 * from game signals. No timers, no side effects, no wall-clock — hand
 * the snapshot in, get the next state back. Replay-deterministic by
 * construction.
 *
 * Transition precedence (highest first):
 *   1. hp <= 0 → dying
 *   2. hurtEdge → hurt
 *   3. attackEdge → attacking
 *   4. celebrateEdge → celebrating
 *   5. velocityMag above threshold → walking
 *   6. velocity below threshold → idle
 *
 * `dying` is terminal — once entered, stays there until the entity is
 * destroyed.
 */

export type AnimationState =
  | 'idle'
  | 'walking'
  | 'attacking'
  | 'hurt'
  | 'celebrating'
  | 'dying';

export interface AnimationSignals {
  /** Length of the entity's velocity vector, in px/s. */
  readonly velocityMag: number;
  /** True on the frame a takeDamage fired. */
  readonly hurtEdge: boolean;
  /** True on the frame a melee weapon fired. */
  readonly attackEdge: boolean;
  /** True on the frame a celebration event fired (boss kill, level up). */
  readonly celebrateEdge: boolean;
  /** Current HP. 0 triggers dying; entity cleans up separately. */
  readonly hp: number;
}

/**
 * Minimum velocity magnitude (px/s) for an entity to count as "walking".
 * Below this it idles. Value chosen to match Player.ts normal movement
 * baseline (~150 px/s min) with headroom for drift micro-jitter.
 */
export const WALKING_VELOCITY_THRESHOLD = 20;

export function evaluateAnimationState(
  current: AnimationState,
  signals: AnimationSignals,
): AnimationState {
  if (current === 'dying') return 'dying';
  if (signals.hp <= 0) return 'dying';
  if (signals.hurtEdge) return 'hurt';
  if (signals.attackEdge) return 'attacking';
  if (signals.celebrateEdge) return 'celebrating';
  if (signals.velocityMag >= WALKING_VELOCITY_THRESHOLD) return 'walking';
  return 'idle';
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- --run src/animation/animationStates.test.ts
```

Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/animation/animationStates.ts src/animation/animationStates.test.ts
git commit -m "feat(animation): animationStates.ts — pure FSM with 9 test branches"
```

---

## Task 4: frameClock.ts — 24 fps clock

**Files:**
- Create: `src/animation/frameClock.ts`
- Test: `src/animation/frameClock.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/animation/frameClock.test.ts
import { describe, expect, it } from 'vitest';
import {
  advanceFrameClock,
  getFrameCountForState,
  getTempoForState,
  type AnimationState,
} from './frameClock';

describe('advanceFrameClock', () => {
  it('advances frame when accumulator exceeds 1000/fps ms', () => {
    // idle runs at 2 fps → 500 ms per frame
    const r = advanceFrameClock({
      accMs: 0,
      frameIndex: 0,
      state: 'idle',
      scaledDelta: 500,
    });
    expect(r.frameIndex).toBe(1);
    expect(r.accMs).toBe(0);
  });

  it('preserves sub-frame accumulation', () => {
    const r = advanceFrameClock({
      accMs: 300,
      frameIndex: 1,
      state: 'idle',
      scaledDelta: 150,
    });
    expect(r.frameIndex).toBe(1);
    expect(r.accMs).toBe(450);
  });

  it('looping states wrap frame index at state frame count', () => {
    // idle has 2 frames; after 2 advances it wraps to 0
    let r = advanceFrameClock({ accMs: 0, frameIndex: 1, state: 'idle', scaledDelta: 500 });
    expect(r.frameIndex).toBe(0); // wrapped from 2 back to 0
  });

  it('one-shot states clamp at final frame (no wrap)', () => {
    // dying has 3 frames; advancing at frame 2 keeps frame 2
    const r = advanceFrameClock({
      accMs: 500,
      frameIndex: 2,
      state: 'dying',
      scaledDelta: 500,
    });
    expect(r.frameIndex).toBe(2);
  });

  it('handles multiple frame advances in one tick (catch-up)', () => {
    // walking at 24 fps → ~41.67 ms per frame; a 200 ms spike advances ~4 frames
    const r = advanceFrameClock({
      accMs: 0,
      frameIndex: 0,
      state: 'walking',
      scaledDelta: 200,
    });
    expect(r.frameIndex).toBe(0); // wrapped: 4 mod 4 = 0
  });

  it('zero or negative scaledDelta does not advance frames', () => {
    const r1 = advanceFrameClock({ accMs: 100, frameIndex: 1, state: 'walking', scaledDelta: 0 });
    expect(r1).toEqual({ accMs: 100, frameIndex: 1 });
    const r2 = advanceFrameClock({ accMs: 100, frameIndex: 1, state: 'walking', scaledDelta: -50 });
    expect(r2).toEqual({ accMs: 100, frameIndex: 1 });
  });
});

describe('getFrameCountForState / getTempoForState', () => {
  const states: AnimationState[] = ['idle', 'walking', 'attacking', 'hurt', 'celebrating', 'dying'];

  it('returns a positive integer frame count per state', () => {
    for (const s of states) {
      const n = getFrameCountForState(s);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(n)).toBe(true);
    }
  });

  it('walking is the highest-tempo looping state at 24 fps', () => {
    expect(getTempoForState('walking')).toBe(24);
  });

  it('idle is the lowest-tempo looping state at 2 fps', () => {
    expect(getTempoForState('idle')).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --run src/animation/frameClock.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// src/animation/frameClock.ts
/**
 * Pure per-state frame clock. Advances a frame index based on a
 * time accumulator + scaledDelta. Loops or one-shots per state's
 * authored tempo. No wall-clock reads; replay-deterministic.
 *
 * Tempos chosen per the animation charter in
 * `docs/superpowers/specs/2026-04-18-moor-renders-itself-design.md` §2.
 */

import type { AnimationState } from './animationStates';
export type { AnimationState } from './animationStates';

interface StateDef {
  readonly frames: number;
  readonly fps: number;
  readonly loop: boolean;
}

const STATE_DEFS: Record<AnimationState, StateDef> = {
  idle: { frames: 2, fps: 2, loop: true },
  walking: { frames: 4, fps: 24, loop: true },
  attacking: { frames: 4, fps: 24, loop: false },
  hurt: { frames: 2, fps: 30, loop: false },
  celebrating: { frames: 4, fps: 12, loop: true },
  dying: { frames: 3, fps: 12, loop: false },
};

export function getFrameCountForState(state: AnimationState): number {
  return STATE_DEFS[state].frames;
}

export function getTempoForState(state: AnimationState): number {
  return STATE_DEFS[state].fps;
}

export interface FrameClockTickInput {
  readonly accMs: number;
  readonly frameIndex: number;
  readonly state: AnimationState;
  readonly scaledDelta: number;
}

export interface FrameClockTickResult {
  readonly accMs: number;
  readonly frameIndex: number;
}

export function advanceFrameClock(input: FrameClockTickInput): FrameClockTickResult {
  if (input.scaledDelta <= 0) {
    return { accMs: input.accMs, frameIndex: input.frameIndex };
  }
  const def = STATE_DEFS[input.state];
  const msPerFrame = 1000 / def.fps;
  const acc = input.accMs + input.scaledDelta;
  const frameAdvance = Math.floor(acc / msPerFrame);
  const remainder = acc - frameAdvance * msPerFrame;
  const rawIndex = input.frameIndex + frameAdvance;
  const nextIndex = def.loop
    ? rawIndex % def.frames
    : Math.min(rawIndex, def.frames - 1);
  return { accMs: remainder, frameIndex: nextIndex };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- --run src/animation/frameClock.test.ts
```

Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/animation/frameClock.ts src/animation/frameClock.test.ts
git commit -m "feat(animation): frameClock.ts — per-state frame advancer with loop + one-shot"
```

---

## Task 5: textureAtlas.ts — atlas key mapping

**Files:**
- Create: `src/animation/textureAtlas.ts`
- Test: `src/animation/textureAtlas.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/animation/textureAtlas.test.ts
import { describe, expect, it } from 'vitest';
import {
  atlasKey,
  allAtlasKeysForVariant,
} from './textureAtlas';

describe('atlasKey', () => {
  it('formats as <subject>_<variant>_<state>_<frame>', () => {
    expect(atlasKey('haggis', 'classic', 'walking', 2)).toBe('haggis_classic_walking_2');
  });

  it('accepts accessory subjects without variant when passed null', () => {
    expect(atlasKey('tam_o_shanter', null, 'idle', 0)).toBe('tam_o_shanter_idle_0');
  });

  it('negative or non-integer frame throws', () => {
    expect(() => atlasKey('haggis', 'classic', 'idle', -1)).toThrow();
    expect(() => atlasKey('haggis', 'classic', 'idle', 1.5)).toThrow();
  });
});

describe('allAtlasKeysForVariant', () => {
  it('enumerates every (state, frame) key for a variant — 19 frames total', () => {
    const keys = allAtlasKeysForVariant('haggis', 'classic');
    expect(keys).toContain('haggis_classic_idle_0');
    expect(keys).toContain('haggis_classic_idle_1');
    expect(keys).toContain('haggis_classic_walking_0');
    expect(keys).toContain('haggis_classic_walking_3');
    expect(keys).toContain('haggis_classic_attacking_0');
    expect(keys).toContain('haggis_classic_attacking_3');
    expect(keys).toContain('haggis_classic_hurt_0');
    expect(keys).toContain('haggis_classic_hurt_1');
    expect(keys).toContain('haggis_classic_celebrating_0');
    expect(keys).toContain('haggis_classic_celebrating_3');
    expect(keys).toContain('haggis_classic_dying_0');
    expect(keys).toContain('haggis_classic_dying_2');
    // Total: 2 + 4 + 4 + 2 + 4 + 3 = 19
    expect(keys.length).toBe(19);
  });

  it('returns a different key set per variant', () => {
    const classic = allAtlasKeysForVariant('haggis', 'classic');
    const runner = allAtlasKeysForVariant('haggis', 'moor_runner');
    expect(classic).not.toEqual(runner);
    expect(classic[0]).toMatch(/classic/);
    expect(runner[0]).toMatch(/moor_runner/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --run src/animation/textureAtlas.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// src/animation/textureAtlas.ts
/**
 * Pure atlas-key map. The texture-swap architecture pre-bakes one
 * texture per (subject × variant × state × frame) at boot; runtime
 * looks up by key. This module owns the key format — nothing else
 * builds these strings by hand.
 *
 * Subjects: 'haggis' for the player body, or an accessory id
 *   (e.g. 'tam_o_shanter') for accessory layers.
 * Variant: non-null for 'haggis' (one of the 9 variants);
 *   null for accessories (accessories are variant-agnostic in MVP).
 */

import { getFrameCountForState } from './frameClock';
import type { AnimationState } from './animationStates';

export type AtlasSubject = 'haggis' | string; // accessory ids are free strings
export type AtlasVariant = string | null;

const ALL_STATES: AnimationState[] = [
  'idle',
  'walking',
  'attacking',
  'hurt',
  'celebrating',
  'dying',
];

export function atlasKey(
  subject: AtlasSubject,
  variant: AtlasVariant,
  state: AnimationState,
  frame: number,
): string {
  if (!Number.isInteger(frame) || frame < 0) {
    throw new Error(`atlasKey: frame must be non-negative integer, got ${frame}`);
  }
  return variant === null
    ? `${subject}_${state}_${frame}`
    : `${subject}_${variant}_${state}_${frame}`;
}

/**
 * Enumerate every atlas key for a (subject, variant) pair across every
 * state × authored frame. Used by BootScene to drive the pre-bake loop
 * and by AnimationController for warm-cache assertions in dev.
 */
export function allAtlasKeysForVariant(
  subject: AtlasSubject,
  variant: AtlasVariant,
): string[] {
  const out: string[] = [];
  for (const state of ALL_STATES) {
    const count = getFrameCountForState(state);
    for (let f = 0; f < count; f++) {
      out.push(atlasKey(subject, variant, state, f));
    }
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- --run src/animation/textureAtlas.test.ts
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/animation/textureAtlas.ts src/animation/textureAtlas.test.ts
git commit -m "feat(animation): textureAtlas.ts — key mapping for (subject × variant × state × frame)"
```

---

## Task 6: haggisFrames.ts — classic haggis idle atlas (2 frames)

This task authors procedural drawer functions for the classic haggis in the idle state. Iteration is expected — each frame is drafted, reviewed against the style bible, and refined until it meets the charter. **Multiple commits inside this task are fine.** The task completes when the style-bible self-review passes on both frames.

**Files:**
- Create: `src/animation/frameDrawers/haggisFrames.ts`
- Create: `src/animation/frameDrawers/haggisFrames.test.ts`

- [ ] **Step 1: Write the smoke test**

```typescript
// src/animation/frameDrawers/haggisFrames.test.ts
import { describe, expect, it, vi } from 'vitest';
import { drawHaggisFrame } from './haggisFrames';
import { CLASSIC_VARIANT } from '../../art/palettes';

describe('drawHaggisFrame', () => {
  // The Graphics object is a Phaser stub; we only assert draw calls happen.
  function makeGraphicsStub() {
    return {
      fillStyle: vi.fn().mockReturnThis(),
      fillCircle: vi.fn().mockReturnThis(),
      fillEllipse: vi.fn().mockReturnThis(),
      fillRect: vi.fn().mockReturnThis(),
      fillTriangle: vi.fn().mockReturnThis(),
    };
  }

  it('draws at least one primitive per frame for idle state', () => {
    const g0 = makeGraphicsStub();
    drawHaggisFrame(g0 as unknown as Phaser.GameObjects.Graphics, {
      variantPalette: CLASSIC_VARIANT,
      state: 'idle',
      frame: 0,
    });
    // Every sprite has at least body fill + eyes + some detail.
    const totalCalls =
      g0.fillCircle.mock.calls.length +
      g0.fillEllipse.mock.calls.length +
      g0.fillRect.mock.calls.length +
      g0.fillTriangle.mock.calls.length;
    expect(totalCalls).toBeGreaterThanOrEqual(5);
  });

  it('idle frame 0 and frame 1 differ in at least one draw call', () => {
    const g0 = makeGraphicsStub();
    const g1 = makeGraphicsStub();
    drawHaggisFrame(g0 as unknown as Phaser.GameObjects.Graphics, {
      variantPalette: CLASSIC_VARIANT,
      state: 'idle',
      frame: 0,
    });
    drawHaggisFrame(g1 as unknown as Phaser.GameObjects.Graphics, {
      variantPalette: CLASSIC_VARIANT,
      state: 'idle',
      frame: 1,
    });
    // At minimum the frame parameter drives a difference somewhere.
    const sig0 = JSON.stringify([g0.fillCircle.mock.calls, g0.fillEllipse.mock.calls]);
    const sig1 = JSON.stringify([g1.fillCircle.mock.calls, g1.fillEllipse.mock.calls]);
    expect(sig0).not.toBe(sig1);
  });

  it('throws on unknown state × frame combo', () => {
    const g = makeGraphicsStub();
    expect(() =>
      drawHaggisFrame(g as unknown as Phaser.GameObjects.Graphics, {
        variantPalette: CLASSIC_VARIANT,
        state: 'idle',
        frame: 99,
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --run src/animation/frameDrawers/haggisFrames.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the drawer scaffold + idle implementation (first draft)**

```typescript
// src/animation/frameDrawers/haggisFrames.ts
/**
 * Procedural drawers for the classic haggis body across (state × frame).
 *
 * Authored against `docs/ART_STYLE_BIBLE.md`. Reference sprites for
 * craft-bar comparison: `dean_apparition`, `tome_wraith`, `redcap`,
 * `ceilidh_caller` in `src/scenes/BootScene.ts`.
 *
 * Ships Phase 0: idle × 2 + walking × 4 (6 frames total for classic).
 * Remaining states (attacking, hurt, celebrating, dying) land in Phase 1.
 *
 * Light model per the bible:
 *   - Primary light upper-left
 *   - Fill light upper-right at 50%
 *   - Ambient occlusion at body underside
 */

import type { AnimationState } from '../animationStates';
import type { VariantPalette } from '../../art/palettes';

export interface HaggisDrawCtx {
  readonly variantPalette: VariantPalette;
  readonly state: AnimationState;
  readonly frame: number;
}

const SPRITE_SIZE = 56; // matches the existing variant texture sizes

type StateFrameDrawer = (g: Phaser.GameObjects.Graphics, palette: VariantPalette) => void;

const DRAWERS: Partial<Record<AnimationState, StateFrameDrawer[]>> = {
  idle: [drawIdleFrame0, drawIdleFrame1],
  walking: [drawWalkingFrame0, drawWalkingFrame1, drawWalkingFrame2, drawWalkingFrame3],
  // attacking, hurt, celebrating, dying — Phase 1
};

export function drawHaggisFrame(
  g: Phaser.GameObjects.Graphics,
  ctx: HaggisDrawCtx,
): void {
  const drawers = DRAWERS[ctx.state];
  if (!drawers) {
    throw new Error(`drawHaggisFrame: state ${ctx.state} not authored yet (Phase 1)`);
  }
  const drawer = drawers[ctx.frame];
  if (!drawer) {
    throw new Error(`drawHaggisFrame: frame ${ctx.frame} out of range for state ${ctx.state}`);
  }
  drawer(g, ctx.variantPalette);
}

export function getHaggisSpriteSize(): number {
  return SPRITE_SIZE;
}

// ──────────────────────────────────────────────────────────────
// IDLE frames — ~2 fps loop. Subtle breathing: body rises + falls.
// ──────────────────────────────────────────────────────────────

function drawIdleFrame0(g: Phaser.GameObjects.Graphics, p: VariantPalette): void {
  // FIRST DRAFT — iterate against ART_STYLE_BIBLE.md before declaring done.
  const cx = SPRITE_SIZE / 2;
  const cy = SPRITE_SIZE / 2 + 2;

  // Ground shadow (ambient occlusion)
  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(cx, cy + 14, 28, 6);

  // Body — breathing in (slight squash down)
  g.fillStyle(p.bodyShadow, 1);
  g.fillEllipse(cx, cy + 2, 32, 26);
  g.fillStyle(p.body, 1);
  g.fillEllipse(cx, cy + 1, 29, 23);

  // Upper-left highlight per the bible
  g.fillStyle(p.bodyHighlight, 0.6);
  g.fillEllipse(cx - 6, cy - 4, 12, 8);

  // Eyes
  g.fillStyle(0x1a1010, 1);
  g.fillCircle(cx - 5, cy - 2, 1.8);
  g.fillCircle(cx + 5, cy - 2, 1.8);

  // Little feet nubs
  g.fillStyle(p.bodyShadow, 1);
  g.fillRect(cx - 8, cy + 12, 4, 3);
  g.fillRect(cx + 4, cy + 12, 4, 3);
}

function drawIdleFrame1(g: Phaser.GameObjects.Graphics, p: VariantPalette): void {
  // Breathing out — body lifts slightly, slight stretch upward.
  const cx = SPRITE_SIZE / 2;
  const cy = SPRITE_SIZE / 2 + 2;

  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(cx, cy + 14, 28, 6);

  g.fillStyle(p.bodyShadow, 1);
  g.fillEllipse(cx, cy, 30, 28);      // slightly taller
  g.fillStyle(p.body, 1);
  g.fillEllipse(cx, cy - 1, 27, 25);   // lifts up

  g.fillStyle(p.bodyHighlight, 0.6);
  g.fillEllipse(cx - 6, cy - 6, 12, 8);

  g.fillStyle(0x1a1010, 1);
  g.fillCircle(cx - 5, cy - 4, 1.8);
  g.fillCircle(cx + 5, cy - 4, 1.8);

  g.fillStyle(p.bodyShadow, 1);
  g.fillRect(cx - 8, cy + 12, 4, 3);
  g.fillRect(cx + 4, cy + 12, 4, 3);
}

// ──────────────────────────────────────────────────────────────
// WALKING frames — 24 fps loop. Contact → passing → contact → passing.
// Authored in Task 7.
// ──────────────────────────────────────────────────────────────

function drawWalkingFrame0(g: Phaser.GameObjects.Graphics, p: VariantPalette): void {
  // Placeholder — authored in Task 7. Draws same as idle for now
  // so tests pass; gets replaced.
  drawIdleFrame0(g, p);
}
function drawWalkingFrame1(g: Phaser.GameObjects.Graphics, p: VariantPalette): void {
  drawIdleFrame0(g, p);
}
function drawWalkingFrame2(g: Phaser.GameObjects.Graphics, p: VariantPalette): void {
  drawIdleFrame0(g, p);
}
function drawWalkingFrame3(g: Phaser.GameObjects.Graphics, p: VariantPalette): void {
  drawIdleFrame0(g, p);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- --run src/animation/frameDrawers/haggisFrames.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Review against style bible (self-review)**

Load both idle frames in-game (requires Tasks 7-10 to complete the integration, so this review runs AFTER Task 10). Compare side-by-side with `dean_apparition`, `tome_wraith`, `redcap`. For now:
- Verify palette pulls from `src/art/palettes.ts` CLASSIC_VARIANT
- Verify light model (upper-left highlight present)
- Verify composition rules (head/body/shadow ratios)

If anything fails the bible, revise `drawIdleFrame0` / `drawIdleFrame1` and commit a new pass. Multiple commits inside this task are expected.

- [ ] **Step 6: Commit first draft**

```bash
git add src/animation/frameDrawers/haggisFrames.ts src/animation/frameDrawers/haggisFrames.test.ts
git commit -m "feat(animation): haggisFrames.ts — idle × 2 first draft + walking stubs"
```

---

## Task 7: haggisFrames walking atlas (4 frames) — author until charter passes

**Files:**
- Modify: `src/animation/frameDrawers/haggisFrames.ts`

- [ ] **Step 1: Replace walking drawer stubs with authored frames**

Replace `drawWalkingFrame0..3` with the authored 4-frame cycle. Draft:

```typescript
function drawWalkingFrame0(g: Phaser.GameObjects.Graphics, p: VariantPalette): void {
  // Contact pose — left foot forward, body centred, slight downward settle.
  const cx = SPRITE_SIZE / 2;
  const cy = SPRITE_SIZE / 2 + 2;

  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(cx, cy + 14, 28, 5);

  g.fillStyle(p.bodyShadow, 1);
  g.fillEllipse(cx, cy + 2, 32, 25);
  g.fillStyle(p.body, 1);
  g.fillEllipse(cx, cy + 1, 29, 22);

  g.fillStyle(p.bodyHighlight, 0.6);
  g.fillEllipse(cx - 6, cy - 4, 12, 8);

  g.fillStyle(0x1a1010, 1);
  g.fillCircle(cx - 5, cy - 2, 1.8);
  g.fillCircle(cx + 5, cy - 2, 1.8);

  // Feet — left forward, right back
  g.fillStyle(p.bodyShadow, 1);
  g.fillRect(cx - 10, cy + 12, 4, 3);  // left forward
  g.fillRect(cx + 6, cy + 13, 4, 3);   // right back
}

function drawWalkingFrame1(g: Phaser.GameObjects.Graphics, p: VariantPalette): void {
  // Passing pose — mid-step, body lifts slightly.
  const cx = SPRITE_SIZE / 2;
  const cy = SPRITE_SIZE / 2 + 1;  // body lifted by 1px

  g.fillStyle(0x000000, 0.30);
  g.fillEllipse(cx, cy + 15, 24, 4);

  g.fillStyle(p.bodyShadow, 1);
  g.fillEllipse(cx, cy + 1, 31, 26);
  g.fillStyle(p.body, 1);
  g.fillEllipse(cx, cy, 28, 23);

  g.fillStyle(p.bodyHighlight, 0.6);
  g.fillEllipse(cx - 6, cy - 5, 12, 8);

  g.fillStyle(0x1a1010, 1);
  g.fillCircle(cx - 5, cy - 3, 1.8);
  g.fillCircle(cx + 5, cy - 3, 1.8);

  // Feet — together (both tucked under)
  g.fillStyle(p.bodyShadow, 1);
  g.fillRect(cx - 4, cy + 13, 4, 3);
  g.fillRect(cx, cy + 13, 4, 3);
}

function drawWalkingFrame2(g: Phaser.GameObjects.Graphics, p: VariantPalette): void {
  // Contact pose — right foot forward (mirror of frame 0), body centre.
  const cx = SPRITE_SIZE / 2;
  const cy = SPRITE_SIZE / 2 + 2;

  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(cx, cy + 14, 28, 5);

  g.fillStyle(p.bodyShadow, 1);
  g.fillEllipse(cx, cy + 2, 32, 25);
  g.fillStyle(p.body, 1);
  g.fillEllipse(cx, cy + 1, 29, 22);

  g.fillStyle(p.bodyHighlight, 0.6);
  g.fillEllipse(cx - 6, cy - 4, 12, 8);

  g.fillStyle(0x1a1010, 1);
  g.fillCircle(cx - 5, cy - 2, 1.8);
  g.fillCircle(cx + 5, cy - 2, 1.8);

  // Feet — right forward, left back
  g.fillStyle(p.bodyShadow, 1);
  g.fillRect(cx - 10, cy + 13, 4, 3);  // left back
  g.fillRect(cx + 6, cy + 12, 4, 3);   // right forward
}

function drawWalkingFrame3(g: Phaser.GameObjects.Graphics, p: VariantPalette): void {
  // Passing pose (second half) — same lift as frame 1, opposite foot grouping.
  const cx = SPRITE_SIZE / 2;
  const cy = SPRITE_SIZE / 2 + 1;

  g.fillStyle(0x000000, 0.30);
  g.fillEllipse(cx, cy + 15, 24, 4);

  g.fillStyle(p.bodyShadow, 1);
  g.fillEllipse(cx, cy + 1, 31, 26);
  g.fillStyle(p.body, 1);
  g.fillEllipse(cx, cy, 28, 23);

  g.fillStyle(p.bodyHighlight, 0.6);
  g.fillEllipse(cx - 6, cy - 5, 12, 8);

  g.fillStyle(0x1a1010, 1);
  g.fillCircle(cx - 5, cy - 3, 1.8);
  g.fillCircle(cx + 5, cy - 3, 1.8);

  // Feet — together (both tucked under, inverse of frame 1)
  g.fillStyle(p.bodyShadow, 1);
  g.fillRect(cx, cy + 13, 4, 3);
  g.fillRect(cx + 4, cy + 13, 4, 3);
}
```

- [ ] **Step 2: Run tests**

```bash
npm test -- --run src/animation/frameDrawers/haggisFrames.test.ts
```

Expected: PASS (3 tests — the smoke test passes because all frames now draw distinct primitives).

- [ ] **Step 3: Commit first draft of walking**

```bash
git add src/animation/frameDrawers/haggisFrames.ts
git commit -m "feat(animation): haggisFrames walking × 4 first draft (contact → passing → contact → passing)"
```

- [ ] **Step 4: Iterate**

After Tasks 8-10 complete the integration and the haggis animates in-game, review walking cycle against charter:
- Does the 4-frame cycle read as walking, not shuddering?
- Does the foot pattern match (contact → passing → contact → passing)?
- Does the body lift in passing frames?
- Does it hold up next to `dean_apparition` and peers?

Revise + re-commit each iteration pass. Multiple commits inside this task are expected.

---

## Task 8: BootScene atlas pre-bake + wall-time measurement

**Files:**
- Modify: `src/scenes/BootScene.ts`
- Modify: `src/entities/Player.ts` (read side: ensure new texture keys are available as fallback)

- [ ] **Step 1: Locate BootScene preload / create method**

```bash
grep -n "create()\|preload()" src/scenes/BootScene.ts | head -5
```

Expected output: lines where create() is defined.

- [ ] **Step 2: Add atlas pre-bake function**

Add to BootScene:

```typescript
// src/scenes/BootScene.ts — near the bottom of the class

private bakeHaggisAtlas(): number {
  const startMs = performance.now();
  const allKeys = allAtlasKeysForVariant('haggis', 'classic');
  const size = getHaggisSpriteSize();
  for (const key of allKeys) {
    // Parse state + frame from key: 'haggis_classic_<state>_<frame>'
    const parts = key.split('_');
    const frame = Number(parts[parts.length - 1]);
    const state = parts.slice(2, -1).join('_') as AnimationState;
    // Only bake idle + walking in Phase 0; others fall back silently
    // (drawHaggisFrame throws for unauthored states — guard here).
    if (state !== 'idle' && state !== 'walking') continue;

    const g = this.add.graphics();
    drawHaggisFrame(g, {
      variantPalette: CLASSIC_VARIANT,
      state,
      frame,
    });
    g.generateTexture(key, size, size);
    g.destroy();
  }
  return performance.now() - startMs;
}
```

At the top of the file, add imports:

```typescript
import { allAtlasKeysForVariant } from '../animation/textureAtlas';
import { drawHaggisFrame, getHaggisSpriteSize } from '../animation/frameDrawers/haggisFrames';
import { CLASSIC_VARIANT } from '../art/palettes';
import type { AnimationState } from '../animation/animationStates';
```

In `create()`, after existing texture generation:

```typescript
const bakeMs = this.bakeHaggisAtlas();
// eslint-disable-next-line no-console
console.info(`[BootScene] Haggis atlas bake: ${bakeMs.toFixed(1)} ms`);
```

- [ ] **Step 3: Run the dev server and verify atlas bake log**

```bash
npm run dev
```

Open the game in browser; check devtools console. Expected log line like `[BootScene] Haggis atlas bake: 14.3 ms`. Record this number — it goes in the commit message + Phase 0 gate notes.

- [ ] **Step 4: Run type-check + lint**

```bash
npm run build && npm run lint
```

Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat(boot): pre-bake haggis_classic atlas (idle + walking)

Measured bake time on dev machine: <RECORDED_MS> ms.
This number calibrates Phases 1-3 expectations per spec v3 §6."
```

Replace `<RECORDED_MS>` with the actual measurement from step 3.

---

## Task 9: AnimationController.ts

**Files:**
- Create: `src/animation/AnimationController.ts`
- Create: `src/animation/AnimationController.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/animation/AnimationController.test.ts
import { describe, expect, it, vi } from 'vitest';
import { AnimationController } from './AnimationController';

function makeSpriteStub() {
  return {
    setTexture: vi.fn(),
  };
}

describe('AnimationController', () => {
  it('starts in idle at frame 0', () => {
    const sprite = makeSpriteStub();
    const c = new AnimationController({
      sprite: sprite as unknown as Phaser.GameObjects.Sprite,
      subject: 'haggis',
      variant: 'classic',
    });
    expect(c.getState()).toBe('idle');
    expect(c.getFrame()).toBe(0);
  });

  it('tick advances frame over time and calls setTexture on boundary', () => {
    const sprite = makeSpriteStub();
    const c = new AnimationController({
      sprite: sprite as unknown as Phaser.GameObjects.Sprite,
      subject: 'haggis',
      variant: 'classic',
    });
    // idle at 2 fps = 500 ms/frame; one tick of 500 ms advances to frame 1
    c.tick(500, {
      velocityMag: 0,
      hurtEdge: false,
      attackEdge: false,
      celebrateEdge: false,
      hp: 100,
    });
    expect(c.getFrame()).toBe(1);
    expect(sprite.setTexture).toHaveBeenCalledWith('haggis_classic_idle_1');
  });

  it('transitions state and resets frame when signals fire', () => {
    const sprite = makeSpriteStub();
    const c = new AnimationController({
      sprite: sprite as unknown as Phaser.GameObjects.Sprite,
      subject: 'haggis',
      variant: 'classic',
    });
    c.tick(10, {
      velocityMag: 200,
      hurtEdge: false,
      attackEdge: false,
      celebrateEdge: false,
      hp: 100,
    });
    expect(c.getState()).toBe('walking');
    expect(c.getFrame()).toBe(0); // frame resets on state change
    expect(sprite.setTexture).toHaveBeenLastCalledWith('haggis_classic_walking_0');
  });

  it('does not call setTexture when state + frame are unchanged', () => {
    const sprite = makeSpriteStub();
    const c = new AnimationController({
      sprite: sprite as unknown as Phaser.GameObjects.Sprite,
      subject: 'haggis',
      variant: 'classic',
    });
    // Initial setTexture on construction = 1 call
    const initialCalls = sprite.setTexture.mock.calls.length;
    // Tick with too-small delta to advance; no state change
    c.tick(10, {
      velocityMag: 0,
      hurtEdge: false,
      attackEdge: false,
      celebrateEdge: false,
      hp: 100,
    });
    expect(sprite.setTexture.mock.calls.length).toBe(initialCalls);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --run src/animation/AnimationController.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```typescript
// src/animation/AnimationController.ts
/**
 * Per-entity animation state + frame-index owner.
 *
 * Reads game signals via `tick(scaledDelta, signals)`. Evaluates state
 * transitions through the pure `animationStates` FSM. Advances frame
 * index through the pure `frameClock`. Calls `sprite.setTexture(key)`
 * on state or frame change — that's the only Phaser coupling in the
 * hot path.
 *
 * Replay determinism: all inputs are pure data (signals + scaledDelta);
 * controller state is a pure function of its history.
 */

import type { AnimationState, AnimationSignals } from './animationStates';
import { evaluateAnimationState } from './animationStates';
import { advanceFrameClock } from './frameClock';
import { atlasKey } from './textureAtlas';

export interface AnimationControllerInit {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly subject: string;
  readonly variant: string | null;
}

export class AnimationController {
  private state: AnimationState = 'idle';
  private frameIndex = 0;
  private accMs = 0;

  constructor(private readonly init: AnimationControllerInit) {
    // Bind initial texture so the sprite has something to render on frame 0.
    this.applyTexture();
  }

  getState(): AnimationState {
    return this.state;
  }

  getFrame(): number {
    return this.frameIndex;
  }

  tick(scaledDelta: number, signals: AnimationSignals): void {
    const nextState = evaluateAnimationState(this.state, signals);
    if (nextState !== this.state) {
      this.state = nextState;
      this.frameIndex = 0;
      this.accMs = 0;
      this.applyTexture();
      return;
    }
    const advanced = advanceFrameClock({
      accMs: this.accMs,
      frameIndex: this.frameIndex,
      state: this.state,
      scaledDelta,
    });
    this.accMs = advanced.accMs;
    if (advanced.frameIndex !== this.frameIndex) {
      this.frameIndex = advanced.frameIndex;
      this.applyTexture();
    }
  }

  private applyTexture(): void {
    const key = atlasKey(
      this.init.subject,
      this.init.variant,
      this.state,
      this.frameIndex,
    );
    this.init.sprite.setTexture(key);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- --run src/animation/AnimationController.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/animation/AnimationController.ts src/animation/AnimationController.test.ts
git commit -m "feat(animation): AnimationController — pure FSM + frameClock + setTexture glue"
```

---

## Task 10: Wire Player to AnimationController, retire wobblePhase

**Files:**
- Modify: `src/entities/Player.ts`

- [ ] **Step 1: Locate wobblePhase and update paths**

```bash
grep -n "wobblePhase" src/entities/Player.ts
```

Expected: ~3 hits (field declaration, usage in update, settle).

- [ ] **Step 2: Add AnimationController field + construction**

Near the existing Player fields (following pattern of other controllers):

```typescript
// src/entities/Player.ts — near top of class
import { AnimationController } from '../animation/AnimationController';
import type { AnimationSignals } from '../animation/animationStates';

// Inside class body, near other private fields:
private animController: AnimationController;
```

In the constructor (after `super.add` + sprite setup):

```typescript
this.animController = new AnimationController({
  sprite: this,
  subject: 'haggis',
  variant: 'classic', // Phase 0 — all variants in Phase 1
});
```

- [ ] **Step 3: Drive the controller from update()**

In `Player.update(delta)`, replace the wobble scale section:

Old:
```typescript
this.wobblePhase += 0.15;
const wobble = Math.sin(this.wobblePhase) * 0.06;
this.setScale(playerGrowthScale(this.currentLevel) * (1 + wobble));
```

New:
```typescript
// Animation controller — replaces wobble-based squash-stretch.
const vx = this.body?.velocity.x ?? 0;
const vy = this.body?.velocity.y ?? 0;
const signals: AnimationSignals = {
  velocityMag: Math.hypot(vx, vy),
  hurtEdge: this.consumeHurtEdge(),
  attackEdge: false, // Phase 1 — wire melee-weapon-fire edge later
  celebrateEdge: false, // Phase 1 — wire boss-kill / level-up edge later
  hp: this.hp,
};
this.animController.tick(scaledDelta, signals);
this.setScale(playerGrowthScale(this.currentLevel));
```

Also in the `if (dir.x === 0 && dir.y === 0)` branch that used to set `this.wobblePhase = 0`, remove the wobblePhase reset — no longer meaningful.

Delete the `wobblePhase` field declaration entirely.

- [ ] **Step 4: Add hurt-edge tracking**

Near the top of class:

```typescript
private hurtEdgeThisFrame = false;
```

In `takeDamage(amount)`, set the flag:

```typescript
takeDamage(amount: number): boolean {
  this.hurtEdgeThisFrame = true;
  // ... existing body
}
```

Add consume method:

```typescript
private consumeHurtEdge(): boolean {
  const v = this.hurtEdgeThisFrame;
  this.hurtEdgeThisFrame = false;
  return v;
}
```

- [ ] **Step 5: Run the full test suite**

```bash
npm test -- --run
```

Expected: all tests pass. Some existing Player tests may need minor updates — fix as necessary.

- [ ] **Step 6: Build + lint**

```bash
npm run build && npm run lint
```

Expected: both pass.

- [ ] **Step 7: Manually verify animation in game**

```bash
npm run dev
```

Start a run. Walk around. Observe:
- Idle haggis breathing (2 fps loop).
- Walking haggis animating through 4-frame cycle.
- Take a hit — animation still visible (Phase 1 adds hurt state atlas; for now hurt falls back to idle fallback — check no crash).

- [ ] **Step 8: Commit**

```bash
git add src/entities/Player.ts
git commit -m "feat(player): retire wobblePhase, wire AnimationController for idle + walking"
```

---

## Task 11: HaggisContainer refactor

**Files:**
- Create: `src/entities/haggisComposition/HaggisContainer.ts`
- Create: `src/entities/haggisComposition/HaggisContainer.test.ts`

- [ ] **Step 1: Write the smoke test**

```typescript
// src/entities/haggisComposition/HaggisContainer.test.ts
import { describe, expect, it } from 'vitest';
import type { HaggisLayerSlot } from './HaggisContainer';

describe('HaggisContainer — type surface', () => {
  it('exports HaggisLayerSlot enum covering all 4 accessory depths', () => {
    const slots: HaggisLayerSlot[] = ['behind', 'body', 'front', 'above'];
    expect(slots.length).toBe(4);
  });
});

// Phaser-bound tests for HaggisContainer are integration only; see
// manual verification in Task 14.
```

- [ ] **Step 2: Write the implementation**

```typescript
// src/entities/haggisComposition/HaggisContainer.ts
/**
 * Container for the compositional haggis. Owns the body sprite +
 * four optional accessory layer sprites (behind / body / front /
 * above). Each layer renders one accessory drawer's atlas at a time;
 * adding a second same-layer accessory needs the drawer author to
 * stack (rare).
 *
 * Phase 0: container scaffold + empty layer sprites. No accessories
 * wired yet — that's Task 14.
 *
 * The body sprite stays the Phaser Sprite the Player class extends;
 * this container is a sibling that owns accessory children. Player
 * continues to be the physics + collision entity; this container is
 * purely visual.
 */

export type HaggisLayerSlot = 'behind' | 'body' | 'front' | 'above';

export const HAGGIS_LAYER_DEPTHS: Readonly<Record<HaggisLayerSlot, number>> = {
  behind: -1,
  body: 0,
  front: 1,
  above: 2,
};

export class HaggisContainer {
  private readonly layers: Map<HaggisLayerSlot, Phaser.GameObjects.Sprite> = new Map();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly anchor: Phaser.GameObjects.Sprite, // the Player body sprite
  ) {
    for (const slot of ['behind', 'body', 'front', 'above'] as HaggisLayerSlot[]) {
      const sprite = this.scene.add.sprite(anchor.x, anchor.y, '');
      sprite.setVisible(false);
      sprite.setDepth(anchor.depth + HAGGIS_LAYER_DEPTHS[slot]);
      this.layers.set(slot, sprite);
    }
  }

  /**
   * Per-frame: move every layer to the anchor's current position and
   * copy its rotation. Called from Player.update() after physics
   * velocity application.
   */
  syncToAnchor(): void {
    for (const sprite of this.layers.values()) {
      sprite.setPosition(this.anchor.x, this.anchor.y);
      sprite.setRotation(this.anchor.rotation);
      sprite.setScale(this.anchor.scaleX, this.anchor.scaleY);
    }
  }

  /**
   * Assign an accessory to a layer slot. `textureKey` is the atlas
   * key the layer's sprite will bind to — AnimationController swaps
   * frames on the layer sprite.
   */
  equipLayer(slot: HaggisLayerSlot, textureKey: string): Phaser.GameObjects.Sprite {
    const sprite = this.layers.get(slot);
    if (!sprite) throw new Error(`HaggisContainer: unknown layer slot ${slot}`);
    sprite.setTexture(textureKey);
    sprite.setVisible(true);
    return sprite;
  }

  unequipLayer(slot: HaggisLayerSlot): void {
    const sprite = this.layers.get(slot);
    if (sprite) sprite.setVisible(false);
  }

  getLayerSprite(slot: HaggisLayerSlot): Phaser.GameObjects.Sprite | undefined {
    return this.layers.get(slot);
  }

  destroy(): void {
    for (const sprite of this.layers.values()) sprite.destroy();
    this.layers.clear();
  }
}
```

- [ ] **Step 3: Run test**

```bash
npm test -- --run src/entities/haggisComposition/HaggisContainer.test.ts
```

Expected: PASS (1 test).

- [ ] **Step 4: Build + lint**

```bash
npm run build && npm run lint
```

Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add src/entities/haggisComposition/HaggisContainer.ts src/entities/haggisComposition/HaggisContainer.test.ts
git commit -m "feat(entity): HaggisContainer — body + 4 accessory layer sprites"
```

---

## Task 12: AccessoryDrawer interface + registry

**Files:**
- Create: `src/entities/haggisComposition/AccessoryDrawer.ts`
- Create: `src/entities/haggisComposition/accessoryRegistry.ts`
- Create: `src/entities/haggisComposition/accessoryRegistry.test.ts`

- [ ] **Step 1: Write the interface**

```typescript
// src/entities/haggisComposition/AccessoryDrawer.ts
/**
 * Contract every accessory implementation satisfies. Pure draw function
 * over a pre-baked Graphics + DrawCtx — no Phaser scene coupling at
 * draw time. BootScene calls the drawer once per (state × frame) to
 * generate the atlas; runtime swaps texture keys.
 */

import type { AnimationState } from '../../animation/animationStates';
import type { VariantPalette } from '../../art/palettes';
import type { HaggisLayerSlot } from './HaggisContainer';

export interface AccessoryDrawCtx {
  readonly variantPalette: VariantPalette;
  readonly state: AnimationState;
  readonly frame: number;
}

export interface AccessoryDrawer {
  readonly id: string;
  readonly layer: HaggisLayerSlot;
  /**
   * Authored state × frame pairs. Only states in this list get atlases;
   * others fall back to idle frame 0 (the accessory doesn't animate
   * for that state in Phase 0).
   */
  readonly authoredStates: ReadonlyArray<AnimationState>;
  draw(g: Phaser.GameObjects.Graphics, ctx: AccessoryDrawCtx): void;
}
```

- [ ] **Step 2: Write the registry tests**

```typescript
// src/entities/haggisComposition/accessoryRegistry.test.ts
import { describe, expect, it } from 'vitest';
import { ACCESSORY_REGISTRY, getAccessoryDrawer } from './accessoryRegistry';

describe('accessoryRegistry', () => {
  it('has exactly one entry per registered id', () => {
    const ids = Object.keys(ACCESSORY_REGISTRY);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('Phase 0 ships tam_o_shanter', () => {
    expect(ACCESSORY_REGISTRY['tam_o_shanter']).toBeDefined();
    expect(ACCESSORY_REGISTRY['tam_o_shanter'].layer).toBe('above');
  });

  it('getAccessoryDrawer returns registered drawer', () => {
    const d = getAccessoryDrawer('tam_o_shanter');
    expect(d).toBeDefined();
    expect(d!.id).toBe('tam_o_shanter');
  });

  it('getAccessoryDrawer returns undefined for unknown id', () => {
    expect(getAccessoryDrawer('not_a_real_thing')).toBeUndefined();
  });
});
```

- [ ] **Step 3: Write the registry (initially empty — tam added in Task 13)**

```typescript
// src/entities/haggisComposition/accessoryRegistry.ts
/**
 * id → AccessoryDrawer map. Populated by each accessory drawer module
 * registering itself. Phase 0 ships `tam_o_shanter`; remaining 16
 * accessories land in Phase 2 + 2.5.
 */

import type { AccessoryDrawer } from './AccessoryDrawer';
import { TAM_O_SHANTER_DRAWER } from './drawers/tamOShanter';

export const ACCESSORY_REGISTRY: Readonly<Record<string, AccessoryDrawer>> = {
  tam_o_shanter: TAM_O_SHANTER_DRAWER,
};

export function getAccessoryDrawer(id: string): AccessoryDrawer | undefined {
  return ACCESSORY_REGISTRY[id];
}
```

- [ ] **Step 4: Run test — expected to fail (tamOShanter not yet created)**

```bash
npm test -- --run src/entities/haggisComposition/accessoryRegistry.test.ts
```

Expected: FAIL — can't resolve `./drawers/tamOShanter`. Fixed in Task 13.

- [ ] **Step 5: Commit interface + registry scaffold (with failing registry test)**

```bash
git add src/entities/haggisComposition/AccessoryDrawer.ts src/entities/haggisComposition/accessoryRegistry.ts src/entities/haggisComposition/accessoryRegistry.test.ts
git commit -m "feat(entity): AccessoryDrawer interface + accessoryRegistry scaffold

Registry test fails pending Task 13 (tam_o_shanter drawer). Intentional
TDD red state — next task turns it green."
```

---

## Task 13: tam-o-shanter drawer (idle × 2 + walking × 4)

**Files:**
- Create: `src/entities/haggisComposition/drawers/tamOShanter.ts`
- Create: `src/entities/haggisComposition/drawers/tamOShanter.test.ts`

- [ ] **Step 1: Write the smoke test**

```typescript
// src/entities/haggisComposition/drawers/tamOShanter.test.ts
import { describe, expect, it, vi } from 'vitest';
import { TAM_O_SHANTER_DRAWER } from './tamOShanter';
import { CLASSIC_VARIANT } from '../../../art/palettes';

function makeGraphicsStub() {
  return {
    fillStyle: vi.fn().mockReturnThis(),
    fillCircle: vi.fn().mockReturnThis(),
    fillEllipse: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
    fillTriangle: vi.fn().mockReturnThis(),
  };
}

describe('TAM_O_SHANTER_DRAWER', () => {
  it('has id tam_o_shanter on layer above', () => {
    expect(TAM_O_SHANTER_DRAWER.id).toBe('tam_o_shanter');
    expect(TAM_O_SHANTER_DRAWER.layer).toBe('above');
  });

  it('authors idle + walking states only in Phase 0', () => {
    expect(TAM_O_SHANTER_DRAWER.authoredStates).toEqual(['idle', 'walking']);
  });

  it('draws primitives for every authored (state × frame) pair', () => {
    for (const state of TAM_O_SHANTER_DRAWER.authoredStates) {
      const framesInState = state === 'idle' ? 2 : 4;
      for (let frame = 0; frame < framesInState; frame++) {
        const g = makeGraphicsStub();
        TAM_O_SHANTER_DRAWER.draw(g as unknown as Phaser.GameObjects.Graphics, {
          variantPalette: CLASSIC_VARIANT,
          state,
          frame,
        });
        const totalCalls =
          g.fillCircle.mock.calls.length +
          g.fillEllipse.mock.calls.length +
          g.fillRect.mock.calls.length +
          g.fillTriangle.mock.calls.length;
        expect(totalCalls, `${state} frame ${frame}`).toBeGreaterThan(0);
      }
    }
  });
});
```

- [ ] **Step 2: Write the drawer (first draft — iteration expected)**

```typescript
// src/entities/haggisComposition/drawers/tamOShanter.ts
/**
 * Tam-o-shanter — iconic Scottish flat wool bonnet. Phase 0 reference
 * accessory. Sits on the above layer, so it renders on top of the
 * haggis body. Sprite size 56×56 matches haggis for easy alignment.
 *
 * Inspiration: Still Game Jack's bonnet, Trainspotting cast stills.
 * Palette: heather dark for base wool, bright for the pom-pom, gold
 * accent for the tartan band.
 */

import type { AccessoryDrawer, AccessoryDrawCtx } from '../AccessoryDrawer';
import { PALETTE } from '../../../art/palettes';

const SPRITE_SIZE = 56;

function drawTamIdle0(g: Phaser.GameObjects.Graphics): void {
  // Breathing in — bonnet sits slightly lower on the head.
  const cx = SPRITE_SIZE / 2;
  const cy = SPRITE_SIZE / 2 - 10; // above the haggis body

  // Bonnet brim — dark wool
  g.fillStyle(PALETTE.heather.dark, 1);
  g.fillEllipse(cx, cy + 4, 20, 6);
  // Bonnet crown — mid wool
  g.fillStyle(PALETTE.heather.mid, 1);
  g.fillEllipse(cx, cy, 16, 10);
  // Highlight — upper-left per bible
  g.fillStyle(PALETTE.heather.bright, 0.6);
  g.fillEllipse(cx - 3, cy - 2, 6, 4);
  // Gold tartan band around the brim
  g.fillStyle(PALETTE.gold.aged, 1);
  g.fillRect(cx - 10, cy + 3, 20, 1);
  // Pom-pom on top
  g.fillStyle(PALETTE.red.deep, 1);
  g.fillCircle(cx, cy - 5, 2.5);
  g.fillStyle(PALETTE.red.arterial, 1);
  g.fillCircle(cx, cy - 6, 1.5);
}

function drawTamIdle1(g: Phaser.GameObjects.Graphics): void {
  // Breathing out — bonnet rises by 1 px with the body.
  const cx = SPRITE_SIZE / 2;
  const cy = SPRITE_SIZE / 2 - 11;

  g.fillStyle(PALETTE.heather.dark, 1);
  g.fillEllipse(cx, cy + 4, 20, 6);
  g.fillStyle(PALETTE.heather.mid, 1);
  g.fillEllipse(cx, cy, 16, 10);
  g.fillStyle(PALETTE.heather.bright, 0.6);
  g.fillEllipse(cx - 3, cy - 2, 6, 4);
  g.fillStyle(PALETTE.gold.aged, 1);
  g.fillRect(cx - 10, cy + 3, 20, 1);
  g.fillStyle(PALETTE.red.deep, 1);
  g.fillCircle(cx, cy - 5, 2.5);
  g.fillStyle(PALETTE.red.arterial, 1);
  g.fillCircle(cx, cy - 6, 1.5);
}

function drawTamWalkingFrame(g: Phaser.GameObjects.Graphics, tilt: number, yOffset: number): void {
  // Shared walking drawer parameterized on tilt + yOffset so the 4-frame
  // cycle feels like a gentle side-to-side wag on the haggis head.
  const cx = SPRITE_SIZE / 2 + tilt;
  const cy = SPRITE_SIZE / 2 - 10 + yOffset;

  g.fillStyle(PALETTE.heather.dark, 1);
  g.fillEllipse(cx, cy + 4, 20, 6);
  g.fillStyle(PALETTE.heather.mid, 1);
  g.fillEllipse(cx, cy, 16, 10);
  g.fillStyle(PALETTE.heather.bright, 0.6);
  g.fillEllipse(cx - 3, cy - 2, 6, 4);
  g.fillStyle(PALETTE.gold.aged, 1);
  g.fillRect(cx - 10, cy + 3, 20, 1);
  g.fillStyle(PALETTE.red.deep, 1);
  g.fillCircle(cx, cy - 5, 2.5);
  g.fillStyle(PALETTE.red.arterial, 1);
  g.fillCircle(cx, cy - 6, 1.5);
}

function drawTamWalking0(g: Phaser.GameObjects.Graphics): void {
  drawTamWalkingFrame(g, 0, 0);
}
function drawTamWalking1(g: Phaser.GameObjects.Graphics): void {
  drawTamWalkingFrame(g, -1, -1);
}
function drawTamWalking2(g: Phaser.GameObjects.Graphics): void {
  drawTamWalkingFrame(g, 0, 0);
}
function drawTamWalking3(g: Phaser.GameObjects.Graphics): void {
  drawTamWalkingFrame(g, 1, -1);
}

const FRAMES = {
  idle: [drawTamIdle0, drawTamIdle1],
  walking: [drawTamWalking0, drawTamWalking1, drawTamWalking2, drawTamWalking3],
} as const;

export const TAM_O_SHANTER_DRAWER: AccessoryDrawer = {
  id: 'tam_o_shanter',
  layer: 'above',
  authoredStates: ['idle', 'walking'] as const,
  draw(g: Phaser.GameObjects.Graphics, ctx: AccessoryDrawCtx): void {
    const drawers = FRAMES[ctx.state as 'idle' | 'walking'];
    if (!drawers) {
      // State not authored — fall back to idle frame 0 silently.
      FRAMES.idle[0](g);
      return;
    }
    const drawer = drawers[ctx.frame];
    if (!drawer) {
      throw new Error(
        `tamOShanter: frame ${ctx.frame} out of range for state ${ctx.state}`,
      );
    }
    drawer(g);
  },
};

export function getTamSpriteSize(): number {
  return SPRITE_SIZE;
}
```

- [ ] **Step 3: Run tests**

```bash
npm test -- --run src/entities/haggisComposition/
```

Expected: both registry + tamOShanter tests PASS (4 + 3 tests = 7 total).

- [ ] **Step 4: Bake the tam atlas in BootScene**

Modify `src/scenes/BootScene.ts` — after `bakeHaggisAtlas()`:

```typescript
private bakeAccessoryAtlas(): number {
  const startMs = performance.now();
  for (const drawer of Object.values(ACCESSORY_REGISTRY)) {
    for (const state of drawer.authoredStates) {
      const frameCount = state === 'idle' ? 2 : 4; // matches FrameClock authoring
      for (let frame = 0; frame < frameCount; frame++) {
        const g = this.add.graphics();
        drawer.draw(g, {
          variantPalette: CLASSIC_VARIANT,
          state,
          frame,
        });
        const key = `${drawer.id}_${state}_${frame}`; // accessory key format (no variant)
        g.generateTexture(key, 56, 56);
        g.destroy();
      }
    }
  }
  return performance.now() - startMs;
}
```

Add import:

```typescript
import { ACCESSORY_REGISTRY } from '../entities/haggisComposition/accessoryRegistry';
```

Call it in `create()` after `bakeHaggisAtlas()`:

```typescript
const accessoryBakeMs = this.bakeAccessoryAtlas();
console.info(`[BootScene] Accessory atlas bake: ${accessoryBakeMs.toFixed(1)} ms`);
```

- [ ] **Step 5: Build + lint + run**

```bash
npm run build && npm run lint && npm test -- --run
```

Expected: all green.

```bash
npm run dev
```

Verify console logs show both bake times.

- [ ] **Step 6: Commit first draft**

```bash
git add src/entities/haggisComposition/drawers/ src/scenes/BootScene.ts
git commit -m "feat(entity): tam_o_shanter drawer — idle × 2 + walking × 4 + atlas bake

Tam atlas bake time on dev machine: <RECORDED_MS> ms."
```

- [ ] **Step 7: Iterate**

After Task 14-17 allow viewing the tam on the haggis, review against charter + style bible. Multiple refinement commits expected before declaring Task 13 done for Gate A purposes.

---

## Task 14: Wire tam pickup + HaggisContainer equip

**Files:**
- Modify: `src/entities/Player.ts`

- [ ] **Step 1: Add HaggisContainer to Player**

In Player.ts, near other fields:

```typescript
import { HaggisContainer } from './haggisComposition/HaggisContainer';
import { AccessoryDrawer } from './haggisComposition/AccessoryDrawer';
import { getAccessoryDrawer } from './haggisComposition/accessoryRegistry';
import { AnimationController } from '../animation/AnimationController';

// private fields:
private haggisContainer!: HaggisContainer;
private ownedAccessories: Array<{
  id: string;
  drawer: AccessoryDrawer;
  controller: AnimationController;
}> = [];
```

In the constructor (after the body sprite + animController setup):

```typescript
this.haggisContainer = new HaggisContainer(scene, this);
```

- [ ] **Step 2: Add equipAccessory method**

```typescript
public equipAccessory(id: string): void {
  const drawer = getAccessoryDrawer(id);
  if (!drawer) {
    console.warn(`Player.equipAccessory: unknown id ${id}`);
    return;
  }
  if (this.ownedAccessories.some((a) => a.id === id)) return; // no-op on re-equip

  const layerSprite = this.haggisContainer.equipLayer(
    drawer.layer,
    `${id}_idle_0`, // start on idle frame 0
  );
  const controller = new AnimationController({
    sprite: layerSprite,
    subject: id,
    variant: null, // accessory atlases are variant-agnostic in Phase 0
  });
  this.ownedAccessories.push({ id, drawer, controller });
}

public unequipAccessory(id: string): void {
  const idx = this.ownedAccessories.findIndex((a) => a.id === id);
  if (idx === -1) return;
  const [removed] = this.ownedAccessories.splice(idx, 1);
  this.haggisContainer.unequipLayer(removed.drawer.layer);
}
```

- [ ] **Step 3: Tick accessory controllers from update()**

In `Player.update(delta)` — after existing `animController.tick(...)` call:

```typescript
// Tick every owned accessory with the same signals.
for (const a of this.ownedAccessories) {
  a.controller.tick(scaledDelta, signals);
}
this.haggisContainer.syncToAnchor();
```

- [ ] **Step 4: Build + lint + test**

```bash
npm run build && npm run lint && npm test -- --run
```

Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/entities/Player.ts
git commit -m "feat(player): equipAccessory wires tam into HaggisContainer via AnimationController"
```

---

## Task 15: debugHotkeys.ts — force-equip hotkey

**Files:**
- Create: `src/scenes/dev/debugHotkeys.ts`

- [ ] **Step 1: Write the module**

```typescript
// src/scenes/dev/debugHotkeys.ts
/**
 * Dev-only hotkeys for Phase 0 iteration loop. Registered from
 * GameScene in dev mode only. Not shipped to production builds.
 *
 * Hotkeys:
 *   T — toggle tam_o_shanter on/off
 *   I — force state: idle
 *   W — force state: walking (body not moving but animation override)
 *   H — force state: hurt (for visual review)
 *   K — capture haggis body screenshot to .superpowers/captures/
 *   C — toggle Combinations preview scene
 */

import type { Player } from '../../entities/Player';

const DEV_HOTKEY_MODE =
  typeof globalThis !== 'undefined' &&
  (globalThis as unknown as { DEV_HOTKEYS?: boolean }).DEV_HOTKEYS === true;

export function isDevHotkeysEnabled(): boolean {
  return DEV_HOTKEY_MODE;
}

export interface DebugHotkeyHooks {
  getPlayer(): Player;
  getScene(): Phaser.Scene;
}

export function registerDebugHotkeys(scene: Phaser.Scene, hooks: DebugHotkeyHooks): void {
  if (!isDevHotkeysEnabled()) return;
  const kb = scene.input.keyboard;
  if (!kb) return;

  // T — toggle tam
  kb.on('keydown-T', () => {
    const p = hooks.getPlayer();
    const has = (p as unknown as { ownedAccessories: Array<{ id: string }> })
      .ownedAccessories.some((a) => a.id === 'tam_o_shanter');
    if (has) p.unequipAccessory('tam_o_shanter');
    else p.equipAccessory('tam_o_shanter');
  });

  // K — screenshot capture
  kb.on('keydown-K', () => {
    captureHaggisScreenshot(scene, hooks.getPlayer());
  });

  // I, W, H — force-state (Phase 0: overrides only last one frame;
  // full force-state-lock implementation in Task 16)
  // stubs — extended in Task 16 to actually hold state
}

function captureHaggisScreenshot(scene: Phaser.Scene, player: Player): void {
  // Renders the player's current frame to a PNG data URL and triggers download.
  const rt = scene.add.renderTexture(player.x - 60, player.y - 60, 120, 120);
  rt.setVisible(false);
  rt.draw(player, 60, 60);
  const canvas = rt.canvas;
  if (!canvas) {
    rt.destroy();
    return;
  }
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  a.href = dataUrl;
  a.download = `haggis-capture-${ts}.png`;
  a.click();
  rt.destroy();
}
```

- [ ] **Step 2: Wire into GameScene**

In `src/scenes/GameScene.ts` (near other scene-init code, after Player construction):

```typescript
import { registerDebugHotkeys } from './dev/debugHotkeys';

// After this.player is constructed:
registerDebugHotkeys(this, {
  getPlayer: () => this.player,
  getScene: () => this,
});
```

- [ ] **Step 3: Build + lint**

```bash
npm run build && npm run lint
```

Expected: both pass.

- [ ] **Step 4: Manual verification**

```bash
npm run dev
```

In the browser console before starting a run:
```js
globalThis.DEV_HOTKEYS = true;
```

Start a run. Press `T`. Tam should appear on the haggis head. Press `T` again — disappears. Press `K` — browser should download a PNG.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/dev/debugHotkeys.ts src/scenes/GameScene.ts
git commit -m "feat(dev): T hotkey toggles tam; K hotkey screenshot capture"
```

---

## Task 16: Force-state-transition hotkey

**Files:**
- Modify: `src/scenes/dev/debugHotkeys.ts`
- Modify: `src/entities/Player.ts` (expose state-override)

- [ ] **Step 1: Add state-override to Player**

In Player.ts:

```typescript
private animStateOverride: AnimationState | null = null;

public overrideAnimationState(state: AnimationState | null): void {
  this.animStateOverride = state;
}
```

In `Player.update(delta)`, modify the signals construction:

```typescript
// Existing:
// const signals: AnimationSignals = { velocityMag: ..., hurtEdge: ..., ... };

// Just before calling animController.tick:
if (this.animStateOverride !== null) {
  // Force desired state via tampered signals. Hacky but effective for dev.
  switch (this.animStateOverride) {
    case 'walking':
      signals.velocityMag = 1000;
      break;
    case 'hurt':
      signals.hurtEdge = true;
      break;
    case 'attacking':
      signals.attackEdge = true;
      break;
    case 'celebrating':
      signals.celebrateEdge = true;
      break;
    case 'dying':
      signals.hp = 0;
      break;
    case 'idle':
    default:
      signals.velocityMag = 0;
      break;
  }
}
```

- [ ] **Step 2: Wire hotkeys in debugHotkeys**

Replace the stub section in debugHotkeys.ts:

```typescript
// I, W, H — force-state toggles
kb.on('keydown-I', () => hooks.getPlayer().overrideAnimationState('idle'));
kb.on('keydown-W', () => hooks.getPlayer().overrideAnimationState('walking'));
kb.on('keydown-H', () => hooks.getPlayer().overrideAnimationState('hurt'));
kb.on('keydown-ESC', () => hooks.getPlayer().overrideAnimationState(null));
```

Add import at top of file:
```typescript
import type { AnimationState } from '../../animation/animationStates';
```

- [ ] **Step 3: Build + lint**

```bash
npm run build && npm run lint
```

Expected: both pass.

- [ ] **Step 4: Manual verification**

Start dev server, enable DEV_HOTKEYS. Press W — haggis should animate walking even while standing still. Press I — back to idle. Press H — hurt flash (fallback to idle in Phase 0 since hurt frames not authored). Press ESC — override cleared.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/dev/debugHotkeys.ts src/entities/Player.ts
git commit -m "feat(dev): I/W/H hotkeys force animation state; ESC clears override"
```

---

## Task 17: CombinationsPreviewScene (minimal Phase 0 version)

**Files:**
- Create: `src/scenes/dev/CombinationsPreviewScene.ts`
- Modify: `src/main.ts` (register scene)
- Modify: `src/scenes/dev/debugHotkeys.ts` (C hotkey to toggle)

- [ ] **Step 1: Write the scene**

```typescript
// src/scenes/dev/CombinationsPreviewScene.ts
/**
 * Dev-only Combinations Preview. Phase 0 minimal version: renders the
 * classic haggis with tam on/off, across idle and walking states,
 * side by side.
 *
 * Phase 2 expands this to the full variant × accessory grid. For now
 * it's a 2 × 2 preview: (classic no-tam, classic with-tam) × (idle,
 * walking).
 */

import Phaser from 'phaser';
import { CLASSIC_VARIANT } from '../../art/palettes';
import { drawHaggisFrame, getHaggisSpriteSize } from '../../animation/frameDrawers/haggisFrames';
import { TAM_O_SHANTER_DRAWER } from '../../entities/haggisComposition/drawers/tamOShanter';

interface Cell {
  readonly label: string;
  readonly withTam: boolean;
  readonly state: 'idle' | 'walking';
}

const CELLS: Cell[] = [
  { label: 'no-tam / idle', withTam: false, state: 'idle' },
  { label: 'no-tam / walking', withTam: false, state: 'walking' },
  { label: 'with-tam / idle', withTam: true, state: 'idle' },
  { label: 'with-tam / walking', withTam: true, state: 'walking' },
];

export class CombinationsPreviewScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CombinationsPreview' });
  }

  create(): void {
    const size = getHaggisSpriteSize();
    const cellW = size + 40;
    const cellH = size + 60;
    const cols = 2;

    this.cameras.main.setBackgroundColor('#1a1a1a');
    this.add.text(20, 10, 'Combinations Preview (Phase 0)', {
      fontSize: '16px',
      color: '#c8a040',
    });
    this.add.text(20, 34, 'Press ESC to return to game', {
      fontSize: '12px',
      color: '#8a9a6b',
    });

    CELLS.forEach((cell, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = 40 + col * cellW;
      const y = 70 + row * cellH;

      const haggisFrameCount = cell.state === 'idle' ? 2 : 4;
      const tamFrameCount = cell.state === 'idle' ? 2 : 4;

      // Cell background
      this.add.rectangle(x + size / 2, y + size / 2, cellW - 10, cellH - 10, 0x2a2a30);
      this.add.text(x - 10, y + size + 10, cell.label, {
        fontSize: '11px',
        color: '#9aa590',
      });

      // Build body sprite — bind first frame of state. The AnimationController isn't
      // strictly needed here; we can just display frame 0.
      const bodyKey = `haggis_classic_${cell.state}_0`;
      this.add.sprite(x + size / 2, y + size / 2, bodyKey);

      if (cell.withTam) {
        const tamKey = `tam_o_shanter_${cell.state}_0`;
        this.add.sprite(x + size / 2, y + size / 2, tamKey);
      }
    });

    // Return to game on ESC
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.stop('CombinationsPreview');
      this.scene.resume('Game');
    });
  }
}
```

- [ ] **Step 2: Register scene in main.ts**

```typescript
// src/main.ts — add to scenes array (dev-only):
import { CombinationsPreviewScene } from './scenes/dev/CombinationsPreviewScene';

// In the Phaser config scenes array, add CombinationsPreviewScene to
// the list. Order: BootScene, MenuScene, GameScene, ShopScene, ...,
// CombinationsPreviewScene (last — dev).
```

Precise path depends on existing structure; look at main.ts and add
CombinationsPreviewScene to the scene array's tail.

- [ ] **Step 3: Wire C hotkey**

In debugHotkeys.ts, add:

```typescript
kb.on('keydown-C', () => {
  const scene = hooks.getScene();
  scene.scene.pause('Game');
  scene.scene.launch('CombinationsPreview');
});
```

- [ ] **Step 4: Build + lint + test**

```bash
npm run build && npm run lint && npm test -- --run
```

Expected: all green.

- [ ] **Step 5: Manual verification**

Dev server; enable DEV_HOTKEYS; start run; press `C`. Should see 2×2 grid of haggis sprites (no-tam/with-tam × idle/walking). Press ESC, return to game.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/dev/CombinationsPreviewScene.ts src/main.ts src/scenes/dev/debugHotkeys.ts
git commit -m "feat(dev): CombinationsPreviewScene Phase 0 — 2x2 classic haggis × tam × (idle, walking)"
```

---

## Task 18: Add .superpowers/captures/ to .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Confirm current .gitignore state**

```bash
grep -c "superpowers" .gitignore
```

Expected: existing rule `.superpowers/` already present (added earlier). That rule covers `.superpowers/captures/` already.

- [ ] **Step 2: Make captures dir**

```bash
mkdir -p .superpowers/captures
```

(No commit needed; dir is gitignored.)

---

## Task 19: Full pre-gate verification

**Files:** none (verification only)

- [ ] **Step 1: Full test suite**

```bash
npm test -- --run
```

Expected: all tests pass. Count should be previous baseline + ~25 new tests from Tasks 3-13.

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: clean.

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: clean; log bundle size. Should be within ~10 KB of pre-Phase-0 baseline (new animation modules are tiny).

- [ ] **Step 4: AutoBattler stress test**

```bash
npm run dev
```

In browser console:
```js
globalThis.AUTO_BATTLE = true;
```

Start a run. Let it run 3-5 minutes. Observe FPS in dev tools. Compare against a run before Phase 0 landed (checkout previous commit, repeat).

Expected: FPS within 5% of baseline under AutoBattler 10× stress.

- [ ] **Step 5: Record the metrics in a GATE_NOTES.md**

Create `docs/PHASE_0_GATE_NOTES.md`:

```markdown
# Phase 0 Gate Notes

## Texture bake times (dev machine)

- Haggis atlas (classic only, idle + walking): <RECORDED_MS> ms
- Accessory atlas (tam only, idle + walking): <RECORDED_MS> ms
- Total boot-time overhead: <SUM> ms

These numbers calibrate the Phase 1-3 expectations per spec v3 §6.

## FPS baseline

- Pre-Phase-0 AutoBattler 10× stress (5 min run): <BASELINE_FPS> avg
- Post-Phase-0 AutoBattler 10× stress (5 min run): <CURRENT_FPS> avg
- Delta: <DELTA>%. Within the 5% gate? <YES/NO>.

## Gate A — 24h cooldown self-review

Date completed: <FILL IN AFTER 24H WAIT>
Reference sprites compared side-by-side: dean_apparition, tome_wraith, redcap.
Outcome: <PASS / REWORK>
Notes: ...

## Gate B — external review

Date completed: <FILL IN AFTER REVIEWS>
Reviewers: <R1>, <R2>
Clip URL / link: ...
Question asked: "Does this look handcrafted / polished / Scottish?"
Responses:
- R1: <response>
- R2: <response>
Outcome: <PASS / REWORK>
```

- [ ] **Step 6: Commit gate notes scaffold**

```bash
git add docs/PHASE_0_GATE_NOTES.md
git commit -m "docs: Phase 0 gate notes scaffold (metrics + Gate A/B placeholders)"
```

---

## Task 20: Gate A — 24-hour cooldown self-review

**This task is time-gated: minimum 24 hours after Task 19 completes before Step 1 runs. Purpose: mitigate sunk-cost bias. Use the elapsed time to work on unrelated tickets or step away from the repo.**

- [ ] **Step 1: Capture reference + subject screenshots**

Run the game (`npm run dev`). Enable DEV_HOTKEYS.
- Use the `K` hotkey to capture classic haggis idle screenshot.
- Press `W` then `K` — capture walking.
- Press `T` then `K` — capture with-tam idle.
- Press `W` then `K` — capture with-tam walking.

Rename captured files to `.superpowers/captures/phase0_<label>.png`.

Also capture the three reference sprites from BootScene-generated output:
- `dean_apparition`
- `tome_wraith`
- `redcap`

(Open the BootScene output at `/` or via debug overlay; screenshot each.)

- [ ] **Step 2: Side-by-side comparison**

Open captures in an image viewer. Compare:
- Does the haggis silhouette read at distance (squint test)?
- Is the light model (upper-left highlight) visible?
- Does the walking cycle read as walking?
- Does the tam sit on the head convincingly?
- Do the sprites all feel like they belong to the same game?

Fill in Gate A section of `docs/PHASE_0_GATE_NOTES.md` with outcome.

- [ ] **Step 3: If PASS — commit Gate A note + proceed to Task 21**

```bash
git add docs/PHASE_0_GATE_NOTES.md
git commit -m "docs(gate): Phase 0 Gate A PASS — 24h cooldown self-review"
```

- [ ] **Step 3 (alternative): If REWORK — iterate haggisFrames / tamOShanter / palette**

Revise the drawer code. Re-bake atlas. Re-capture. Re-review. Repeat until PASS.
If after 5 rework cycles Gate A still fails — escalate to user for strategy re-eval (spec Gate C).

---

## Task 21: Gate B — external review

- [ ] **Step 1: Record gameplay clip**

Record 15-30 seconds of gameplay showing:
- Classic haggis walking (with & without tam toggled via `T`).
- A few basic combat beats.

Use OS screen recorder or browser devtools "record" feature. Save to `.superpowers/captures/phase0_gameplay.mp4` (or .webm).

- [ ] **Step 2: Distribute to ≥ 2 non-developer reviewers**

Ask specifically:
> "Does this look handcrafted / polished / Scottish? Any one-sentence reaction?"

- [ ] **Step 3: Record responses in `docs/PHASE_0_GATE_NOTES.md`**

Fill the Gate B section. If ≥ 2 reviewers say "yes / handcrafted / polished," PASS. If either says no or the feedback signals the craft bar isn't met, REWORK.

- [ ] **Step 4: Commit**

```bash
git add docs/PHASE_0_GATE_NOTES.md
git commit -m "docs(gate): Phase 0 Gate B <PASS|REWORK> — external review complete"
```

- [ ] **Step 5: If PASS — Phase 0 ships**

Tag the commit:

```bash
git tag phase-0-ship
```

Spec §16 next step: Phase 1 plan document can now be written. Phase 1 execution gated on Phase 0 ship.

- [ ] **Step 5 (alternative): If REWORK — iterate or escalate**

Return to Task 13 / 6 / 7 iterations with the specific feedback. After 5 iteration cycles of Gate B failing, escalate to user: revisit Option A (procedural) vs Option D (hybrid pixel-art pipeline).

---

## Self-review (writer's checklist, completed)

**Spec coverage (§7 of spec v3):**
- [x] Animation infrastructure (animationStates, frameClock, AnimationController, textureAtlas) — Tasks 3-5, 9.
- [x] Dev affordances (force-equip + force-state + combinations preview + screenshot) — Tasks 15-17.
- [x] Classic haggis authored (idle × 2 + walking × 4) — Tasks 6-7.
- [x] Tam-o-shanter accessory authored — Task 13.
- [x] `src/art/palettes.ts` — Task 2.
- [x] `docs/ART_STYLE_BIBLE.md` — Task 1.
- [x] Measure texture bake time — Task 8 (recorded in commit message) + Task 19 (recorded in GATE_NOTES).
- [x] Gate A + Gate B — Tasks 20-21.

**Placeholder scan:**
- No "TBD" / "TODO" inside step bodies.
- All code steps show complete code.
- Gate notes placeholder document has `<RECORDED_MS>` / `<PASS/REWORK>` markers — these are *values the human fills in at runtime*, not unfilled authoring. Acceptable because the template is the deliverable.

**Type consistency:**
- `AnimationState` used uniformly (animationStates, frameClock, textureAtlas, AnimationController).
- `AnimationSignals` used in Player.update + AnimationController.tick — same shape.
- `VariantPalette` from `palettes.ts` used in haggisFrames + tamOShanter DrawCtx.
- `AccessoryDrawer` / `AccessoryDrawCtx` used in tamOShanter + registry + BootScene.
- `atlasKey` used by AnimationController + BootScene.

**Sequencing:**
- Pure helpers (Tasks 3-5) land before integrations (Task 9 depends on them).
- Task 8 (BootScene bake) depends on Task 7 (walking frames authored) and Task 6 (idle frames authored) — but Task 7 uses Task 6's pattern, so Task 6 must come first.
- Task 10 (Player wiring) depends on Tasks 8 + 9.
- Task 13 (tam drawer) depends on Task 12 (registry + interface).
- Task 14 (Player equipAccessory) depends on Tasks 11 + 13.
- Task 15 (debug hotkeys) depends on Task 14.
- Task 17 (combinations scene) depends on Task 13 (tam atlas baked).
- Tasks 20-21 (gates) depend on Task 19 (verification pass).

All dependencies honoured in task ordering.

**Known caveats passed through from spec v3:**
- External reviewers (Gate B) sourced at Task 21 time; degrades to solo + friends if panel doesn't materialize.
- Gate C (≥ 5 iteration failures) escalates to user for strategy re-eval, not auto-close.
- Low-HP toast cut is Phase 4 scope, not Phase 0.

---

Plan complete and saved to `docs/superpowers/plans/2026-04-18-moor-phase-0-prototype-plan.md`.

Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration with checkpoints.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints for review.

Which approach?
