import { describe, it, expect } from 'vitest';
import {
  captureComposedStats,
  isComposedStatsSnapshot,
} from './composedStatsSnapshot';
import type { ComposedPlayerStats } from '../core/StatComposer';
import { BALANCE } from '../core/BalanceConfig';

const fullStats: ComposedPlayerStats = {
  ...BALANCE.player,
  speed: 200,
  maxHp: 120,
  driftDegrees: 11,
  pickupRadius: 110,
  damagePctBonus: 0.15,
  hpRegen: 0.2,
  critBonus: 0.05,
  cooldownReduction: 0.08,
  xpGainBonus: 0.05,
  armorBonus: 2,
  dashCooldownReduction: 0.10,
};

describe('composedStatsSnapshot', () => {
  it('captureComposedStats copies every whitelisted field', () => {
    const snap = captureComposedStats(fullStats);
    expect(snap.speed).toBe(200);
    expect(snap.maxHp).toBe(120);
    expect(snap.driftDegrees).toBe(11);
    expect(snap.pickupRadius).toBe(110);
    expect(snap.damagePctBonus).toBeCloseTo(0.15);
    expect(snap.hpRegen).toBeCloseTo(0.2);
    expect(snap.critBonus).toBeCloseTo(0.05);
    expect(snap.cooldownReduction).toBeCloseTo(0.08);
    expect(snap.xpGainBonus).toBeCloseTo(0.05);
    expect(snap.armorBonus).toBe(2);
    expect(snap.dashCooldownReduction).toBeCloseTo(0.10);
  });

  it('captureComposedStats produces an independent copy', () => {
    const snap = captureComposedStats(fullStats);
    fullStats.speed = 99999;
    expect(snap.speed).toBe(200);
    fullStats.speed = 200; // restore so downstream tests keep a valid fixture
  });

  it('captureComposedStats drops BALANCE.player fields — snapshot is Pick<>-shaped only', () => {
    const snap = captureComposedStats(fullStats);
    expect('dashCooldownMs' in snap).toBe(false);
    expect('shieldCooldownMs' in snap).toBe(false);
    expect('baseHitboxRadius' in snap).toBe(false);
  });

  it('isComposedStatsSnapshot accepts a correctly shaped value', () => {
    const snap = captureComposedStats(fullStats);
    expect(isComposedStatsSnapshot(snap)).toBe(true);
  });

  it('isComposedStatsSnapshot rejects missing fields', () => {
    const snap = captureComposedStats(fullStats) as Record<string, unknown>;
    delete snap.speed;
    expect(isComposedStatsSnapshot(snap)).toBe(false);
  });

  it('isComposedStatsSnapshot rejects non-finite numbers', () => {
    const snap: Record<string, unknown> = { ...captureComposedStats(fullStats), speed: NaN };
    expect(isComposedStatsSnapshot(snap)).toBe(false);
    snap.speed = Infinity;
    expect(isComposedStatsSnapshot(snap)).toBe(false);
  });

  it('isComposedStatsSnapshot rejects null, primitives, arrays', () => {
    expect(isComposedStatsSnapshot(null)).toBe(false);
    expect(isComposedStatsSnapshot(42)).toBe(false);
    expect(isComposedStatsSnapshot('x')).toBe(false);
    expect(isComposedStatsSnapshot([])).toBe(false);
  });
});
