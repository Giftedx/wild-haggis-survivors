import { describe, expect, it, vi } from 'vitest';
import { createRNG } from '../../utils/rng';
import {
  CAIRN_BOON_POOL,
  getCairnBoonById,
  pickCairnBoonOptions,
  type CairnBoonId,
} from './cairnStackingBoons';

describe('CAIRN_BOON_POOL integrity', () => {
  it('has exactly 5 boons', () => {
    expect(CAIRN_BOON_POOL).toHaveLength(5);
  });

  it('all boon ids are unique', () => {
    const ids = CAIRN_BOON_POOL.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all weights are positive', () => {
    for (const b of CAIRN_BOON_POOL) {
      expect(b.weight).toBeGreaterThan(0);
    }
  });

  it('all boons have non-empty i18n keys', () => {
    for (const b of CAIRN_BOON_POOL) {
      expect(b.nameKey.length).toBeGreaterThan(0);
      expect(b.descKey.length).toBeGreaterThan(0);
    }
  });

  it('known ids cover all five expected boons', () => {
    const ids = new Set(CAIRN_BOON_POOL.map((b) => b.id));
    const expected: CairnBoonId[] = [
      'full_mend', 'moor_sweep', 'stone_vigour', 'cairn_ward', 'glacial_calm',
    ];
    for (const id of expected) expect(ids.has(id)).toBe(true);
  });
});

describe('pickCairnBoonOptions', () => {
  it('returns exactly count boons', () => {
    const rng = createRNG(42);
    const result = pickCairnBoonOptions(rng, 3);
    expect(result).toHaveLength(3);
  });

  it('never returns duplicates in one draw', () => {
    for (let seed = 0; seed < 200; seed++) {
      const rng = createRNG(seed);
      const result = pickCairnBoonOptions(rng, 3);
      const ids = result.map((b) => b.id);
      expect(new Set(ids).size).toBe(3);
    }
  });

  it('returns full pool when count >= pool size', () => {
    const rng = createRNG(0);
    const result = pickCairnBoonOptions(rng, 99);
    expect(result).toHaveLength(CAIRN_BOON_POOL.length);
  });

  it('all picks are from the pool', () => {
    const ids = new Set(CAIRN_BOON_POOL.map((b) => b.id));
    for (let seed = 0; seed < 100; seed++) {
      for (const b of pickCairnBoonOptions(createRNG(seed), 3)) {
        expect(ids.has(b.id)).toBe(true);
      }
    }
  });

  it('over many seeds, all 5 boons appear at least once in draws of 3', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 500; seed++) {
      for (const b of pickCairnBoonOptions(createRNG(seed), 3)) seen.add(b.id);
    }
    expect(seen.size).toBe(5);
  });
});

describe('getCairnBoonById', () => {
  it('returns the correct def for each known id', () => {
    const ids: CairnBoonId[] = ['full_mend', 'moor_sweep', 'stone_vigour', 'cairn_ward', 'glacial_calm'];
    for (const id of ids) {
      const def = getCairnBoonById(id);
      expect(def.id).toBe(id);
    }
  });

  it('throws for unknown id', () => {
    expect(() => getCairnBoonById('unknown_boon' as CairnBoonId)).toThrow();
  });
});

describe('boon effects (stubbed Player)', () => {
  function makePlayer() {
    return {
      heal: vi.fn(),
      getMaxHp: vi.fn().mockReturnValue(100),
      grantMoorMomentMagnet: vi.fn(),
      addMaxHp: vi.fn(),
      addDamageMultiplier: vi.fn(),
      addCooldownReduction: vi.fn(),
    };
  }

  it('full_mend heals to max HP', () => {
    const p = makePlayer();
    getCairnBoonById('full_mend').effect(p as never, null);
    expect(p.heal).toHaveBeenCalledWith(100);
  });

  it('moor_sweep grants magnet 80px for 8s', () => {
    const p = makePlayer();
    getCairnBoonById('moor_sweep').effect(p as never, null);
    expect(p.grantMoorMomentMagnet).toHaveBeenCalledWith(80, 8000);
  });

  it('stone_vigour adds 20 max HP and heals 20', () => {
    const p = makePlayer();
    getCairnBoonById('stone_vigour').effect(p as never, null);
    expect(p.addMaxHp).toHaveBeenCalledWith(20);
    expect(p.heal).toHaveBeenCalledWith(20);
  });

  it('cairn_ward adds 12% damage multiplier', () => {
    const p = makePlayer();
    getCairnBoonById('cairn_ward').effect(p as never, null);
    expect(p.addDamageMultiplier).toHaveBeenCalledWith(0.12);
  });

  it('glacial_calm adds 15% cooldown reduction', () => {
    const p = makePlayer();
    getCairnBoonById('glacial_calm').effect(p as never, null);
    expect(p.addCooldownReduction).toHaveBeenCalledWith(0.15);
  });
});
