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

function snap(overrides: Partial<DeedStatsSnapshot> = {}): DeedStatsSnapshot {
  return {
    lifetimeKills: 0,
    bestTimeSec: 0,
    victories: 0,
    unlockedIds: [],
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
