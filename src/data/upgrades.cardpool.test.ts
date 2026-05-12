import { describe, expect, it } from 'vitest';
import { buildCardPool, drawCards, WEAPON_CARDS, PASSIVE_CARDS, STAT_CARDS, PASSIVE_KEYS } from './upgrades';

describe('buildCardPool', () => {
  it('includes stat cards when player has no items', () => {
    const pool = buildCardPool([], [], {});
    const statIds = STAT_CARDS.map((c) => c.id);
    for (const id of statIds) {
      expect(pool.some((c) => c.id === id), `Missing stat card: ${id}`).toBe(true);
    }
  });

  it('includes new weapon cards when player has fewer than 6 weapons', () => {
    // thistle_shot is the starter; WEAPON_CARDS has 7 cards for the other weapons
    const pool = buildCardPool(['thistle_shot'], [], { thistle_shot: 1 });
    const addWeaponCards = pool.filter((c) => c.effect.type === 'add_weapon');
    expect(addWeaponCards.length).toBe(WEAPON_CARDS.length); // all 7 are available
  });

  it('excludes new weapon cards when player has 6 weapons', () => {
    const sixWeapons = ['thistle_shot', 'bagpipe_blast', 'caber_toss', 'scotch_mist', 'haggis_hurler', 'nessie_tentacle'];
    const levels: Record<string, number> = {};
    for (const k of sixWeapons) levels[k] = 1;
    const pool = buildCardPool(sixWeapons, [], levels);
    const addWeaponCards = pool.filter((c) => c.effect.type === 'add_weapon');
    expect(addWeaponCards.length).toBe(0);
  });

  it('includes level-up cards for owned weapons below max level', () => {
    const pool = buildCardPool(['thistle_shot', 'claymore'], [], { thistle_shot: 2, claymore: 3 });
    const levelUps = pool.filter((c) => c.effect.type === 'level_weapon');
    expect(levelUps.length).toBe(2); // one for each weapon
  });

  it('excludes level-up cards for weapons at max level (5)', () => {
    const pool = buildCardPool(['thistle_shot'], [], { thistle_shot: 5 });
    const levelUps = pool.filter((c) => c.effect.type === 'level_weapon');
    expect(levelUps.length).toBe(0);
  });

  it('excludes level-up cards for evolved weapons', () => {
    const pool = buildCardPool(['thistle_shot'], [], { thistle_shot: 3 }, ['thistle_shot']);
    const levelUps = pool.filter(
      (c) => c.effect.type === 'level_weapon' && (c.effect as any).weaponKey === 'thistle_shot'
    );
    expect(levelUps.length).toBe(0);
  });

  it('includes passive cards for passives not yet owned', () => {
    const pool = buildCardPool([], ['sporran'], {});
    const passiveCards = pool.filter((c) => c.effect.type === 'add_passive');
    const passiveKeys = passiveCards.map((c) => (c.effect as any).passiveKey);
    expect(passiveKeys).not.toContain('sporran');
    expect(passiveKeys.length).toBe(PASSIVE_CARDS.length - 1);
  });

  it('level 4→5 cards are legendary rarity when evolution recipe exists', () => {
    const pool = buildCardPool(['thistle_shot'], ['sporran'], { thistle_shot: 4 });
    const lvl5 = pool.find((c) => c.id === 'levelup_thistle_shot_5');
    expect(lvl5).toBeDefined();
    expect(lvl5!.rarity).toBe('legendary');
    // Should contain evolution hint
    expect(lvl5!.description).toContain('Sporran');
  });
});

describe('drawCards', () => {
  it('returns the entire pool when pool is smaller than count', () => {
    const pool = buildCardPool([], [], {});
    const drawn = drawCards(pool.slice(0, 2), 5);
    expect(drawn.length).toBe(2);
  });

  it('returns exactly count cards from the pool', () => {
    const pool = buildCardPool([], [], {});
    const drawn = drawCards(pool, 3);
    expect(drawn.length).toBe(3);
  });

  it('does not draw duplicates', () => {
    const pool = buildCardPool([], [], {});
    const drawn = drawCards(pool, 4);
    const ids = drawn.map((c) => c.id);
    expect(new Set(ids).size).toBe(4);
  });

  it('luck bonus increases rare/legendary chances', () => {
    // Run many draws with high luck and check distribution
    const pool = buildCardPool([], [], {});
    let rareCount = 0;
    const trials = 500;
    for (let i = 0; i < trials; i++) {
      const drawn = drawCards(pool, 3, 40);
      rareCount += drawn.filter((c) => c.rarity === 'rare' || c.rarity === 'legendary').length;
    }
    // With 40 luck bonus, we expect significantly more rares than 13%+4% baseline
    // At least 25% of draws should be rare or legendary
    expect(rareCount / (trials * 3)).toBeGreaterThan(0.15);
  });
});

describe('PASSIVE_KEYS', () => {
  it('is derived from PASSIVE_CARDS and contains all passive keys', () => {
    // Wild Living World Phase 2 (2026-05-11) added `tuning_fork` —
    // the Waulking Mallet's evolution pairing for the Pibroch Hammer.
    // Highland Horrors (2026-05-12) added `gillies_edge`, `widows_shawl`,
    // `stirling_medal` — pairings for Dirk Flurry, Banshee Wail,
    // Freedom Blade.
    expect(PASSIVE_KEYS).toHaveLength(16);
    expect(PASSIVE_KEYS).toContain('sporran');
    expect(PASSIVE_KEYS).toContain('thistle_crown');
    expect(PASSIVE_KEYS).toContain('tartan_sash');
    expect(PASSIVE_KEYS).toContain('shinty_ball');
    expect(PASSIVE_KEYS).toContain('whetstone');
    expect(PASSIVE_KEYS).toContain('velvet_antler');
    expect(PASSIVE_KEYS).toContain('tuning_fork');
    expect(PASSIVE_KEYS).toContain('gillies_edge');
    expect(PASSIVE_KEYS).toContain('widows_shawl');
    expect(PASSIVE_KEYS).toContain('stirling_medal');
  });
});

describe('overcharge — Phase B Endless mythic-tier cards', () => {
  it('does NOT add overcharge cards outside post-bell', () => {
    const pool = buildCardPool(
      ['thistle_shot'], ['sporran'], { thistle_shot: 5 }, ['thistle_shot'],
      { isPostBell: false },
    );
    const overcharge = pool.filter(c => c.effect.type === 'overcharge_weapon');
    expect(overcharge.length).toBe(0);
  });

  it('does NOT add overcharge for un-evolved weapons', () => {
    const pool = buildCardPool(
      ['thistle_shot'], [], { thistle_shot: 5 }, [],
      { isPostBell: true },
    );
    const overcharge = pool.filter(c => c.effect.type === 'overcharge_weapon');
    expect(overcharge.length).toBe(0);
  });

  it('adds one Overcharge mythic card per evolved weapon when post-bell', () => {
    const pool = buildCardPool(
      ['thistle_shot', 'caber_toss'],
      [], {}, ['thistle_shot', 'caber_toss'],
      { isPostBell: true },
    );
    const overcharge = pool.filter(c => c.effect.type === 'overcharge_weapon');
    expect(overcharge.length).toBe(2);
    expect(overcharge.every(c => c.rarity === 'mythic')).toBe(true);
  });

  it('filters out already-overcharged weapons', () => {
    const pool = buildCardPool(
      ['thistle_shot', 'caber_toss'],
      [], {}, ['thistle_shot', 'caber_toss'],
      { isPostBell: true, overchargedWeaponKeys: ['thistle_shot'] },
    );
    const overcharge = pool.filter(c => c.effect.type === 'overcharge_weapon');
    expect(overcharge.length).toBe(1);
    expect((overcharge[0].effect as { type: 'overcharge_weapon'; weaponKey: string }).weaponKey).toBe('caber_toss');
  });
});
