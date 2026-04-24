import { describe, expect, it } from 'vitest';
import { computeDroveSlots } from './drove';
import { VARIANTS } from '../../../data/variants';

const region = { x: 0, y: 0, w: 400, h: 80 };

describe('computeDroveSlots', () => {
  it('returns one slot per variant (selected view always covers full roster)', () => {
    const slots = computeDroveSlots(region, [], 'classic');
    expect(slots.length).toBe(VARIANTS.length);
  });

  it('marks unlocked-set membership correctly', () => {
    const slots = computeDroveSlots(region, ['classic', 'moor_runner'], 'classic');
    expect(slots.find((s) => s.variant.key === 'classic')!.unlocked).toBe(true);
    expect(slots.find((s) => s.variant.key === 'moor_runner')!.unlocked).toBe(true);
    expect(slots.find((s) => s.variant.key === 'iron_belly')!.unlocked).toBe(false);
  });

  it('flags the currently-selected variant in exactly one slot', () => {
    const slots = computeDroveSlots(region, ['classic', 'iron_belly'], 'iron_belly');
    const selected = slots.filter((s) => s.selected);
    expect(selected.length).toBe(1);
    expect(selected[0].variant.key).toBe('iron_belly');
  });

  it('slots flow left-to-right, x strictly increasing', () => {
    const slots = computeDroveSlots(region, [], 'classic');
    for (let i = 1; i < slots.length; i++) {
      expect(slots[i].x).toBeGreaterThan(slots[i - 1].x);
    }
  });

  it('slots sit on the sill (y below region centre)', () => {
    const slots = computeDroveSlots(region, [], 'classic');
    for (const s of slots) {
      expect(s.y).toBeGreaterThan(region.y + region.h / 2);
    }
  });
});
