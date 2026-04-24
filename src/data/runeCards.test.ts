import { describe, expect, it } from 'vitest';
import { buildCardPool, type Rarity } from './upgrades';
import { buildRuneCards } from './runeCards';
import { RUNES } from './runes';

describe('rune rarity + buildRuneCards (U1 Task 11)', () => {
  it('"rune" is now a valid Rarity literal', () => {
    const r: Rarity = 'rune';
    expect(r).toBe('rune');
  });

  it('buildRuneCards returns one UpgradeCard per rune def, all tagged "rune" rarity', () => {
    const cards = buildRuneCards();
    expect(cards).toHaveLength(Object.keys(RUNES).length);
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

  it('buildCardPool EXCLUDES runes when bossKilledThisRun is false', () => {
    const pool = buildCardPool([], [], {}, [], { bossKilledThisRun: false });
    expect(pool.every((c) => c.rarity !== 'rune')).toBe(true);
  });

  it('buildCardPool INCLUDES rune cards when bossKilledThisRun is true', () => {
    const pool = buildCardPool([], [], {}, [], { bossKilledThisRun: true });
    const runeCards = pool.filter((c) => c.rarity === 'rune');
    expect(runeCards.length).toBeGreaterThan(0);
    // 30 runes, none owned, none seen — all eligible.
    expect(runeCards).toHaveLength(Object.keys(RUNES).length);
  });

  it('buildCardPool excludes already-owned runes even when bossKilled', () => {
    const pool = buildCardPool([], [], {}, [], {
      bossKilledThisRun: true,
      ownedRuneIds: ['haar_rune', 'thirst_rune'],
    });
    const runeIds = pool
      .filter((c) => c.rarity === 'rune')
      .map((c) => (c.effect as { type: 'grant_rune'; runeId: string }).runeId);
    expect(runeIds).not.toContain('haar_rune');
    expect(runeIds).not.toContain('thirst_rune');
    expect(runeIds).toHaveLength(Object.keys(RUNES).length - 2);
  });

  it('buildCardPool remains backward compatible when ctx argument is omitted', () => {
    const pool = buildCardPool([], [], {});
    expect(pool.every((c) => c.rarity !== 'rune')).toBe(true);
  });
});
