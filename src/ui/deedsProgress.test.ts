import { describe, expect, it } from 'vitest';
import {
  DEED_DISPLAY_ORDER,
  computeAllDeeds,
  computeDeedProgress,
  deedSummary,
  formatDeedProgressLabel,
  type DeedStatsSnapshot,
} from './deedsProgress';
import { ACHIEVEMENT_DEFS } from '../core/BalanceConfig';
import { getCodexRosterTotal } from './chronicleAggregates';

function snap(overrides: Partial<DeedStatsSnapshot> = {}): DeedStatsSnapshot {
  return {
    lifetimeKills: 0,
    bestTimeSec: 0,
    victories: 0,
    moorMomentsLifetime: 0,
    unlockedIds: [],
    codexDiscoveredCount: 0,
    uniqueRoutesWalked: 0,
    ceilidhPulsesLifetime: 0,
    bestEndlessSeconds: 0,
    ...overrides,
  };
}

describe('DEED_DISPLAY_ORDER', () => {
  it('covers every defined achievement exactly once', () => {
    const defined = Object.keys(ACHIEVEMENT_DEFS).sort();
    const ordered = [...DEED_DISPLAY_ORDER].sort();
    expect(ordered).toEqual(defined);
  });
});

describe('computeDeedProgress — codex', () => {
  it('ach_codex_half shows progress toward half the roster', () => {
    const roster = getCodexRosterTotal();
    const target = Math.max(1, Math.ceil(roster * 0.5));
    const p = computeDeedProgress('ach_codex_half', snap({ codexDiscoveredCount: Math.max(1, target - 2) }));
    expect(p.target).toBe(target);
    expect(p.status).toBe('in_progress');
  });

  it('ach_codex_loremaster targets full roster size', () => {
    const roster = getCodexRosterTotal();
    const p = computeDeedProgress('ach_codex_loremaster', snap({ codexDiscoveredCount: 1 }));
    expect(p.target).toBe(roster);
    expect(p.status).toBe('in_progress');
  });
});

describe('computeDeedProgress — threshold kills', () => {
  it('0 kills → locked', () => {
    const p = computeDeedProgress('ach_kills_1000', snap());
    expect(p.status).toBe('locked');
    expect(p.current).toBe(0);
    expect(p.ratio).toBe(0);
  });

  it('partial kills → in_progress with correct ratio', () => {
    const p = computeDeedProgress('ach_kills_1000', snap({ lifetimeKills: 250 }));
    expect(p.status).toBe('in_progress');
    expect(p.current).toBe(250);
    expect(p.target).toBe(1000);
    expect(p.ratio).toBeCloseTo(0.25);
  });

  it('overshoot clamps to target', () => {
    const p = computeDeedProgress('ach_kills_1000', snap({ lifetimeKills: 9999, unlockedIds: ['ach_kills_1000'] }));
    expect(p.status).toBe('unlocked');
    expect(p.current).toBe(1000);
    expect(p.ratio).toBe(1);
  });

  it('unlocked id wins even if stats somehow show 0 (data desync)', () => {
    const p = computeDeedProgress('ach_kills_1000', snap({ unlockedIds: ['ach_kills_1000'] }));
    expect(p.status).toBe('unlocked');
  });
});

describe('computeDeedProgress — time thresholds', () => {
  it('ach_survive_5m uses bestTimeSec with 300s target', () => {
    const p = computeDeedProgress('ach_survive_5m', snap({ bestTimeSec: 180 }));
    expect(p.target).toBe(300);
    expect(p.current).toBe(180);
    expect(p.status).toBe('in_progress');
  });

  it('ach_full_run target is 900 seconds', () => {
    const p = computeDeedProgress('ach_full_run', snap({ bestTimeSec: 450 }));
    expect(p.target).toBe(900);
    expect(p.ratio).toBeCloseTo(0.5);
  });
});

describe('computeDeedProgress — binary deeds', () => {
  it.each(['ach_first_evolution', 'ach_defeat_taxman', 'ach_all_bosses'] as const)(
    '%s reports binary + locked when not unlocked',
    (id) => {
      const p = computeDeedProgress(id, snap());
      expect(p.isBinary).toBe(true);
      expect(p.status).toBe('locked');
      expect(p.target).toBe(0);
    },
  );

  it('binary deed reports unlocked when in unlockedIds', () => {
    const p = computeDeedProgress('ach_defeat_taxman', snap({ unlockedIds: ['ach_defeat_taxman'] }));
    expect(p.status).toBe('unlocked');
    expect(p.ratio).toBe(1);
  });
});

describe('computeDeedProgress — first_victory', () => {
  it('0 victories → locked', () => {
    const p = computeDeedProgress('ach_first_victory', snap());
    expect(p.status).toBe('locked');
  });

  it('1 victory → unlocked-or-progress depending on id presence', () => {
    const withoutId = computeDeedProgress('ach_first_victory', snap({ victories: 1 }));
    // Ratio hits 1 but we treat it as in_progress until the AchievementManager
    // writes the id — SaveManager is the source of truth for unlocks.
    expect(withoutId.status).toBe('in_progress');
    expect(withoutId.ratio).toBe(1);

    const withId = computeDeedProgress('ach_first_victory', snap({ victories: 1, unlockedIds: ['ach_first_victory'] }));
    expect(withId.status).toBe('unlocked');
  });
});

describe('computeAllDeeds', () => {
  it('returns one entry per defined achievement in display order', () => {
    const all = computeAllDeeds(snap());
    expect(all).toHaveLength(DEED_DISPLAY_ORDER.length);
    expect(all.map((d) => d.id)).toEqual(DEED_DISPLAY_ORDER);
  });
});

describe('deedSummary', () => {
  it('counts only unlocked deeds known to the display order', () => {
    const s = deedSummary(snap({ unlockedIds: ['ach_kills_1000', 'ach_defeat_taxman', 'unknown_id'] }));
    expect(s.earned).toBe(2);
    expect(s.total).toBe(DEED_DISPLAY_ORDER.length);
  });
});

describe('formatDeedProgressLabel', () => {
  it('renders count/target for kill deeds', () => {
    const p = computeDeedProgress('ach_kills_1000', snap({ lifetimeKills: 400 }));
    expect(formatDeedProgressLabel(p)).toBe('400 / 1000');
  });

  it('renders M:SS for time deeds', () => {
    const p = computeDeedProgress('ach_survive_5m', snap({ bestTimeSec: 75 }));
    expect(formatDeedProgressLabel(p)).toBe('1:15 / 5:00');
  });

  it('returns empty string for binary deeds', () => {
    const p = computeDeedProgress('ach_defeat_taxman', snap());
    expect(formatDeedProgressLabel(p)).toBe('');
  });
});

describe('ach_walk_every_road progress', () => {
  it('tracks uniqueRoutesWalked toward a target of 6', () => {
    const p = computeDeedProgress('ach_walk_every_road', snap({ uniqueRoutesWalked: 4 }));
    expect(p.current).toBe(4);
    expect(p.target).toBe(6);
    expect(p.isBinary).toBe(false);
    expect(p.status).toBe('in_progress');
  });

  it('clamps current to 6 when uniqueRoutesWalked exceeds the target', () => {
    const p = computeDeedProgress('ach_walk_every_road', snap({ uniqueRoutesWalked: 12 }));
    expect(p.current).toBe(6);
  });

  it('reports unlocked when the id is in unlockedIds', () => {
    const p = computeDeedProgress(
      'ach_walk_every_road',
      snap({ uniqueRoutesWalked: 6, unlockedIds: ['ach_walk_every_road'] }),
    );
    expect(p.status).toBe('unlocked');
    expect(p.ratio).toBe(1);
  });
});

describe('ach_past_the_bell — binary', () => {
  it('is binary (no progress bar)', () => {
    const p = computeDeedProgress('ach_past_the_bell', snap());
    expect(p.isBinary).toBe(true);
  });

  it('locked when not in unlockedIds even with bestEndlessSeconds populated', () => {
    const p = computeDeedProgress('ach_past_the_bell', snap({ bestEndlessSeconds: 90 }));
    expect(p.status).toBe('locked');
  });

  it('unlocked when present in unlockedIds', () => {
    const p = computeDeedProgress(
      'ach_past_the_bell',
      snap({ unlockedIds: ['ach_past_the_bell'], bestEndlessSeconds: 5 }),
    );
    expect(p.status).toBe('unlocked');
    expect(p.ratio).toBe(1);
  });
});

describe('ach_endless_endurance — threshold', () => {
  it('targets 60 seconds past the bell', () => {
    const p = computeDeedProgress('ach_endless_endurance', snap({ bestEndlessSeconds: 30 }));
    expect(p.target).toBe(60);
    expect(p.current).toBe(30);
    expect(p.status).toBe('in_progress');
  });

  it('clamps current to 60 once the threshold is met', () => {
    const p = computeDeedProgress('ach_endless_endurance', snap({ bestEndlessSeconds: 600 }));
    expect(p.current).toBe(60);
  });

  it('reports unlocked when in unlockedIds', () => {
    const p = computeDeedProgress(
      'ach_endless_endurance',
      snap({ bestEndlessSeconds: 60, unlockedIds: ['ach_endless_endurance'] }),
    );
    expect(p.status).toBe('unlocked');
  });

  it('formats progress label as M:SS (time-threshold deed)', () => {
    const p = computeDeedProgress('ach_endless_endurance', snap({ bestEndlessSeconds: 30 }));
    expect(formatDeedProgressLabel(p)).toBe('0:30 / 1:00');
  });
});
