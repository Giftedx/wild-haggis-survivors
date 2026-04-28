import { describe, expect, it } from 'vitest';
import { buildCardPool, RUNE_CARD_OFFERS_ENABLED, type Rarity } from './upgrades';
import { buildRuneCards, isRuneConditionGrounded } from './runeCards';
import { RUNES } from './runes';

const groundedCount = Object.values(RUNES).filter(isRuneConditionGrounded).length;

describe('rune rarity + buildRuneCards (U1 Task 11 + M4 alignment)', () => {
  it('"rune" is now a valid Rarity literal', () => {
    const r: Rarity = 'rune';
    expect(r).toBe('rune');
  });

  it('buildRuneCards returns one UpgradeCard per *grounded* rune def, all tagged "rune" rarity', () => {
    const cards = buildRuneCards();
    expect(cards).toHaveLength(groundedCount);
    expect(cards.length).toBeLessThan(Object.keys(RUNES).length);
    for (const c of cards) {
      expect(c.rarity).toBe('rune');
      expect(c.effect.type).toBe('grant_rune');
    }
  });

  it('each rune card id is rune_<id>', () => {
    const cards = buildRuneCards();
    for (const c of cards) {
      expect(c.id).toMatch(/^rune_/);
    }
  });

  it('M4 T113 — ungrounded biome runes are filtered out', () => {
    const cards = buildRuneCards();
    const ids = cards.map((c) => (c.effect as { type: 'grant_rune'; runeId: string }).runeId);
    // These rune IDs reference unshipped biome axes (B5 charter Phase
    // 1-3 will ground them as biomes ship). gloaming_rune graduated
    // 2026-04-28 (B5 Phase 0); seawrack_rune graduated 2026-04-28 too
    // via Loch-as-coastal-foundation (see runeConditions.ts biome_coastal).
    expect(ids).not.toContain('haar_rune');     // biome_fog
    expect(ids).not.toContain('frost_rune');    // biome_cold
    expect(ids).not.toContain('edinburgh_rune'); // biome_urban
    expect(ids).toContain('gloaming_rune');     // biome_dusk — grounded post B5 Phase 0
    expect(ids).toContain('seawrack_rune');     // biome_coastal — grounded via loch
  });

  it('buildCardPool EXCLUDES runes when bossKilledThisRun is false', () => {
    const pool = buildCardPool([], [], {}, [], { bossKilledThisRun: false });
    expect(pool.every((c) => c.rarity !== 'rune')).toBe(true);
  });

  it('U1 M4 — live rune offers ENABLED after consumers wired', () => {
    expect(RUNE_CARD_OFFERS_ENABLED).toBe(true);
    const pool = buildCardPool([], [], {}, [], { bossKilledThisRun: true });
    const runeCards = pool.filter((c) => c.rarity === 'rune');
    expect(runeCards.length).toBe(groundedCount);
  });

  it('buildCardPool includes rune cards only when the rollout gate is explicitly enabled', () => {
    const pool = buildCardPool([], [], {}, [], {
      bossKilledThisRun: true,
      runeOffersEnabled: true,
    });
    const runeCards = pool.filter((c) => c.rarity === 'rune');
    expect(runeCards.length).toBeGreaterThan(0);
    // grounded subset, none owned, none seen — all eligible.
    expect(runeCards).toHaveLength(groundedCount);
  });

  it('buildCardPool excludes already-owned runes when the rollout gate is enabled', () => {
    const pool = buildCardPool([], [], {}, [], {
      bossKilledThisRun: true,
      ownedRuneIds: ['peat_rune', 'thirst_rune'],
      runeOffersEnabled: true,
    });
    const runeIds = pool
      .filter((c) => c.rarity === 'rune')
      .map((c) => (c.effect as { type: 'grant_rune'; runeId: string }).runeId);
    expect(runeIds).not.toContain('peat_rune');
    expect(runeIds).not.toContain('thirst_rune');
    expect(runeIds).toHaveLength(groundedCount - 2);
  });

  it('buildCardPool remains backward compatible when ctx argument is omitted', () => {
    const pool = buildCardPool([], [], {});
    expect(pool.every((c) => c.rarity !== 'rune')).toBe(true);
  });
});
