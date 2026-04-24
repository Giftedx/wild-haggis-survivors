import { describe, expect, it } from 'vitest';

import {
  applyBronzeClaspFirstHit,
  applyCeilidhDancersRibbonThreshold,
  applyDampTinderFireReduction,
  applyGransThimbleCritBonus,
  applyLuckyHeatherSprigLuck,
  applyOatcakeHealOnCircleEntry,
  applySporranOfHolding,
  applyWhiskyDramActivation,
  applyBodhranSkinBeatDamage,
  applyClootieRagLifesteal,
  applyFishermensNetDamage,
  applyHighlandTorqueEliteDamage,
  applyHighlandTorqueEliteSpawnRate,
  applyStoneOfDestinyBossHp,
  applyStoneOfDestinyXp,
  activateFingalsHorn,
  initialBronzeClaspState,
  initialClootieRagState,
  initialFingalsHornState,
  initialGransTeapotState,
  initialCairnStoneState,
  initialWhiskyDramState,
  isClootieRagDoubleActive,
  isMidgieRepellentImmune,
  noteClootieRagDamageTaken,
  noteGransTeapotDamageTaken,
  resolveCairnStoneOnHeatherKill,
  tickGransTeapot,
  BODHRAN_SKIN_ON_BEAT_WINDOW_MS,
  CAIRN_STONE_COOLDOWN_MS,
  CLOOTIE_RAG_WINDOW_MS,
  FINGALS_HORN_SUMMON_COUNT,
  FINGALS_HORN_SUMMON_DURATION_MS,
  GRANS_TEAPOT_DAMAGE_FREE_MS,
  GRANS_TEAPOT_HEAL_FRAC_PER_SEC,
  HIGHLAND_TORQUE_ELITE_DAMAGE_MULT,
  HIGHLAND_TORQUE_ELITE_SPAWN_MULT,
  STONE_OF_DESTINY_BOSS_HP_MULT,
  STONE_OF_DESTINY_XP_MULT,
  type BronzeClaspState,
  type WhiskyDramState,
} from './relicEffects';

describe('sporran_of_holding', () => {
  it('adds +2 gold to a normal pickup', () => {
    expect(applySporranOfHolding(5)).toBe(7);
  });

  it('still adds +2 on a zero-value pickup (floor bump)', () => {
    expect(applySporranOfHolding(0)).toBe(2);
  });

  it('handles large pickup values without rounding drift', () => {
    expect(applySporranOfHolding(1_000_000)).toBe(1_000_002);
  });
});

describe('oatcake_stash', () => {
  it('adds +2 HP to a normal healing-circle heal', () => {
    expect(applyOatcakeHealOnCircleEntry(4)).toBe(6);
  });

  it('still adds +2 when the base heal is zero', () => {
    expect(applyOatcakeHealOnCircleEntry(0)).toBe(2);
  });

  it('is additive, not multiplicative', () => {
    expect(applyOatcakeHealOnCircleEntry(10)).toBe(12);
    expect(applyOatcakeHealOnCircleEntry(1)).toBe(3);
  });
});

describe('grans_thimble', () => {
  it('scales a 2× crit multiplier by +8% to 2.16×', () => {
    expect(applyGransThimbleCritBonus(2)).toBeCloseTo(2.16, 10);
  });

  it('scales a 1× (no-crit baseline) up to 1.08×', () => {
    expect(applyGransThimbleCritBonus(1)).toBeCloseTo(1.08, 10);
  });

  it('scales a 3× mega-crit by 1.08 to 3.24×', () => {
    expect(applyGransThimbleCritBonus(3)).toBeCloseTo(3.24, 10);
  });
});

describe('lucky_heather_sprig', () => {
  it('adds +0.03 luck to a neutral 0 baseline', () => {
    expect(applyLuckyHeatherSprigLuck(0)).toBeCloseTo(0.03, 10);
  });

  it('is additive with existing luck', () => {
    expect(applyLuckyHeatherSprigLuck(0.1)).toBeCloseTo(0.13, 10);
  });

  it('stacks without clamping (callers own upper bound)', () => {
    expect(applyLuckyHeatherSprigLuck(0.99)).toBeCloseTo(1.02, 10);
  });
});

describe('bronze_clasp', () => {
  it('first ever hit triggers the +15% bonus and stamps lastHitTime', () => {
    const result = applyBronzeClaspFirstHit(100, 500, initialBronzeClaspState);
    expect(result.damage).toBeCloseTo(115, 10);
    expect(result.state.lastHitTime).toBe(500);
  });

  it('a second hit within 1000ms returns base damage and preserves state', () => {
    const primed: BronzeClaspState = { lastHitTime: 500 };
    const result = applyBronzeClaspFirstHit(100, 1200, primed);
    expect(result.damage).toBe(100);
    expect(result.state).toBe(primed);
  });

  it('a hit exactly 1000ms after the last one re-triggers the bonus', () => {
    const primed: BronzeClaspState = { lastHitTime: 500 };
    const result = applyBronzeClaspFirstHit(100, 1500, primed);
    expect(result.damage).toBeCloseTo(115, 10);
    expect(result.state.lastHitTime).toBe(1500);
  });

  it('does not mutate the input state when bonus fires', () => {
    const primed: BronzeClaspState = { lastHitTime: 0 };
    applyBronzeClaspFirstHit(10, 2000, primed);
    expect(primed.lastHitTime).toBe(0);
  });
});

describe('ceilidh_dancers_ribbon', () => {
  it('returns 5 as the override threshold regardless of default', () => {
    expect(applyCeilidhDancersRibbonThreshold(8)).toBe(5);
  });

  it('overrides even a lower default threshold to 5 (relic is the source of truth)', () => {
    expect(applyCeilidhDancersRibbonThreshold(3)).toBe(5);
  });

  it('handles a zero default without error', () => {
    expect(applyCeilidhDancersRibbonThreshold(0)).toBe(5);
  });
});

describe('damp_tinder', () => {
  it('reduces a 10-damage fire tick to 6 (×0.6)', () => {
    expect(applyDampTinderFireReduction(10)).toBeCloseTo(6, 10);
  });

  it('returns 0 when the incoming fire damage is 0', () => {
    expect(applyDampTinderFireReduction(0)).toBe(0);
  });

  it('scales proportionally for small and large values', () => {
    expect(applyDampTinderFireReduction(1)).toBeCloseTo(0.6, 10);
    expect(applyDampTinderFireReduction(100)).toBeCloseTo(60, 10);
  });
});

describe('whisky_dram', () => {
  it('heals 20% of max HP on first activation and marks state used', () => {
    const result = applyWhiskyDramActivation(40, 100, initialWhiskyDramState);
    expect(result.hp).toBe(60);
    expect(result.state.used).toBe(true);
  });

  it('clamps the heal to maxHp (no overflow at high HP)', () => {
    const result = applyWhiskyDramActivation(95, 100, initialWhiskyDramState);
    expect(result.hp).toBe(100);
    expect(result.state.used).toBe(true);
  });

  it('is inert on a second activation — HP and state both unchanged', () => {
    const spent: WhiskyDramState = { used: true };
    const result = applyWhiskyDramActivation(40, 100, spent);
    expect(result.hp).toBe(40);
    expect(result.state).toBe(spent);
  });

  it('heals from zero HP as expected (clutch activation)', () => {
    const result = applyWhiskyDramActivation(0, 100, initialWhiskyDramState);
    expect(result.hp).toBe(20);
    expect(result.state.used).toBe(true);
  });

  it('does not mutate input state on activation', () => {
    const fresh: WhiskyDramState = { used: false };
    applyWhiskyDramActivation(50, 100, fresh);
    expect(fresh.used).toBe(false);
  });
});

describe('cairn_stone', () => {
  it('spawns on first heather kill', () => {
    const r = resolveCairnStoneOnHeatherKill(1000, initialCairnStoneState);
    expect(r.spawn).toBe(true);
    expect(r.state.lastSpawnMs).toBe(1000);
  });

  it('suppresses spawn inside the 5s cooldown', () => {
    const first = resolveCairnStoneOnHeatherKill(1000, initialCairnStoneState);
    const second = resolveCairnStoneOnHeatherKill(2000, first.state);
    expect(second.spawn).toBe(false);
    expect(second.state).toBe(first.state);
  });

  it('re-fires after the 5s cooldown lapses', () => {
    const first = resolveCairnStoneOnHeatherKill(0, initialCairnStoneState);
    const later = resolveCairnStoneOnHeatherKill(CAIRN_STONE_COOLDOWN_MS, first.state);
    expect(later.spawn).toBe(true);
  });

  it('initial state has a -Infinity last-spawn so the first kill always fires', () => {
    expect(initialCairnStoneState.lastSpawnMs).toBe(Number.NEGATIVE_INFINITY);
  });
});

describe('highland_torque', () => {
  it('doubles elite damage via the multiplier constant', () => {
    expect(HIGHLAND_TORQUE_ELITE_DAMAGE_MULT).toBe(2.0);
    expect(applyHighlandTorqueEliteDamage(10)).toBe(20);
    expect(applyHighlandTorqueEliteDamage(0)).toBe(0);
  });

  it('scales elite spawn chance by 20%, clamped to 1', () => {
    expect(HIGHLAND_TORQUE_ELITE_SPAWN_MULT).toBe(1.2);
    expect(applyHighlandTorqueEliteSpawnRate(0.1)).toBeCloseTo(0.12);
    expect(applyHighlandTorqueEliteSpawnRate(0.9)).toBeCloseTo(1);
    expect(applyHighlandTorqueEliteSpawnRate(1)).toBe(1);
  });
});

describe('bodhran_skin', () => {
  const period = 500; // 120 BPM quarter-note

  it('grants +20% exactly on the beat', () => {
    expect(applyBodhranSkinBeatDamage(10, 0, period)).toBeCloseTo(12);
  });

  it('grants +20% inside the ±80ms window', () => {
    expect(applyBodhranSkinBeatDamage(10, BODHRAN_SKIN_ON_BEAT_WINDOW_MS, period)).toBeCloseTo(12);
    expect(applyBodhranSkinBeatDamage(10, period - BODHRAN_SKIN_ON_BEAT_WINDOW_MS, period)).toBeCloseTo(12);
  });

  it('falls back to baseline just outside the window', () => {
    expect(applyBodhranSkinBeatDamage(10, BODHRAN_SKIN_ON_BEAT_WINDOW_MS + 1, period)).toBe(10);
  });

  it('handles ms past a full period (wraps cleanly)', () => {
    expect(applyBodhranSkinBeatDamage(10, period * 3, period)).toBeCloseTo(12);
  });

  it('rejects invalid period / elapsed', () => {
    expect(applyBodhranSkinBeatDamage(10, 0, 0)).toBe(10);
    expect(applyBodhranSkinBeatDamage(10, Number.NaN, 500)).toBe(10);
  });
});

describe('clootie_rag', () => {
  it('notes damage sets the timer to now', () => {
    const s = noteClootieRagDamageTaken(1000, initialClootieRagState);
    expect(s.lastDamagedMs).toBe(1000);
  });

  it('doubles lifesteal inside the 5s window', () => {
    const s = noteClootieRagDamageTaken(0, initialClootieRagState);
    expect(applyClootieRagLifesteal(3, 2500, s)).toBe(6);
    expect(isClootieRagDoubleActive(2500, s)).toBe(true);
  });

  it('reverts to baseline lifesteal after 5s', () => {
    const s = noteClootieRagDamageTaken(0, initialClootieRagState);
    expect(applyClootieRagLifesteal(3, CLOOTIE_RAG_WINDOW_MS + 1, s)).toBe(3);
    expect(isClootieRagDoubleActive(CLOOTIE_RAG_WINDOW_MS + 1, s)).toBe(false);
  });

  it('never-damaged start state leaves lifesteal untouched', () => {
    expect(applyClootieRagLifesteal(3, 0, initialClootieRagState)).toBe(3);
  });
});

describe('fishermens_net', () => {
  it('applies +30% when the dot toward player is negative (fleeing)', () => {
    expect(applyFishermensNetDamage(10, -1)).toBeCloseTo(13);
  });

  it('baseline when the enemy is approaching (positive dot)', () => {
    expect(applyFishermensNetDamage(10, 1)).toBe(10);
  });

  it('baseline at exactly zero velocity (neither approaching nor fleeing)', () => {
    expect(applyFishermensNetDamage(10, 0)).toBe(10);
  });
});

describe('midgie_repellent', () => {
  it('is immune when held', () => {
    expect(isMidgieRepellentImmune(true)).toBe(true);
  });
  it('is not immune when not held', () => {
    expect(isMidgieRepellentImmune(false)).toBe(false);
  });
});

describe('grans_teapot', () => {
  it('does not heal inside the 5s damage-free window', () => {
    const r = tickGransTeapot(1000, 100, initialGransTeapotState);
    expect(r.healHp).toBe(0);
    expect(r.state.msSinceDamage).toBe(1000);
  });

  it('heals 5% max HP per second after the window elapses', () => {
    // Simulate 5000ms of damage-free, then 1000ms of heal.
    const afterWindow = tickGransTeapot(GRANS_TEAPOT_DAMAGE_FREE_MS, 100, initialGransTeapotState);
    expect(afterWindow.healHp).toBe(0);
    const oneSec = tickGransTeapot(1000, 100, afterWindow.state);
    expect(oneSec.healHp).toBe(GRANS_TEAPOT_HEAL_FRAC_PER_SEC * 100);
  });

  it('accumulates sub-1-HP ticks via healCarry', () => {
    // With maxHp=10, 5% per second is 0.5 HP/s; 100ms ticks each yield 0.
    const after5sWindow = tickGransTeapot(GRANS_TEAPOT_DAMAGE_FREE_MS, 10, initialGransTeapotState);
    const t1 = tickGransTeapot(100, 10, after5sWindow.state);
    expect(t1.healHp).toBe(0);
    expect(t1.state.healCarry).toBeCloseTo(0.05);
    // 2 seconds in total should yield 1 integer HP with carry.
    const t2 = tickGransTeapot(1900, 10, t1.state);
    expect(t2.healHp).toBe(1);
  });

  it('damage taken resets the window to 0', () => {
    const mid = tickGransTeapot(3000, 100, initialGransTeapotState);
    const reset = noteGransTeapotDamageTaken(mid.state);
    expect(reset.msSinceDamage).toBe(0);
    expect(reset.healCarry).toBe(0);
  });
});

describe('stone_of_destiny_shard', () => {
  it('+50% XP multiplier', () => {
    expect(STONE_OF_DESTINY_XP_MULT).toBe(1.5);
    expect(applyStoneOfDestinyXp(10)).toBe(15);
  });

  it('+15% boss HP multiplier', () => {
    expect(STONE_OF_DESTINY_BOSS_HP_MULT).toBeCloseTo(1.15);
    expect(applyStoneOfDestinyBossHp(100)).toBeCloseTo(115);
  });
});

describe('fingals_horn', () => {
  it('fires once; second call is no-op', () => {
    const first = activateFingalsHorn(initialFingalsHornState);
    expect(first.fired).toBe(true);
    expect(first.state.used).toBe(true);

    const second = activateFingalsHorn(first.state);
    expect(second.fired).toBe(false);
    expect(second.state).toBe(first.state);
  });

  it('summon constants are reasonable (3 Fianna, 10s)', () => {
    expect(FINGALS_HORN_SUMMON_COUNT).toBe(3);
    expect(FINGALS_HORN_SUMMON_DURATION_MS).toBe(10_000);
  });
});
