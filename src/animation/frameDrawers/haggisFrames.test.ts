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
      lineStyle: vi.fn().mockReturnThis(),
      strokeCircle: vi.fn().mockReturnThis(),
      beginPath: vi.fn().mockReturnThis(),
      strokePath: vi.fn().mockReturnThis(),
      arc: vi.fn().mockReturnThis(),
      lineBetween: vi.fn().mockReturnThis(),
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
