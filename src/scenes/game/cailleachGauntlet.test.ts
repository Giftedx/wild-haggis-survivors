import { describe, expect, it } from 'vitest';
import {
  advanceGauntlet,
  computeCandleRing,
  initialGauntletState,
  GAUNTLET_CANDLE_TIME_MS,
  GAUNTLET_BOSS_TIME_MS,
  GAUNTLET_CANDLE_RING_RADIUS_PX,
  type CailleachGauntletState,
} from './cailleachGauntlet';

describe('advanceGauntlet — phase transitions', () => {
  it('starts idle', () => {
    const s = initialGauntletState();
    expect(s.phase).toBe('idle');
    expect(s.touchedSavedAts).toEqual([]);
  });

  it('arms when touch count crosses threshold (pre-candle-time)', () => {
    let s = initialGauntletState();
    const touched = [1, 2, 3, 4, 5, 6, 7];
    s = advanceGauntlet(s, { gameTimeMs: 5 * 60_000, touchedSavedAts: touched, playerX: 0, playerY: 0, bossDead: false, playerDead: false });
    expect(s.phase).toBe('armed');
    expect(s.touchedSavedAts).toEqual(touched);
    expect(s.armedAtMs).toBe(5 * 60_000);
  });

  it('stays idle below threshold', () => {
    let s = initialGauntletState();
    s = advanceGauntlet(s, { gameTimeMs: 5 * 60_000, touchedSavedAts: [1, 2, 3, 4, 5, 6], playerX: 0, playerY: 0, bossDead: false, playerDead: false });
    expect(s.phase).toBe('idle');
  });

  it('lights candles at 14:00 when armed', () => {
    let s = initialGauntletState();
    const touched = [1, 2, 3, 4, 5, 6, 7];
    s = advanceGauntlet(s, { gameTimeMs: 5 * 60_000, touchedSavedAts: touched, playerX: 100, playerY: 100, bossDead: false, playerDead: false });
    s = advanceGauntlet(s, { gameTimeMs: GAUNTLET_CANDLE_TIME_MS, touchedSavedAts: touched, playerX: 200, playerY: 300, bossDead: false, playerDead: false });
    expect(s.phase).toBe('candles_lit');
    expect(s.candleLightAtMs).toBe(GAUNTLET_CANDLE_TIME_MS);
    expect(s.candleRing).toHaveLength(7);
    expect(s.candleRing[0].x).toBeCloseTo(200 + GAUNTLET_CANDLE_RING_RADIUS_PX);
    expect(s.candleRing[0].y).toBeCloseTo(300);
  });

  it('lights candles immediately when 7th touch is AFTER 14:00', () => {
    let s = initialGauntletState();
    s = advanceGauntlet(s, {
      gameTimeMs: GAUNTLET_CANDLE_TIME_MS + 30_000,
      touchedSavedAts: [1, 2, 3, 4, 5, 6, 7],
      playerX: 0, playerY: 0,
      bossDead: false, playerDead: false,
    });
    expect(s.phase).toBe('candles_lit');
  });

  it('spawns Cailleach at 15:00', () => {
    let s = initialGauntletState();
    const touched = [1, 2, 3, 4, 5, 6, 7];
    s = advanceGauntlet(s, { gameTimeMs: GAUNTLET_CANDLE_TIME_MS, touchedSavedAts: touched, playerX: 0, playerY: 0, bossDead: false, playerDead: false });
    s = advanceGauntlet(s, { gameTimeMs: GAUNTLET_BOSS_TIME_MS, touchedSavedAts: touched, playerX: 0, playerY: 0, bossDead: false, playerDead: false });
    expect(s.phase).toBe('engaged');
    expect(s.bossSpawnAtMs).toBe(GAUNTLET_BOSS_TIME_MS);
  });

  it('resolves to win on bossDead', () => {
    let s = initialGauntletState();
    const touched = [1, 2, 3, 4, 5, 6, 7];
    s = advanceGauntlet(s, { gameTimeMs: GAUNTLET_BOSS_TIME_MS, touchedSavedAts: touched, playerX: 0, playerY: 0, bossDead: false, playerDead: false });
    s = advanceGauntlet(s, { gameTimeMs: GAUNTLET_BOSS_TIME_MS + 60_000, touchedSavedAts: touched, playerX: 0, playerY: 0, bossDead: true, playerDead: false });
    expect(s.phase).toBe('resolved');
    expect(s.outcome).toBe('win');
  });

  it('resolves to lose on playerDead', () => {
    let s = initialGauntletState();
    const touched = [1, 2, 3, 4, 5, 6, 7];
    s = advanceGauntlet(s, { gameTimeMs: GAUNTLET_BOSS_TIME_MS, touchedSavedAts: touched, playerX: 0, playerY: 0, bossDead: false, playerDead: false });
    s = advanceGauntlet(s, { gameTimeMs: GAUNTLET_BOSS_TIME_MS + 30_000, touchedSavedAts: touched, playerX: 0, playerY: 0, bossDead: false, playerDead: true });
    expect(s.phase).toBe('resolved');
    expect(s.outcome).toBe('lose');
  });

  it('resolved phase ignores further input', () => {
    const s: CailleachGauntletState = {
      phase: 'resolved',
      touchedSavedAts: [1, 2, 3, 4, 5, 6, 7],
      armedAtMs: 0, candleLightAtMs: 0, bossSpawnAtMs: 0,
      outcome: 'win', candleRing: [],
    };
    const next = advanceGauntlet(s, { gameTimeMs: 9999, touchedSavedAts: [], playerX: 0, playerY: 0, bossDead: false, playerDead: false });
    expect(next).toBe(s);
  });

  it('captures only first 7 touched savedAts when more are passed', () => {
    let s = initialGauntletState();
    const touched = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    s = advanceGauntlet(s, { gameTimeMs: 5 * 60_000, touchedSavedAts: touched, playerX: 0, playerY: 0, bossDead: false, playerDead: false });
    expect(s.touchedSavedAts).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

describe('computeCandleRing — geometry', () => {
  it('produces 7 points equispaced on the ring radius', () => {
    const ring = computeCandleRing(100, 100);
    expect(ring).toHaveLength(7);
    for (const p of ring) {
      const dx = p.x - 100;
      const dy = p.y - 100;
      const r = Math.sqrt(dx * dx + dy * dy);
      expect(r).toBeCloseTo(GAUNTLET_CANDLE_RING_RADIUS_PX, 1);
    }
  });

  it('first point is on the +X axis from origin', () => {
    const ring = computeCandleRing(0, 0);
    expect(ring[0].x).toBeCloseTo(GAUNTLET_CANDLE_RING_RADIUS_PX);
    expect(ring[0].y).toBeCloseTo(0);
  });
});
