/**
 * U1 M4 — integration tests proving the rune condition system + consumer
 * fold actually mutates measurable state across the apply/remove cycle.
 *
 * Pure modules only — no Phaser. The harness wires
 * `RuneConditionSystem` to a `RuneEffectBag` and asserts that the
 * composer outputs (damage / speed / xp / max-hp / gold) flip in
 * lockstep with the condition transitions, exactly as Player +
 * WeaponSystem + XPSystem + RunScoreState would observe at runtime.
 */
import { describe, expect, it } from 'vitest';
import { RuneConditionSystem } from '../RuneConditionSystem';
import { createRuneEffectBag } from './runeEffects';
import {
  composeDamageMul,
  composeGoldMul,
  composeMaxHpMul,
  composeSpeedMul,
  composeXpMul,
  composeCritBonus,
  composeLuckBonus,
} from './runeConsumer';
import { RUNES } from '../../data/runes';
import { emptyRuneEvalContext } from './runeConditions';

describe('rune integration — Peat Rune (biome_bog → dmg up + speed down)', () => {
  it('apply on bog entry, remove on bog exit — composers reflect both edges', () => {
    const bag = createRuneEffectBag();
    const sys = new RuneConditionSystem(bag);
    const peat = RUNES.peat_rune;
    expect(peat).toBeDefined();
    sys.addRune(peat);

    // Outside bog — composers identity.
    sys.tick({ ...emptyRuneEvalContext(), biomeKey: 'pine' });
    expect(composeDamageMul(bag)).toBe(1);
    expect(composeSpeedMul(bag)).toBe(1);

    // Enter bog — peat rune fires.
    sys.tick({ ...emptyRuneEvalContext(), biomeKey: 'bog' });
    expect(composeDamageMul(bag)).toBeCloseTo(1.4);
    expect(composeSpeedMul(bag)).toBeCloseTo(0.8);

    // Leave bog — composers fully revert.
    sys.tick({ ...emptyRuneEvalContext(), biomeKey: 'heather' });
    expect(composeDamageMul(bag)).toBe(1);
    expect(composeSpeedMul(bag)).toBe(1);
  });
});

describe('rune integration — Heather Rune (biome_heather → gem_spawn pulse)', () => {
  it('queues a pending gem on entry, drained by GameScene each frame', () => {
    const bag = createRuneEffectBag();
    const sys = new RuneConditionSystem(bag);
    const heather = RUNES.heather_rune;
    sys.addRune(heather);

    sys.tick({ ...emptyRuneEvalContext(), biomeKey: 'bog' });
    expect(bag.pendingGems).toBe(0);
    sys.tick({ ...emptyRuneEvalContext(), biomeKey: 'heather' });
    // Pulse fires once on apply, then drained externally.
    expect(bag.pendingGems).toBeGreaterThan(0);
  });
});

describe('rune integration — Thirst Rune (hp_low → dmg_mult 1.3)', () => {
  it('fires only while HP < 30 %, reverts above', () => {
    const bag = createRuneEffectBag();
    const sys = new RuneConditionSystem(bag);
    sys.addRune(RUNES.thirst_rune);

    sys.tick({ ...emptyRuneEvalContext(), hpFrac: 0.5 });
    expect(composeDamageMul(bag)).toBe(1);
    sys.tick({ ...emptyRuneEvalContext(), hpFrac: 0.2 });
    expect(composeDamageMul(bag)).toBeCloseTo(1.3);
    sys.tick({ ...emptyRuneEvalContext(), hpFrac: 0.5 });
    expect(composeDamageMul(bag)).toBe(1);
  });
});

describe('rune integration — Drover Rune (relics_full → all_stats_mult 1.1)', () => {
  it('lifts every layer (dmg / speed / hp / xp / gold) by 1.1x', () => {
    const bag = createRuneEffectBag();
    const sys = new RuneConditionSystem(bag);
    sys.addRune(RUNES.drover_rune);

    sys.tick({ ...emptyRuneEvalContext(), ownedRelicsCount: 1 });
    expect(composeDamageMul(bag)).toBe(1);

    sys.tick({ ...emptyRuneEvalContext(), ownedRelicsCount: 3 });
    expect(composeDamageMul(bag)).toBeCloseTo(1.1);
    expect(composeSpeedMul(bag)).toBeCloseTo(1.1);
    expect(composeMaxHpMul(bag)).toBeCloseTo(1.1);
    expect(composeXpMul(bag)).toBeCloseTo(1.1);
    expect(composeGoldMul(bag)).toBeCloseTo(1.1);

    sys.tick({ ...emptyRuneEvalContext(), ownedRelicsCount: 2 });
    expect(composeDamageMul(bag)).toBe(1);
  });
});

describe('rune integration — Cairn Rune (near_cairn → luck +15)', () => {
  it('luck composer reads the bag flat addend', () => {
    const bag = createRuneEffectBag();
    const sys = new RuneConditionSystem(bag);
    sys.addRune(RUNES.cairn_rune);

    sys.tick({ ...emptyRuneEvalContext(), nearCairn: false });
    expect(composeLuckBonus(bag)).toBe(0);
    sys.tick({ ...emptyRuneEvalContext(), nearCairn: true });
    expect(composeLuckBonus(bag)).toBe(15);
    sys.tick({ ...emptyRuneEvalContext(), nearCairn: false });
    expect(composeLuckBonus(bag)).toBe(0);
  });
});

describe('rune integration — Trek + Warden combined (run_early × run_late)', () => {
  it('mutually exclusive — never compose simultaneously', () => {
    const bag = createRuneEffectBag();
    const sys = new RuneConditionSystem(bag);
    sys.addRune(RUNES.trek_rune);
    sys.addRune(RUNES.warden_rune);

    // Early run → trek fires (speed +25%), warden silent.
    sys.tick({ ...emptyRuneEvalContext(), runTimeMs: 30_000 });
    expect(composeSpeedMul(bag)).toBeCloseTo(1.25);
    expect(composeDamageMul(bag)).toBe(1);

    // Mid run → both silent.
    sys.tick({ ...emptyRuneEvalContext(), runTimeMs: 600_000 });
    expect(composeSpeedMul(bag)).toBe(1);
    expect(composeDamageMul(bag)).toBe(1);

    // Late run → warden fires (dmg +40%), trek silent.
    sys.tick({ ...emptyRuneEvalContext(), runTimeMs: 25 * 60_000 });
    expect(composeSpeedMul(bag)).toBe(1);
    expect(composeDamageMul(bag)).toBeCloseTo(1.4);
  });
});

describe('rune integration — Piper Rune (weapon_bagpipes)', () => {
  it('only fires when bagpipes weapon is owned (bagpipe_blast does NOT trigger)', () => {
    const bag = createRuneEffectBag();
    const sys = new RuneConditionSystem(bag);
    sys.addRune(RUNES.piper_rune);

    sys.tick({ ...emptyRuneEvalContext(), ownedWeaponKeys: ['thistle_shot'] });
    expect(bag.bagpipesRadiusMult).toBe(1);

    // T113 audit: condition is `weapon_bagpipes` not `weapon_bagpipe_blast`.
    sys.tick({ ...emptyRuneEvalContext(), ownedWeaponKeys: ['bagpipe_blast'] });
    expect(bag.bagpipesRadiusMult).toBe(1);

    sys.tick({ ...emptyRuneEvalContext(), ownedWeaponKeys: ['bagpipes'] });
    expect(bag.bagpipesRadiusMult).toBeCloseTo(1.25);

    sys.tick({ ...emptyRuneEvalContext(), ownedWeaponKeys: ['thistle_shot'] });
    expect(bag.bagpipesRadiusMult).toBe(1);
  });
});

describe('rune integration — bag clock (timed dmg)', () => {
  it('Fastburn rune dmg mult lapses on its own clock without re-applying', () => {
    const bag = createRuneEffectBag();
    const sys = new RuneConditionSystem(bag);
    sys.addRune(RUNES.fastburn_rune);

    bag.nowMs = 0;
    sys.tick({ ...emptyRuneEvalContext(), dashMsAgo: 1500 });
    // Latched timed effect — dmg mult active until window closes.
    expect(composeDamageMul(bag)).toBeCloseTo(1.5);

    // Time slips past the 1000 ms window — composer drops the timed slice.
    bag.nowMs = 2000;
    expect(composeDamageMul(bag)).toBe(1);
  });
});

describe('rune integration — Gloaming + Flush stack vs. mutex on conditions', () => {
  it('hp_high (flush) and biome_dusk (gloaming) are independent — both can fire', () => {
    const bag = createRuneEffectBag();
    const sys = new RuneConditionSystem(bag);
    sys.addRune(RUNES.flush_rune);     // hp_high → +0.15 crit
    sys.addRune(RUNES.gloaming_rune);  // biome_dusk → +0.08 crit

    sys.tick({ ...emptyRuneEvalContext(), hpFrac: 0.95, timeOfDayKey: 'dusk' });
    expect(composeCritBonus(bag)).toBeCloseTo(0.23);

    // Drop dusk; only flush remains.
    sys.tick({ ...emptyRuneEvalContext(), hpFrac: 0.95, timeOfDayKey: 'day' });
    expect(composeCritBonus(bag)).toBeCloseTo(0.15);
  });
});

describe('rune integration — system clear() reverts every active rune', () => {
  it('clear() rolls every multiplicative slot back to 1', () => {
    const bag = createRuneEffectBag();
    const sys = new RuneConditionSystem(bag);
    sys.addRune(RUNES.peat_rune);
    sys.addRune(RUNES.thirst_rune);
    sys.addRune(RUNES.drover_rune);

    sys.tick({
      ...emptyRuneEvalContext(),
      biomeKey: 'bog',
      hpFrac: 0.2,
      ownedRelicsCount: 3,
    });
    expect(composeDamageMul(bag)).toBeGreaterThan(1.5);

    sys.clear();
    expect(composeDamageMul(bag)).toBe(1);
    expect(composeSpeedMul(bag)).toBe(1);
    expect(composeMaxHpMul(bag)).toBe(1);
    expect(sys.activeCount()).toBe(0);
  });
});
