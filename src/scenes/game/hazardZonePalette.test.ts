import { describe, it, expect } from 'vitest';
import {
  HAZARD_ZONE_LAVA,
  HAZARD_ZONE_HEAL,
  HAZARD_ZONE_SLICK,
  HAZARD_ZONE_FOG,
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

  it('slick is distinct from lava + heal (no shared base colour)', () => {
    expect(HAZARD_ZONE_SLICK.baseColor).not.toBe(HAZARD_ZONE_LAVA.baseColor);
    expect(HAZARD_ZONE_SLICK.baseColor).not.toBe(HAZARD_ZONE_HEAL.baseColor);
  });

  it('slick base is more opaque than its glow (consistent with lava / heal)', () => {
    expect(HAZARD_ZONE_SLICK.baseAlpha).toBeGreaterThan(HAZARD_ZONE_SLICK.glowAlpha);
  });

  it('fog is distinct from lava / heal / slick', () => {
    expect(HAZARD_ZONE_FOG.baseColor).not.toBe(HAZARD_ZONE_LAVA.baseColor);
    expect(HAZARD_ZONE_FOG.baseColor).not.toBe(HAZARD_ZONE_HEAL.baseColor);
    expect(HAZARD_ZONE_FOG.baseColor).not.toBe(HAZARD_ZONE_SLICK.baseColor);
  });

  it('fog base is more opaque than its glow', () => {
    expect(HAZARD_ZONE_FOG.baseAlpha).toBeGreaterThan(HAZARD_ZONE_FOG.glowAlpha);
  });
});
