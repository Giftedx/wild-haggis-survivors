import { describe, expect, it } from 'vitest';
import { buildCardPool, RUNE_CARD_OFFERS_ENABLED, type Rarity } from './upgrades';
import { buildRuneCards, isRuneConditionGrounded } from './runeCards';
import { RUNES } from './runes';

const groundedCount = Object.values(RUNES).filter(isRuneConditionGrounded).length;
const cardRuneIds = () => buildRuneCards().map((c) => (c.effect as { type: 'grant_rune'; runeId: string }).runeId);

describe('rune rarity + buildRuneCards (U1 Task 11 + M4 alignment)', () => {
  it('"rune" is now a valid Rarity literal', () => {
    const r: Rarity = 'rune';
    expect(r).toBe('rune');
  });

  it('buildRuneCards returns one UpgradeCard per *grounded* rune def, all tagged "rune" rarity', () => {
    const cards = buildRuneCards();
    expect(cards).toHaveLength(groundedCount);
    expect(groundedCount).toBeLessThan(Object.keys(RUNES).length);
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
    const ids = cardRuneIds();
    // biome_urban grounded via glasgow_close (B6). No biome runes
    // remain on UNGROUNDED_CONDITION_KEYS in this build.
    expect(ids).toContain('edinburgh_rune');   // biome_urban → glasgow_close
    expect(ids).toContain('gloaming_rune');     // biome_dusk — grounded post B5 Phase 0
    expect(ids).toContain('seawrack_rune');     // biome_coastal — grounded post B5 Phase 1a
    expect(ids).toContain('haar_rune');         // biome_fog — grounded post B5 Phase 1b
    expect(ids).toContain('frost_rune');        // biome_cold — grounded post B5 Phase 2
  });

  it('M4 T113 — hides rune cards whose runtime signal is still unwired', () => {
    const ids = cardRuneIds();
    expect(ids).not.toContain('cairn_rune');          // near_cairn
    expect(ids).not.toContain('fastburn_rune');       // dash_recent_2s
    expect(ids).not.toContain('echo_rune');           // every_nth_kill:10
    expect(ids).not.toContain('cascade_rune');        // kill_cascade
    expect(ids).not.toContain('chorus_rune');         // three_types_in_5s
    expect(ids).not.toContain('storm_rune');          // crit_on_weakened
    expect(ids).not.toContain('ceilidh_chain_rune');  // pickup_chain_5s
    expect(ids).not.toContain('drift_rune');          // dashed_5s_ago
    expect(ids).not.toContain('thistle_crown_rune');  // kill_on_thistle
    expect(ids).not.toContain('song_rune');           // music_bass_active
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
