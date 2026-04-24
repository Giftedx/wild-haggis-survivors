import { describe, expect, it } from 'vitest';
import {
  TROPHY_BOSS_KEYS,
  TROPHY_TIER_TENTH_THRESHOLD,
  computeAllTrophies,
  computeTrophy,
  computeTrophyTier,
  countEarnedTrophies,
  type TrophySaveView,
} from './CroftTrophies';

const empty: TrophySaveView = {
  bossKillCounts: {},
  cursedVictoriesByBoss: {},
};

function saveWith(overrides: Partial<TrophySaveView> = {}): TrophySaveView {
  return {
    bossKillCounts: { ...(overrides.bossKillCounts ?? {}) },
    cursedVictoriesByBoss: { ...(overrides.cursedVictoriesByBoss ?? {}) },
  };
}

describe('CroftTrophies — tier logic', () => {
  it('returns "none" when the boss has never been killed', () => {
    expect(computeTrophyTier('gordon', empty)).toBe('none');
  });

  it('promotes to "first" on a single kill', () => {
    expect(
      computeTrophyTier('gordon', saveWith({ bossKillCounts: { gordon: 1 } })),
    ).toBe('first');
  });

  it('stays at "first" up to but not including the tenth-tier threshold', () => {
    const below = TROPHY_TIER_TENTH_THRESHOLD - 1;
    expect(
      computeTrophyTier('gordon', saveWith({ bossKillCounts: { gordon: below } })),
    ).toBe('first');
  });

  it('promotes to "tenth" at exactly the threshold', () => {
    expect(
      computeTrophyTier(
        'gordon',
        saveWith({ bossKillCounts: { gordon: TROPHY_TIER_TENTH_THRESHOLD } }),
      ),
    ).toBe('tenth');
  });

  it('promotes to "cursed" as the highest tier (beats tenth even at 50 kills)', () => {
    expect(
      computeTrophyTier(
        'gordon',
        saveWith({
          bossKillCounts: { gordon: 50 },
          cursedVictoriesByBoss: { gordon: 1 },
        }),
      ),
    ).toBe('cursed');
  });

  it('promotes to "cursed" even on low kill counts (the accolade outranks volume)', () => {
    expect(
      computeTrophyTier(
        'the_laird',
        saveWith({
          bossKillCounts: { the_laird: 1 },
          cursedVictoriesByBoss: { the_laird: 1 },
        }),
      ),
    ).toBe('cursed');
  });
});

describe('CroftTrophies — computeTrophy snapshot', () => {
  it('returns the killCount + cursedWinCount alongside the tier', () => {
    const save = saveWith({
      bossKillCounts: { taxman: 4 },
      cursedVictoriesByBoss: { taxman: 2 },
    });
    const trophy = computeTrophy('taxman', save);
    expect(trophy).toEqual({
      bossKey: 'taxman',
      tier: 'cursed',
      killCount: 4,
      cursedWinCount: 2,
    });
  });

  it('fills zero for missing keys', () => {
    const trophy = computeTrophy('gordon', empty);
    expect(trophy.killCount).toBe(0);
    expect(trophy.cursedWinCount).toBe(0);
    expect(trophy.tier).toBe('none');
  });
});

describe('CroftTrophies — computeAllTrophies ordering', () => {
  it('returns one trophy per canonical boss key, in TROPHY_BOSS_KEYS order', () => {
    const trophies = computeAllTrophies(empty);
    expect(trophies.map((t) => t.bossKey)).toEqual([...TROPHY_BOSS_KEYS]);
  });

  it('covers all 5 shipped bosses', () => {
    expect(TROPHY_BOSS_KEYS.length).toBe(5);
    expect(new Set(TROPHY_BOSS_KEYS).size).toBe(5);
  });
});

describe('CroftTrophies — countEarnedTrophies', () => {
  it('is 0 when no boss has been killed', () => {
    expect(countEarnedTrophies(empty)).toBe(0);
  });

  it('counts each tier > none as one earned slot', () => {
    const save = saveWith({
      bossKillCounts: {
        gordon: 1,
        tour_bus: TROPHY_TIER_TENTH_THRESHOLD,
        the_laird: 0,
      },
      cursedVictoriesByBoss: {
        hunter_general: 1,
      },
    });
    // gordon first + tour_bus tenth + hunter_general cursed = 3 slots filled
    expect(countEarnedTrophies(save)).toBe(3);
  });

  it('never exceeds the canonical boss count', () => {
    const save = saveWith({
      bossKillCounts: {
        gordon: 100, tour_bus: 100, the_laird: 100, hunter_general: 100, taxman: 100,
        // Junk key: should not count, since it's not in TROPHY_BOSS_KEYS.
        rando_unknown: 999,
      },
    });
    expect(countEarnedTrophies(save)).toBe(TROPHY_BOSS_KEYS.length);
  });
});
