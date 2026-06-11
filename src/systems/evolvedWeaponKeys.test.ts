/**
 * Pure-helper guard for the trail-spawn evolved-weapon lookup that
 * `WeaponSystem.update()` runs once per N frames. Without the cache,
 * each active projectile's trail emit ran an O(weapons) `Array.some`
 * with a fresh closure — measurable per-frame allocation cost on
 * runs with many projectiles. The helper builds a Set<string> once
 * per trail tick; trail emits then do an O(1) `has()` against it.
 */
import { describe, it, expect } from 'vitest';
import { populateEvolvedKeys } from './evolvedWeaponKeys';

describe('populateEvolvedKeys', () => {
  it('produces empty set when no weapons are present', () => {
    const out = new Set<string>();
    populateEvolvedKeys([], out);
    expect(out.size).toBe(0);
  });

  it('adds only weapons whose evolved flag is true', () => {
    const out = new Set<string>();
    populateEvolvedKeys(
      [
        { evolved: false, config: { key: 'thistle_shot' } },
        { evolved: true, config: { key: 'caber_toss' } },
        { evolved: true, config: { key: 'haggis_hurler' } },
      ],
      out,
    );
    expect(out.size).toBe(2);
    expect(out.has('caber_toss')).toBe(true);
    expect(out.has('haggis_hurler')).toBe(true);
    expect(out.has('thistle_shot')).toBe(false);
  });

  it('clears stale contents before re-populating', () => {
    // Long-lived scratch Set: the WeaponSystem allocates one and
    // re-uses it every trail tick. The helper must wipe stale keys
    // from the prior tick before adding the new generation.
    const out = new Set(['stale_a', 'stale_b']);
    populateEvolvedKeys(
      [{ evolved: true, config: { key: 'fresh' } }],
      out,
    );
    expect(out.size).toBe(1);
    expect(out.has('fresh')).toBe(true);
    expect(out.has('stale_a')).toBe(false);
    expect(out.has('stale_b')).toBe(false);
  });
});
