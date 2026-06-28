import { describe, expect, it } from 'vitest';
import { RuneConditionSystem } from './RuneConditionSystem';
import { createRuneEffectBag } from './runes/runeEffects';
import { emptyRuneEvalContext, type RuneEvalContext } from './runes/runeConditions';
import type { RuneDef } from '../data/runes';

const haarRune: RuneDef = {
  id: 'haar_rune',
  nameKey: 'runes.haar_rune.name',
  conditionKey: 'biome_fog',
  effects: [{ key: 'dmg_mult', params: { mult: 2.0 } }],
  flavourKey: 'runes.haar_rune.flavour',
  glyph: 'rune_haar',
};

const thirstRune: RuneDef = {
  id: 'thirst_rune',
  nameKey: 'runes.thirst_rune.name',
  conditionKey: 'hp_low',
  effects: [{ key: 'dmg_mult', params: { mult: 1.3 } }],
  flavourKey: 'runes.thirst_rune.flavour',
  glyph: 'rune_thirst',
};

const echoRune: RuneDef = {
  id: 'echo_rune',
  nameKey: 'runes.echo_rune.name',
  conditionKey: 'every_nth_kill:10',
  effects: [{ key: 'healing_thistle_spawn', params: { count: 1 } }],
  flavourKey: 'runes.echo_rune.flavour',
  glyph: 'rune_echo',
};

const lairdsRune: RuneDef = {
  id: 'lairds_rune',
  nameKey: 'runes.lairds_rune.name',
  conditionKey: 'kill_named_elite',
  effects: [{ key: 'shrine_buff_grant', params: { count: 1 } }],
  flavourKey: 'runes.lairds_rune.flavour',
  glyph: 'rune_lairds',
};

const ctx = (patch: Partial<RuneEvalContext>): RuneEvalContext => ({ ...emptyRuneEvalContext(), ...patch });

describe('RuneConditionSystem — transitions', () => {
  it('false → true fires applyEffect once; sustained truth does not re-apply', () => {
    const bag = createRuneEffectBag();
    const sys = new RuneConditionSystem(bag);
    sys.addRune(haarRune);

    // Baseline: condition false → no change.
    sys.tick(ctx({ biomeKey: 'heather' }));
    expect(bag.dmgMult).toBeCloseTo(1.0);

    // Enter fog: condition false→true → apply (×2).
    sys.tick(ctx({ biomeKey: 'fog' }));
    expect(bag.dmgMult).toBeCloseTo(2.0);

    // Still in fog: condition stays true → no re-apply.
    sys.tick(ctx({ biomeKey: 'fog' }));
    expect(bag.dmgMult).toBeCloseTo(2.0);
  });

  it('true → false fires removeEffect', () => {
    const bag = createRuneEffectBag();
    const sys = new RuneConditionSystem(bag);
    sys.addRune(haarRune);

    sys.tick(ctx({ biomeKey: 'fog' }));
    expect(bag.dmgMult).toBeCloseTo(2.0);

    sys.tick(ctx({ biomeKey: 'heather' }));
    expect(bag.dmgMult).toBeCloseTo(1.0);
  });

  it('pulse condition fires apply on each true-frame and remove on false-frame', () => {
    const bag = createRuneEffectBag();
    const sys = new RuneConditionSystem(bag);
    sys.addRune(echoRune);

    // 10th kill frame: condition true → apply → queues 1 thistle.
    sys.tick(ctx({ killsThisRun: 10, justKilled: true }));
    expect(bag.pendingHealingThistles).toBe(1);

    // Next frame: justKilled still true but killsThisRun advances to 11
    //  → condition false → remove (no-op for pulse).
    sys.tick(ctx({ killsThisRun: 11, justKilled: true }));
    expect(bag.pendingHealingThistles).toBe(1);

    // 20th kill: condition true again → another pulse queued.
    sys.tick(ctx({ killsThisRun: 20, justKilled: true }));
    expect(bag.pendingHealingThistles).toBe(2);
  });

  it('one-shot event conditions fire on consecutive true frames', () => {
    const bag = createRuneEffectBag();
    const sys = new RuneConditionSystem(bag);
    sys.addRune(lairdsRune);

    sys.tick(ctx({ namedEliteKilledThisFrame: true }));
    sys.tick(ctx({ namedEliteKilledThisFrame: true }));

    expect(bag.pendingShrineBuffs).toBe(2);
    expect(sys.snapshot()[0]?.active).toBe(false);
  });

  it('multiple runes evaluate independently in one tick', () => {
    const bag = createRuneEffectBag();
    const sys = new RuneConditionSystem(bag);
    sys.addRune(haarRune);
    sys.addRune(thirstRune);

    // Fog only.
    sys.tick(ctx({ biomeKey: 'fog' }));
    expect(bag.dmgMult).toBeCloseTo(2.0);

    // Fog + hp_low.
    sys.tick(ctx({ biomeKey: 'fog', hpFrac: 0.2 }));
    expect(bag.dmgMult).toBeCloseTo(2.0 * 1.3);

    // Recover HP.
    sys.tick(ctx({ biomeKey: 'fog', hpFrac: 0.5 }));
    expect(bag.dmgMult).toBeCloseTo(2.0);
  });

  it('removeRune reverts active effect when its condition was true', () => {
    const bag = createRuneEffectBag();
    const sys = new RuneConditionSystem(bag);
    sys.addRune(haarRune);

    sys.tick(ctx({ biomeKey: 'fog' }));
    expect(bag.dmgMult).toBeCloseTo(2.0);

    sys.removeRune('haar_rune');
    expect(bag.dmgMult).toBeCloseTo(1.0);
  });

  it('addRune of an already-true condition applies immediately on next tick', () => {
    const bag = createRuneEffectBag();
    const sys = new RuneConditionSystem(bag);

    // Condition true BEFORE rune is added — add then tick → apply.
    sys.addRune(haarRune);
    sys.tick(ctx({ biomeKey: 'fog' }));
    expect(bag.dmgMult).toBeCloseTo(2.0);
  });

  it('clear reverts every active rune', () => {
    const bag = createRuneEffectBag();
    const sys = new RuneConditionSystem(bag);
    sys.addRune(haarRune);
    sys.addRune(thirstRune);

    sys.tick(ctx({ biomeKey: 'fog', hpFrac: 0.2 }));
    expect(bag.dmgMult).toBeCloseTo(2.0 * 1.3);

    sys.clear();
    expect(bag.dmgMult).toBeCloseTo(1.0);
    expect(sys.activeCount()).toBe(0);
  });

  it('snapshot lists active runes with their current truth state', () => {
    const bag = createRuneEffectBag();
    const sys = new RuneConditionSystem(bag);
    sys.addRune(haarRune);
    sys.addRune(thirstRune);

    sys.tick(ctx({ biomeKey: 'fog', hpFrac: 0.5 }));
    const snap = sys.snapshot();
    expect(snap).toHaveLength(2);
    expect(snap.find((s) => s.id === 'haar_rune')?.active).toBe(true);
    expect(snap.find((s) => s.id === 'thirst_rune')?.active).toBe(false);
  });
});
