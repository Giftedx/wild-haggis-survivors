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
});
