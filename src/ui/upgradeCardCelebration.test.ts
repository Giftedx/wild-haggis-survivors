import { describe, it, expect } from 'vitest';
import {
  legendaryTrailSpec,
  resolveRarityPillPulseSpec,
} from './upgradeCardCelebration';

describe('legendaryTrailSpec', () => {
  const origin = { x: 400, y: 300 };
  const target = { x: 640, y: 700 };

  it('returns empty array when reduceParticles is on', () => {
    expect(legendaryTrailSpec(origin, target, 8, true)).toEqual([]);
  });

  it('returns the requested count when reduceParticles is off', () => {
    expect(legendaryTrailSpec(origin, target, 8, false)).toHaveLength(8);
    expect(legendaryTrailSpec(origin, target, 4, false)).toHaveLength(4);
  });

  it('each particle targets the same endpoint', () => {
    const specs = legendaryTrailSpec(origin, target, 8, false);
    for (const s of specs) {
      expect(s.endX).toBe(640);
      expect(s.endY).toBe(700);
    }
  });

  it('stagger delays increase monotonically from 0', () => {
    const specs = legendaryTrailSpec(origin, target, 8, false);
    expect(specs[0].delay).toBe(0);
    for (let i = 1; i < specs.length; i++) {
      expect(specs[i].delay).toBeGreaterThan(specs[i - 1].delay);
    }
  });

  it('start positions fan out around origin, not collapsed into a point', () => {
    const specs = legendaryTrailSpec(origin, target, 8, false);
    const uniqueXs = new Set(specs.map((s) => s.startX));
    expect(uniqueXs.size).toBeGreaterThan(1);
  });

  it('count 0 returns empty array', () => {
    expect(legendaryTrailSpec(origin, target, 0, false)).toEqual([]);
  });
});

describe('resolveRarityPillPulseSpec', () => {
  it('legendary returns a pulse spec', () => {
    const spec = resolveRarityPillPulseSpec('legendary');
    expect(spec).not.toBeNull();
    expect(spec!.alphaFrom).toBeLessThan(spec!.alphaTo);
    expect(spec!.duration).toBeGreaterThan(0);
  });

  it('rare returns null (no pulse)', () => {
    expect(resolveRarityPillPulseSpec('rare')).toBeNull();
  });

  it('uncommon returns null (no pulse)', () => {
    expect(resolveRarityPillPulseSpec('uncommon')).toBeNull();
  });

  it('common returns null (no pulse)', () => {
    expect(resolveRarityPillPulseSpec('common')).toBeNull();
  });
});
