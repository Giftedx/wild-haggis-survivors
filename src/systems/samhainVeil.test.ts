import { describe, expect, it } from 'vitest';
import { defaultModifiers } from '../core/RunModifiers';
import {
  SAMHAIN_SPAWN_MULT,
  SAMHAIN_VEIL_HEAL,
  applySamhainVeil,
} from './samhainVeil';

describe('applySamhainVeil', () => {
  it('does not fire for null event', () => {
    const m = defaultModifiers();
    const result = applySamhainVeil(null, m);
    expect(result.applied).toBe(false);
    expect(result.extraStartingHpHeal).toBe(0);
    expect(m).toEqual(defaultModifiers());
  });

  it('does not fire for non-samhain events', () => {
    for (const event of ['hogmanay', 'beltane', 'burns_night', 'st_andrews']) {
      const m = defaultModifiers();
      const result = applySamhainVeil(event, m);
      expect(result.applied, `should skip ${event}`).toBe(false);
      expect(m).toEqual(defaultModifiers());
    }
  });

  it('multiplies spawnIntervalMult and grants the heal on samhain', () => {
    const m = defaultModifiers();
    const result = applySamhainVeil('samhain', m);
    expect(result.applied).toBe(true);
    expect(result.extraStartingHpHeal).toBe(SAMHAIN_VEIL_HEAL);
    expect(m.spawnIntervalMult).toBeCloseTo(SAMHAIN_SPAWN_MULT, 5);
  });

  it('leaves non-spawn-interval modifier fields untouched', () => {
    const m = defaultModifiers();
    applySamhainVeil('samhain', m);
    expect(m.moveSpeedMult).toBe(1);
    expect(m.startHpRatio).toBe(1);
    expect(m.damageTakenMult).toBe(1);
    expect(m.goldMult).toBe(1);
    expect(m.weaponCooldownMult).toBe(1);
  });

  it('stacks multiplicatively (defensive — caller should only invoke once)', () => {
    const m = defaultModifiers();
    applySamhainVeil('samhain', m);
    applySamhainVeil('samhain', m);
    expect(m.spawnIntervalMult).toBeCloseTo(SAMHAIN_SPAWN_MULT * SAMHAIN_SPAWN_MULT, 5);
  });
});
