import { describe, expect, it } from 'vitest';
import {
  STONE_BOONS,
  STONE_PICK_RADIUS_PX,
  STONE_SPAWN_RADIUS_PX,
  STONE_SPAWN_SEC,
  applyStoneBoon,
  nearestStoneIndex,
  shuffleBoons,
  stonePositions,
  type StoneBoon,
} from './standingStones';
import { createRNG } from '../../utils/rng';
import { t } from '../../core/i18n';

describe('Standing Stones — constants', () => {
  it('spawns at 5:00 into a run', () => {
    expect(STONE_SPAWN_SEC).toBe(300);
  });

  it('has three boons in the pool', () => {
    expect(STONE_BOONS).toHaveLength(3);
  });

  it('pick radius is smaller than spawn radius (player has to travel)', () => {
    expect(STONE_PICK_RADIUS_PX).toBeLessThan(STONE_SPAWN_RADIUS_PX);
  });

  it('every boon has a resolvable title + description', () => {
    for (const b of STONE_BOONS) {
      expect(t(b.titleKey)).not.toBe(b.titleKey);
      expect(t(b.descKey)).not.toBe(b.descKey);
    }
  });
});

describe('stonePositions', () => {
  it('places three stones around the player at SPAWN_RADIUS distance', () => {
    const positions = stonePositions(0, 0);
    expect(positions).toHaveLength(3);
    for (const p of positions) {
      const d = Math.hypot(p.x, p.y);
      expect(d).toBeCloseTo(STONE_SPAWN_RADIUS_PX);
    }
  });

  it('three stones are equilateral (~120° apart)', () => {
    const positions = stonePositions(100, 100);
    const angleFromCenter = (p: { x: number; y: number }) =>
      Math.atan2(p.y - 100, p.x - 100);
    const angles = positions.map(angleFromCenter).sort((a, b) => a - b);
    const gap01 = angles[1]! - angles[0]!;
    const gap12 = angles[2]! - angles[1]!;
    expect(gap01).toBeCloseTo(gap12);
    expect(gap01).toBeCloseTo((2 * Math.PI) / 3, 2);
  });

  it('starts with the top stone (angle -π/2)', () => {
    const positions = stonePositions(0, 0);
    expect(positions[0]?.y).toBeCloseTo(-STONE_SPAWN_RADIUS_PX);
    expect(positions[0]?.x).toBeCloseTo(0);
  });
});

describe('nearestStoneIndex', () => {
  const stones = [
    { x: 0, y: -100 },
    { x: 87, y: 50 },
    { x: -87, y: 50 },
  ];

  it('returns -1 when no stone is within pick radius', () => {
    expect(nearestStoneIndex(stones, 0, 0, 30)).toBe(-1);
  });

  it('returns the index of the stone the player overlaps', () => {
    expect(nearestStoneIndex(stones, 0, -100, 10)).toBe(0);
    expect(nearestStoneIndex(stones, 87, 50, 10)).toBe(1);
    expect(nearestStoneIndex(stones, -87, 50, 10)).toBe(2);
  });

  it('defaults to STONE_PICK_RADIUS_PX when not passed', () => {
    // 30px away from stone 0, within default 40px radius
    expect(nearestStoneIndex(stones, 10, -110, undefined)).toBe(0);
  });

  it('lower index wins when two stones overlap (rare, stones are spaced)', () => {
    const overlapping = [{ x: 0, y: 0 }, { x: 5, y: 0 }];
    expect(nearestStoneIndex(overlapping, 0, 0, 20)).toBe(0);
  });

  it('tolerates null/undefined slots in the stones array', () => {
    const sparse = [
      { x: 0, y: -100 },
      null as unknown as { x: number; y: number },
      { x: -87, y: 50 },
    ];
    expect(nearestStoneIndex(sparse, -87, 50, 10)).toBe(2);
  });
});

describe('shuffleBoons', () => {
  it('returns all three boons (no drops, no duplicates)', () => {
    const rng = createRNG(42);
    const shuffled = shuffleBoons(rng);
    expect(shuffled).toHaveLength(3);
    const ids = new Set(shuffled.map((b) => b.id));
    expect(ids.size).toBe(3);
  });

  it('is deterministic for a given RNG seed', () => {
    const a = shuffleBoons(createRNG(42));
    const b = shuffleBoons(createRNG(42));
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
  });

  it('different seeds produce different orders (usually)', () => {
    const a = shuffleBoons(createRNG(1)).map((x) => x.id);
    // 1 in 6 chance of collision per seed, so we iterate until we find
    // a different shuffle to prove non-constant output.
    let different = false;
    for (let seed = 2; seed < 50; seed++) {
      const c = shuffleBoons(createRNG(seed)).map((x) => x.id);
      if (c.join(',') !== a.join(',')) {
        different = true;
        break;
      }
    }
    expect(different, 'shuffleBoons appears constant across seeds').toBe(true);
  });
});

describe('applyStoneBoon', () => {
  // Fake Player: just record which addX calls fired + with what amount.
  type FakePlayer = ReturnType<typeof makeFake>;
  function makeFake() {
    return {
      hpRegen: 0,
      critChance: 0,
      cdr: 0,
      addHpRegen(amount: number) {
        this.hpRegen += amount;
      },
      addCritChance(amount: number) {
        this.critChance += amount;
      },
      addCooldownReduction(amount: number) {
        this.cdr += amount;
      },
    };
  }

  const boonById = (id: StoneBoon['id']) => STONE_BOONS.find((b) => b.id === id)!;

  it('mending adds HP regen (not crit, not cdr)', () => {
    const p = makeFake() as unknown as FakePlayer;
    applyStoneBoon(p as never, boonById('mending'));
    expect(p.hpRegen).toBeGreaterThan(0);
    expect(p.critChance).toBe(0);
    expect(p.cdr).toBe(0);
  });

  it('fire adds crit chance (not regen, not cdr)', () => {
    const p = makeFake() as unknown as FakePlayer;
    applyStoneBoon(p as never, boonById('fire'));
    expect(p.critChance).toBeGreaterThan(0);
    expect(p.hpRegen).toBe(0);
    expect(p.cdr).toBe(0);
  });

  it('haste adds cooldown reduction (not regen, not crit)', () => {
    const p = makeFake() as unknown as FakePlayer;
    applyStoneBoon(p as never, boonById('haste'));
    expect(p.cdr).toBeGreaterThan(0);
    expect(p.hpRegen).toBe(0);
    expect(p.critChance).toBe(0);
  });
});
