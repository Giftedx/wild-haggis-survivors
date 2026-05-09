import { describe, expect, it } from 'vitest';
import { defaultModifiers } from '../core/RunModifiers';
import {
  SIMMER_DIM_CRIT_DAMAGE_BONUS,
  SIMMER_DIM_SOLSTICE_HEAL,
  applySimmerDimBlessing,
} from './simmerDimBlessing';

describe('applySimmerDimBlessing', () => {
  it('does not fire for null event', () => {
    const m = defaultModifiers();
    const result = applySimmerDimBlessing(null, m);
    expect(result.applied).toBe(false);
    expect(result.extraStartingHpHeal).toBe(0);
    expect(result.extraCritDamageMultiplier).toBe(0);
    expect(m).toEqual(defaultModifiers());
  });

  it('does not fire for non-simmer_dim events', () => {
    for (const event of [
      'hogmanay', 'beltane', 'samhain', 'st_andrews',
      'burns_night', 'imbolc', 'lammas', 'bracken_turn',
      'bannockburn', 'glorious_twelfth', 'tartan_day',
    ]) {
      const m = defaultModifiers();
      const result = applySimmerDimBlessing(event, m);
      expect(result.applied, `should skip ${event}`).toBe(false);
      expect(m).toEqual(defaultModifiers());
    }
  });

  it('grants the solstice heal and crit-damage bonus on simmer_dim', () => {
    const m = defaultModifiers();
    const result = applySimmerDimBlessing('simmer_dim', m);
    expect(result.applied).toBe(true);
    expect(result.extraStartingHpHeal).toBe(SIMMER_DIM_SOLSTICE_HEAL);
    expect(result.extraCritDamageMultiplier).toBe(SIMMER_DIM_CRIT_DAMAGE_BONUS);
  });

  it('does not mutate the modifiers bag — crit-damage rides the Player accessor', () => {
    const m = defaultModifiers();
    applySimmerDimBlessing('simmer_dim', m);
    expect(m).toEqual(defaultModifiers());
  });

  it('reports stable values across calls (idempotent return shape)', () => {
    const m = defaultModifiers();
    const a = applySimmerDimBlessing('simmer_dim', m);
    const b = applySimmerDimBlessing('simmer_dim', m);
    expect(a.extraStartingHpHeal).toBe(b.extraStartingHpHeal);
    expect(a.extraCritDamageMultiplier).toBe(b.extraCritDamageMultiplier);
  });
});
