import { describe, it, expect } from 'vitest';
import {
  HAZARD_ZONE_LAVA,
  HAZARD_ZONE_HEAL,
  type HazardZonePalette,
} from './hazardZonePalette';

describe('hazardZonePalette', () => {
  it('lava + heal are fully distinct (no shared colour or alpha)', () => {
    const fields: (keyof HazardZonePalette)[] = ['baseColor', 'baseAlpha', 'glowColor', 'glowAlpha'];
    for (const f of fields) {
      expect(HAZARD_ZONE_LAVA[f]).not.toBe(HAZARD_ZONE_HEAL[f]);
    }
  });

  it('lava base is more opaque than its glow (classic "under/over" pair)', () => {
    expect(HAZARD_ZONE_LAVA.baseAlpha).toBeGreaterThan(HAZARD_ZONE_LAVA.glowAlpha);
  });

  it('heal base is more opaque than its glow', () => {
    expect(HAZARD_ZONE_HEAL.baseAlpha).toBeGreaterThan(HAZARD_ZONE_HEAL.glowAlpha);
  });

  it('heal base is lower-alpha than lava base (danger is louder than comfort)', () => {
    expect(HAZARD_ZONE_HEAL.baseAlpha).toBeLessThan(HAZARD_ZONE_LAVA.baseAlpha);
  });
});
