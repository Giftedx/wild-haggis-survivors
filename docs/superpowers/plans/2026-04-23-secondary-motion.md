# Secondary Motion (W71 Phase 2 slice) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the first W71 Phase 2 slice — keyframe tail phase-offset lag + tier-gated heather mantle overlay — without introducing any runtime rig solver.

**Architecture:** Two additive fields (`tailX`, `tailY`) on `HaggisBodyFrame`, authored across all 6 animation states per a phase-offset rule. One new pure `computeMantleTier` helper. One new mantle drawer + BootScene atlas bake loop (10 variants × 2 tiers = 20 textures). One `Player.setMantleTier` method + child overlay sprite. `RunScoreState.onKillsChanged` notifier wired from `GameScene` drives tier transitions with a 300 ms alpha tween (instant under `motionScale === 0`).

**Tech Stack:** TypeScript, Phaser 4 Graphics/Sprite/Tween APIs, Vitest with existing Phaser mocks, ESLint.

**Spec ref:** `docs/superpowers/specs/2026-04-23-secondary-motion-design.md`.

---

## Where we are today

- `src/animation/frameDrawers/haggisBodyDraw.ts` owns `HaggisBodyFrame` and `drawHaggisBody`. The "wee tail nub" is two `fillCircle` calls at lines 84–88. The interface currently exposes `breathY`, `leftLegY`, `rightLegY`, `bodyX`.
- `src/animation/frameDrawers/haggisFrames.ts` authors per-state drawers that delegate to `drawHaggisBody` with offsets. Every variant uses the same drawer registry.
- `src/animation/frameDrawers/haggisFrames.test.ts` uses a stubbed `Phaser.GameObjects.Graphics` with `vi.fn()` spies. Pattern: assert primitive-call counts or inter-frame draw-call diffs.
- `src/scenes/BootScene.ts` has `bakeHaggisAtlas()` and `bakeAccessoryAtlas()` patterns that loop `VARIANTS`, call `scene.add.graphics()`, `generateTexture(key, size, size)`, then destroy. See lines 306–332.
- `src/scenes/game/RunScoreState.ts` owns `killCount: number` plus `incrementKillCount(): void`. Class lives in 71 lines; no notifier hooks today.
- `src/entities/Player.ts` already has `variantKey: string` (line 151, default `'classic'`), an `update(delta)` override (line 343), and a `destroy(fromScene?)` override (line 1010) that cascades cleanup.
- `src/core/SettingsManager.ts` exposes `motionScale: number` in `[0, 1]` (line 30). No separate `reduceMotion` boolean — treat `motionScale === 0` as "instant, no tween".
- No `W71 Phase 2` work exists in `src/`; this slice is greenfield within the animation tree.

---

## File map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/animation/mantleTier.ts` | **Create** | Pure `MANTLE_TIERS` constants + `computeMantleTier(kills): MantleTier`. |
| `src/animation/mantleTier.test.ts` | **Create** | Boundary + monotonicity tests. |
| `src/animation/frameDrawers/haggisBodyDraw.ts` | **Modify** | Add `tailX?: number`, `tailY?: number` to `HaggisBodyFrame`; apply them to the two tail-nub `fillCircle` calls. |
| `src/animation/frameDrawers/haggisFrames.ts` | **Modify** | Add tail offsets per §3.2 of the spec to every state's drawers. |
| `src/animation/frameDrawers/haggisFrames.test.ts` | **Modify** | Regression: for each `(state, frame)` in spec §3.2, assert the expected `HaggisBodyFrame` shape via a lightweight spy on `drawHaggisBody`. |
| `src/art/sprites/haggisMantle.ts` | **Create** | `drawMantleTier(g, variant, tier)` pure drawer. |
| `src/art/sprites/haggisMantle.test.ts` | **Create** | Every `VariantKey` + tier 1/2 produces primitive calls; tier 0 produces none. |
| `src/scenes/BootScene.ts` | **Modify** | Add `bakeHaggisMantleAtlas()` and call it from `create()` alongside the other bakes. |
| `src/scenes/game/RunScoreState.ts` | **Modify** | Add a single `onKillsChanged?: (kills: number) => void` callback field; `incrementKillCount` notifies after the bump. |
| `src/scenes/game/RunScoreState.test.ts` | **Modify** (or **Create** if absent) | Test notifier fires on each increment, noop when unset, preserves existing behaviour. |
| `src/entities/Player.ts` | **Modify** | `mantleOverlay` field, create in spawn, sync position + scale in `update`, `setMantleTier` method, `destroy` cleanup. |
| `src/entities/Player.mantle.test.ts` | **Create** | Unit-level coverage of `setMantleTier`. |
| `src/scenes/GameScene.ts` | **Modify** | After Player spawn + `RunScoreState` hookup, pre-seed mantle tier (`instant: true`) and wire `onKillsChanged` to call `setMantleTier` with `instant: motionScale === 0`. |

**Total:** 5 modified, 4 created — 9 files touched. Two of the modified files (`haggisFrames.test.ts`, `RunScoreState.test.ts`) likely only gain cases, not structural edits.

---

## Task 1: Pure mantle-tier helper

**Files:**
- Create: `src/animation/mantleTier.ts`
- Create: `src/animation/mantleTier.test.ts`

**Why first:** The helper is pure, trivial to write, and its boundary behaviour is referenced by every downstream task. Landing it alone gives later tasks a stable import.

- [ ] **Step 1: Write the failing test**

```ts
// src/animation/mantleTier.test.ts
import { describe, expect, it } from 'vitest';
import { computeMantleTier, MANTLE_TIERS } from './mantleTier';

describe('computeMantleTier', () => {
  it('returns tier 0 below the tier-1 threshold', () => {
    expect(computeMantleTier(0)).toBe(0);
    expect(computeMantleTier(MANTLE_TIERS.tier1KillThreshold - 1)).toBe(0);
  });

  it('returns tier 1 at the tier-1 threshold and up to just below tier 2', () => {
    expect(computeMantleTier(MANTLE_TIERS.tier1KillThreshold)).toBe(1);
    expect(computeMantleTier(MANTLE_TIERS.tier2KillThreshold - 1)).toBe(1);
  });

  it('returns tier 2 at and above the tier-2 threshold', () => {
    expect(computeMantleTier(MANTLE_TIERS.tier2KillThreshold)).toBe(2);
    expect(computeMantleTier(10_000)).toBe(2);
  });

  it('is monotonic in kills across a 300-kill sample', () => {
    let prev = 0;
    for (let k = 0; k <= 300; k++) {
      const tier = computeMantleTier(k);
      expect(tier).toBeGreaterThanOrEqual(prev);
      prev = tier;
    }
  });

  it('rejects negative kill counts by treating them as 0', () => {
    expect(computeMantleTier(-5)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/animation/mantleTier.test.ts`
Expected: FAIL — `Cannot find module './mantleTier'`.

- [ ] **Step 3: Write the implementation**

```ts
// src/animation/mantleTier.ts
/**
 * Mantle tier ladder for the heather-mantle overlay (W71 Phase 2).
 *
 * Thresholds are placeholders pending first playtest (spec §3.5). The
 * two values below are the only tuning knob — adjust and the rest of
 * the pipeline rides the change.
 */

export type MantleTier = 0 | 1 | 2;

export const MANTLE_TIERS = {
  tier1KillThreshold: 50,
  tier2KillThreshold: 250,
} as const;

export function computeMantleTier(kills: number): MantleTier {
  const n = Math.max(0, kills);
  if (n >= MANTLE_TIERS.tier2KillThreshold) return 2;
  if (n >= MANTLE_TIERS.tier1KillThreshold) return 1;
  return 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/animation/mantleTier.test.ts`
Expected: PASS — 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/animation/mantleTier.ts src/animation/mantleTier.test.ts
git commit -m "feat(animation): mantleTier pure helper (W71 Phase 2)"
```

---

## Task 2: `HaggisBodyFrame` gains `tailX` / `tailY`

**Files:**
- Modify: `src/animation/frameDrawers/haggisBodyDraw.ts`

**Why now:** Adding the fields before authoring tail offsets keeps Task 3's edits focused on frames, not interface changes. The interface addition is backwards-compatible (optional, defaults to 0), so no existing frame author breaks.

- [ ] **Step 1: Extend the `HaggisBodyFrame` interface**

In `src/animation/frameDrawers/haggisBodyDraw.ts`, replace the interface block (currently lines 28–37) with:

```ts
export interface HaggisBodyFrame {
  /** Body y offset (px). Positive = sinks (breathing in). */
  readonly breathY?: number;
  /** Extra y offset for LEFT leg pair (px). Positive = lifts (foot back). */
  readonly leftLegY?: number;
  /** Extra y offset for RIGHT leg pair (px). */
  readonly rightLegY?: number;
  /** Whole-body x offset (px). Used for hurt-flinch and attack-lean. */
  readonly bodyX?: number;
  /**
   * Tail x offset (px). Positive = tail trails right. W71 Phase 2 —
   * used by walking/attacking/hurt keyframes to sell secondary motion.
   */
  readonly tailX?: number;
  /**
   * Tail y offset (px). Positive = tail sinks (lags body rise).
   * W71 Phase 2 — used by idle/celebrating/dying keyframes.
   */
  readonly tailY?: number;
}
```

- [ ] **Step 2: Apply the fields to the tail-nub circles**

The tail is drawn at `src/animation/frameDrawers/haggisBodyDraw.ts` lines 84–88. Replace that block with:

```ts
  // ── Wee tail nub at the rear ──
  const tailDx = frame.tailX ?? 0;
  const tailDy = frame.tailY ?? 0;
  g.fillStyle(palette.bodyDark, 1);
  g.fillCircle(cx - 20 + tailDx, cy + 4 + leftDy + tailDy, 4);
  g.fillStyle(palette.fur, 0.7);
  g.fillCircle(cx - 20 + tailDx, cy + 3 + leftDy + tailDy, 2.5);
```

- [ ] **Step 3: Run the existing body-draw + haggisFrames tests to confirm no regressions**

Run: `npm test -- --run src/animation/frameDrawers/`
Expected: all existing tests still pass. Optional fields default to 0 → existing bakes unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/animation/frameDrawers/haggisBodyDraw.ts
git commit -m "feat(animation): HaggisBodyFrame gains tailX/tailY (W71 Phase 2)"
```

---

## Task 3: Author tail phase-offset values per state

**Files:**
- Modify: `src/animation/frameDrawers/haggisFrames.ts`
- Modify: `src/animation/frameDrawers/haggisFrames.test.ts`

**Why now:** The interface exists (Task 2) but no frame uses it yet. This task writes the intent (spec §3.2 table) directly into the frame drawers and locks the values in a regression test so future tuning surfaces in PR diffs, not silent visual drift.

**Test strategy note:** rather than spying on an ESM named import (fragile under vitest + esbuild), this task exposes an exported `FRAME_OFFSETS` table in `haggisFrames.ts`. The table is the single source of truth; the drawer functions read from it, and the test imports it directly. No mocking, no spies.

- [ ] **Step 1: Write the failing regression test**

Append to `src/animation/frameDrawers/haggisFrames.test.ts`:

```ts
// --- W71 Phase 2 tail lag regression ---
import { FRAME_OFFSETS } from './haggisFrames';
import type { HaggisBodyFrame } from './haggisBodyDraw';
import type { AnimationState } from '../animationStates';

const EXPECTED: Record<AnimationState, readonly HaggisBodyFrame[]> = {
  idle: [
    { breathY: 1, tailY: -1 },
    { breathY: -1, tailY: 1 },
  ],
  walking: [
    { breathY: 0, leftLegY: -2, rightLegY: 1, tailX: -1 },
    { breathY: -1, leftLegY: -1, rightLegY: 0, tailX: 0 },
    { breathY: 0, leftLegY: 1, rightLegY: -2, tailX: 1 },
    { breathY: -1, leftLegY: 0, rightLegY: -1, tailX: 0 },
  ],
  attacking: [
    { bodyX: 1, tailX: 0 },
    { bodyX: 2, breathY: -2, tailX: -1 },
    { bodyX: 1, breathY: -1, tailX: -1 },
    { tailX: 0 },
  ],
  hurt: [
    { bodyX: -2, breathY: 1, tailX: 1 },
    { bodyX: -1, breathY: 0, tailX: 0 },
  ],
  celebrating: [
    { breathY: 2, tailY: 0 },
    { breathY: -6, tailY: 3 },
    { breathY: -1, bodyX: -1, tailY: 1 },
    { breathY: -1, bodyX: 1, tailY: -1 },
  ],
  dying: [
    { breathY: 1, bodyX: -1, tailY: 0 },
    { breathY: 4, leftLegY: 3, rightLegY: 3, tailY: 3 },
    { breathY: 6, leftLegY: 4, rightLegY: 4, tailY: 5 },
  ],
};

describe('W71 Phase 2 tail lag — FRAME_OFFSETS authored per spec §3.2', () => {
  for (const [state, frames] of Object.entries(EXPECTED)) {
    frames.forEach((expected, idx) => {
      it(`${state}[${idx}] matches the spec`, () => {
        expect(FRAME_OFFSETS[state as AnimationState]?.[idx]).toEqual(expected);
      });
    });
  }
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `npm test -- --run src/animation/frameDrawers/haggisFrames.test.ts`
Expected: FAIL — `FRAME_OFFSETS` not exported.

- [ ] **Step 3: Refactor `haggisFrames.ts` to expose `FRAME_OFFSETS` and read from it**

Replace the whole body of `src/animation/frameDrawers/haggisFrames.ts` (between the existing imports and the bottom `getHaggisSpriteSize` export) with:

```ts
/**
 * FRAME_OFFSETS — the authored HaggisBodyFrame payload per (state, frame).
 * Exposed as a const so W71 Phase 2 tail-lag regression can assert values
 * without spying on the drawer function. Drawer delegates to the shared
 * full-detail `drawHaggisBody` with the offset for the requested slot.
 */
export const FRAME_OFFSETS: Record<AnimationState, readonly HaggisBodyFrame[]> = {
  idle: [
    { breathY: 1, tailY: -1 },
    { breathY: -1, tailY: 1 },
  ],
  walking: [
    { breathY: 0, leftLegY: -2, rightLegY: 1, tailX: -1 },
    { breathY: -1, leftLegY: -1, rightLegY: 0, tailX: 0 },
    { breathY: 0, leftLegY: 1, rightLegY: -2, tailX: 1 },
    { breathY: -1, leftLegY: 0, rightLegY: -1, tailX: 0 },
  ],
  attacking: [
    { bodyX: 1, tailX: 0 },
    { bodyX: 2, breathY: -2, tailX: -1 },
    { bodyX: 1, breathY: -1, tailX: -1 },
    { tailX: 0 },
  ],
  hurt: [
    { bodyX: -2, breathY: 1, tailX: 1 },
    { bodyX: -1, breathY: 0, tailX: 0 },
  ],
  celebrating: [
    { breathY: 2, tailY: 0 },
    { breathY: -6, tailY: 3 },
    { breathY: -1, bodyX: -1, tailY: 1 },
    { breathY: -1, bodyX: 1, tailY: -1 },
  ],
  dying: [
    { breathY: 1, bodyX: -1, tailY: 0 },
    { breathY: 4, leftLegY: 3, rightLegY: 3, tailY: 3 },
    { breathY: 6, leftLegY: 4, rightLegY: 4, tailY: 5 },
  ],
};
```

Delete the existing per-frame `drawXxxFrameN` helper functions (lines 32–137) and the `DRAWERS` map (lines 139–156); they are superseded by the FRAME_OFFSETS table + a simple lookup. Replace them with:

```ts
/**
 * Draw a full haggis body for `ctx.state, ctx.frame` into `g`. Reads the
 * authored offset from `FRAME_OFFSETS` and delegates to the shared drawer.
 */
export function drawHaggisFrame(
  g: Phaser.GameObjects.Graphics,
  ctx: HaggisDrawCtx,
): void {
  const frames = FRAME_OFFSETS[ctx.state];
  if (!frames) {
    throw new Error(`drawHaggisFrame: state ${ctx.state} not authored yet (Phase 1)`);
  }
  const bodyFrame = frames[ctx.frame];
  if (!bodyFrame) {
    throw new Error(`drawHaggisFrame: frame ${ctx.frame} out of range for state ${ctx.state}`);
  }
  const variant = getVariantByKey(ctx.variantKey ?? 'classic');
  drawHaggisBody(g, variant, bodyFrame);
}
```

Keep the existing `getHaggisSpriteSize` export and imports at the top.

- [ ] **Step 4: Author tail offsets in `haggisFrames.ts`** *(absorbed by Step 3 — FRAME_OFFSETS is the authored data)*

*(This step is intentionally empty — the table in Step 3 already contains every authored tail value. Left here so the task numbering in the commit message matches the task list.)*

- [ ] **Step 5: Run tests to confirm they pass**

Run: `npm test -- --run src/animation/frameDrawers/haggisFrames.test.ts`
Expected: PASS — new regression (19 cases) plus all existing haggisFrames tests.

The existing test cases (idle-differs, "at least 5 primitives per frame", etc.) still exercise `drawHaggisFrame` end-to-end and validate that the refactored drawer still drives the graphics stub correctly.

```ts
function drawIdleFrame0(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  drawHaggisBody(g, variant, { breathY: 1, tailY: -1 });
}

function drawIdleFrame1(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  drawHaggisBody(g, variant, { breathY: -1, tailY: 1 });
}

function drawWalkingFrame0(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  drawHaggisBody(g, variant, { breathY: 0, leftLegY: -2, rightLegY: 1, tailX: -1 });
}

function drawWalkingFrame1(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  drawHaggisBody(g, variant, { breathY: -1, leftLegY: -1, rightLegY: 0, tailX: 0 });
}

function drawWalkingFrame2(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  drawHaggisBody(g, variant, { breathY: 0, leftLegY: 1, rightLegY: -2, tailX: 1 });
}

function drawWalkingFrame3(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  drawHaggisBody(g, variant, { breathY: -1, leftLegY: 0, rightLegY: -1, tailX: 0 });
}

function drawAttackingFrame0(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  drawHaggisBody(g, variant, { bodyX: 1, tailX: 0 });
}

function drawAttackingFrame1(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  drawHaggisBody(g, variant, { bodyX: 2, breathY: -2, tailX: -1 });
}

function drawAttackingFrame2(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  drawHaggisBody(g, variant, { bodyX: 1, breathY: -1, tailX: -1 });
}

function drawAttackingFrame3(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  drawHaggisBody(g, variant, { tailX: 0 });
}

function drawHurtFrame0(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  drawHaggisBody(g, variant, { bodyX: -2, breathY: 1, tailX: 1 });
}

function drawHurtFrame1(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  drawHaggisBody(g, variant, { bodyX: -1, breathY: 0, tailX: 0 });
}

function drawCelebratingFrame0(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  drawHaggisBody(g, variant, { breathY: 2, tailY: 0 });
}

function drawCelebratingFrame1(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  drawHaggisBody(g, variant, { breathY: -6, tailY: 3 });
}

function drawCelebratingFrame2(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  drawHaggisBody(g, variant, { breathY: -1, bodyX: -1, tailY: 1 });
}

function drawCelebratingFrame3(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  drawHaggisBody(g, variant, { breathY: -1, bodyX: 1, tailY: -1 });
}

function drawDyingFrame0(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  drawHaggisBody(g, variant, { breathY: 1, bodyX: -1, tailY: 0 });
}

function drawDyingFrame1(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  drawHaggisBody(g, variant, { breathY: 4, leftLegY: 3, rightLegY: 3, tailY: 3 });
}

function drawDyingFrame2(g: Phaser.GameObjects.Graphics, variant: VariantDef): void {
  drawHaggisBody(g, variant, { breathY: 6, leftLegY: 4, rightLegY: 4, tailY: 5 });
}
```

- [ ] **Step 4: Run test to confirm it passes**

Run: `npm test -- --run src/animation/frameDrawers/haggisFrames.test.ts`
Expected: PASS — the new regression plus all existing haggisFrames tests.

- [ ] **Step 6: Run the full frameDrawers suite to catch neighbours**

Run: `npm test -- --run src/animation/frameDrawers/`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add src/animation/frameDrawers/haggisFrames.ts src/animation/frameDrawers/haggisFrames.test.ts
git commit -m "feat(animation): phase-offset tail lag across all haggis states (W71 Phase 2)"
```

---

## Task 4: Mantle drawer

**Files:**
- Create: `src/art/sprites/haggisMantle.ts`
- Create: `src/art/sprites/haggisMantle.test.ts`

**Why now:** Drawer is pure and covered by unit tests; BootScene (Task 6) needs it to bake textures.

- [ ] **Step 1: Write the failing test**

```ts
// src/art/sprites/haggisMantle.test.ts
import { describe, expect, it, vi } from 'vitest';
import { drawMantleTier } from './haggisMantle';
import { VARIANTS } from '../../data/variants';
import type { MantleTier } from '../../animation/mantleTier';

function makeGraphicsStub() {
  return {
    fillStyle: vi.fn().mockReturnThis(),
    fillCircle: vi.fn().mockReturnThis(),
    fillEllipse: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
    fillTriangle: vi.fn().mockReturnThis(),
    lineStyle: vi.fn().mockReturnThis(),
    strokeCircle: vi.fn().mockReturnThis(),
    strokeEllipse: vi.fn().mockReturnThis(),
    beginPath: vi.fn().mockReturnThis(),
    strokePath: vi.fn().mockReturnThis(),
    arc: vi.fn().mockReturnThis(),
    lineBetween: vi.fn().mockReturnThis(),
  };
}

function totalPrimitiveCalls(g: ReturnType<typeof makeGraphicsStub>): number {
  return (
    g.fillCircle.mock.calls.length +
    g.fillEllipse.mock.calls.length +
    g.fillRect.mock.calls.length +
    g.fillTriangle.mock.calls.length +
    g.strokeCircle.mock.calls.length +
    g.strokeEllipse.mock.calls.length
  );
}

describe('drawMantleTier', () => {
  it('draws nothing for tier 0', () => {
    for (const variant of VARIANTS) {
      const g = makeGraphicsStub();
      drawMantleTier(g as unknown as Phaser.GameObjects.Graphics, variant, 0);
      expect(totalPrimitiveCalls(g), `tier 0 / ${variant.key}`).toBe(0);
    }
  });

  it.each<MantleTier>([1, 2])('draws at least one primitive for tier %i across every variant', (tier) => {
    for (const variant of VARIANTS) {
      const g = makeGraphicsStub();
      drawMantleTier(g as unknown as Phaser.GameObjects.Graphics, variant, tier);
      expect(totalPrimitiveCalls(g), `tier ${tier} / ${variant.key}`).toBeGreaterThanOrEqual(1);
    }
  });

  it('tier 2 draws at least as many primitives as tier 1 for every variant', () => {
    for (const variant of VARIANTS) {
      const g1 = makeGraphicsStub();
      const g2 = makeGraphicsStub();
      drawMantleTier(g1 as unknown as Phaser.GameObjects.Graphics, variant, 1);
      drawMantleTier(g2 as unknown as Phaser.GameObjects.Graphics, variant, 2);
      expect(
        totalPrimitiveCalls(g2),
        `tier 2 ≥ tier 1 for ${variant.key}`,
      ).toBeGreaterThanOrEqual(totalPrimitiveCalls(g1));
    }
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `npm test -- --run src/art/sprites/haggisMantle.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the drawer**

```ts
// src/art/sprites/haggisMantle.ts
/**
 * Heather Mantle — tier-gated overlay drawn on the haggis's back as
 * kills accumulate (W71 Phase 2, DESIGN_IDEAS §M7 visual half).
 *
 * Universal shape, per-variant palette tint. Tier 1 draws a collar
 * over the neck; tier 2 extends the collar into a short cape down the
 * back. Canvas matches HAGGIS_SPRITE_SIZE so the overlay sprite aligns
 * pixel-perfect with the body texture at scale 1.
 */

import type { VariantDef } from '../../data/variants';
import type { MantleTier } from '../../animation/mantleTier';
import { HAGGIS_SPRITE_SIZE } from '../../animation/frameDrawers/haggisBodyDraw';

export function drawMantleTier(
  g: Phaser.GameObjects.Graphics,
  variant: VariantDef,
  tier: MantleTier,
): void {
  if (tier === 0) return;

  const s = HAGGIS_SPRITE_SIZE;
  const cx = s / 2;
  const cy = s / 2 - 2;
  const { palette } = variant.appearance;

  // ── Collar (present at tier 1 and tier 2) ──
  // Sits just above the body ellipse, behind the neck line.
  g.fillStyle(palette.outline, 1);
  g.fillEllipse(cx - 6, cy - 9, 22, 8);
  g.fillStyle(palette.bodyDark, 0.95);
  g.fillEllipse(cx - 6, cy - 9, 20, 6);
  g.fillStyle(palette.fur, 0.75);
  g.fillEllipse(cx - 6, cy - 10, 16, 4);

  if (tier === 1) return;

  // ── Tier 2: cape — extends from the collar down the back ──
  g.fillStyle(palette.outline, 1);
  g.fillEllipse(cx - 8, cy - 4, 28, 16);
  g.fillStyle(palette.bodyDark, 0.9);
  g.fillEllipse(cx - 8, cy - 4, 24, 12);
  g.fillStyle(palette.fur, 0.6);
  g.fillEllipse(cx - 8, cy - 3, 18, 8);

  // Subtle edge highlight along the cape hem.
  g.lineStyle(1, palette.fur, 0.5);
  g.strokeEllipse(cx - 8, cy - 4, 24, 12);
}
```

- [ ] **Step 4: Run test to confirm it passes**

Run: `npm test -- --run src/art/sprites/haggisMantle.test.ts`
Expected: PASS — 3 cases (tier 0 empty, tier 1/2 non-empty, tier 2 ≥ tier 1).

- [ ] **Step 5: Commit**

```bash
git add src/art/sprites/haggisMantle.ts src/art/sprites/haggisMantle.test.ts
git commit -m "feat(art): heather-mantle tier drawer (W71 Phase 2)"
```

---

## Task 5: `RunScoreState.onKillsChanged` notifier

**Files:**
- Modify: `src/scenes/game/RunScoreState.ts`
- Modify (or Create): `src/scenes/game/RunScoreState.test.ts`

**Why now:** The mantle wire (Task 8) needs this hook. Keeping it tiny and typed here prevents GameScene from growing its own diff-watcher.

- [ ] **Step 1: Check whether a test file exists**

Run: `ls src/scenes/game/RunScoreState.test.ts 2>&1 || echo "missing"`

If missing, create the file with:

```ts
// src/scenes/game/RunScoreState.test.ts
import { describe, expect, it, vi } from 'vitest';
import { RunScoreState } from './RunScoreState';

describe('RunScoreState', () => {
  it('increments killCount', () => {
    const rs = new RunScoreState();
    rs.incrementKillCount();
    rs.incrementKillCount();
    expect(rs.killCount).toBe(2);
  });
});
```

Otherwise, append only the new cases below.

- [ ] **Step 2: Append the failing notifier tests**

Add to `src/scenes/game/RunScoreState.test.ts`:

```ts
describe('RunScoreState.onKillsChanged', () => {
  it('fires after each incrementKillCount with the new kill total', () => {
    const rs = new RunScoreState();
    const spy = vi.fn();
    rs.onKillsChanged = spy;
    rs.incrementKillCount();
    rs.incrementKillCount();
    rs.incrementKillCount();
    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy.mock.calls.map((c) => c[0])).toEqual([1, 2, 3]);
  });

  it('is a noop when callback is undefined', () => {
    const rs = new RunScoreState();
    expect(() => rs.incrementKillCount()).not.toThrow();
    expect(rs.killCount).toBe(1);
  });

  it('reset() clears the counter but leaves the callback wired', () => {
    const rs = new RunScoreState();
    const spy = vi.fn();
    rs.onKillsChanged = spy;
    rs.incrementKillCount();
    rs.reset();
    expect(rs.killCount).toBe(0);
    rs.incrementKillCount();
    expect(spy).toHaveBeenLastCalledWith(1);
  });
});
```

- [ ] **Step 3: Run the test to confirm it fails**

Run: `npm test -- --run src/scenes/game/RunScoreState.test.ts`
Expected: FAIL — `onKillsChanged` not defined.

- [ ] **Step 4: Add the notifier to `RunScoreState`**

In `src/scenes/game/RunScoreState.ts`, inside the class body, add the field and update `incrementKillCount`:

```ts
  /**
   * Optional notifier fired immediately after `incrementKillCount`
   * bumps the counter. Wired from `GameScene` to drive the W71 Phase 2
   * mantle-tier transitions. Intentionally a single callback (not an
   * event emitter) — only one consumer expected.
   */
  onKillsChanged?: (kills: number) => void;

  incrementKillCount(): void {
    this.killCount++;
    this.onKillsChanged?.(this.killCount);
  }
```

Remove the previous `incrementKillCount()` definition (the bare `this.killCount++` lines).

- [ ] **Step 5: Run the test to confirm it passes**

Run: `npm test -- --run src/scenes/game/RunScoreState.test.ts`
Expected: PASS — all cases green.

- [ ] **Step 6: Run the whole RunScoreState-adjacent suite to catch collateral**

Run: `npm test -- --run src/scenes/game/`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add src/scenes/game/RunScoreState.ts src/scenes/game/RunScoreState.test.ts
git commit -m "feat(scene): RunScoreState.onKillsChanged notifier (W71 Phase 2)"
```

---

## Task 6: BootScene mantle atlas bake

**Files:**
- Modify: `src/scenes/BootScene.ts`

**Why now:** Textures must exist before Player creates the overlay sprite (Task 7). No unit test — matches existing `bakeHaggisAtlas` pattern which is covered by E2E boot smoke.

- [ ] **Step 1: Add the bake method**

In `src/scenes/BootScene.ts`, add the following method alongside `bakeHaggisAtlas` / `bakeAccessoryAtlas` (near line 306):

```ts
  private bakeHaggisMantleAtlas(): number {
    const startMs = performance.now();
    const size = getHaggisSpriteSize();
    // Tier 0 skipped — the overlay sprite stays hidden until tier 1 is
    // reached; no texture is needed.
    for (const variant of VARIANTS) {
      for (const tier of [1, 2] as const) {
        const g = this.add.graphics();
        drawMantleTier(g, variant, tier);
        g.generateTexture(`mantle_${variant.key}_${tier}`, size, size);
        g.destroy();
      }
    }
    return performance.now() - startMs;
  }
```

- [ ] **Step 2: Wire the bake into `create()`**

Find the block that calls `bakeHaggisAtlas` / `bakeAccessoryAtlas` (near line 105–110). Add the mantle bake alongside, with the same timing-log convention:

```ts
    const mantleBakeMs = this.bakeHaggisMantleAtlas();
```

Place it after `bakeAccessoryAtlas` so mantle textures land after the haggis body textures are already generated. If there is an existing console.log line reporting bake timings, append `mantleBakeMs` in the same format.

- [ ] **Step 3: Add the import for `drawMantleTier`**

At the top of `src/scenes/BootScene.ts`, add:

```ts
import { drawMantleTier } from '../art/sprites/haggisMantle';
```

- [ ] **Step 4: Build to verify the scene compiles + textures pack**

Run: `npm run build`
Expected: PASS — tsc clean, Vite build green, bundle size report in output.

Note the new bundle figures; compare against the pre-change baseline (`ea7eb56` HEAD). Delta should be ≤ 5 KB gzip on the main chunk.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat(boot): bake heather-mantle atlas (W71 Phase 2)"
```

---

## Task 7: Player mantle overlay + `setMantleTier`

**Files:**
- Modify: `src/entities/Player.ts`
- Create: `src/entities/Player.mantle.test.ts`

**Why now:** The overlay sprite is Player-owned; its lifecycle (create / sync / destroy) belongs with the entity. `setMantleTier` is pure enough to unit-test against a mocked Phaser scene.

- [ ] **Step 1: Write the failing test**

```ts
// src/entities/Player.mantle.test.ts
import { describe, expect, it, vi } from 'vitest';
import type { MantleTier } from '../animation/mantleTier';

// Minimal fake sprite that captures setTexture / setAlpha / setVisible calls.
function makeFakeSprite() {
  const state = { texture: 'mantle_classic_1', alpha: 0, visible: false };
  return {
    state,
    setTexture: vi.fn((key: string) => { state.texture = key; return undefined; }),
    setAlpha: vi.fn((a: number) => { state.alpha = a; return undefined; }),
    setVisible: vi.fn((v: boolean) => { state.visible = v; return undefined; }),
    setPosition: vi.fn(),
    setScale: vi.fn(),
    setDepth: vi.fn(),
    destroy: vi.fn(),
    scaleX: 1,
    scaleY: 1,
  };
}

function makeFakeTweens() {
  const calls: Array<Record<string, unknown>> = [];
  return {
    calls,
    add: vi.fn((cfg: Record<string, unknown>) => {
      calls.push(cfg);
      // Simulate instant completion for the test — set alpha on the target.
      const alphaCfg = cfg.alpha as { to?: number } | number | undefined;
      const target = cfg.targets as { setAlpha: (a: number) => void };
      if (typeof alphaCfg === 'number') target.setAlpha(alphaCfg);
      else if (alphaCfg && typeof alphaCfg === 'object' && 'to' in alphaCfg) target.setAlpha(alphaCfg.to ?? 0);
      return {};
    }),
  };
}

import { applyMantleTier } from './Player.mantle';

describe('applyMantleTier (extracted from Player.setMantleTier)', () => {
  it('tier 0 hides the overlay without tween', () => {
    const sprite = makeFakeSprite();
    const tweens = makeFakeTweens();
    applyMantleTier({
      overlay: sprite as unknown as Phaser.GameObjects.Sprite,
      tweens: tweens as unknown as Phaser.Tweens.TweenManager,
      variantKey: 'classic',
      nextTier: 0 as MantleTier,
      instant: false,
    });
    expect(sprite.setVisible).toHaveBeenLastCalledWith(false);
    expect(sprite.setAlpha).toHaveBeenLastCalledWith(0);
    expect(tweens.add).not.toHaveBeenCalled();
  });

  it('tier 1 with instant=true sets alpha directly and swaps texture', () => {
    const sprite = makeFakeSprite();
    const tweens = makeFakeTweens();
    applyMantleTier({
      overlay: sprite as unknown as Phaser.GameObjects.Sprite,
      tweens: tweens as unknown as Phaser.Tweens.TweenManager,
      variantKey: 'classic',
      nextTier: 1 as MantleTier,
      instant: true,
    });
    expect(sprite.setTexture).toHaveBeenCalledWith('mantle_classic_1');
    expect(sprite.setVisible).toHaveBeenLastCalledWith(true);
    expect(sprite.setAlpha).toHaveBeenLastCalledWith(1);
    expect(tweens.add).not.toHaveBeenCalled();
  });

  it('tier 2 with instant=false kicks a 300ms alpha tween', () => {
    const sprite = makeFakeSprite();
    const tweens = makeFakeTweens();
    applyMantleTier({
      overlay: sprite as unknown as Phaser.GameObjects.Sprite,
      tweens: tweens as unknown as Phaser.Tweens.TweenManager,
      variantKey: 'iron_belly',
      nextTier: 2 as MantleTier,
      instant: false,
    });
    expect(sprite.setTexture).toHaveBeenCalledWith('mantle_iron_belly_2');
    expect(sprite.setVisible).toHaveBeenLastCalledWith(true);
    expect(tweens.add).toHaveBeenCalledOnce();
    const cfg = tweens.calls[0];
    expect(cfg.duration).toBe(300);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `npm test -- --run src/entities/Player.mantle.test.ts`
Expected: FAIL — `./Player.mantle` module not found.

- [ ] **Step 3: Extract the pure half into `src/entities/Player.mantle.ts`**

```ts
// src/entities/Player.mantle.ts
/**
 * Pure half of Player.setMantleTier — extracted so the state-machine
 * logic (texture swap vs tween vs instant vs hide) can be unit-tested
 * without mounting the whole Player entity.
 */

import type { MantleTier } from '../animation/mantleTier';

export interface ApplyMantleTierArgs {
  overlay: Phaser.GameObjects.Sprite;
  tweens: Phaser.Tweens.TweenManager;
  variantKey: string;
  nextTier: MantleTier;
  instant: boolean;
}

export function applyMantleTier(args: ApplyMantleTierArgs): void {
  const { overlay, tweens, variantKey, nextTier, instant } = args;
  if (nextTier === 0) {
    overlay.setVisible(false);
    overlay.setAlpha(0);
    return;
  }
  overlay.setTexture(`mantle_${variantKey}_${nextTier}`);
  overlay.setVisible(true);
  if (instant) {
    overlay.setAlpha(1);
    return;
  }
  tweens.add({
    targets: overlay,
    alpha: { from: 0, to: 1 },
    duration: 300,
    ease: 'Cubic.easeOut',
  });
}
```

- [ ] **Step 4: Run the pure-half tests to confirm they pass**

Run: `npm test -- --run src/entities/Player.mantle.test.ts`
Expected: PASS.

- [ ] **Step 5: Add the overlay lifecycle to `Player.ts`**

Edits to `src/entities/Player.ts`:

**(a) Imports** — add near the top-of-file imports:

```ts
import type { MantleTier } from '../animation/mantleTier';
import { applyMantleTier } from './Player.mantle';
```

**(b) Fields** — add alongside the existing private fields (near line 151 where `variantKey` lives):

```ts
  private mantleOverlay: Phaser.GameObjects.Sprite | null = null;
  private mantleTier: MantleTier = 0;
  private mantleLastScale = 1;
```

**(c) Overlay creation** — inside the spawn path, right after `this.variantKey = variantKey;` (line 244). Add:

```ts
    // W71 Phase 2 — heather mantle overlay. Starts invisible; GameScene
    // will call setMantleTier immediately after spawn to pre-seed from
    // current kill count. Tier 1 texture is the initial key because the
    // sprite needs some texture to exist at construction; it is not
    // visible until a tier is actually shown.
    this.mantleOverlay = this.scene.add.sprite(this.x, this.y, `mantle_${this.variantKey}_1`);
    this.mantleOverlay.setDepth(this.depth + 1);
    this.mantleOverlay.setAlpha(0);
    this.mantleOverlay.setVisible(false);
    this.mantleLastScale = this.scaleX;
```

**(d) Position + scale sync in `update(delta)`** — inside the existing `update` method (line 343), near the top of the method body:

```ts
    if (this.mantleOverlay) {
      this.mantleOverlay.setPosition(this.x, this.y);
      // Scale only changes on level-up — skip the setScale matrix when
      // unchanged (Player.update runs every frame).
      if (this.scaleX !== this.mantleLastScale) {
        this.mantleOverlay.setScale(this.scaleX, this.scaleY);
        this.mantleLastScale = this.scaleX;
      }
    }
```

**(e) Public setter** — add as a new method on `Player` (after the existing public methods; above `destroy`):

```ts
  public setMantleTier(tier: MantleTier, opts: { instant?: boolean } = {}): void {
    if (!this.mantleOverlay) return;
    if (tier === this.mantleTier) return;
    this.mantleTier = tier;
    applyMantleTier({
      overlay: this.mantleOverlay,
      tweens: this.scene.tweens,
      variantKey: this.variantKey,
      nextTier: tier,
      instant: opts.instant === true,
    });
  }

  public getMantleTier(): MantleTier {
    return this.mantleTier;
  }
```

**(f) Destroy cleanup** — inside `destroy(fromScene)` (line 1010), before `super.destroy(fromScene);`:

```ts
    this.mantleOverlay?.destroy();
    this.mantleOverlay = null;
```

- [ ] **Step 6: Run the Player test suite**

Run: `npm test -- --run src/entities/`
Expected: PASS — all existing Player tests plus `Player.mantle.test.ts`.

- [ ] **Step 7: Build to verify typings + bundle**

Run: `npm run build`
Expected: PASS — tsc clean, bundle delta still ≤ 5 KB gzip vs baseline.

- [ ] **Step 8: Commit**

```bash
git add src/entities/Player.ts src/entities/Player.mantle.ts src/entities/Player.mantle.test.ts
git commit -m "feat(player): heather-mantle overlay + setMantleTier (W71 Phase 2)"
```

---

## Task 8: GameScene wires the mantle tier to kills

**Files:**
- Modify: `src/scenes/GameScene.ts`

**Why now:** Everything downstream exists; the wire is the final piece. No new test — the composition is already covered by Tasks 1, 5, and 7 individually, and the glue is two calls.

- [ ] **Step 1: Locate the Player-spawn + run-score setup block**

Run: `grep -n "RunScoreState\|runScore\|new Player\|this.player" src/scenes/GameScene.ts | head -30`

Identify the lines where (a) `RunScoreState` is instantiated or first referenced after scene reset and (b) the Player entity is created or returned by the spawn helper. The wire lives immediately after both exist.

- [ ] **Step 2: Add the mantle-wire helper on GameScene**

Inside `src/scenes/GameScene.ts`, add a private method near the other wiring helpers (search for an existing `private wire` / `private setup` near the top of the class, and place the new helper alongside):

```ts
  private wireMantleTier(player: Player, runScore: RunScoreState): void {
    const motionScale = this.getComfortMotionScale();
    const instantForComfort = motionScale === 0;
    // Pre-seed from current kill count so replays / save-mid-run starts
    // at the correct tier without a reveal tween.
    player.setMantleTier(
      computeMantleTier(runScore.killCount),
      { instant: true },
    );
    runScore.onKillsChanged = (kills) => {
      const nextTier = computeMantleTier(kills);
      if (nextTier === player.getMantleTier()) return;
      player.setMantleTier(nextTier, { instant: instantForComfort });
    };
  }

  private getComfortMotionScale(): number {
    // SettingsManager source of truth; fallback to 1 when unavailable
    // (e.g. during a test harness that bypasses settings).
    const settings = (this as unknown as { settings?: { motionScale?: number } }).settings;
    return settings?.motionScale ?? 1;
  }
```

If `GameScene` already has a settings accessor with a different name, use that accessor instead of the guarded-cast pattern — `grep -n "motionScale\|settingsManager\|this.settings" src/scenes/GameScene.ts` to check.

- [ ] **Step 3: Call the wire helper**

Immediately after the Player is created and the `RunScoreState` is attached (the block identified in Step 1), call:

```ts
    this.wireMantleTier(this.player, this.runScore);
```

Use the actual field names the scene uses (likely `this.player` / `this.runScore` — verify via the grep in Step 1).

- [ ] **Step 4: Add the imports**

At the top of `src/scenes/GameScene.ts`:

```ts
import { computeMantleTier } from '../animation/mantleTier';
```

(`RunScoreState` and `Player` are almost certainly already imported; grep to confirm.)

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: PASS — all existing vitest cases plus the new mantle-related cases. No snapshots changed.

- [ ] **Step 6: Run the full CI gate**

Run: `npm run ci`
Expected: PASS — lint + vitest + build all green.

- [ ] **Step 7: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat(scene): wire RunScoreState kills → Player.setMantleTier (W71 Phase 2)"
```

---

## Task 9: Verification gate — CI + E2E + bundle delta + manual playtest

**Files:**
- None (verification only).

**Why last:** Kills the flagship criterion (≤10 % frame-time regression, ≤5 KB bundle gzip). Any slip here rolls back to the per-task commits cleanly.

- [ ] **Step 1: Full CI (lint + vitest + build)**

Run: `npm run ci`
Expected: PASS.

- [ ] **Step 2: E2E smoke**

Run: `npm run build && npm run test:e2e`
Expected: PASS — 11/11 specs (current matrix).

- [ ] **Step 3: Record bundle delta**

Run: `ls -la dist/assets/*.js`
Compare against pre-change values from the HEAD-before-this-branch build. Realistic target: ≤ 5 KB gzip on `index-*.js`. If the delta exceeds 5 KB, descope the cape (tier 2) back to collar-only, re-run from Step 1.

- [ ] **Step 4: Manual playtest — 5 minutes minimum**

Run: `npm run dev`
Verify in a browser:

1. **Tail lag on walk** — move the haggis left/right; tail visibly trails (tailX swings opposite to leg-contact phase).
2. **Tail lag on attack** — fire a weapon; tail drags back during the forward lunge.
3. **Mantle tier 0** — first minute, no mantle visible.
4. **Mantle tier 1 reveal** — kill 50 enemies (use AutoBattler if preferred: `?auto=1` URL flag if the project supports it — grep `autoBattler` to confirm); collar should fade in over 300 ms.
5. **Mantle tier 2 reveal** — continue to 250 kills; cape should fade in.
6. **Motion-reduce** — Options → Comfort → set `motionScale` to 0; start a new run; kill past 50 → mantle appears instantly (no tween).
7. **Death** — mantle tier persists through the dying state; overlay disappears on `destroy`.

Any failure, fix in place and re-run from Step 1.

- [ ] **Step 5: Reflect**

Append a one-line lesson to `~/.claude/memory/reflections.jsonl` per the user's `/reflect` standing instruction. Example payload:

```json
{"date":"2026-04-23","task":"W71 Phase 2 secondary-motion slice (tail lag + mantle tiers)","outcome":"shipped","surprise":"...","next-time":"..."}
```

- [ ] **Step 6: Final commit (if anything was tweaked during verification)**

Only if Steps 3 or 4 required code changes. Otherwise this step is a noop — every prior task already committed cleanly.

```bash
git add -A
git commit -m "chore(w71): verification gate tweaks"
```

---

## Rollback

Every task is one logical commit. To rollback a partial slice:

- Mantle too expensive → `git revert` Task 6 + Task 7 + Task 8 commits; tail lag stays.
- Tail lag lands wrong → `git revert` Task 3; Tasks 1, 4, 5, 6, 7, 8 still ship the mantle with no tail change.
- Full rollback → `git reset --hard <pre-branch-HEAD>` on the working branch before merge.

---

## Spec coverage check

| Spec section | Implemented by |
|--------------|----------------|
| §3.1 `HaggisBodyFrame` extension | Task 2 |
| §3.2 Tail lag authoring rule | Task 3 |
| §3.3 Mantle overlay sprite | Task 4 (drawer) + Task 7 (sprite lifecycle) |
| §3.4 BootScene mantle atlas bake | Task 6 |
| §3.5 `computeMantleTier` pure helper | Task 1 |
| §3.6 `Player` mantle integration | Task 7 |
| §3.7 GameScene kill-count → tier wiring | Task 8 |
| §3.8 Motion-reduce a11y | Task 8 (`instantForComfort`) |
| §3.9 Replay + determinism | Tasks 1, 3, 7 (frame-indexed, edge-triggered, no rng) + Task 9 E2E gate |
| §5 Testing | Tasks 1, 3, 4, 5, 7 unit + Task 9 gate |
| §6 Rollout | This plan's ordering + Task 9 verification |
| §7 Followups | Deferred per spec — not in this plan. |

No spec gaps. No cross-task type drift (`MantleTier`, `HaggisBodyFrame`, `ApplyMantleTierArgs`, `RunScoreState.onKillsChanged` are defined once and imported thereafter).
