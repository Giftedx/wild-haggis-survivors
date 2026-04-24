import { describe, expect, it } from 'vitest';
import {
  buildChronicleCodex,
  computeIronmoorStats,
  computeMilestones,
  computeMoorRoadKillCriteria,
  countUniqueRouteKeys,
  findLastSeededRun,
  detectMood,
  formatChronicleMilestoneLines,
  formatChronicleRunSubLine,
  formatClock,
  formatCodexNamesLine,
  formatDurationLong,
  formatIronmoorLine,
  formatMoorRoadStatus,
  formatRelativeTime,
  formatRouteBreadcrumb,
  getCodexRosterTotal,
  lifetimeTotals,
  moodColor,
  moodSubtitleKey,
  resolveChronicleMilestonesDensityStyle,
  selectRunsWithRoutes,
  CHRONICLE_MILESTONES_DENSE_THRESHOLD,
  type ChronicleMood,
  type Milestones,
} from './chronicleAggregates';
import type { RunHistoryEntry, SaveData } from '../utils/save';
import type { RoutePick } from '../data/routes';

function entry(overrides: Partial<RunHistoryEntry> = {}): RunHistoryEntry {
  return {
    timestamp: 1_000_000,
    timeSurvivedSec: 120,
    enemiesKilled: 50,
    level: 5,
    bossKills: 1,
    goldEarned: 30,
    bestCombo: 6,
    variantKey: 'classic',
    isVictory: false,
    weaponKeys: ['thistle_shot'],
    ...overrides,
  };
}

function save(overrides: Partial<SaveData> = {}): SaveData {
  return {
    schemaVersion: 3,
    gold: 0,
    upgrades: {},
    unlockedVariants: ['classic'],
    selectedVariant: 'classic',
    totalRuns: 0,
    bestTime: 0,
    bestKills: 0,
    totalKills: 0,
    totalGoldEarned: 0,
    bestCombo: 0,
    victories: 0,
    cursedVictoriesCompleted: 0,
    runsWithoutHealingCircleCompleted: 0,
    runsInCoastalOnlyCompleted: 0,
    runsWithAllEvolutionsCompleted: 0,
    burnsNightFullEvoRunsCompleted: 0,
    bossKillCounts: {},
    firstRouteVisits: [],
    cursedVictoriesByBoss: {},
    runHistory: [],
    seenEnemies: [],
    firstTimeEventsFired: [],
    discoveryLog: {
      beastiesSeen: {},
      routesVisited: {},
      findsAcquired: {},
      banterHeard: {},
      almanacVisits: 0,
    },
    settings: { soundOn: true, musicOn: true },
    ...overrides,
  };
}

describe('lifetimeTotals', () => {
  it('returns authoritative counters and a derived win rate', () => {
    const s = save({ totalRuns: 10, victories: 3, totalKills: 500, totalGoldEarned: 200, bestTime: 300, bestKills: 80, bestCombo: 12,
      runHistory: [entry({ timeSurvivedSec: 60 }), entry({ timeSurvivedSec: 90 })] });
    const t = lifetimeTotals(s);
    expect(t.totalRuns).toBe(10);
    expect(t.victories).toBe(3);
    expect(t.winRate).toBeCloseTo(0.3);
    expect(t.timeOnMoorSec).toBe(150);
    expect(t.bestTimeSec).toBe(300);
  });

  it('zero runs → 0 win rate (no NaN)', () => {
    const t = lifetimeTotals(save());
    expect(t.winRate).toBe(0);
  });
});

describe('computeMilestones', () => {
  it('empty history → null fields and zero streaks', () => {
    const m = computeMilestones([]);
    expect(m.firstVictory).toBeNull();
    expect(m.longestRun).toBeNull();
    expect(m.favoriteVariantKey).toBeNull();
    expect(m.currentWinStreak).toBe(0);
    expect(m.currentLossStreak).toBe(0);
  });

  it('picks longest, most-kills, highest-combo correctly', () => {
    const h = [
      entry({ timeSurvivedSec: 60, enemiesKilled: 20, bestCombo: 4 }),
      entry({ timeSurvivedSec: 180, enemiesKilled: 50, bestCombo: 8 }),
      entry({ timeSurvivedSec: 120, enemiesKilled: 90, bestCombo: 6 }),
    ];
    const m = computeMilestones(h);
    expect(m.longestRun?.timeSurvivedSec).toBe(180);
    expect(m.mostKills?.enemiesKilled).toBe(90);
    expect(m.highestCombo?.bestCombo).toBe(8);
  });

  it('firstVictory returns the earliest victory, not latest', () => {
    const h = [
      entry({ timestamp: 100 }),
      entry({ timestamp: 200, isVictory: true, timeSurvivedSec: 300 }),
      entry({ timestamp: 300, isVictory: true, timeSurvivedSec: 500 }),
    ];
    const m = computeMilestones(h);
    expect(m.firstVictory?.timestamp).toBe(200);
  });

  it('favoriteVariant = most played variant', () => {
    const h = [
      entry({ variantKey: 'classic' }),
      entry({ variantKey: 'moor_runner' }),
      entry({ variantKey: 'moor_runner' }),
      entry({ variantKey: 'moor_runner' }),
      entry({ variantKey: 'classic' }),
    ];
    const m = computeMilestones(h);
    expect(m.favoriteVariantKey).toBe('moor_runner');
    expect(m.favoriteVariantCount).toBe(3);
  });

  it('favoriteWeapon dedupes duplicates within a single run', () => {
    const h = [
      entry({ weaponKeys: ['thistle_shot', 'thistle_shot', 'bagpipes'] }),
      entry({ weaponKeys: ['bagpipes', 'caber_toss'] }),
      entry({ weaponKeys: ['bagpipes'] }),
    ];
    const m = computeMilestones(h);
    expect(m.favoriteWeaponKey).toBe('bagpipes');
    expect(m.favoriteWeaponCount).toBe(3);
  });

  it('counts current trailing win streak', () => {
    const h = [
      entry({ isVictory: false }),
      entry({ isVictory: true }),
      entry({ isVictory: true }),
      entry({ isVictory: true }),
    ];
    const m = computeMilestones(h);
    expect(m.currentWinStreak).toBe(3);
    expect(m.currentLossStreak).toBe(0);
  });

  it('counts current trailing loss streak only when most recent is a loss', () => {
    const h = [
      entry({ isVictory: true }),
      entry({ isVictory: false }),
      entry({ isVictory: false }),
    ];
    const m = computeMilestones(h);
    expect(m.currentWinStreak).toBe(0);
    expect(m.currentLossStreak).toBe(2);
  });
});

describe('detectMood', () => {
  it('empty → empty', () => expect(detectMood([])).toBe('empty'));
  it('single entry → first_run', () => expect(detectMood([entry()])).toBe('first_run'));

  it('victory_streak beats fresh_victory when 2+ wins in a row', () => {
    const h = [entry({ isVictory: false }), entry({ isVictory: true }), entry({ isVictory: true })];
    expect(detectMood(h)).toBe('victory_streak');
  });

  it('loss_streak kicks in at 3+ consecutive losses', () => {
    const h = [entry({ isVictory: true }), entry({ isVictory: false }), entry({ isVictory: false }), entry({ isVictory: false })];
    expect(detectMood(h)).toBe('loss_streak');
  });

  it('fresh_victory when only last run is a win', () => {
    const h = [entry({ isVictory: false }), entry({ isVictory: false }), entry({ isVictory: true })];
    expect(detectMood(h)).toBe('fresh_victory');
  });

  it('improving when recent avg is >10% over overall', () => {
    // Need >5 entries so slice(-5) is a proper subset of overall.
    // Mixed isVictory so loss_streak / fresh_victory don't short-circuit trend.
    const h = [
      entry({ timeSurvivedSec: 40, isVictory: false }),
      entry({ timeSurvivedSec: 40, isVictory: true }),
      entry({ timeSurvivedSec: 40, isVictory: false }),
      entry({ timeSurvivedSec: 200, isVictory: true }),
      entry({ timeSurvivedSec: 200, isVictory: false }),
      entry({ timeSurvivedSec: 200, isVictory: true }),
      entry({ timeSurvivedSec: 200, isVictory: false }),
    ];
    expect(detectMood(h)).toBe('improving');
  });

  it('declining when recent avg is <90% of overall', () => {
    const h = [
      entry({ timeSurvivedSec: 200, isVictory: true }),
      entry({ timeSurvivedSec: 200, isVictory: false }),
      entry({ timeSurvivedSec: 200, isVictory: true }),
      entry({ timeSurvivedSec: 200, isVictory: false }),
      entry({ timeSurvivedSec: 40, isVictory: true }),
      entry({ timeSurvivedSec: 40, isVictory: false }),
      entry({ timeSurvivedSec: 40, isVictory: false }),
    ];
    // 2 trailing losses — under loss_streak's 3-threshold, so trend wins.
    expect(detectMood(h)).toBe('declining');
  });
});

describe('codex chronicle', () => {
  it('roster total matches enemy types plus bosses (unique keys)', () => {
    const n = getCodexRosterTotal();
    expect(n).toBeGreaterThan(10);
    expect(getCodexRosterTotal()).toBe(n);
  });

  it('buildChronicleCodex sorts names and counts discovered', () => {
    const c = buildChronicleCodex(['chef', 'tourist']);
    expect(c.discoveredCount).toBe(2);
    expect(c.rosterTotal).toBe(getCodexRosterTotal());
    expect(c.discoveredNames[0] < c.discoveredNames[1]).toBe(true);
  });

  it('formatCodexNamesLine truncates long lists', () => {
    const long = formatCodexNamesLine(['Alpha', 'Beta', 'Gamma'], 12);
    expect(long.endsWith('…')).toBe(true);
    expect(long.length).toBeLessThanOrEqual(12);
  });
});

describe('formatters', () => {
  it('formatClock pads seconds to 2 digits', () => {
    expect(formatClock(65)).toBe('1:05');
    expect(formatClock(7)).toBe('0:07');
    expect(formatClock(-5)).toBe('0:00');
  });

  it('formatDurationLong switches to h/m above one hour', () => {
    expect(formatDurationLong(30)).toBe('0m 30s');
    expect(formatDurationLong(125)).toBe('2m 5s');
    expect(formatDurationLong(3700)).toBe('1h 1m');
  });

  it('formatRelativeTime buckets into reasonable labels', () => {
    const now = 10_000_000_000;
    expect(formatRelativeTime(now, now)).toBe('just now');
    expect(formatRelativeTime(now - 5 * 60 * 1000, now)).toBe('5m ago');
    expect(formatRelativeTime(now - 3 * 60 * 60 * 1000, now)).toBe('3h ago');
    expect(formatRelativeTime(now - 2 * 24 * 60 * 60 * 1000, now)).toBe('2d ago');
  });
});

describe('W2 Moor Road chronicle helpers', () => {
  describe('formatRouteBreadcrumb', () => {
    it('returns empty string for no picks', () => {
      expect(formatRouteBreadcrumb([])).toBe('');
    });

    it('formats single pick as the short label', () => {
      const pick: RoutePick = {
        slot: 'A', routeKey: 'up_the_brae', atGameTimeSec: 305, defaultedBySetting: false,
      };
      expect(formatRouteBreadcrumb([pick])).toBe('Up the brae');
    });

    it('joins multiple picks with arrow separator', () => {
      const picks: RoutePick[] = [
        { slot: 'A', routeKey: 'up_the_brae', atGameTimeSec: 305, defaultedBySetting: false },
        { slot: 'B', routeKey: 'buckie_pitstop', atGameTimeSec: 610, defaultedBySetting: false },
      ];
      expect(formatRouteBreadcrumb(picks)).toBe('Up the brae → Buckie pit-stop');
    });

    it('marks defaulted-by-setting picks with a trailing asterisk', () => {
      const picks: RoutePick[] = [
        { slot: 'A', routeKey: 'round_the_loch', atGameTimeSec: 305, defaultedBySetting: true },
      ];
      expect(formatRouteBreadcrumb(picks)).toBe('Round the loch*');
    });

    it('truncates long trails with trailing ellipsis', () => {
      const picks: RoutePick[] = [
        { slot: 'A', routeKey: 'through_the_kirkyard', atGameTimeSec: 305, defaultedBySetting: false },
        { slot: 'B', routeKey: 'buckie_pitstop', atGameTimeSec: 610, defaultedBySetting: false },
      ];
      const truncated = formatRouteBreadcrumb(picks, 20);
      expect(truncated.length).toBe(20);
      expect(truncated.endsWith('…')).toBe(true);
    });
  });

  describe('selectRunsWithRoutes', () => {
    const withRoute = entry({
      timestamp: 2,
      routes: [{
        slot: 'A', routeKey: 'up_the_brae',
        atGameTimeSec: 305, defaultedBySetting: false,
      }],
    });
    const withoutRoute = entry({ timestamp: 1 });

    it('drops runs that have no routes', () => {
      const out = selectRunsWithRoutes([withoutRoute, withRoute]);
      expect(out).toHaveLength(1);
      expect(out[0].timestamp).toBe(2);
    });

    it('returns newest-first, capped at limit', () => {
      const many = Array.from({ length: 15 }, (_, i) => entry({
        timestamp: i,
        routes: [{
          slot: 'A', routeKey: 'up_the_brae',
          atGameTimeSec: 305, defaultedBySetting: false,
        }],
      }));
      const out = selectRunsWithRoutes(many, 5);
      expect(out).toHaveLength(5);
      expect(out.map((e) => e.timestamp)).toEqual([14, 13, 12, 11, 10]);
    });

    it('returns empty when no runs have routes', () => {
      expect(selectRunsWithRoutes([withoutRoute])).toEqual([]);
    });
  });

  describe('computeMoorRoadKillCriteria', () => {
    const pickA = (routeKey: string, defaulted = false): RoutePick => ({
      slot: 'A', routeKey: routeKey as RoutePick['routeKey'],
      atGameTimeSec: 305, defaultedBySetting: defaulted,
    });
    const pickB = (routeKey: string, defaulted = false): RoutePick => ({
      slot: 'B', routeKey: routeKey as RoutePick['routeKey'],
      atGameTimeSec: 610, defaultedBySetting: defaulted,
    });

    it('returns zero-shaped report on empty history', () => {
      const r = computeMoorRoadKillCriteria([]);
      expect(r.w2Runs).toBe(0);
      expect(r.preW2Runs).toBe(0);
      expect(r.monotonyA).toBe(0);
      expect(r.completionDelta).toBe(0);
      expect(r.skipRate).toBe(0);
    });

    it('partitions runs into pre-W2 (no routes) and W2 buckets', () => {
      const hist = [
        entry({ isVictory: false }),
        entry({ isVictory: true, routes: [pickA('up_the_brae')] }),
        entry({ isVictory: true, routes: [pickA('up_the_brae'), pickB('buckie_pitstop')] }),
      ];
      const r = computeMoorRoadKillCriteria(hist);
      expect(r.preW2Runs).toBe(1);
      expect(r.w2Runs).toBe(2);
    });

    it('monotonyA reports the dominant slot-A route + its share', () => {
      const hist = [
        entry({ routes: [pickA('up_the_brae')] }),
        entry({ routes: [pickA('up_the_brae')] }),
        entry({ routes: [pickA('up_the_brae')] }),
        entry({ routes: [pickA('round_the_loch')] }),
      ];
      const r = computeMoorRoadKillCriteria(hist);
      expect(r.monotonyARouteKey).toBe('up_the_brae');
      expect(r.monotonyA).toBeCloseTo(0.75);
    });

    it('completionDelta compares post-W2 victory rate to pre-W2', () => {
      // Pre-W2: 1 of 2 won = 50%. W2: 1 of 1 won = 100%. Delta = +0.5.
      const hist = [
        entry({ isVictory: false }),
        entry({ isVictory: true }),
        entry({ isVictory: true, routes: [pickA('up_the_brae')] }),
      ];
      const r = computeMoorRoadKillCriteria(hist);
      expect(r.completionDelta).toBeCloseTo(0.5);
    });

    it('skipRate is defaulted picks / all picks across W2 runs', () => {
      // 2 runs, 3 picks total, 1 defaulted → 1/3.
      const hist = [
        entry({ routes: [pickA('up_the_brae'), pickB('buckie_pitstop')] }),
        entry({ routes: [pickA('round_the_loch', true)] }),
      ];
      const r = computeMoorRoadKillCriteria(hist);
      expect(r.skipRate).toBeCloseTo(1 / 3);
    });
  });

  describe('formatMoorRoadStatus', () => {
    it('returns empty state when no W2 runs have been logged', () => {
      const r = formatMoorRoadStatus(computeMoorRoadKillCriteria([]));
      expect(r.line).toBe('');
      expect(r.anyFailed).toBe(false);
    });

    it('renders a concise single-line summary when W2 runs exist', () => {
      const pickA = {
        slot: 'A' as const, routeKey: 'up_the_brae' as const,
        atGameTimeSec: 305, defaultedBySetting: false,
      };
      const hist = [entry({ isVictory: true, routes: [pickA] })];
      const r = formatMoorRoadStatus(computeMoorRoadKillCriteria(hist));
      expect(r.line).toContain('Moor Road');
      expect(r.line).toContain('up_the_brae');
      expect(r.anyFailed).toBe(false);
    });

    it('flags anyFailed when monotony crosses the threshold', () => {
      const pickA = {
        slot: 'A' as const, routeKey: 'up_the_brae' as const,
        atGameTimeSec: 305, defaultedBySetting: false,
      };
      // 5 runs, all the same slot-A pick → monotonyA = 1.0 → fail.
      const hist = Array.from({ length: 5 }, () => entry({ routes: [pickA] }));
      const r = formatMoorRoadStatus(computeMoorRoadKillCriteria(hist));
      expect(r.anyFailed).toBe(true);
    });
  });

  describe('computeIronmoorStats / formatIronmoorLine', () => {
    it('returns zeros + blank line on empty history', () => {
      const s = computeIronmoorStats([]);
      expect(s).toEqual({ attempts: 0, victories: 0, longestSec: 0, winRate: 0 });
      expect(formatIronmoorLine(s)).toBe('');
    });

    it('ignores non-ironmoor runs', () => {
      const hist = [
        entry({ isVictory: true, timeSurvivedSec: 900 }),
        entry({ isVictory: false, timeSurvivedSec: 200 }),
      ];
      const s = computeIronmoorStats(hist);
      expect(s.attempts).toBe(0);
    });

    it('aggregates victories, longest, winRate over ironmoor-only runs', () => {
      const hist = [
        entry({ isVictory: false, timeSurvivedSec: 200, ironmoor: true }),
        entry({ isVictory: true, timeSurvivedSec: 905, ironmoor: true }),
        entry({ isVictory: false, timeSurvivedSec: 500, ironmoor: true }),
        // Non-ironmoor: dropped from denominator.
        entry({ isVictory: true, timeSurvivedSec: 1200, ironmoor: false }),
      ];
      const s = computeIronmoorStats(hist);
      expect(s.attempts).toBe(3);
      expect(s.victories).toBe(1);
      expect(s.longestSec).toBe(905);
      expect(s.winRate).toBeCloseTo(1 / 3);
    });

    it('formats the ironmoor line with mm:ss longest', () => {
      const hist = [
        entry({ isVictory: true, timeSurvivedSec: 905, ironmoor: true }),
      ];
      const line = formatIronmoorLine(computeIronmoorStats(hist));
      expect(line).toContain('⚔ Ironmoor');
      expect(line).toContain('1/1 wins');
      expect(line).toContain('15:05');
    });

    it('omits "fastest win" when bestVictorySec is 0', () => {
      const hist = [
        entry({ isVictory: true, timeSurvivedSec: 905, ironmoor: true }),
      ];
      const line = formatIronmoorLine(computeIronmoorStats(hist), 0);
      expect(line).not.toContain('fastest win');
    });

    it('appends "fastest win mm:ss" when bestVictorySec > 0', () => {
      const hist = [
        entry({ isVictory: true, timeSurvivedSec: 905, ironmoor: true }),
      ];
      const line = formatIronmoorLine(computeIronmoorStats(hist), 723);
      expect(line).toContain('fastest win 12:03');
    });

    it('formats 0 seconds padded correctly', () => {
      const hist = [entry({ isVictory: true, timeSurvivedSec: 600, ironmoor: true })];
      const line = formatIronmoorLine(computeIronmoorStats(hist), 600);
      // 600s == 10:00, longest and fastest same
      expect(line).toContain('longest 10:00');
      expect(line).toContain('fastest win 10:00');
    });
  });
});

describe('formatChronicleMilestoneLines', () => {
  function emptyMilestones(): Milestones {
    return {
      firstVictory: null,
      longestRun: null,
      mostKills: null,
      highestCombo: null,
      favoriteVariantKey: null,
      favoriteVariantCount: 0,
      favoriteWeaponKey: null,
      favoriteWeaponCount: 0,
      currentWinStreak: 0,
      currentLossStreak: 0,
    };
  }

  it('returns the "first victory _none" placeholder when history is empty', () => {
    const lines = formatChronicleMilestoneLines(emptyMilestones());
    expect(lines).toHaveLength(1);
    // The placeholder must not be the raw key (would mean missing i18n).
    expect(lines[0]).not.toBe('ui.chronicle.milestone_first_victory_none');
  });

  it('emits the firstVictory line when the player has won', () => {
    const lines = formatChronicleMilestoneLines({
      ...emptyMilestones(),
      firstVictory: entry({ isVictory: true, timeSurvivedSec: 600, enemiesKilled: 100 }),
    });
    // Exactly one line; refs the time + kills.
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('10:00');
    expect(lines[0]).toContain('100');
  });

  it('skips highestCombo when bestCombo is 0', () => {
    const lines = formatChronicleMilestoneLines({
      ...emptyMilestones(),
      highestCombo: entry({ bestCombo: 0 }),
    });
    // Only the firstVictory placeholder — highestCombo line gated on > 0.
    expect(lines).toHaveLength(1);
  });

  it('emits highestCombo when bestCombo > 0', () => {
    const lines = formatChronicleMilestoneLines({
      ...emptyMilestones(),
      highestCombo: entry({ bestCombo: 42 }),
    });
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('42');
  });

  it('win streak (>=2) wins the streak slot — loss streak ignored', () => {
    const lines = formatChronicleMilestoneLines({
      ...emptyMilestones(),
      currentWinStreak: 3,
      currentLossStreak: 5, // would normally trigger compassion line
    });
    // Placeholder + win-streak line, no loss line.
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('3');
    expect(lines.every((l) => !l.toLowerCase().includes('back-to-back'))).toBe(true);
  });

  it('loss streak (>=3) prints when there is no winning streak', () => {
    const lines = formatChronicleMilestoneLines({
      ...emptyMilestones(),
      currentWinStreak: 1, // below the >=2 threshold
      currentLossStreak: 4,
    });
    // Placeholder + loss line.
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('4');
  });

  it('neither streak qualifies → no streak line', () => {
    const lines = formatChronicleMilestoneLines({
      ...emptyMilestones(),
      currentWinStreak: 1,
      currentLossStreak: 2,
    });
    expect(lines).toHaveLength(1);
  });

  it('full milestone set produces lines in stable order', () => {
    const m: Milestones = {
      firstVictory: entry({ isVictory: true, timeSurvivedSec: 720, enemiesKilled: 200 }),
      longestRun: entry({ timeSurvivedSec: 900, variantKey: 'classic' }),
      mostKills: entry({ enemiesKilled: 300, variantKey: 'classic' }),
      highestCombo: entry({ bestCombo: 50 }),
      favoriteVariantKey: 'classic',
      favoriteVariantCount: 7,
      favoriteWeaponKey: 'thistle_shot',
      favoriteWeaponCount: 4,
      currentWinStreak: 3,
      currentLossStreak: 0,
    };
    const lines = formatChronicleMilestoneLines(m);
    // 1 firstVictory + 1 longest + 1 mostKills + 1 highestCombo + 1 favoriteVariant
    // + 1 favoriteWeapon + 1 winStreak = 7
    expect(lines).toHaveLength(7);
  });
});

describe('formatChronicleRunSubLine', () => {
  it('uses "boss" (singular) when bossKills === 1', () => {
    const out = formatChronicleRunSubLine(entry({ bossKills: 1 }));
    expect(out).toContain('1 boss ');
    expect(out).not.toContain('bosses');
  });

  it('uses "bosses" for 0 and >1', () => {
    expect(formatChronicleRunSubLine(entry({ bossKills: 0 }))).toContain('0 bosses');
    expect(formatChronicleRunSubLine(entry({ bossKills: 3 }))).toContain('3 bosses');
  });

  it('falls back to em-dash when the weapons list is empty', () => {
    const out = formatChronicleRunSubLine(entry({ weaponKeys: [] }));
    // "—  ·  …" prefix — no leading comma/label collapse.
    expect(out.startsWith('—')).toBe(true);
  });

  it('caps weapons at the first 4 and joins with ", "', () => {
    const out = formatChronicleRunSubLine(entry({
      weaponKeys: ['thistle_shot', 'caber_toss', 'haggis_hurler', 'bagpipe_blast', 'scotch_mist'],
      bossKills: 0,
    }));
    // scotch_mist is the 5th — must not appear.
    expect(out).not.toContain('Scotch Mist');
    // thistle_shot display name should be present.
    const firstWeaponsSegment = out.split('  ·  ')[0];
    expect(firstWeaponsSegment.split(', ')).toHaveLength(4);
  });

  it('passes unknown weapon keys through as raw keys', () => {
    const out = formatChronicleRunSubLine(entry({ weaponKeys: ['not_a_real_weapon'] }));
    expect(out).toContain('not_a_real_weapon');
  });

  it('surfaces the combo count verbatim with an "x" suffix', () => {
    expect(formatChronicleRunSubLine(entry({ bestCombo: 27 }))).toContain('combo 27x');
    expect(formatChronicleRunSubLine(entry({ bestCombo: 0 }))).toContain('combo 0x');
  });

  it('omits the route trail when there are no picks', () => {
    const out = formatChronicleRunSubLine(entry({ routes: [] }));
    // Without routes, the string ends at the combo segment — no trailing bullet.
    expect(out.endsWith('x')).toBe(true);
  });

  it('appends a route breadcrumb after combo when routes exist', () => {
    const picks: RoutePick[] = [
      { slot: 'A', routeKey: 'up_the_brae', atGameTimeSec: 60, defaultedBySetting: false },
      { slot: 'B', routeKey: 'round_the_loch', atGameTimeSec: 180, defaultedBySetting: false },
    ];
    const out = formatChronicleRunSubLine(entry({ routes: picks }));
    // Breadcrumb is delimited by "  ·  " from the combo segment.
    const segments = out.split('  ·  ');
    expect(segments).toHaveLength(4); // weapons | bosses | combo | trail
    // Trail should be the formatted breadcrumb, not raw route keys.
    expect(segments[3]).toBe(formatRouteBreadcrumb(picks));
  });

  it('appends a relic trail with ⟡ sigil when relics exist (R1 M4 T27)', () => {
    const out = formatChronicleRunSubLine(
      entry({ relics: ['sporran_of_holding', 'grans_thimble'] as never }),
    );
    const segments = out.split('  ·  ');
    // weapons | bosses | combo | ⟡ trail (no routes on this entry).
    expect(segments).toHaveLength(4);
    expect(segments[3]).toContain('⟡');
    expect(segments[3]).toContain('Sporran of Holding');
    expect(segments[3]).toContain('Gran\'s Thimble');
  });

  it('omits relic trail when the list is empty (R1 M4 T27)', () => {
    const out = formatChronicleRunSubLine(entry({ relics: [] as never }));
    expect(out).not.toContain('⟡');
  });

  it('silently skips unknown relic keys (e.g. cut in a future balance pass)', () => {
    const out = formatChronicleRunSubLine(
      entry({ relics: ['sporran_of_holding', 'nonexistent_relic'] as never }),
    );
    expect(out).toContain('Sporran of Holding');
    expect(out).not.toContain('nonexistent_relic');
  });

  it('both route + relic trails co-exist when the run has both', () => {
    const picks: RoutePick[] = [
      { slot: 'A', routeKey: 'up_the_brae', atGameTimeSec: 60, defaultedBySetting: false },
    ];
    const out = formatChronicleRunSubLine(
      entry({ routes: picks, relics: ['bronze_clasp'] as never }),
    );
    const segments = out.split('  ·  ');
    // weapons | bosses | combo | routes | relics
    expect(segments).toHaveLength(5);
    expect(segments[4]).toContain('⟡');
  });
});

describe('moodSubtitleKey', () => {
  const moods: ChronicleMood[] = [
    'empty', 'first_run', 'victory_streak', 'fresh_victory',
    'loss_streak', 'improving', 'declining', 'steady',
  ];

  it('returns a distinct i18n key for every mood tag', () => {
    const keys = new Set(moods.map(moodSubtitleKey));
    expect(keys.size).toBe(moods.length);
  });

  it('every key points under the ui.chronicle.sub_* namespace', () => {
    for (const mood of moods) {
      expect(moodSubtitleKey(mood)).toMatch(/^ui\.chronicle\.sub_/);
    }
  });

  it('steady is the default — unknown tags fall back to its key', () => {
    // @ts-expect-error — intentional: test default-branch behaviour.
    expect(moodSubtitleKey('not_a_mood')).toBe(moodSubtitleKey('steady'));
  });
});

describe('moodColor', () => {
  it('victory moods (streak + fresh) use the same warm gold', () => {
    expect(moodColor('victory_streak')).toBe(moodColor('fresh_victory'));
    expect(moodColor('victory_streak')).toMatch(/^#/);
  });

  it('loss_streak renders in a soft grey — NOT a shameful red', () => {
    const color = moodColor('loss_streak');
    expect(color).toBe('#b8a8a8');
    // Explicit: the tint must not be a saturated red.
    expect(color).not.toMatch(/^#(?:[Cc][0-Ff]|[EFef][0-Ff])[0-3][0-3]/);
  });

  it('improving trends in green; declining in cool blue-grey', () => {
    expect(moodColor('improving')).toBe('#9de6a8');
    expect(moodColor('declining')).toBe('#a8b3c8');
  });

  it('empty and first_run share the warm introductory tint', () => {
    expect(moodColor('empty')).toBe(moodColor('first_run'));
  });

  it('every mood returns a valid 7-char hex string', () => {
    const moods: ChronicleMood[] = [
      'empty', 'first_run', 'victory_streak', 'fresh_victory',
      'loss_streak', 'improving', 'declining', 'steady',
    ];
    for (const m of moods) {
      expect(moodColor(m)).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe('countUniqueRouteKeys', () => {
  it('returns 0 for empty history', () => {
    expect(countUniqueRouteKeys([])).toBe(0);
  });

  it('returns 0 when no entries have routes', () => {
    expect(countUniqueRouteKeys([entry(), entry()])).toBe(0);
  });

  it('counts distinct routeKeys across entries', () => {
    const picks: RoutePick[] = [
      { slot: 'A', routeKey: 'up_the_brae', atGameTimeSec: 0, defaultedBySetting: false },
      { slot: 'B', routeKey: 'round_the_loch', atGameTimeSec: 0, defaultedBySetting: false },
    ];
    const picks2: RoutePick[] = [
      { slot: 'A', routeKey: 'up_the_brae', atGameTimeSec: 0, defaultedBySetting: false }, // dupe
      { slot: 'B', routeKey: 'through_the_kirkyard', atGameTimeSec: 0, defaultedBySetting: false },
    ];
    const history = [entry({ routes: picks }), entry({ routes: picks2 })];
    expect(countUniqueRouteKeys(history)).toBe(3);
  });

  it('tolerates entries with a missing routes field', () => {
    const picks: RoutePick[] = [
      { slot: 'A', routeKey: 'up_the_brae', atGameTimeSec: 0, defaultedBySetting: false },
    ];
    const history = [entry({ routes: picks }), entry()];
    expect(countUniqueRouteKeys(history)).toBe(1);
  });
});

describe('findLastSeededRun', () => {
  it('returns null for empty history', () => {
    expect(findLastSeededRun([])).toBeNull();
  });

  it('returns null when no entry carries a runSeed', () => {
    expect(findLastSeededRun([entry(), entry()])).toBeNull();
  });

  it('returns the newest entry (last in array) that has a runSeed', () => {
    // Input order is newest-last. We want the last entry that has a seed.
    const history = [entry({ runSeed: 100 }), entry(), entry({ runSeed: 200 })];
    expect(findLastSeededRun(history)?.runSeed).toBe(200);
  });

  it('skips past unseeded entries at the tail', () => {
    const history = [entry({ runSeed: 100 }), entry(), entry()];
    expect(findLastSeededRun(history)?.runSeed).toBe(100);
  });

  it('returns null when every entry lacks a seed, even with many entries', () => {
    const history = [entry(), entry(), entry()];
    expect(findLastSeededRun(history)).toBeNull();
  });
});

describe('resolveChronicleMilestonesDensityStyle', () => {
  it('below threshold → roomy style (12px, 4 line spacing)', () => {
    const s = resolveChronicleMilestonesDensityStyle(CHRONICLE_MILESTONES_DENSE_THRESHOLD - 1);
    expect(s.dense).toBe(false);
    expect(s.fontSize).toBe('12px');
    expect(s.lineSpacing).toBe(4);
  });

  it('at threshold → dense style kicks in (>=)', () => {
    const s = resolveChronicleMilestonesDensityStyle(CHRONICLE_MILESTONES_DENSE_THRESHOLD);
    expect(s.dense).toBe(true);
    expect(s.fontSize).toBe('11px');
    expect(s.lineSpacing).toBe(2);
  });

  it('well above threshold stays in dense style', () => {
    expect(resolveChronicleMilestonesDensityStyle(100).dense).toBe(true);
  });

  it('zero lines (empty save) stays roomy', () => {
    expect(resolveChronicleMilestonesDensityStyle(0).dense).toBe(false);
  });

  it('dense font is smaller than roomy font (proxy for legibility)', () => {
    const roomy = parseInt(resolveChronicleMilestonesDensityStyle(0).fontSize, 10);
    const dense = parseInt(resolveChronicleMilestonesDensityStyle(50).fontSize, 10);
    expect(dense).toBeLessThan(roomy);
  });
});
