import { describe, expect, it } from 'vitest';
import {
  DEED_DISPLAY_ORDER,
  computeAllDeeds,
  computeDeedProgress,
  deedSummary,
  formatDeedProgressLabel,
  resolveDeedCardPalette,
  resolveDeedDescription,
  resolveDeedProgressBarStyle,
  resolveDeedsSubtitleStyle,
  DEED_PROGRESS_BAR_UNLOCKED,
  DEED_PROGRESS_BAR_LOCKED,
  type DeedStatsSnapshot,
  type DeedStatus,
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

describe('resolveDeedsSubtitleStyle', () => {
  it('returns the "empty" style when earned is 0', () => {
    const s = resolveDeedsSubtitleStyle(0, 20);
    expect(s.key).toBe('ui.deeds.sub_empty');
    expect(s.color).toBe('#b8a88a');
  });

  it('returns the "complete" gold style when earned equals total', () => {
    const s = resolveDeedsSubtitleStyle(20, 20);
    expect(s.key).toBe('ui.deeds.sub_complete');
    expect(s.color).toBe('#f7d27a');
  });

  it('returns the "partial" style for in-between progress', () => {
    const s = resolveDeedsSubtitleStyle(5, 20);
    expect(s.key).toBe('ui.deeds.sub_partial');
    expect(s.color).toBe('#b8a88a');
  });

  it('does not fire the "complete" branch when total is 0 (no deeds defined)', () => {
    // Edge case: if total is 0 and earned is 0 → empty.
    // If total is 0 but earned somehow > 0 (corrupted save), it should
    // fall through to partial, NOT "complete" — complete is a
    // celebratory state that requires real deeds to exist.
    expect(resolveDeedsSubtitleStyle(0, 0).key).toBe('ui.deeds.sub_empty');
    expect(resolveDeedsSubtitleStyle(1, 0).key).toBe('ui.deeds.sub_partial');
  });

  it('earned > total (shouldn\'t happen, but defensive) reads as complete', () => {
    const s = resolveDeedsSubtitleStyle(25, 20);
    expect(s.key).toBe('ui.deeds.sub_complete');
  });
});

describe('resolveDeedCardPalette', () => {
  const STATUSES: DeedStatus[] = ['locked', 'in_progress', 'unlocked'];

  it('every status returns a complete palette (9 non-null fields)', () => {
    for (const s of STATUSES) {
      const p = resolveDeedCardPalette(s);
      expect(p.bgColor).toBeTypeOf('number');
      expect(p.strokeColor).toBeTypeOf('number');
      expect(p.strokeWidth).toBeTypeOf('number');
      expect(p.strokeAlpha).toBeTypeOf('number');
      expect(p.iconChar.length).toBeGreaterThan(0);
      expect(p.iconColor).toMatch(/^#/);
      expect(p.titleColor).toMatch(/^#/);
      expect(p.statusColor).toMatch(/^#/);
      expect(p.descColor).toMatch(/^#/);
    }
  });

  it('unlocked uses the celebratory gold icon ✦; others use the empty ○', () => {
    expect(resolveDeedCardPalette('unlocked').iconChar).toBe('\u2726');
    expect(resolveDeedCardPalette('in_progress').iconChar).toBe('\u25cb');
    expect(resolveDeedCardPalette('locked').iconChar).toBe('\u25cb');
  });

  it('unlocked has a warmer/wider stroke than in-progress or locked', () => {
    const u = resolveDeedCardPalette('unlocked');
    const p = resolveDeedCardPalette('in_progress');
    const l = resolveDeedCardPalette('locked');
    expect(u.strokeWidth).toBeGreaterThan(p.strokeWidth);
    expect(u.strokeWidth).toBeGreaterThan(l.strokeWidth);
    expect(u.strokeAlpha).toBeGreaterThan(p.strokeAlpha);
  });

  it('unlocked vs locked/in-progress use different bg tints (gold vs slate)', () => {
    const u = resolveDeedCardPalette('unlocked');
    const p = resolveDeedCardPalette('in_progress');
    const l = resolveDeedCardPalette('locked');
    expect(u.bgColor).not.toBe(p.bgColor);
    // locked and in-progress share a bg (cool slate) — differ on stroke.
    expect(p.bgColor).toBe(l.bgColor);
    expect(p.strokeColor).not.toBe(l.strokeColor);
  });

  it('every text colour is distinct across the 3 statuses per field', () => {
    const fields: Array<keyof ReturnType<typeof resolveDeedCardPalette>> = [
      'iconColor', 'titleColor', 'statusColor', 'descColor',
    ];
    for (const field of fields) {
      const values = new Set(STATUSES.map((s) => resolveDeedCardPalette(s)[field]));
      expect(values.size).toBe(STATUSES.length);
    }
  });
});

describe('resolveDeedDescription', () => {
  it('locked binary deed shows the mystery hint in italics', () => {
    const out = resolveDeedDescription({
      status: 'locked',
      isBinary: true,
      fullDescription: 'Kill 1000 enemies',
      mysteryHint: '???',
    });
    expect(out.text).toBe('???');
    expect(out.italic).toBe(true);
  });

  it('in-progress binary deed ALSO shows the mystery hint', () => {
    // Binary deeds have no per-step progress — "not unlocked" is always
    // hidden regardless of the specific pre-unlock status.
    const out = resolveDeedDescription({
      status: 'in_progress',
      isBinary: true,
      fullDescription: 'Kill 1000 enemies',
      mysteryHint: '???',
    });
    expect(out.text).toBe('???');
    expect(out.italic).toBe(true);
  });

  it('unlocked binary deed reveals the real description (not italic)', () => {
    const out = resolveDeedDescription({
      status: 'unlocked',
      isBinary: true,
      fullDescription: 'Kill 1000 enemies',
      mysteryHint: '???',
    });
    expect(out.text).toBe('Kill 1000 enemies');
    expect(out.italic).toBe(false);
  });

  it('threshold (non-binary) deed always shows the real description', () => {
    for (const status of ['locked', 'in_progress', 'unlocked'] as const) {
      const out = resolveDeedDescription({
        status,
        isBinary: false,
        fullDescription: 'Kill 1000 enemies',
        mysteryHint: '???',
      });
      expect(out.text).toBe('Kill 1000 enemies');
      expect(out.italic).toBe(false);
    }
  });
});

describe('resolveDeedProgressBarStyle', () => {
  it('unlocked uses gold fill + label', () => {
    expect(resolveDeedProgressBarStyle(true)).toBe(DEED_PROGRESS_BAR_UNLOCKED);
  });

  it('locked/in-progress uses slate fill + muted label', () => {
    expect(resolveDeedProgressBarStyle(false)).toBe(DEED_PROGRESS_BAR_LOCKED);
  });

  it('unlocked and locked bar styles never share a field', () => {
    expect(DEED_PROGRESS_BAR_UNLOCKED.fillColor).not.toBe(DEED_PROGRESS_BAR_LOCKED.fillColor);
    expect(DEED_PROGRESS_BAR_UNLOCKED.labelColor).not.toBe(DEED_PROGRESS_BAR_LOCKED.labelColor);
  });
});
