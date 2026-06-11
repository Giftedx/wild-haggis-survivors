import { describe, expect, it } from 'vitest';
import { createRNG } from '../../utils/rng';
import {
  chooseReliquaryCurio,
  chooseReliquarySpawnSec,
  computeReliquaryPlacement,
  RELIQUARY_CURIOS,
  RELIQUARY_EDGE_MARGIN_PX,
  RELIQUARY_MAX_SPAWN_DIST_PX,
  RELIQUARY_MIN_SPAWN_DIST_PX,
  RELIQUARY_SPAWN_MAX_SEC,
  RELIQUARY_SPAWN_MIN_SEC,
  shuffleCurios,
} from './reliquary';

describe('RELIQUARY_CURIOS', () => {
  it('has three curios covering pickup / crit / regen axes', () => {
    const ids = RELIQUARY_CURIOS.map((c) => c.id).sort();
    expect(ids).toEqual(['cairn_moss', 'echoing_reed', 'flint_charm']);
  });

  it('every curio ties a titleKey + descKey under ui.reliquary.*', () => {
    for (const c of RELIQUARY_CURIOS) {
      expect(c.titleKey).toMatch(/^ui\.reliquary\./);
      expect(c.descKey).toMatch(/^ui\.reliquary\./);
    }
  });
});

describe('chooseReliquarySpawnSec', () => {
  it('returns a value inside the spawn window', () => {
    const rng = createRNG(1);
    for (let i = 0; i < 64; i++) {
      const sec = chooseReliquarySpawnSec(rng);
      expect(sec).toBeGreaterThanOrEqual(RELIQUARY_SPAWN_MIN_SEC);
      expect(sec).toBeLessThanOrEqual(RELIQUARY_SPAWN_MAX_SEC);
    }
  });

  it('is deterministic under the same seed', () => {
    const a = chooseReliquarySpawnSec(createRNG(42));
    const b = chooseReliquarySpawnSec(createRNG(42));
    expect(a).toBe(b);
  });

  it('varies across seeds (not a constant)', () => {
    const seen = new Set<number>();
    for (let s = 1; s < 32; s++) {
      seen.add(chooseReliquarySpawnSec(createRNG(s)));
    }
    // Not strictly guaranteed but extremely likely with 32 seeds over a 361-value window.
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe('shuffleCurios', () => {
  it('returns a permutation of RELIQUARY_CURIOS', () => {
    const out = shuffleCurios(createRNG(7));
    expect(out.length).toBe(RELIQUARY_CURIOS.length);
    const outIds = out.map((c) => c.id).sort();
    const refIds = RELIQUARY_CURIOS.map((c) => c.id).sort();
    expect(outIds).toEqual(refIds);
  });

  it('does not mutate RELIQUARY_CURIOS', () => {
    const ref = RELIQUARY_CURIOS.map((c) => c.id);
    shuffleCurios(createRNG(11));
    expect(RELIQUARY_CURIOS.map((c) => c.id)).toEqual(ref);
  });
});

describe('chooseReliquaryCurio', () => {
  it('is deterministic under the same seed', () => {
    const a = chooseReliquaryCurio(createRNG(5));
    const b = chooseReliquaryCurio(createRNG(5));
    expect(a.id).toBe(b.id);
  });
});

describe('computeReliquaryPlacement', () => {
  const W = 4000;
  const H = 4000;

  it('returns a point inside the playable world margins', () => {
    const rng = createRNG(1);
    for (let i = 0; i < 32; i++) {
      const p = computeReliquaryPlacement(rng, W / 2, H / 2, W, H);
      expect(p.x).toBeGreaterThanOrEqual(RELIQUARY_EDGE_MARGIN_PX);
      expect(p.x).toBeLessThanOrEqual(W - RELIQUARY_EDGE_MARGIN_PX);
      expect(p.y).toBeGreaterThanOrEqual(RELIQUARY_EDGE_MARGIN_PX);
      expect(p.y).toBeLessThanOrEqual(H - RELIQUARY_EDGE_MARGIN_PX);
    }
  });

  it('typically keeps the relic at least MIN dist from the player (centre-of-world case)', () => {
    // At centre there is always room on all sides for the full radius shell,
    // so no clamp should pull us inside the min-dist band.
    const rng = createRNG(2);
    for (let i = 0; i < 32; i++) {
      const p = computeReliquaryPlacement(rng, W / 2, H / 2, W, H);
      const d = Math.hypot(p.x - W / 2, p.y - H / 2);
      expect(d).toBeGreaterThanOrEqual(RELIQUARY_MIN_SPAWN_DIST_PX - 0.01);
      expect(d).toBeLessThanOrEqual(RELIQUARY_MAX_SPAWN_DIST_PX + 0.01);
    }
  });

  it('clamps inside the world when the player hugs a corner', () => {
    // Near (0,0) most sampled angles place the point outside the world —
    // the clamp pulls it back, so resulting coords must still respect margins
    // and the min-distance may be violated (that is acceptable — better a
    // reachable relic than a stuck one).
    const rng = createRNG(3);
    for (let i = 0; i < 32; i++) {
      const p = computeReliquaryPlacement(rng, 50, 50, W, H);
      expect(p.x).toBeGreaterThanOrEqual(RELIQUARY_EDGE_MARGIN_PX);
      expect(p.y).toBeGreaterThanOrEqual(RELIQUARY_EDGE_MARGIN_PX);
    }
  });

  it('is deterministic for the same (seed, player, world)', () => {
    const a = computeReliquaryPlacement(createRNG(13), 1000, 1000, W, H);
    const b = computeReliquaryPlacement(createRNG(13), 1000, 1000, W, H);
    expect(a).toEqual(b);
  });
});
