import { describe, expect, it } from 'vitest';
import { createRNG, dailyChallengeSeed } from '../../utils/rng';
import {
  computeExtraHealingPlacement,
  computeHazardPlacements,
} from './hazardPlacement';

const WORLD_W = 2000;
const WORLD_H = 2000;

describe('computeHazardPlacements', () => {
  it('produces 4 lava + 3 heal zones', () => {
    const rng = createRNG(42);
    const placements = computeHazardPlacements(rng, WORLD_W, WORLD_H);
    expect(placements.lava).toHaveLength(4);
    expect(placements.heal).toHaveLength(3);
  });

  it('every zone respects the 200px edge inset', () => {
    const rng = createRNG(1234);
    const placements = computeHazardPlacements(rng, WORLD_W, WORLD_H);
    for (const z of [...placements.lava, ...placements.heal]) {
      expect(z.x).toBeGreaterThanOrEqual(200);
      expect(z.x).toBeLessThanOrEqual(WORLD_W - 200);
      expect(z.y).toBeGreaterThanOrEqual(200);
      expect(z.y).toBeLessThanOrEqual(WORLD_H - 200);
    }
  });

  it('lava radii fall in [35, 55], heal radii in [30, 45]', () => {
    const rng = createRNG(7);
    const placements = computeHazardPlacements(rng, WORLD_W, WORLD_H);
    for (const z of placements.lava) {
      expect(z.r).toBeGreaterThanOrEqual(35);
      expect(z.r).toBeLessThanOrEqual(55);
    }
    for (const z of placements.heal) {
      expect(z.r).toBeGreaterThanOrEqual(30);
      expect(z.r).toBeLessThanOrEqual(45);
    }
  });

  it('same seed produces identical placements (determinism)', () => {
    const a = computeHazardPlacements(createRNG(9999), WORLD_W, WORLD_H);
    const b = computeHazardPlacements(createRNG(9999), WORLD_W, WORLD_H);
    expect(b).toEqual(a);
  });

  it('different seeds produce different placements (seed is load-bearing)', () => {
    const a = computeHazardPlacements(createRNG(1), WORLD_W, WORLD_H);
    const b = computeHazardPlacements(createRNG(2), WORLD_W, WORLD_H);
    expect(b).not.toEqual(a);
  });

  it('daily-challenge seed is deterministic across two calls', () => {
    const dateIso = new Date('2026-04-17T00:00:00Z');
    const seedA = dailyChallengeSeed(dateIso);
    const seedB = dailyChallengeSeed(dateIso);
    expect(seedA).toBe(seedB);
    const a = computeHazardPlacements(createRNG(seedA), WORLD_W, WORLD_H);
    const b = computeHazardPlacements(createRNG(seedB), WORLD_W, WORLD_H);
    expect(b).toEqual(a);
  });
});

describe('computeExtraHealingPlacement', () => {
  it('falls within edge inset and heal radius range', () => {
    const placement = computeExtraHealingPlacement(createRNG(5), WORLD_W, WORLD_H);
    expect(placement.x).toBeGreaterThanOrEqual(200);
    expect(placement.x).toBeLessThanOrEqual(WORLD_W - 200);
    expect(placement.y).toBeGreaterThanOrEqual(200);
    expect(placement.y).toBeLessThanOrEqual(WORLD_H - 200);
    expect(placement.r).toBeGreaterThanOrEqual(30);
    expect(placement.r).toBeLessThanOrEqual(45);
    expect(placement.tweenJitterMs).toBeGreaterThanOrEqual(0);
    expect(placement.tweenJitterMs).toBeLessThanOrEqual(1000);
  });

  it('advances the RNG stream (two draws differ)', () => {
    const rng = createRNG(77);
    const first = computeExtraHealingPlacement(rng, WORLD_W, WORLD_H);
    const second = computeExtraHealingPlacement(rng, WORLD_W, WORLD_H);
    expect(second).not.toEqual(first);
  });
});
