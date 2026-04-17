import { describe, it, expect } from 'vitest';
import { computeGoldReward } from '../utils/save';
import {
  formatClockTime,
  computeGoldBreakdown,
  boundedLoadoutSummary,
  buildWeaponDamageRows,
  formatDeathInsightLine,
  resolveUnlockHeading,
  formatUnlockBodyText,
  formatRerunSeedLinkLabel,
  formatSeedReadoutLabel,
  buildPostcardPayloadFromGameOver,
} from './gameOverFormatting';
import type { GameOverPayload } from './gameOverPayload';
import type { DeathCause, DeathCauseTag } from '../core/deathCauseClassifier';
import type { VariantKey } from '../data/variants';

describe('formatClockTime', () => {
  it('formats 0 seconds', () => {
    expect(formatClockTime(0)).toBe('0:00');
  });

  it('formats sub-minute values with zero-padded seconds', () => {
    expect(formatClockTime(5)).toBe('0:05');
    expect(formatClockTime(59)).toBe('0:59');
  });

  it('formats exact minutes', () => {
    expect(formatClockTime(60)).toBe('1:00');
    expect(formatClockTime(120)).toBe('2:00');
  });

  it('formats mixed minutes and seconds', () => {
    expect(formatClockTime(90)).toBe('1:30');
    expect(formatClockTime(3661)).toBe('61:01');
  });

  it('floors fractional seconds', () => {
    expect(formatClockTime(59.9)).toBe('0:59');
    expect(formatClockTime(0.1)).toBe('0:00');
  });

  it('clamps negative values to 0:00', () => {
    expect(formatClockTime(-10)).toBe('0:00');
    expect(formatClockTime(-0.5)).toBe('0:00');
  });
});

describe('computeGoldBreakdown', () => {
  it('computes gold from time survived', () => {
    const result = computeGoldBreakdown({
      timeSurvivedSec: 100,
      enemiesKilled: 0,
      bossGold: 0,
      coinGold: 0,
    });
    expect(result.timeGold).toBe(40);
    expect(result.total).toBe(40);
  });

  it('computes gold from enemy kills', () => {
    const result = computeGoldBreakdown({
      timeSurvivedSec: 0,
      enemiesKilled: 50,
      bossGold: 0,
      coinGold: 0,
    });
    expect(result.killGold).toBe(20);
    expect(result.total).toBe(20);
  });

  it('passes through boss and coin gold', () => {
    const result = computeGoldBreakdown({
      timeSurvivedSec: 0,
      enemiesKilled: 0,
      bossGold: 15,
      coinGold: 7,
    });
    expect(result.bossGold).toBe(15);
    expect(result.coinGold).toBe(7);
    expect(result.total).toBe(22);
  });

  it('floors fractional time/kill gold', () => {
    const result = computeGoldBreakdown({
      timeSurvivedSec: 1,
      enemiesKilled: 1,
      bossGold: 0,
      coinGold: 0,
    });
    expect(result.timeGold).toBe(0);
    expect(result.killGold).toBe(0);
    expect(result.total).toBe(0);
  });

  it('sums all sources correctly', () => {
    const result = computeGoldBreakdown({
      timeSurvivedSec: 300,
      enemiesKilled: 200,
      bossGold: 50,
      coinGold: 30,
    });
    expect(result.timeGold).toBe(120);
    expect(result.killGold).toBe(80);
    expect(result.total).toBe(120 + 80 + 50 + 30);
    expect(result.timeGold + result.killGold + result.bossGold + result.coinGold).toBe(result.total);
  });

  it('matches computeGoldReward when goldMult is not 1 (display lines sum to earned total)', () => {
    const summary = {
      timeSurvivedSec: 48,
      enemiesKilled: 44,
      bossGold: 0,
      coinGold: 1,
      goldMult: 1.18,
      victory: false,
    };
    const result = computeGoldBreakdown({
      timeSurvivedSec: summary.timeSurvivedSec,
      enemiesKilled: summary.enemiesKilled,
      bossGold: summary.bossGold,
      coinGold: summary.coinGold ?? 0,
      goldMult: summary.goldMult,
    });
    expect(result.total).toBe(computeGoldReward(summary));
    expect(result.timeGold + result.killGold + result.bossGold + result.coinGold).toBe(result.total);
  });
});

describe('boundedLoadoutSummary', () => {
  it('returns every line untouched when the count is at or below the cap', () => {
    const input = 'Thistle Shot\nCaber Toss\nHaggis Hurler';
    expect(boundedLoadoutSummary(input, 3)).toBe(input);
    expect(boundedLoadoutSummary(input, 10)).toBe(input);
  });

  it('truncates to cap and appends a "+N more" line when over', () => {
    const input = 'A\nB\nC\nD\nE';
    const out = boundedLoadoutSummary(input, 2).split('\n');
    // 2 visible + 1 overflow = 3 lines.
    expect(out).toHaveLength(3);
    expect(out[0]).toBe('A');
    expect(out[1]).toBe('B');
    expect(out[2]).toContain('3'); // 5 - 2 dropped → 3
  });

  it('trims leading/trailing whitespace on each line before counting', () => {
    const input = '  A  \n\tB\t\n  C  ';
    const out = boundedLoadoutSummary(input, 5);
    expect(out).toBe('A\nB\nC');
  });

  it('drops blank lines entirely (they do not count toward the cap)', () => {
    const input = 'A\n\n\nB\n   \nC';
    // 3 real lines, cap 3 — no overflow suffix.
    expect(boundedLoadoutSummary(input, 3)).toBe('A\nB\nC');
  });

  it('returns empty string when input has no content', () => {
    expect(boundedLoadoutSummary('', 5)).toBe('');
    expect(boundedLoadoutSummary('\n\n  \n', 5)).toBe('');
  });

  it('clamps negative/fractional caps to 0 — everything becomes overflow', () => {
    const out = boundedLoadoutSummary('A\nB', -1).split('\n');
    // 0 visible + 1 overflow line.
    expect(out).toHaveLength(1);
    expect(out[0]).toContain('2');
  });

  it('cap of 0 with non-empty input emits only the overflow line', () => {
    const out = boundedLoadoutSummary('A\nB\nC', 0).split('\n');
    expect(out).toHaveLength(1);
    expect(out[0]).toContain('3');
  });

  it('cap of 0 with empty input emits nothing', () => {
    expect(boundedLoadoutSummary('', 0)).toBe('');
  });
});

describe('buildWeaponDamageRows', () => {
  const baseInput = {
    weaponDamage: {} as Record<string, number>,
    enemiesKilled: 42,
    timeSurvivedSec: 95,
    goldEarned: 123,
    maxRows: 3,
  };

  it('produces just the header + placeholder when weaponDamage is empty', () => {
    const out = buildWeaponDamageRows({ ...baseInput, weaponDamage: {} }).split('\n');
    // header + placeholder = 2 lines, no weapon rows.
    expect(out).toHaveLength(2);
    expect(out[0]).toContain('42'); // kills
    expect(out[0]).toContain('1:35'); // 95s → 1:35 via formatClockTime
    expect(out[0]).toContain('123'); // gold
    // Placeholder is an i18n string — just assert it's non-key and non-empty.
    expect(out[1]).not.toBe('ui.gameOver.no_weapon_damage');
    expect(out[1].length).toBeGreaterThan(0);
  });

  it('skips zero-damage entries (sortedWeaponDamageEntries filters them)', () => {
    const out = buildWeaponDamageRows({
      ...baseInput,
      weaponDamage: { thistle_shot: 0, caber_toss: 0 },
    }).split('\n');
    // All filtered → header + placeholder, not two rows.
    expect(out).toHaveLength(2);
  });

  it('emits one row per weapon in descending damage order', () => {
    const out = buildWeaponDamageRows({
      ...baseInput,
      weaponDamage: { thistle_shot: 100, caber_toss: 300, haggis_hurler: 200 },
      maxRows: 5,
    }).split('\n');
    // header + 3 rows = 4 lines, no "+N more".
    expect(out).toHaveLength(4);
    // Row 1 is the biggest (caber_toss = 300).
    expect(out[1]).toContain('300');
    expect(out[2]).toContain('200');
    expect(out[3]).toContain('100');
  });

  it('truncates to maxRows and appends a "+N more" overflow line', () => {
    const out = buildWeaponDamageRows({
      ...baseInput,
      weaponDamage: {
        thistle_shot: 500,
        caber_toss: 400,
        haggis_hurler: 300,
        bagpipe_blast: 200,
        scotch_mist: 100,
      },
      maxRows: 2,
    }).split('\n');
    // header + 2 rows + "+3 more" tail = 4 lines.
    expect(out).toHaveLength(4);
    expect(out[1]).toContain('500');
    expect(out[2]).toContain('400');
    expect(out[3]).toContain('3'); // 5 - 2 dropped = 3
  });

  it('renders percentage as round(damage / total × 100)', () => {
    const out = buildWeaponDamageRows({
      ...baseInput,
      weaponDamage: { thistle_shot: 75, caber_toss: 25 }, // total 100 → 75% / 25%
      maxRows: 5,
    }).split('\n');
    expect(out[1]).toContain('75%');
    expect(out[2]).toContain('25%');
  });

  it('pads label column to 18 chars and truncates longer names', () => {
    // thistle_shot's display name should fit; we just assert padding contract
    // by checking the first 18 chars of the weapon row hold the label.
    const out = buildWeaponDamageRows({
      ...baseInput,
      weaponDamage: { thistle_shot: 50 },
      maxRows: 1,
    }).split('\n');
    const row = out[1];
    // Label ends at col 18 (padEnd), then a single space, then damage padded-6.
    expect(row.length).toBeGreaterThanOrEqual(18 + 1 + 6);
    // Damage "50" right-padded in a 6-wide column.
    expect(row.slice(19, 25)).toBe('    50');
  });

  it('clamps a negative maxRows to 0 — all entries become overflow', () => {
    const out = buildWeaponDamageRows({
      ...baseInput,
      weaponDamage: { thistle_shot: 10, caber_toss: 20 },
      maxRows: -5,
    }).split('\n');
    // header + "+2 more", no rows.
    expect(out).toHaveLength(2);
    expect(out[1]).toContain('2');
  });

  it('handles unknown weapon keys by falling back to the raw key label', () => {
    const out = buildWeaponDamageRows({
      ...baseInput,
      weaponDamage: { not_a_real_weapon: 10 },
      maxRows: 1,
    }).split('\n');
    // header + 1 fallback row, no crash.
    expect(out).toHaveLength(2);
    expect(out[1]).toContain('not_a_real_weapon'.slice(0, 18));
    expect(out[1]).toContain('10');
  });
});

describe('formatDeathInsightLine', () => {
  function cause(overrides: Partial<DeathCause> = {}): DeathCause {
    return { tag: 'unlucky' as DeathCauseTag, sourceKey: null, ...overrides };
  }

  it('returns a "{headline} — {tip}" blend', () => {
    const out = formatDeathInsightLine(cause({ tag: 'unlucky' }));
    // Must contain the separator dash, and both sides must resolve to
    // non-key strings (i18n bootstrapped).
    expect(out).toContain(' — ');
    const [headline, tip] = out.split(' — ');
    expect(headline.length).toBeGreaterThan(0);
    expect(tip.length).toBeGreaterThan(0);
    expect(headline).not.toBe('ui.gameOver.death_unlucky_headline');
  });

  it('interpolates "something" when sourceKey is null', () => {
    const noSource = formatDeathInsightLine(cause({ tag: 'swarmed', sourceKey: null }));
    // At minimum, the literal fallback should not leak as unresolved.
    expect(noSource).not.toContain('{source}');
  });

  it('resolves enemy display name when sourceKey is provided', () => {
    const out = formatDeathInsightLine(cause({ tag: 'one_shot', sourceKey: 'tourist' }));
    // The source should have been substituted — no raw {source} placeholder.
    expect(out).not.toContain('{source}');
  });

  it('produces a different line per cause tag', () => {
    const tags: DeathCauseTag[] = [
      'hazard', 'boss_crushed', 'elite_kill', 'one_shot',
      'same_killer', 'swarmed', 'low_hp_neglect', 'unlucky',
    ];
    const lines = new Set(tags.map((tag) => formatDeathInsightLine(cause({ tag, sourceKey: 'tourist' }))));
    // Every tag should map to a distinct line.
    expect(lines.size).toBe(tags.length);
  });
});

describe('resolveUnlockHeading', () => {
  it('returns the blue "next tip" heading when there are no unlocks', () => {
    const h = resolveUnlockHeading([]);
    expect(h.color).toBe('#8aa4d7');
    expect(h.text.length).toBeGreaterThan(0);
    expect(h.text).not.toBe('ui.gameOver.next_tip');
  });

  it('returns the green single-unlock heading for exactly one variant', () => {
    const h = resolveUnlockHeading(['classic'] as VariantKey[]);
    expect(h.color).toBe('#77c977');
    expect(h.text).not.toBe('ui.gameOver.unlock_single');
  });

  it('returns the green multi-unlock heading for two or more variants', () => {
    const two = resolveUnlockHeading(['classic', 'moor_runner'] as VariantKey[]);
    const three = resolveUnlockHeading(['classic', 'moor_runner', 'iron_belly'] as VariantKey[]);
    expect(two.color).toBe('#77c977');
    expect(three.color).toBe('#77c977');
    // Single-vs-multi copy should differ.
    expect(two.text).not.toBe(resolveUnlockHeading(['classic'] as VariantKey[]).text);
  });
});

describe('formatUnlockBodyText', () => {
  it('returns null for 0 or 1 unlocks (scene handles those separately)', () => {
    expect(formatUnlockBodyText([])).toBeNull();
    expect(formatUnlockBodyText(['classic'] as VariantKey[])).toBeNull();
  });

  it('joins two variant names with a single newline (no bullets)', () => {
    const out = formatUnlockBodyText(['classic', 'moor_runner'] as VariantKey[]);
    expect(out).not.toBeNull();
    const lines = (out as string).split('\n');
    expect(lines).toHaveLength(2);
    // Two-variant layout has no bullet prefix.
    expect(lines.every((l) => !l.startsWith('-'))).toBe(true);
  });

  it('prefixes each line with "- " for 3+ variants', () => {
    const out = formatUnlockBodyText(['classic', 'moor_runner', 'iron_belly'] as VariantKey[]);
    const lines = (out as string).split('\n');
    expect(lines).toHaveLength(3);
    expect(lines.every((l) => l.startsWith('- '))).toBe(true);
  });

  it('maps each key to a non-empty resolved variant name', () => {
    const out = formatUnlockBodyText(['classic', 'moor_runner'] as VariantKey[]);
    const lines = (out as string).split('\n');
    for (const l of lines) {
      expect(l.length).toBeGreaterThan(0);
    }
  });
});

describe('formatRerunSeedLinkLabel', () => {
  it('returns the plain-rerun label when no curse', () => {
    expect(formatRerunSeedLinkLabel(null)).not.toBe('ui.gameOver.rerun_same_seed');
    expect(formatRerunSeedLinkLabel(undefined)).not.toBe('ui.gameOver.rerun_same_seed');
  });

  it('treats empty curse label as "no curse"', () => {
    expect(formatRerunSeedLinkLabel('')).toBe(formatRerunSeedLinkLabel(null));
  });

  it('surfaces the curse label in the output when provided', () => {
    const out = formatRerunSeedLinkLabel('The Grasping');
    expect(out).toContain('The Grasping');
    // Must not be the raw i18n key (proves i18n is resolving).
    expect(out).not.toBe('ui.gameOver.rerun_same_seed_with_curse');
  });

  it('curse and no-curse produce different copy', () => {
    const withCurse = formatRerunSeedLinkLabel('A Curse');
    const noCurse = formatRerunSeedLinkLabel(null);
    expect(withCurse).not.toBe(noCurse);
  });
});

describe('formatSeedReadoutLabel', () => {
  it('daily copy surfaces the code', () => {
    const out = formatSeedReadoutLabel('ABC-123', true);
    expect(out).toContain('ABC-123');
    expect(out).not.toBe('ui.gameOver.seed_daily');
  });

  it('normal copy surfaces the code', () => {
    const out = formatSeedReadoutLabel('XYZ-777', false);
    expect(out).toContain('XYZ-777');
    expect(out).not.toBe('ui.gameOver.seed_normal');
  });

  it('daily and normal use distinct i18n strings', () => {
    const daily = formatSeedReadoutLabel('SAME', true);
    const normal = formatSeedReadoutLabel('SAME', false);
    expect(daily).not.toBe(normal);
  });
});

describe('buildPostcardPayloadFromGameOver', () => {
  function payload(overrides: Partial<GameOverPayload> = {}): GameOverPayload {
    return {
      mode: 'death',
      isVictory: false,
      summary: {
        timeSurvivedSec: 120,
        enemiesKilled: 50,
        bossGold: 0,
        coinGold: 0,
      } as GameOverPayload['summary'],
      runResult: {} as GameOverPayload['runResult'],
      xpLevel: 1,
      bossKillCount: 0,
      ownedPassiveCount: 0,
      weaponCount: 1,
      evolvedCount: 0,
      buildSummary: '',
      variantLabel: 'Classic Haggis',
      weaponDamage: {},
      ...overrides,
    };
  }

  it('maps mode verbatim for both victory and death', () => {
    expect(buildPostcardPayloadFromGameOver(payload({ mode: 'victory' })).mode).toBe('victory');
    expect(buildPostcardPayloadFromGameOver(payload({ mode: 'death' })).mode).toBe('death');
  });

  it('copies summary counters onto the postcard', () => {
    const out = buildPostcardPayloadFromGameOver(payload({
      summary: { timeSurvivedSec: 200, enemiesKilled: 99 } as GameOverPayload['summary'],
    }));
    expect(out.timeSurvivedSec).toBe(200);
    expect(out.enemiesKilled).toBe(99);
  });

  it('defaults counters to 0 when summary fields are missing (defensive)', () => {
    // Force an incomplete summary to simulate a corrupt payload.
    const out = buildPostcardPayloadFromGameOver(payload({
      summary: {} as GameOverPayload['summary'],
    }));
    expect(out.enemiesKilled).toBe(0);
    expect(out.timeSurvivedSec).toBe(0);
  });

  it('passes through seedCode / variantLabel / ironmoor / postBellSec', () => {
    const out = buildPostcardPayloadFromGameOver(payload({
      seedCode: 'ABC-123',
      variantLabel: 'Moor Runner',
      ironmoor: true,
      postBellSec: 42,
    }));
    expect(out.seedCode).toBe('ABC-123');
    expect(out.variantLabel).toBe('Moor Runner');
    expect(out.ironmoor).toBe(true);
    expect(out.postBellSec).toBe(42);
  });

  it('uses the caller-supplied curseLabel when present', () => {
    const out = buildPostcardPayloadFromGameOver(payload(), 'The Grasping');
    expect(out.curseLabel).toBe('The Grasping');
  });

  it('curseLabel is undefined when caller passes null', () => {
    const out = buildPostcardPayloadFromGameOver(payload(), null);
    expect(out.curseLabel).toBeUndefined();
  });

  it('curseLabel is undefined when caller passes nothing', () => {
    const out = buildPostcardPayloadFromGameOver(payload());
    expect(out.curseLabel).toBeUndefined();
  });
});
