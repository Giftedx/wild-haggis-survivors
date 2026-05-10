# Phase 1 — Enemy Animation Foundation

> **STATUS:** ✅ SHIPPED 2026-04-20 — texture-swap animation for 3 archetypes (chase, ranged, dive). Per `superpowers/plans/INDEX.md`.
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add texture-swap animation to 3 enemy archetypes (chase, ranged, dive), wiring the same AnimationController infrastructure that already drives the player. Retire `bobPhase` scaleY wobble for animated enemies; non-animated enemies keep their current behavior unchanged.

**Architecture:** Each animated enemy gets a frame drawer module (like `haggisFrames.ts`) that parameterizes the existing static drawing function with per-frame offsets (breathY, bodyX, legOffset). An `ANIMATED_ENEMIES` registry maps enemy keys to their frame drawer. `Enemy.ts` checks this registry at spawn — animated enemies get an `AnimationController`; non-animated enemies keep `bobPhase`. BootScene bakes per-state×frame atlases for each registered enemy at boot.

**Tech Stack:** Phaser 3 Graphics API, TypeScript, existing `AnimationController`/`frameClock`/`textureAtlas` from Phase 0.

**Spec ref:** `docs/superpowers/specs/2026-04-18-moor-renders-itself-design.md` §8 (Phase 1).

---

## Where we are today

### Already shipped (Phase 0)
- `AnimationController` — per-entity state + frame-index owner. Calls `sprite.setTexture(key)` on frame change.
- `animationStates.ts` — pure FSM with 6 states (idle/walking/attacking/hurt/celebrating/dying).
- `frameClock.ts` — pure per-state frame clock. Idle 2f@2fps, walking 4f@24fps, hurt 2f@30fps, dying 3f@12fps, etc.
- `textureAtlas.ts` — `atlasKey(subject, variant, state, frame)` key format. `allAtlasKeysForVariant()` enumerates all.
- `haggisFrames.ts` — per-state frame drawers for haggis body using `HaggisBodyFrame` offsets.
- Player.ts — fully wired. `tickAnimationAndSync()` feeds signals to AnimationController.
- BootScene — `bakeHaggisAtlas()` and `bakeAccessoryAtlas()` loops already produce ~270 textures.

### Enemies today
- 31 enemy types, each drawn by a `bake<Name>(scene)` function in `src/art/sprites/enemies/<name>.ts`.
- Static single texture per enemy. `Enemy.spawn()` calls `this.setTexture(config.texture)`.
- Idle "breathing" via `bobPhase` — a `sin(phase) * 0.04` scaleY wobble in `chaseTarget()` (lines 442-447).
- No AnimationController, no frame swapping, no per-state visuals.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/animation/frameDrawers/enemies/enemyFrameTypes.ts` | **Create** | Shared `EnemyBodyFrame` interface + `EnemyFrameDrawer` type |
| `src/animation/frameDrawers/enemies/buckfastNedFrames.ts` | **Create** | Chase archetype — 4-state frame definitions |
| `src/animation/frameDrawers/enemies/haggisHunterFrames.ts` | **Create** | Ranged archetype — 4-state frame definitions |
| `src/animation/frameDrawers/enemies/eagleFrames.ts` | **Create** | Dive archetype — 4-state frame definitions |
| `src/animation/frameDrawers/enemies/enemyFrameRegistry.ts` | **Create** | Maps enemy key → frame drawer for boot bake + controller |
| `src/art/sprites/enemies/buckfastNed.ts` | **Modify** | Extract pure draw function accepting offset params |
| `src/art/sprites/enemies/haggisHunter.ts` | **Modify** | Extract pure draw function accepting offset params |
| `src/art/sprites/enemies/eagle.ts` | **Modify** | Extract pure draw function accepting offset params |
| `src/scenes/BootScene.ts` | **Modify** | Add `bakeEnemyAtlas()` loop for animated enemies |
| `src/entities/Enemy.ts` | **Modify** | Add AnimationController, wire signals, conditional bobPhase |
| `src/animation/frameDrawers/enemies/enemyFrameRegistry.test.ts` | **Create** | Registry tests |
| `src/animation/frameDrawers/enemies/buckfastNedFrames.test.ts` | **Create** | Frame definition tests |
| `src/animation/frameDrawers/enemies/eagleFrames.test.ts` | **Create** | Frame definition tests |
| `src/animation/frameDrawers/enemies/haggisHunterFrames.test.ts` | **Create** | Frame definition tests |

---

## Task 1: Enemy Frame Types + Registry Interface

**Files:**
- Create: `src/animation/frameDrawers/enemies/enemyFrameTypes.ts`
- Create: `src/animation/frameDrawers/enemies/enemyFrameRegistry.ts`
- Create: `src/animation/frameDrawers/enemies/enemyFrameRegistry.test.ts`

The shared types and registry that everything else plugs into.

- [ ] **Step 1: Create enemy frame types**

```typescript
// src/animation/frameDrawers/enemies/enemyFrameTypes.ts

/**
 * Shared per-frame offset interface for enemy animation. Same concept
 * as HaggisBodyFrame — small positional tweaks per frame that sell the
 * animation beat without redrawing the full sprite shape.
 *
 * Every enemy drawer accepts these offsets and shifts its internal cx/cy
 * anchor accordingly. Defaults to 0 for all fields.
 */

import type { AnimationState } from '../../animationStates';

export interface EnemyBodyFrame {
  /** Body vertical offset (px). Positive = sinks (breathing in). */
  readonly breathY?: number;
  /** Whole-body horizontal offset (px). Used for hurt-flinch. */
  readonly bodyX?: number;
  /** Left leg vertical offset (px). Walking shuffle. */
  readonly leftLegY?: number;
  /** Right leg vertical offset (px). Walking shuffle. */
  readonly rightLegY?: number;
}

/**
 * A frame drawer for one enemy type. Maps (state, frame) → the offset
 * to pass to the enemy's draw function. States not in the map fall back
 * to idle frame 0 (same pattern as accessory drawers).
 */
export interface EnemyFrameDrawer {
  /** Enemy texture key (e.g. 'buckfast_ned'). */
  readonly enemyKey: string;
  /** Canvas size the original bake function uses. */
  readonly canvasSize: number;
  /** States with authored frames. Others fall back to idle_0. */
  readonly authoredStates: ReadonlySet<AnimationState>;
  /** Get the offset for a specific state + frame index. */
  getFrame(state: AnimationState, frame: number): EnemyBodyFrame;
  /** Draw the enemy body into the given Graphics at the given offset. */
  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void;
}
```

- [ ] **Step 2: Create enemy frame registry**

```typescript
// src/animation/frameDrawers/enemies/enemyFrameRegistry.ts

/**
 * Registry of animated enemy frame drawers. Enemy.ts checks this at
 * spawn time — keys present here get an AnimationController; keys
 * absent keep static texture + bobPhase.
 *
 * Start with 3 archetypes (Phase 1). More enemies graduate to
 * animation in Phase 2.5+.
 */

import type { EnemyFrameDrawer } from './enemyFrameTypes';

const REGISTRY = new Map<string, EnemyFrameDrawer>();

export function registerEnemyFrameDrawer(drawer: EnemyFrameDrawer): void {
  REGISTRY.set(drawer.enemyKey, drawer);
}

export function getEnemyFrameDrawer(enemyKey: string): EnemyFrameDrawer | null {
  return REGISTRY.get(enemyKey) ?? null;
}

export function isEnemyAnimated(enemyKey: string): boolean {
  return REGISTRY.has(enemyKey);
}

/** All registered enemy keys — used by BootScene bake loop. */
export function getAllAnimatedEnemyKeys(): string[] {
  return Array.from(REGISTRY.keys());
}

/** All registered drawers — used by BootScene bake loop. */
export function getAllAnimatedEnemyDrawers(): EnemyFrameDrawer[] {
  return Array.from(REGISTRY.values());
}
```

- [ ] **Step 3: Write the registry test**

```typescript
// src/animation/frameDrawers/enemies/enemyFrameRegistry.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerEnemyFrameDrawer,
  getEnemyFrameDrawer,
  isEnemyAnimated,
  getAllAnimatedEnemyKeys,
} from './enemyFrameRegistry';
import type { EnemyFrameDrawer } from './enemyFrameTypes';

// The registry is module-level state. Tests that register drawers will
// persist across cases in the same module, which is fine — we're testing
// additive registration, not isolation.

const MOCK_DRAWER: EnemyFrameDrawer = {
  enemyKey: 'test_enemy',
  canvasSize: 48,
  authoredStates: new Set(['idle', 'walking', 'hurt', 'dying']),
  getFrame: () => ({}),
  draw: () => {},
};

describe('enemyFrameRegistry', () => {
  it('returns null for unregistered keys', () => {
    expect(getEnemyFrameDrawer('nonexistent')).toBeNull();
    expect(isEnemyAnimated('nonexistent')).toBe(false);
  });

  it('registers and retrieves a drawer', () => {
    registerEnemyFrameDrawer(MOCK_DRAWER);
    expect(isEnemyAnimated('test_enemy')).toBe(true);
    expect(getEnemyFrameDrawer('test_enemy')).toBe(MOCK_DRAWER);
    expect(getAllAnimatedEnemyKeys()).toContain('test_enemy');
  });
});
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run src/animation/frameDrawers/enemies/enemyFrameRegistry.test.ts`
Expected: PASS — 2 tests pass.

- [ ] **Step 5: Verify build**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/animation/frameDrawers/enemies/enemyFrameTypes.ts src/animation/frameDrawers/enemies/enemyFrameRegistry.ts src/animation/frameDrawers/enemies/enemyFrameRegistry.test.ts
git commit -m "feat(anim): add enemy frame types + registry for Phase 1 animation"
```

---

## Task 2: Refactor buckfastNed drawer to accept offsets

**Files:**
- Modify: `src/art/sprites/enemies/buckfastNed.ts`

The existing `bakeBuckfastNed` draws everything inline. Refactor so the drawing logic lives in a pure `drawBuckfastNedBody(g, cx, cy)` function that both the legacy bake and the new frame drawers can call.

- [ ] **Step 1: Read the full current source**

Read: `src/art/sprites/enemies/buckfastNed.ts` — the entire file (around 100-150 lines). You need to understand every draw call so the refactoring preserves pixel-perfect output.

- [ ] **Step 2: Extract drawing into a parameterized function**

The refactoring pattern is:
1. The existing `bakeBuckfastNed(scene)` currently computes `cx = s/2` and `cy = s/2 + 2`.
2. Extract all the Graphics draw calls into `drawBuckfastNedBody(g, cx, cy)`.
3. `bakeBuckfastNed` becomes a thin wrapper: create graphics, call `drawBuckfastNedBody`, generate texture, destroy.
4. Add `EnemyBodyFrame` offset support: `cx += (frame.bodyX ?? 0)`, `cy += (frame.breathY ?? 0)`, plus leg offsets where legs are drawn.

```typescript
// At top of file, add:
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const BUCKFAST_NED_CANVAS_SIZE = 44;

/**
 * Draw the buckfast ned body into the given Graphics context. Pure
 * drawing — no texture generation. The frame offsets shift the anchor
 * for animation beats (breathing, walking, hurt flinch).
 */
export function drawBuckfastNedBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = BUCKFAST_NED_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 2 + (frame.breathY ?? 0);
  const leftLegY = frame.leftLegY ?? 0;
  const rightLegY = frame.rightLegY ?? 0;

  // [Paste ALL existing draw calls from bakeBuckfastNed, replacing
  //  hardcoded cx/cy with the parameterized values. For leg draw
  //  calls, add leftLegY/rightLegY offsets to the y coordinates.]
  // ...
}

// Existing bake function becomes a thin wrapper:
export function bakeBuckfastNed(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawBuckfastNedBody(g);
  g.generateTexture('buckfast_ned', BUCKFAST_NED_CANVAS_SIZE, BUCKFAST_NED_CANVAS_SIZE);
  g.destroy();
}
```

**Critical constraint:** The leg draw calls (lines drawing tracksuit legs + trainers) must add `leftLegY`/`rightLegY` to their y-coordinates. Identify which `fillRect` calls draw the left leg vs right leg by looking at the x-coordinates — left leg uses `cx - 5` to `cx - 1`, right leg uses `cx + 1` to `cx + 5`.

- [ ] **Step 3: Verify the legacy texture is unchanged**

Run: `npm run dev` — open browser, start a game, let buckfast_ned enemies spawn (they appear at 300s / 5:00 — use `?quickplay&seed=1` to fast-start). The ned should look identical to before. No visual regression.

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/art/sprites/enemies/buckfastNed.ts
git commit -m "refactor(art): extract drawBuckfastNedBody with frame offset support"
```

---

## Task 3: Buckfast Ned Frame Drawer (Chase Archetype)

**Files:**
- Create: `src/animation/frameDrawers/enemies/buckfastNedFrames.ts`
- Create: `src/animation/frameDrawers/enemies/buckfastNedFrames.test.ts`

Per-state frame definitions for the chase archetype. Same pattern as `haggisFrames.ts` — authored offsets per state×frame that create breathing, walking shuffle, hurt flinch, and death collapse.

- [ ] **Step 1: Create the frame drawer**

```typescript
// src/animation/frameDrawers/enemies/buckfastNedFrames.ts

/**
 * Buckfast Ned — chase archetype frame definitions.
 *
 * 4 authored states (idle, walking, hurt, dying). Attacking and
 * celebrating fall back to idle_0 — enemies don't use those states.
 *
 * The ned's walk is a low-centre-of-gravity swagger — the hood
 * dips on contact frames and the legs shuffle tight (tracksuit
 * bottoms don't stride wide).
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawBuckfastNedBody, BUCKFAST_NED_CANVAS_SIZE } from '../../../art/sprites/enemies/buckfastNed';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 1 },   // breathing in — hood dips
    { breathY: -1 },   // breathing out — lifts
  ],
  walking: [
    { breathY: 0, leftLegY: -2, rightLegY: 1 },   // contact L
    { breathY: -1, leftLegY: -1, rightLegY: 0 },   // passing
    { breathY: 0, leftLegY: 1, rightLegY: -2 },    // contact R
    { breathY: -1, leftLegY: 0, rightLegY: -1 },   // passing
  ],
  hurt: [
    { bodyX: -2, breathY: 1 },   // flinch back + compress
    { bodyX: -1 },                // recover
  ],
  dying: [
    { breathY: 1, bodyX: -1 },                      // stagger
    { breathY: 4, leftLegY: 3, rightLegY: 3 },      // buckle
    { breathY: 6, leftLegY: 4, rightLegY: 4 },      // down
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const buckfastNedDrawer: EnemyFrameDrawer = {
  enemyKey: 'buckfast_ned',
  canvasSize: BUCKFAST_NED_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawBuckfastNedBody(g, frame);
  },
};

// Self-register on module load — BootScene imports this file.
registerEnemyFrameDrawer(buckfastNedDrawer);
```

- [ ] **Step 2: Write the test**

```typescript
// src/animation/frameDrawers/enemies/buckfastNedFrames.test.ts

import { describe, it, expect } from 'vitest';
import { buckfastNedDrawer } from './buckfastNedFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('buckfastNedFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(buckfastNedDrawer.enemyKey).toBe('buckfast_ned');
    expect(buckfastNedDrawer.canvasSize).toBe(44);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(buckfastNedDrawer.authoredStates.has('idle')).toBe(true);
    expect(buckfastNedDrawer.authoredStates.has('walking')).toBe(true);
    expect(buckfastNedDrawer.authoredStates.has('hurt')).toBe(true);
    expect(buckfastNedDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of buckfastNedDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = buckfastNedDrawer.getFrame(state, f);
        expect(frame).toBeDefined();
        expect(typeof frame).toBe('object');
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const nonAuthored: AnimationState[] = ['attacking', 'celebrating'];
    const idle0 = buckfastNedDrawer.getFrame('idle', 0);
    for (const state of nonAuthored) {
      expect(buckfastNedDrawer.getFrame(state, 0)).toEqual(idle0);
    }
  });

  it('falls back to idle_0 for out-of-range frames', () => {
    const idle0 = buckfastNedDrawer.getFrame('idle', 0);
    expect(buckfastNedDrawer.getFrame('idle', 99)).toEqual(idle0);
  });
});
```

- [ ] **Step 3: Run the test**

Run: `npx vitest run src/animation/frameDrawers/enemies/buckfastNedFrames.test.ts`
Expected: PASS — 5 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/animation/frameDrawers/enemies/buckfastNedFrames.ts src/animation/frameDrawers/enemies/buckfastNedFrames.test.ts
git commit -m "feat(anim): add buckfast_ned frame drawer — chase archetype"
```

---

## Task 4: Refactor eagle drawer + create eagle frame drawer (Dive Archetype)

**Files:**
- Modify: `src/art/sprites/enemies/eagle.ts`
- Create: `src/animation/frameDrawers/enemies/eagleFrames.ts`
- Create: `src/animation/frameDrawers/enemies/eagleFrames.test.ts`

The eagle is a dive enemy — its animation has a different character. Wing sweep is the dominant motion. Walking = gliding (body tilts forward). Hurt = wing tuck. Dying = spiral descent. No leg offsets — wings are the anchor.

- [ ] **Step 1: Read and refactor eagle.ts**

Read the full `src/art/sprites/enemies/eagle.ts`. Extract all draw calls into `drawEagleBody(g, frame)`, export the canvas size constant. Same pattern as buckfastNed refactoring.

The eagle's animation offsets are different — instead of leg shuffles, use:
- `breathY`: body bob (gliding rise/fall)
- `bodyX`: forward lean (dive commit) or backward flinch (hurt)

```typescript
// At top of eagle.ts, add:
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const EAGLE_CANVAS_SIZE = 56;

export function drawEagleBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = EAGLE_CANVAS_SIZE;
  const cx = s / 2 - 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + (frame.breathY ?? 0);
  // [All existing draw calls with parameterized cx/cy]
}

export function bakeEagle(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawEagleBody(g);
  g.generateTexture('eagle', EAGLE_CANVAS_SIZE, EAGLE_CANVAS_SIZE);
  g.destroy();
}
```

- [ ] **Step 2: Create eagle frame drawer**

```typescript
// src/animation/frameDrawers/enemies/eagleFrames.ts

/**
 * Eagle — dive archetype frame definitions.
 *
 * The eagle's animation is wing-dominant. Idle = gentle bob (thermal
 * riding). Walking = forward lean (active glide). Hurt = wing tuck
 * (flinch up and back). Dying = spiral fall (body drops, tilts).
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawEagleBody, EAGLE_CANVAS_SIZE } from '../../../art/sprites/enemies/eagle';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 1 },    // thermal dip
    { breathY: -1 },   // thermal rise
  ],
  walking: [
    { breathY: 0, bodyX: 1 },    // glide forward
    { breathY: -1, bodyX: 2 },   // committed lean
    { breathY: 0, bodyX: 1 },    // level off
    { breathY: 1, bodyX: 0 },    // slight pull-up between beats
  ],
  hurt: [
    { bodyX: -3, breathY: -2 },  // flinch up and back (wing tuck)
    { bodyX: -1, breathY: -1 },  // recover
  ],
  dying: [
    { breathY: 1, bodyX: -1 },   // stall
    { breathY: 4, bodyX: -2 },   // tumble
    { breathY: 7 },              // drop
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const eagleDrawer: EnemyFrameDrawer = {
  enemyKey: 'eagle',
  canvasSize: EAGLE_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawEagleBody(g, frame);
  },
};

registerEnemyFrameDrawer(eagleDrawer);
```

- [ ] **Step 3: Write the eagle frames test**

```typescript
// src/animation/frameDrawers/enemies/eagleFrames.test.ts

import { describe, it, expect } from 'vitest';
import { eagleDrawer } from './eagleFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('eagleFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(eagleDrawer.enemyKey).toBe('eagle');
    expect(eagleDrawer.canvasSize).toBe(56);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    expect(eagleDrawer.authoredStates.has('idle')).toBe(true);
    expect(eagleDrawer.authoredStates.has('walking')).toBe(true);
    expect(eagleDrawer.authoredStates.has('hurt')).toBe(true);
    expect(eagleDrawer.authoredStates.has('dying')).toBe(true);
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of eagleDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = eagleDrawer.getFrame(state, f);
        expect(frame).toBeDefined();
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const idle0 = eagleDrawer.getFrame('idle', 0);
    expect(eagleDrawer.getFrame('attacking', 0)).toEqual(idle0);
    expect(eagleDrawer.getFrame('celebrating', 0)).toEqual(idle0);
  });
});
```

- [ ] **Step 4: Run tests + build**

Run: `npx vitest run src/animation/frameDrawers/enemies/eagleFrames.test.ts`
Expected: PASS.

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Verify eagle legacy texture unchanged**

Run: `npm run dev` — start a game, let eagles spawn (dive enemies). Verify they look identical.

- [ ] **Step 6: Commit**

```bash
git add src/art/sprites/enemies/eagle.ts src/animation/frameDrawers/enemies/eagleFrames.ts src/animation/frameDrawers/enemies/eagleFrames.test.ts
git commit -m "feat(anim): add eagle frame drawer — dive archetype"
```

---

## Task 5: Refactor haggisHunter drawer + create frame drawer (Ranged Archetype)

**Files:**
- Modify: `src/art/sprites/enemies/haggisHunter.ts`
- Create: `src/animation/frameDrawers/enemies/haggisHunterFrames.ts`
- Create: `src/animation/frameDrawers/enemies/haggisHunterFrames.test.ts`

The haggis hunter is the ranged archetype. Maintains standoff distance, fires slowing projectiles. Walk is a cautious stalk (weight stays back). Hurt flinch drops the net-pole.

- [ ] **Step 1: Read and refactor haggisHunter.ts**

Same pattern: extract `drawHaggisHunterBody(g, frame)` with offset support. Canvas size is 48.

```typescript
import type { EnemyBodyFrame } from '../../../animation/frameDrawers/enemies/enemyFrameTypes';

export const HAGGIS_HUNTER_CANVAS_SIZE = 48;

export function drawHaggisHunterBody(
  g: Phaser.GameObjects.Graphics,
  frame: EnemyBodyFrame = {},
): void {
  const s = HAGGIS_HUNTER_CANVAS_SIZE;
  const cx = s / 2 + (frame.bodyX ?? 0);
  const cy = s / 2 + 2 + (frame.breathY ?? 0);
  const leftLegY = frame.leftLegY ?? 0;
  const rightLegY = frame.rightLegY ?? 0;
  // [All existing draw calls]
}

export function bakeHaggisHunter(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawHaggisHunterBody(g);
  g.generateTexture('haggis_hunter', HAGGIS_HUNTER_CANVAS_SIZE, HAGGIS_HUNTER_CANVAS_SIZE);
  g.destroy();
}
```

- [ ] **Step 2: Create haggis hunter frame drawer**

```typescript
// src/animation/frameDrawers/enemies/haggisHunterFrames.ts

/**
 * Haggis Hunter — ranged archetype frame definitions.
 *
 * Cautious stalker. Walk is weight-back (net held high). Hurt drops
 * the net-pole (flinch backward). Dying = hat-falls-off collapse.
 */

import type { AnimationState } from '../../animationStates';
import type { EnemyBodyFrame, EnemyFrameDrawer } from './enemyFrameTypes';
import { drawHaggisHunterBody, HAGGIS_HUNTER_CANVAS_SIZE } from '../../../art/sprites/enemies/haggisHunter';
import { registerEnemyFrameDrawer } from './enemyFrameRegistry';

type FrameTable = Partial<Record<AnimationState, EnemyBodyFrame[]>>;

const FRAMES: FrameTable = {
  idle: [
    { breathY: 1 },   // weight shifts
    { breathY: -1 },   // settles
  ],
  walking: [
    { breathY: 0, leftLegY: -1, rightLegY: 1 },   // cautious step L
    { breathY: -1, leftLegY: 0, rightLegY: 0 },    // weight transfer
    { breathY: 0, leftLegY: 1, rightLegY: -1 },    // cautious step R
    { breathY: -1, leftLegY: 0, rightLegY: 0 },    // weight transfer
  ],
  hurt: [
    { bodyX: -2, breathY: 2 },   // flinch back, compress (net drops)
    { bodyX: -1, breathY: 1 },   // recover
  ],
  dying: [
    { breathY: 1, bodyX: -1 },                      // stagger
    { breathY: 3, leftLegY: 2, rightLegY: 2 },      // knees buckle
    { breathY: 6, leftLegY: 4, rightLegY: 4 },      // down
  ],
};

const AUTHORED_STATES = new Set<AnimationState>(
  Object.keys(FRAMES) as AnimationState[],
);

const IDLE_0: EnemyBodyFrame = FRAMES.idle![0];

export const haggisHunterDrawer: EnemyFrameDrawer = {
  enemyKey: 'haggis_hunter',
  canvasSize: HAGGIS_HUNTER_CANVAS_SIZE,
  authoredStates: AUTHORED_STATES,

  getFrame(state: AnimationState, frame: number): EnemyBodyFrame {
    const stateFrames = FRAMES[state];
    if (!stateFrames) return IDLE_0;
    return stateFrames[frame] ?? IDLE_0;
  },

  draw(g: Phaser.GameObjects.Graphics, frame: EnemyBodyFrame): void {
    drawHaggisHunterBody(g, frame);
  },
};

registerEnemyFrameDrawer(haggisHunterDrawer);
```

- [ ] **Step 3: Write the test**

```typescript
// src/animation/frameDrawers/enemies/haggisHunterFrames.test.ts

import { describe, it, expect } from 'vitest';
import { haggisHunterDrawer } from './haggisHunterFrames';
import { getFrameCountForState } from '../../frameClock';
import type { AnimationState } from '../../animationStates';

describe('haggisHunterFrames', () => {
  it('has the correct enemy key and canvas size', () => {
    expect(haggisHunterDrawer.enemyKey).toBe('haggis_hunter');
    expect(haggisHunterDrawer.canvasSize).toBe(48);
  });

  it('authors idle, walking, hurt, and dying states', () => {
    for (const s of ['idle', 'walking', 'hurt', 'dying'] as const) {
      expect(haggisHunterDrawer.authoredStates.has(s)).toBe(true);
    }
  });

  it('returns frames for each authored state matching frameClock count', () => {
    for (const state of haggisHunterDrawer.authoredStates) {
      const count = getFrameCountForState(state);
      for (let f = 0; f < count; f++) {
        const frame = haggisHunterDrawer.getFrame(state, f);
        expect(frame).toBeDefined();
      }
    }
  });

  it('falls back to idle_0 for non-authored states', () => {
    const idle0 = haggisHunterDrawer.getFrame('idle', 0);
    expect(haggisHunterDrawer.getFrame('attacking', 0)).toEqual(idle0);
    expect(haggisHunterDrawer.getFrame('celebrating', 0)).toEqual(idle0);
  });
});
```

- [ ] **Step 4: Run tests + build**

Run: `npx vitest run src/animation/frameDrawers/enemies/haggisHunterFrames.test.ts`
Expected: PASS.

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/art/sprites/enemies/haggisHunter.ts src/animation/frameDrawers/enemies/haggisHunterFrames.ts src/animation/frameDrawers/enemies/haggisHunterFrames.test.ts
git commit -m "feat(anim): add haggis_hunter frame drawer — ranged archetype"
```

---

## Task 6: Enemy Atlas Baking in BootScene

**Files:**
- Modify: `src/scenes/BootScene.ts`

Add a `bakeEnemyAtlas()` method that iterates all registered animated enemy drawers and bakes per-state×frame textures. Same pattern as `bakeHaggisAtlas()` / `bakeAccessoryAtlas()`.

- [ ] **Step 1: Import the registration side-effects and registry**

Add to `BootScene.ts` imports:

```typescript
import { getAllAnimatedEnemyDrawers } from '../animation/frameDrawers/enemies/enemyFrameRegistry';
import { ALL_ANIMATION_STATES } from '../animation/textureAtlas';
// Side-effect imports — registers each drawer into the registry on module load:
import '../animation/frameDrawers/enemies/buckfastNedFrames';
import '../animation/frameDrawers/enemies/eagleFrames';
import '../animation/frameDrawers/enemies/haggisHunterFrames';
```

Note: `ALL_ANIMATION_STATES` is already imported. Only add `getAllAnimatedEnemyDrawers` and the three side-effect imports.

- [ ] **Step 2: Add bakeEnemyAtlas method**

Add after `bakeAccessoryAtlas()`:

```typescript
private bakeEnemyAtlas(): number {
  const startMs = performance.now();
  const drawers = getAllAnimatedEnemyDrawers();
  for (const drawer of drawers) {
    const size = drawer.canvasSize;
    for (const state of ALL_ANIMATION_STATES) {
      const frameCount = getFrameCountForState(state);
      for (let frame = 0; frame < frameCount; frame++) {
        const g = this.add.graphics();
        // Authored states get their per-frame offset. Non-authored
        // states fall back to idle_0 — identical to accessory pattern.
        const bodyFrame = drawer.authoredStates.has(state)
          ? drawer.getFrame(state, frame)
          : drawer.getFrame('idle', 0);
        drawer.draw(g, bodyFrame);
        // Key format: `<enemyKey>_<state>_<frame>` — variant is null
        // so atlasKey omits it. But we build the key directly here
        // to avoid importing atlasKey for a trivial concat.
        const key = `${drawer.enemyKey}_${state}_${frame}`;
        g.generateTexture(key, size, size);
        g.destroy();
      }
    }
  }
  return performance.now() - startMs;
}
```

- [ ] **Step 3: Call bakeEnemyAtlas in create()**

In the `create()` method, after the existing accessory atlas bake log (line ~75), add:

```typescript
const enemyBakeMs = this.bakeEnemyAtlas();
console.info(`[BootScene] Enemy atlas bake: ${enemyBakeMs.toFixed(1)} ms`);
```

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Verify in browser**

Run: `npm run dev` — open browser. Check console output for `[BootScene] Enemy atlas bake: X.X ms`. Expected: < 100 ms for 3 enemies × 19 frames = 57 textures. Game should load normally, no visual regression on any sprites.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat(anim): bake enemy animation atlases at boot for 3 archetypes"
```

---

## Task 7: Wire AnimationController into Enemy.ts

**Files:**
- Modify: `src/entities/Enemy.ts`

The biggest change. Add an `AnimationController` to enemies, feed it signals from the enemy's state each frame, and skip `bobPhase` for animated enemies.

- [ ] **Step 1: Add imports**

At the top of `Enemy.ts`, add:

```typescript
import { AnimationController } from '../animation/AnimationController';
import type { AnimationSignals } from '../animation/animationStates';
import { isEnemyAnimated } from '../animation/frameDrawers/enemies/enemyFrameRegistry';
```

- [ ] **Step 2: Add fields**

After the `bobPhase` field (line ~142), add:

```typescript
/** Animation controller for texture-swap animation. Null for non-animated enemies. */
private animController: AnimationController | null = null;
/** Consumed-once flag for hurt animation edge. */
private hurtEdgeThisFrame: boolean = false;
```

- [ ] **Step 3: Initialize AnimationController in spawn()**

In the `spawn()` method, after the existing state reset block (around line 269, after `this.bobPhase = Math.random() * Math.PI * 2`), add:

```typescript
// Animation controller — only for enemies with authored frame drawers.
// Non-animated enemies keep static texture + bobPhase wobble.
if (isEnemyAnimated(config.key)) {
  if (!this.animController || this.animController['init'].subject !== config.key) {
    // First spawn as this enemy type, or pool reuse from a different type.
    this.animController = new AnimationController({
      sprite: this,
      subject: config.key,
      variant: null,
    });
  }
  // Reset to idle frame 0 for a clean start on pool reuse.
  // The controller was just constructed (which applies idle_0), but
  // if the same object was reused we need to force the reset by
  // reconstructing. Simplest: always construct fresh.
  this.animController = new AnimationController({
    sprite: this,
    subject: config.key,
    variant: null,
  });
} else {
  this.animController = null;
}
```

- [ ] **Step 4: Set hurtEdge on takeDamage**

In the `takeDamage()` method (line ~1054), after the `this.hp -= amount` line but before the `if (this.hp <= 0)` check, add:

```typescript
this.hurtEdgeThisFrame = true;
```

Also add it in `takeDamageInternal()` (line ~1010), after `this.hp -= amount`:

```typescript
this.hurtEdgeThisFrame = true;
```

- [ ] **Step 5: Tick the AnimationController in chaseTarget()**

In `chaseTarget()`, replace the bobPhase wobble block (lines 442-447):

```typescript
// OLD (lines 442-447):
if (this.behavior !== 'hazard' && this.behavior !== 'spawner') {
  this.bobPhase += 0.08;
  const wobble = Math.sin(this.bobPhase) * 0.04;
  const base = this.baseDisplayScale;
  this.setScale(base, base * (1 + wobble));
}
```

With:

```typescript
// Animated enemies: tick the animation controller for texture-swap.
// Non-animated enemies: keep the legacy scaleY bob.
if (this.animController) {
  const body = this.body as Phaser.Physics.Arcade.Body;
  const signals: AnimationSignals = {
    velocityMag: Math.hypot(body.velocity.x, body.velocity.y),
    hurtEdge: this.hurtEdgeThisFrame,
    attackEdge: false,
    celebrateEdge: false,
    hp: this.hp,
  };
  this.hurtEdgeThisFrame = false;
  this.animController.tick(delta, signals);
} else if (this.behavior !== 'hazard' && this.behavior !== 'spawner') {
  this.bobPhase += 0.08;
  const wobble = Math.sin(this.bobPhase) * 0.04;
  const base = this.baseDisplayScale;
  this.setScale(base, base * (1 + wobble));
}
```

**Important:** The `delta` passed to `chaseTarget` is raw delta, not scaledDelta. The AnimationController expects scaledDelta. Check whether `chaseTarget` receives raw or scaled delta from SpawnSystem. If SpawnSystem passes raw delta, you need to use scaledDelta instead. Check `SpawnSystem.update()` to see what delta it passes to `chaseTarget`.

- [ ] **Step 6: Check SpawnSystem delta passing**

Read `src/systems/SpawnSystem.ts` — find the line that calls `enemy.chaseTarget(...)` and check whether it passes raw delta or scaledDelta. The AnimationController's frame clock needs scaledDelta (so time-scale=0 during hit freeze pauses animation too).

If SpawnSystem passes raw delta, you have two options:
1. Pass scaledDelta through to chaseTarget (modify the call site)
2. Compute scaledDelta inside chaseTarget from the scene's time scale

The existing `chaseTarget(targetX, targetY, delta)` signature uses `delta` for knockback decay and status effect ticking, which should respect time scale. Check the existing callers.

- [ ] **Step 7: Verify build**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 8: Full browser test**

Run: `npm run dev`

Test each animated enemy:
1. **Buckfast Ned** (spawns at 5:00 / 300s — use `?quickplay` and survive or reduce `appearsAt` temporarily): should show idle breathing when stationary, walking shuffle when chasing, hurt flinch on taking damage.
2. **Eagle** (dive enemy): should show walking/glide animation during dive approach.
3. **Haggis Hunter** (ranged, spawns at 120s): should show cautious walking animation during standoff movement.
4. **Non-animated enemies** (tourist, chef, midge, etc.): should still show the scaleY bob wobble, no visual regression.
5. **Boss enemies**: should keep bobPhase (they're not in the animated registry).
6. **Elite enemies**: gold tint should still apply on top of animation.

- [ ] **Step 9: Commit**

```bash
git add src/entities/Enemy.ts
git commit -m "feat(anim): wire AnimationController into Enemy — 3 archetypes animated, legacy bobPhase preserved"
```

---

## Task 8: Production Build + CI Verification

**Files:** None (verification only)

- [ ] **Step 1: Run full CI pipeline**

Run: `npm run ci`
Expected: Lint passes, all vitest tests pass, `tsc --noEmit` passes, build completes.

- [ ] **Step 2: Verify no stray references**

Run: `grep -r "wobblePhase" src/` (via Grep tool)
Expected: Only found in `Enemy.ts` where `bobPhase` is still used for non-animated enemies. No other files reference it. (The field was already named `bobPhase`, not `wobblePhase` — verify the spec's "retire wobblePhase" language maps to `bobPhase` in the code.)

- [ ] **Step 3: Verify enemy atlas texture count**

In browser dev console after boot, check: 3 enemies × 19 frames per enemy = 57 new textures. The `[BootScene] Enemy atlas bake` log should show reasonable timing.

- [ ] **Step 4: Run E2E smoke test (if dist exists)**

Run: `npm run build && npm run test:e2e`
Expected: All E2E tests pass. No crash on enemy spawn.

- [ ] **Step 5: Commit if cleanup needed**

```bash
git add -A
git commit -m "chore: Phase 1 enemy animation — verify CI + production build"
```

---

## Out of scope for this plan

- **Remaining 28 enemies**: Phase 2.5+ graduates more enemies into animation. Each follows the exact same pattern (refactor drawer → create frame module → register).
- **Enemy attacking/celebrating states**: Enemies don't enter these states. Textures are baked (fallback to idle_0) but never displayed.
- **LOD for swarm enemies**: `midge` and `midgie_swarm` stay idle-loop-only per spec §8.
- **Per-variant enemy differences**: Enemies don't have variants.
- **Accessory frame expansion**: Phase 2 work (walking/hurt/dying frames for accessories).
- **Boss animation**: Separate from enemy archetypes — bosses have unique visual spectacles already.
- **`bobPhase` full retirement**: Only retire for animated enemies. Full retirement happens when all enemies are animated (Phase 2.5+).
