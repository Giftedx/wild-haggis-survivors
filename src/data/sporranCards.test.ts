import { describe, expect, it } from 'vitest';
import { ALL_SPORRAN_CARDS, SPORRAN_CARD_IDS } from './sporranCards';
import { defaultModifiers } from '../core/RunModifiers';

// ---------------------------------------------------------------------------
// Pool integrity
// ---------------------------------------------------------------------------

describe('ALL_SPORRAN_CARDS pool', () => {
  it('has 22 cards (5 curse + 4 boon + 3 quirk + 2 rare + 4 seasonal + 4 variant)', () => {
    expect(ALL_SPORRAN_CARDS).toHaveLength(22);
  });

  it('has no duplicate IDs', () => {
    const ids = ALL_SPORRAN_CARDS.map((c) => c.id);
    expect(ids).toHaveLength(new Set(ids).size);
  });

  it('every card has a nameKey and descKey', () => {
    for (const card of ALL_SPORRAN_CARDS) {
      expect(typeof card.nameKey).toBe('string');
      expect(typeof card.descKey).toBe('string');
    }
  });

  it('every card has a valid kind', () => {
    const validKinds = new Set(['curse', 'boon', 'quirk']);
    for (const card of ALL_SPORRAN_CARDS) {
      expect(validKinds).toContain(card.kind);
    }
  });
});

describe('SPORRAN_CARD_IDS', () => {
  it('size matches ALL_SPORRAN_CARDS length', () => {
    expect(SPORRAN_CARD_IDS.size).toBe(ALL_SPORRAN_CARDS.length);
  });

  it('contains every card id from ALL_SPORRAN_CARDS', () => {
    for (const card of ALL_SPORRAN_CARDS) {
      expect(SPORRAN_CARD_IDS.has(card.id)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Card kinds by id
// ---------------------------------------------------------------------------

describe('card kind classification', () => {
  it('curse cards have kind curse', () => {
    const curseCands = ['curse_heavy_legs', 'curse_thin_hide', 'curse_restless_spirits', 'curse_empty_larder', 'curse_windless_pipes'];
    for (const id of curseCands) {
      const card = ALL_SPORRAN_CARDS.find((c) => c.id === id);
      expect(card?.kind).toBe('curse');
    }
  });

  it('boon_shortbread has kind boon', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'boon_shortbread')!;
    expect(card.kind).toBe('boon');
  });

  it('quirk cards have kind quirk', () => {
    const quirkIds = ['quirk_light_step', 'quirk_hardy_breath', 'quirk_haggis_blooded'];
    for (const id of quirkIds) {
      const card = ALL_SPORRAN_CARDS.find((c) => c.id === id)!;
      expect(card.kind).toBe('quirk');
    }
  });

  it('rare deed cards have kind quirk', () => {
    for (const id of ['rare_taxman_grudge', 'rare_witchs_thread']) {
      const card = ALL_SPORRAN_CARDS.find((c) => c.id === id)!;
      expect(card.kind).toBe('quirk');
    }
  });
});

// ---------------------------------------------------------------------------
// Boon card apply effects
// ---------------------------------------------------------------------------

describe('boon_shortbread apply', () => {
  it('heals 20 starting HP and no damage multiplier', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'boon_shortbread')!;
    const m = defaultModifiers();
    const result = card.apply(m);
    expect(result.extraStartingHpHeal).toBe(20);
    expect(result.extraDamageMultiplier).toBe(0);
  });

  it('does not mutate the modifier bag', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'boon_shortbread')!;
    const m = defaultModifiers();
    card.apply(m);
    expect(m.moveSpeedMult).toBe(1);
    expect(m.goldMult).toBe(1);
  });
});

describe('boon_whisky apply', () => {
  it('increases spawnIntervalMult by 5%', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'boon_whisky')!;
    const m = defaultModifiers();
    card.apply(m);
    expect(m.spawnIntervalMult).toBeCloseTo(1.05);
  });
});

describe('boon_coal apply', () => {
  it('reduces damageTakenMult by 3%', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'boon_coal')!;
    const m = defaultModifiers();
    card.apply(m);
    expect(m.damageTakenMult).toBeCloseTo(0.97);
  });
});

describe('boon_silver apply', () => {
  it('increases goldMult by 10%', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'boon_silver')!;
    const m = defaultModifiers();
    card.apply(m);
    expect(m.goldMult).toBeCloseTo(1.10);
  });
});

// ---------------------------------------------------------------------------
// Quirk card apply effects
// ---------------------------------------------------------------------------

describe('quirk_light_step apply', () => {
  it('increases moveSpeedMult and damageTakenMult by 5%', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'quirk_light_step')!;
    const m = defaultModifiers();
    card.apply(m);
    expect(m.moveSpeedMult).toBeCloseTo(1.05);
    expect(m.damageTakenMult).toBeCloseTo(1.05);
  });
});

describe('quirk_hardy_breath apply', () => {
  it('increases startHpRatio by 10% and reduces moveSpeedMult by 3%', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'quirk_hardy_breath')!;
    const m = defaultModifiers();
    card.apply(m);
    expect(m.startHpRatio).toBeCloseTo(1.10);
    expect(m.moveSpeedMult).toBeCloseTo(0.97);
  });
});

describe('quirk_haggis_blooded apply', () => {
  it('returns extraDamageMultiplier of 0.12', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'quirk_haggis_blooded')!;
    const m = defaultModifiers();
    const result = card.apply(m);
    expect(result.extraDamageMultiplier).toBeCloseTo(0.12);
  });

  it('increases damageTakenMult by 12%', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'quirk_haggis_blooded')!;
    const m = defaultModifiers();
    card.apply(m);
    expect(m.damageTakenMult).toBeCloseTo(1.12);
  });
});

// ---------------------------------------------------------------------------
// Rare deed card apply effects
// ---------------------------------------------------------------------------

describe('rare_taxman_grudge apply', () => {
  it('increases goldMult by 20% and reduces startHpRatio by 10%', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'rare_taxman_grudge')!;
    const m = defaultModifiers();
    card.apply(m);
    expect(m.goldMult).toBeCloseTo(1.20);
    expect(m.startHpRatio).toBeCloseTo(0.90);
  });
});

describe('rare_witchs_thread apply', () => {
  it('returns extraDamageMultiplier of 0.14 and increases damageTakenMult by 14%', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'rare_witchs_thread')!;
    const m = defaultModifiers();
    const result = card.apply(m);
    expect(result.extraDamageMultiplier).toBeCloseTo(0.14);
    expect(m.damageTakenMult).toBeCloseTo(1.14);
  });
});

// ---------------------------------------------------------------------------
// Seasonal card apply effects
// ---------------------------------------------------------------------------

describe('seasonal_burns_dram apply', () => {
  it('heals 20 starting HP and adds 0.05 damage multiplier', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'seasonal_burns_dram')!;
    const m = defaultModifiers();
    const result = card.apply(m);
    expect(result.extraStartingHpHeal).toBe(20);
    expect(result.extraDamageMultiplier).toBeCloseTo(0.05);
  });
});

describe('seasonal_samhain_lantern apply', () => {
  it('increases spawnIntervalMult by 5% and heals 15 HP', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'seasonal_samhain_lantern')!;
    const m = defaultModifiers();
    const result = card.apply(m);
    expect(m.spawnIntervalMult).toBeCloseTo(1.05);
    expect(result.extraStartingHpHeal).toBe(15);
  });
});

describe('seasonal_hogmanay_coal apply', () => {
  it('reduces weaponCooldownMult by 8% and increases damageTakenMult by 7%', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'seasonal_hogmanay_coal')!;
    const m = defaultModifiers();
    card.apply(m);
    expect(m.weaponCooldownMult).toBeCloseTo(0.92);
    expect(m.damageTakenMult).toBeCloseTo(1.07);
  });
});

describe('seasonal_beltane_spark apply', () => {
  it('returns extraDamageMultiplier of 0.12 and reduces startHpRatio by 8%', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'seasonal_beltane_spark')!;
    const m = defaultModifiers();
    const result = card.apply(m);
    expect(result.extraDamageMultiplier).toBeCloseTo(0.12);
    expect(m.startHpRatio).toBeCloseTo(0.92);
  });
});

// ---------------------------------------------------------------------------
// Variant card apply effects
// ---------------------------------------------------------------------------

describe('variant_cailleach_frost apply', () => {
  it('reduces moveSpeedMult by 5% and returns 0.08 extraDamageMultiplier', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'variant_cailleach_frost')!;
    const m = defaultModifiers();
    const result = card.apply(m);
    expect(m.moveSpeedMult).toBeCloseTo(0.95);
    expect(result.extraDamageMultiplier).toBeCloseTo(0.08);
  });
});

describe('variant_glaswegian_buckie apply', () => {
  it('increases damageTakenMult by 6% and returns 0.06 extraDamageMultiplier', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'variant_glaswegian_buckie')!;
    const m = defaultModifiers();
    const result = card.apply(m);
    expect(m.damageTakenMult).toBeCloseTo(1.06);
    expect(result.extraDamageMultiplier).toBeCloseTo(0.06);
  });
});

describe('variant_selkie_sealskin apply', () => {
  it('increases moveSpeedMult by 9% and increases weaponCooldownMult by 6%', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'variant_selkie_sealskin')!;
    const m = defaultModifiers();
    card.apply(m);
    expect(m.moveSpeedMult).toBeCloseTo(1.09);
    expect(m.weaponCooldownMult).toBeCloseTo(1.06);
  });
});

// ---------------------------------------------------------------------------
// Eligibility metadata
// ---------------------------------------------------------------------------

describe('eligibility metadata', () => {
  it('rare_taxman_grudge gates on deed condition victories:1', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'rare_taxman_grudge')!;
    expect(card.eligibility?.type).toBe('deed');
    if (card.eligibility?.type === 'deed') {
      expect(card.eligibility.condition.type).toBe('victories');
      expect(card.eligibility.condition.required).toBe(1);
    }
  });

  it('rare_witchs_thread gates on deed condition cursed_victories:5', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'rare_witchs_thread')!;
    expect(card.eligibility?.type).toBe('deed');
    if (card.eligibility?.type === 'deed') {
      expect(card.eligibility.condition.type).toBe('cursed_victories');
      expect(card.eligibility.condition.required).toBe(5);
    }
  });

  it('seasonal_burns_dram gates on burns_night event', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'seasonal_burns_dram')!;
    expect(card.eligibility?.type).toBe('seasonal');
    if (card.eligibility?.type === 'seasonal') {
      expect(card.eligibility.eventKey).toBe('burns_night');
    }
  });

  it('variant_cailleach_frost gates on cailleach variant', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'variant_cailleach_frost')!;
    expect(card.eligibility?.type).toBe('variant');
    if (card.eligibility?.type === 'variant') {
      expect(card.eligibility.variantKey).toBe('cailleach');
    }
  });

  it('base cards (boon_shortbread) have no eligibility gate', () => {
    const card = ALL_SPORRAN_CARDS.find((c) => c.id === 'boon_shortbread')!;
    expect(card.eligibility).toBeUndefined();
  });
});
