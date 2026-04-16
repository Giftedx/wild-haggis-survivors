import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TRAIL_COLORS,
  EVOLVED_TRAIL_COLORS,
  WEAPON_TRAIL_COLORS,
  pickTrailColor,
} from './weaponTrailColors';

describe('weaponTrailColors', () => {
  it('returns an evolved palette when evolved=true regardless of weapon key', () => {
    const c = pickTrailColor('thistle_shot', true, 0);
    expect(EVOLVED_TRAIL_COLORS).toContain(c);
  });

  it('returns the weapon-specific palette when known and not evolved', () => {
    const c = pickTrailColor('caber_toss', false, 0);
    expect(WEAPON_TRAIL_COLORS.caber_toss).toContain(c);
  });

  it('falls back to DEFAULT_TRAIL_COLORS for unknown weapons', () => {
    const c = pickTrailColor('no_such_weapon', false, 0);
    expect(DEFAULT_TRAIL_COLORS).toContain(c);
  });

  it('clamps indices when the random unit is at the upper bound (1.0)', () => {
    // At u=1, floor(1 * length) == length, which is out-of-bounds without clamping.
    const c = pickTrailColor('thistle_shot', false, 1);
    expect(c).toBe(WEAPON_TRAIL_COLORS.thistle_shot[WEAPON_TRAIL_COLORS.thistle_shot.length - 1]);
  });

  it('handles negative random-unit inputs by clamping to 0', () => {
    const c = pickTrailColor('thistle_shot', false, -0.5);
    expect(c).toBe(WEAPON_TRAIL_COLORS.thistle_shot[0]);
  });
});
