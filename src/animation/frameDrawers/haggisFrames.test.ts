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
