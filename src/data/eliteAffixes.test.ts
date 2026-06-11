import { describe, expect, it } from 'vitest';
import { createRNG } from '../utils/rng';
import type { EnemyBehavior } from './enemies';
import { ELITE_AFFIX_DISPLAY_ORDER, pickEliteAffixId } from './eliteAffixes';

describe('ELITE_AFFIX_DISPLAY_ORDER', () => {
  it('lists all five affix ids in a stable order', () => {
    expect(ELITE_AFFIX_DISPLAY_ORDER).toHaveLength(5);
    expect(new Set(ELITE_AFFIX_DISPLAY_ORDER).size).toBe(5);
  });
});

describe('pickEliteAffixId', () => {
  const volatileBanned: EnemyBehavior[] = ['dive', 'hazard', 'spawner'];

  it('never rolls volatile for dive, hazard, or spawner (many seeds)', () => {
    for (let seed = 0; seed < 500; seed++) {
      const rng = createRNG(seed);
      for (const b of volatileBanned) {
        expect(pickEliteAffixId(b, rng)).not.toBe('volatile');
      }
    }
  });

  it('returns a non-null affix for standard chase behaviour', () => {
    const rng = createRNG(0xbeef);
    for (let i = 0; i < 50; i++) {
      const id = pickEliteAffixId('chase', rng);
      expect(id).not.toBeNull();
    }
  });

  it('per-enemy denylist excludes the listed affix (beithir volatile case)', () => {
    for (let seed = 0; seed < 500; seed++) {
      const rng = createRNG(seed);
      expect(pickEliteAffixId('ranged', rng, ['volatile'])).not.toBe('volatile');
    }
  });

  it('beithir denylist blocks volatile AND bulwark — kill-cure path stays viable', () => {
    const beithirDenylist = ['volatile', 'bulwark'] as const;
    const seen = new Set<string>();
    for (let seed = 0; seed < 2000; seed++) {
      const id = pickEliteAffixId('ranged', createRNG(seed), [...beithirDenylist]);
      if (id) seen.add(id);
    }
    expect(seen.has('volatile')).toBe(false);
    expect(seen.has('bulwark')).toBe(false);
    // Swift, relentless, wealthy remain eligible.
    expect(seen.has('swift')).toBe(true);
    expect(seen.has('relentless')).toBe(true);
    expect(seen.has('wealthy')).toBe(true);
  });

  it('denylist does not affect other affixes', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 2000; seed++) {
      const id = pickEliteAffixId('ranged', createRNG(seed), ['volatile']);
      if (id) seen.add(id);
    }
    expect(seen.has('swift')).toBe(true);
    expect(seen.has('bulwark')).toBe(true);
    expect(seen.has('wealthy')).toBe(true);
    expect(seen.has('volatile')).toBe(false);
  });

  it('empty denylist behaves as no denylist', () => {
    const rng = createRNG(0x1234);
    const id = pickEliteAffixId('chase', rng, []);
    expect(id).not.toBeNull();
  });
});
