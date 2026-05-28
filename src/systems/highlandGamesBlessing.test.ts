import { describe, it, expect } from 'vitest';
import { applyHighlandGamesBlessing, HIGHLAND_GAMES_MAX_HP_BONUS, HIGHLAND_GAMES_HEAL } from './highlandGamesBlessing';

const INERT = {} as Parameters<typeof applyHighlandGamesBlessing>[1];

describe('applyHighlandGamesBlessing', () => {
  it('returns applied=false for non-highland_games events', () => {
    expect(applyHighlandGamesBlessing(null, INERT).applied).toBe(false);
    expect(applyHighlandGamesBlessing('lammas', INERT).applied).toBe(false);
    expect(applyHighlandGamesBlessing('burns_night', INERT).applied).toBe(false);
  });

  it('returns applied=true with correct bonuses for highland_games', () => {
    const result = applyHighlandGamesBlessing('highland_games', INERT);
    expect(result.applied).toBe(true);
    expect(result.extraMaxHp).toBe(HIGHLAND_GAMES_MAX_HP_BONUS);
    expect(result.extraStartingHpHeal).toBe(HIGHLAND_GAMES_HEAL);
  });

  it('zeroes all bonuses when not applied', () => {
    const result = applyHighlandGamesBlessing('glorious_twelfth', INERT);
    expect(result.extraMaxHp).toBe(0);
    expect(result.extraStartingHpHeal).toBe(0);
  });
});
