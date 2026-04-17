import { describe, expect, it } from 'vitest';
import { t } from '../core/i18n';
import { ACHIEVEMENT_DEFS } from '../core/BalanceConfig';
import { VARIANTS } from '../data/variants';

function assertResolves(key: string, vars?: Record<string, string | number>): void {
  const resolved = vars ? t(key, vars) : t(key);
  expect(resolved, key).not.toBe(key);
  expect(resolved.length, key).toBeGreaterThan(0);
}

/** Matches `moodSubtitleKey` in `ChronicleScene.ts` — every mood branch. */
const CHRONICLE_MOOD_SUB_KEYS = [
  'ui.chronicle.sub_empty',
  'ui.chronicle.sub_first_run',
  'ui.chronicle.sub_victory_streak',
  'ui.chronicle.sub_fresh_victory',
  'ui.chronicle.sub_loss_streak',
  'ui.chronicle.sub_improving',
  'ui.chronicle.sub_declining',
  'ui.chronicle.sub_steady',
] as const;

/**
 * i18n regression fence for `ChronicleScene` and `DeedsScene`.
 */
describe('Chronicle / Deeds i18n smoke', () => {
  it('resolves ChronicleScene static + mood subtitles', () => {
    const staticKeys = [
      'ui.chronicle.title',
      'ui.chronicle.lifetime_heading',
      'ui.chronicle.stat_runs',
      'ui.chronicle.stat_victories',
      'ui.chronicle.stat_win_rate',
      'ui.chronicle.stat_total_culls',
      'ui.chronicle.stat_total_gold',
      'ui.chronicle.stat_time_on_moor',
      'ui.chronicle.stat_best_time',
      'ui.chronicle.stat_best_kills',
      'ui.chronicle.stat_best_combo',
      'ui.chronicle.milestones_heading',
      'ui.chronicle.runs_heading',
      'ui.chronicle.back',
      'ui.chronicle.runs_empty',
      'ui.chronicle.milestone_first_victory_none',
      'ui.chronicle.codex_heading',
      'ui.chronicle.codex_empty',
    ] as const;
    for (const key of staticKeys) assertResolves(key);
    for (const key of CHRONICLE_MOOD_SUB_KEYS) assertResolves(key);
  });

  it('resolves ChronicleScene interpolated copy', () => {
    assertResolves('ui.chronicle.runs_cap_note', { max: 50 });
    const sampleVariant = t(VARIANTS[0]!.nameKey);
    assertResolves('ui.chronicle.run_row_victory', {
      time: '1:00',
      kills: 1,
      level: 2,
      variant: sampleVariant,
    });
    assertResolves('ui.chronicle.run_row_defeat', {
      time: '0:30',
      kills: 0,
      level: 1,
      variant: sampleVariant,
    });
    assertResolves('ui.chronicle.run_curse_chip', { curse: 'x' });
    assertResolves('ui.chronicle.rerun_tooltip', { seed: 'ABC-123' });
    assertResolves('ui.chronicle.rerun_tooltip_with_curse', { seed: 'ABC-123', curse: 'Heavy Legs' });
    assertResolves('ui.chronicle.milestone_first_victory', { time: '0:10', kills: 5 });
    assertResolves('ui.chronicle.milestone_longest', { time: '2:00', variant: sampleVariant });
    assertResolves('ui.chronicle.milestone_most_kills', { kills: 99, variant: sampleVariant });
    assertResolves('ui.chronicle.milestone_highest_combo', { combo: 12 });
    assertResolves('ui.chronicle.milestone_favorite_variant', { variant: sampleVariant, count: 3 });
    assertResolves('ui.chronicle.milestone_favorite_weapon', { weapon: 'Claymore', count: 2 });
    assertResolves('ui.chronicle.milestone_win_streak', { count: 2 });
    assertResolves('ui.chronicle.codex_progress', { discovered: 3, total: 20 });
  });

  it('resolves DeedsScene shell strings', () => {
    assertResolves('ui.deeds.title');
    assertResolves('ui.deeds.back');
    assertResolves('ui.deeds.sub_empty');
    assertResolves('ui.deeds.sub_partial', { earned: 1, total: 11 });
    assertResolves('ui.deeds.sub_complete', { earned: 11, total: 11 });
    assertResolves('ui.deeds.counter', { earned: 0, total: 11 });
    assertResolves('ui.deeds.status_unlocked');
    assertResolves('ui.deeds.status_in_progress');
    assertResolves('ui.deeds.status_locked');
    assertResolves('ui.deeds.locked_mystery');
  });

  it('resolves every achievement title + description key', () => {
    for (const def of Object.values(ACHIEVEMENT_DEFS)) {
      assertResolves(def.titleKey);
      assertResolves(def.descriptionKey);
    }
  });
});
