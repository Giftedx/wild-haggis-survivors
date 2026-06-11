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

  it.each<MantleTier>([1, 2])(
    'draws at least one primitive for tier %i across every variant',
    (tier) => {
      for (const variant of VARIANTS) {
        const g = makeGraphicsStub();
        drawMantleTier(g as unknown as Phaser.GameObjects.Graphics, variant, tier);
        expect(totalPrimitiveCalls(g), `tier ${tier} / ${variant.key}`).toBeGreaterThanOrEqual(1);
      }
    },
  );

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
