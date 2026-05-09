import { describe, it, expect } from 'vitest';
import { createRNG } from '../utils/rng';
import {
  CLOOTIE_BOONS,
  CLOOTIE_EDGE_MARGIN_PX,
  CLOOTIE_HP_COST_FRACTION,
  CLOOTIE_HP_COST_MIN,
  CLOOTIE_MAX_SPAWN_DIST_PX,
  CLOOTIE_MIN_SPAWN_DIST_PX,
  CLOOTIE_PICK_RADIUS_PX,
  CLOOTIE_SPAWN_MAX_SEC,
  CLOOTIE_SPAWN_MIN_SEC,
  chooseClootieBoon,
  chooseClootieSpawnSec,
  computeClootiePlacement,
  computeWagerHpCost,
  shuffleClootieBoons,
  type ClootieBoonId,
} from './clootieRagWager';

describe('clootieRagWager', () => {
  describe('boon catalogue', () => {
    it('exposes the three rolled boons', () => {
      const ids = CLOOTIE_BOONS.map((b) => b.id).sort();
      expect(ids).toEqual(['haste', 'patience', 'wrath']);
    });

    it('every boon has title + desc i18n keys', () => {
      for (const b of CLOOTIE_BOONS) {
        expect(b.titleKey).toMatch(/^ui\.clootie\./);
        expect(b.descKey).toMatch(/^ui\.clootie\./);
      }
    });
  });

  describe('chooseClootieSpawnSec', () => {
    it('returns an integer inside the spawn window', () => {
      const rng = createRNG(0xc100711e);
      for (let i = 0; i < 50; i++) {
        const sec = chooseClootieSpawnSec(rng);
        expect(Number.isInteger(sec)).toBe(true);
        expect(sec).toBeGreaterThanOrEqual(CLOOTIE_SPAWN_MIN_SEC);
        expect(sec).toBeLessThanOrEqual(CLOOTIE_SPAWN_MAX_SEC);
      }
    });

    it('window sits between standing-stones and reliquary mid-window', () => {
      // Routing intent — a single run can still chase reliquary (6:00–
      // 12:00) without colliding on the same minute.
      expect(CLOOTIE_SPAWN_MIN_SEC).toBeGreaterThanOrEqual(240);
      expect(CLOOTIE_SPAWN_MAX_SEC).toBeLessThanOrEqual(540);
    });
  });

  describe('shuffleClootieBoons / chooseClootieBoon', () => {
    it('shuffle returns all members exactly once', () => {
      const rng = createRNG(42);
      const out = shuffleClootieBoons(rng);
      expect(out).toHaveLength(CLOOTIE_BOONS.length);
      const ids = new Set(out.map((b) => b.id));
      expect(ids.size).toBe(CLOOTIE_BOONS.length);
    });

    it('same seed → same boon (replay determinism)', () => {
      const a = chooseClootieBoon(createRNG('seed-alpha'));
      const b = chooseClootieBoon(createRNG('seed-alpha'));
      expect(a.id).toBe(b.id);
    });

    it('different seeds eventually pick different first-boons', () => {
      // Sample many seeds — at least two distinct first-boon ids should
      // appear. Three boons over many seeds, collision improbable.
      const seen = new Set<ClootieBoonId>();
      for (let s = 0; s < 64; s++) {
        seen.add(chooseClootieBoon(createRNG(s)).id);
        if (seen.size >= 2) break;
      }
      expect(seen.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('computeWagerHpCost', () => {
    it('floors at the configured minimum for very low base HP', () => {
      expect(computeWagerHpCost(0)).toBe(CLOOTIE_HP_COST_MIN);
      expect(computeWagerHpCost(10)).toBe(CLOOTIE_HP_COST_MIN);
      // Anything where 12% < min still floors.
      expect(computeWagerHpCost(40)).toBe(CLOOTIE_HP_COST_MIN);
    });

    it('uses the configured fraction once base HP clears the floor', () => {
      // 100 * 0.12 = 12 — clears the 5-floor.
      expect(computeWagerHpCost(100)).toBe(12);
      // 150 * 0.12 = 18.
      expect(computeWagerHpCost(150)).toBe(18);
      // 75 * 0.12 = 9 — still clears the floor.
      expect(computeWagerHpCost(75)).toBe(9);
    });

    it('returns an integer (floor of the product)', () => {
      // 83 * 0.12 = 9.96 → floor 9.
      expect(computeWagerHpCost(83)).toBe(9);
    });

    it('matches the documented fraction at canonical breakpoints', () => {
      // Sanity that the constant is what we expect — guards against
      // a future refactor sliding the cost without intent.
      expect(CLOOTIE_HP_COST_FRACTION).toBeCloseTo(0.12, 5);
    });
  });

  describe('computeClootiePlacement', () => {
    it('respects min/max distance from the player when world is large', () => {
      const rng = createRNG(7);
      const px = 5000, py = 5000;
      const W = 10_000, H = 10_000;
      for (let i = 0; i < 50; i++) {
        const p = computeClootiePlacement(rng, px, py, W, H);
        const dx = p.x - px, dy = p.y - py;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Sample-by-sample tolerance — the placement uses [min, max)
        // float draws so the exact bound is approached but never the
        // "max" upper. Allow a tiny epsilon.
        expect(dist).toBeGreaterThanOrEqual(CLOOTIE_MIN_SPAWN_DIST_PX - 1e-6);
        expect(dist).toBeLessThanOrEqual(CLOOTIE_MAX_SPAWN_DIST_PX + 1e-6);
      }
    });

    it('clamps the result inside the world margins', () => {
      const rng = createRNG(123);
      // World barely larger than the spawn ring — clamping must kick in.
      const W = 800, H = 600;
      const px = 100, py = 100;
      for (let i = 0; i < 20; i++) {
        const p = computeClootiePlacement(rng, px, py, W, H);
        expect(p.x).toBeGreaterThanOrEqual(CLOOTIE_EDGE_MARGIN_PX);
        expect(p.x).toBeLessThanOrEqual(W - CLOOTIE_EDGE_MARGIN_PX);
        expect(p.y).toBeGreaterThanOrEqual(CLOOTIE_EDGE_MARGIN_PX);
        expect(p.y).toBeLessThanOrEqual(H - CLOOTIE_EDGE_MARGIN_PX);
      }
    });

    it('same seed → same placement (replay determinism)', () => {
      const a = computeClootiePlacement(createRNG('alpha'), 1000, 1000, 8000, 8000);
      const b = computeClootiePlacement(createRNG('alpha'), 1000, 1000, 8000, 8000);
      expect(a.x).toBe(b.x);
      expect(a.y).toBe(b.y);
    });
  });

  describe('contract', () => {
    it('pick radius is positive', () => {
      expect(CLOOTIE_PICK_RADIUS_PX).toBeGreaterThan(0);
    });

    it('spawn distance band is positive and ordered', () => {
      expect(CLOOTIE_MIN_SPAWN_DIST_PX).toBeGreaterThan(0);
      expect(CLOOTIE_MAX_SPAWN_DIST_PX).toBeGreaterThan(CLOOTIE_MIN_SPAWN_DIST_PX);
    });

    it('cost minimum is at least 1 HP — floor never zeros the cost', () => {
      expect(CLOOTIE_HP_COST_MIN).toBeGreaterThanOrEqual(1);
    });
  });
});
