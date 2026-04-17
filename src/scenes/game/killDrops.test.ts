import { describe, it, expect } from 'vitest';
import {
  healthOrbDropRate,
  healthOrbAmount,
  goldCoinDropRate,
  goldCoinAmountRange,
  HEALTH_ORB_DROP_CHANCE_BASE,
  HEALTH_ORB_AMOUNT_BASE,
  HEALTH_ORB_AMOUNT_BOSS,
  GOLD_DROP_CHANCE_BASE,
  GOLD_DROP_CHANCE_ELITE,
  GOLD_DROP_CHANCE_BOSS,
  GOLD_COIN_AMOUNT_BASE,
  GOLD_COIN_AMOUNT_BOSS,
} from './killDrops';

describe('healthOrbDropRate', () => {
  it('bosses always drop (rate = 1)', () => {
    expect(healthOrbDropRate(true)).toBe(1);
  });
  it('normal enemies drop at the base rate', () => {
    expect(healthOrbDropRate(false)).toBe(HEALTH_ORB_DROP_CHANCE_BASE);
  });
});

describe('healthOrbAmount', () => {
  it('bosses drop the big orb', () => {
    expect(healthOrbAmount(true)).toBe(HEALTH_ORB_AMOUNT_BOSS);
  });
  it('normal enemies drop the small orb', () => {
    expect(healthOrbAmount(false)).toBe(HEALTH_ORB_AMOUNT_BASE);
  });
  it('boss orb is strictly bigger than base orb', () => {
    expect(HEALTH_ORB_AMOUNT_BOSS).toBeGreaterThan(HEALTH_ORB_AMOUNT_BASE);
  });
});

describe('goldCoinDropRate — 3 tiers', () => {
  it('boss beats elite beats normal (rate ordering)', () => {
    expect(GOLD_DROP_CHANCE_BOSS).toBeGreaterThan(GOLD_DROP_CHANCE_ELITE);
    expect(GOLD_DROP_CHANCE_ELITE).toBeGreaterThan(GOLD_DROP_CHANCE_BASE);
  });

  it('boss (any elite flag) always drops', () => {
    expect(goldCoinDropRate(true, true)).toBe(GOLD_DROP_CHANCE_BOSS);
    expect(goldCoinDropRate(true, false)).toBe(GOLD_DROP_CHANCE_BOSS);
  });

  it('elite (non-boss) uses elite rate', () => {
    expect(goldCoinDropRate(false, true)).toBe(GOLD_DROP_CHANCE_ELITE);
  });

  it('plain enemy uses base rate', () => {
    expect(goldCoinDropRate(false, false)).toBe(GOLD_DROP_CHANCE_BASE);
  });
});

describe('goldCoinAmountRange', () => {
  it('bosses drop 5..15 coins', () => {
    expect(goldCoinAmountRange(true)).toEqual(GOLD_COIN_AMOUNT_BOSS);
    expect(GOLD_COIN_AMOUNT_BOSS[0]).toBeGreaterThan(GOLD_COIN_AMOUNT_BASE[1]);
  });

  it('non-boss drops the base range (both normals and elites)', () => {
    expect(goldCoinAmountRange(false)).toEqual(GOLD_COIN_AMOUNT_BASE);
  });

  it('both ranges have lo <= hi', () => {
    expect(GOLD_COIN_AMOUNT_BASE[0]).toBeLessThanOrEqual(GOLD_COIN_AMOUNT_BASE[1]);
    expect(GOLD_COIN_AMOUNT_BOSS[0]).toBeLessThanOrEqual(GOLD_COIN_AMOUNT_BOSS[1]);
  });
});
