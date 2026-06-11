import { describe, it, expect } from 'vitest';
import { computePostBellMultipliers, NEUTRAL_POST_BELL } from './PostBellEscalation';

describe('computePostBellMultipliers', () => {
  it('returns neutral values before the bell', () => {
    expect(computePostBellMultipliers(-10)).toEqual(NEUTRAL_POST_BELL);
    expect(computePostBellMultipliers(0)).toEqual(NEUTRAL_POST_BELL);
  });

  it('leaves first step (0-119s past bell) neutral', () => {
    const m = computePostBellMultipliers(60);
    expect(m.enemyHpMul).toBe(1);
    expect(m.enemySpeedMul).toBe(1);
    expect(m.bonusEliteSlots).toBe(0);
    expect(m.cursedChance).toBe(0);
  });

  it('escalates HP and speed at 120s', () => {
    const m = computePostBellMultipliers(120);
    expect(m.enemyHpMul).toBeCloseTo(1.10, 5);
    expect(m.enemySpeedMul).toBeCloseTo(1.05, 5);
    expect(m.bonusEliteSlots).toBe(1);
  });

  it('compounds over multiple steps', () => {
    const m = computePostBellMultipliers(600); // 5 steps
    expect(m.enemyHpMul).toBeCloseTo(Math.pow(1.10, 5), 5);
    expect(m.enemySpeedMul).toBeCloseTo(Math.pow(1.05, 5), 5);
  });

  it('caps HP multiplier at 5x', () => {
    const m = computePostBellMultipliers(999999);
    expect(m.enemyHpMul).toBe(5);
  });

  it('caps speed multiplier at 1.8x', () => {
    const m = computePostBellMultipliers(999999);
    expect(m.enemySpeedMul).toBe(1.8);
  });

  it('drops boss cadence at 240s and 480s', () => {
    expect(computePostBellMultipliers(119).bossCadenceSec).toBe(300);
    expect(computePostBellMultipliers(240).bossCadenceSec).toBe(180);
    expect(computePostBellMultipliers(480).bossCadenceSec).toBe(120);
  });

  it('cursed chance engages at step 1 and caps at 40%', () => {
    expect(computePostBellMultipliers(60).cursedChance).toBe(0);
    expect(computePostBellMultipliers(120).cursedChance).toBeCloseTo(0.08, 5);
    expect(computePostBellMultipliers(999999).cursedChance).toBe(0.4);
  });

  it('elite slots cap at 4', () => {
    expect(computePostBellMultipliers(999999).bonusEliteSlots).toBe(4);
  });

  it('neutral state has retinue inactive (cadence 0, size 0)', () => {
    expect(NEUTRAL_POST_BELL.retinueCadenceSec).toBe(0);
    expect(NEUTRAL_POST_BELL.retinueWaveSize).toBe(0);
  });

  it('retinue cadence starts at 90s on step 0 (0-119s past bell)', () => {
    expect(computePostBellMultipliers(60).retinueCadenceSec).toBe(90);
    expect(computePostBellMultipliers(60).retinueWaveSize).toBe(2);
  });

  it('retinue cadence shrinks and wave size grows across steps', () => {
    expect(computePostBellMultipliers(120).retinueCadenceSec).toBe(75); // step 1
    expect(computePostBellMultipliers(240).retinueCadenceSec).toBe(60); // step 2
    expect(computePostBellMultipliers(240).retinueWaveSize).toBe(3);
    expect(computePostBellMultipliers(360).retinueCadenceSec).toBe(45); // step 3
    expect(computePostBellMultipliers(480).retinueCadenceSec).toBe(30); // step 4
    expect(computePostBellMultipliers(480).retinueWaveSize).toBe(4);
  });

  it('retinue cadence caps at 30s and wave size caps at 4', () => {
    const m = computePostBellMultipliers(999999);
    expect(m.retinueCadenceSec).toBe(30);
    expect(m.retinueWaveSize).toBe(4);
  });
});
