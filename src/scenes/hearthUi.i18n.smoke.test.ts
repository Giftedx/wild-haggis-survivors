import { describe, expect, it } from 'vitest';
import { t } from '../core/i18n';

/**
 * Regression fence for hearth-facing UI: every `t('ui.*')` used in
 * `BootScene`, `MainMenuScene`, and `PauseMenu` must resolve. Catches missing
 * keys when copy ships without i18n entries.
 */
const MAIN_MENU_AND_PAUSE_STATIC_KEYS = [
  'ui.menu.title',
  /** BootScene tagline — same key tree as main menu identity. */
  'ui.menu.built_on_moor',
  'ui.menu.kill_credits_fresh',
  'ui.menu.hint_suspended',
  'ui.menu.hint_fresh',
  'ui.menu.hint_fresh_with_comfort',
  'ui.menu.start_run',
  'ui.menu.resume_run',
  'ui.menu.new_run_loadout',
  'ui.menu.daily_challenge',
  'ui.menu.meta_upgrades',
  'ui.menu.chronicle',
  'ui.menu.deeds',
  'ui.menu.options',
  'ui.menu.enter_seed',
  'ui.menu.trend_improving',
  'ui.menu.trend_declining',
  'ui.menu.trend_steady',
  'ui.menu.seed_prompt',
  'ui.menu.seed_invalid',
  'ui.menu.challenges_panel_title',
  'ui.menu.challenges_none',
  'ui.menu.challenges_beaten',
  'ui.menu.challenges_pending',
  'ui.menu.challenges_close',
  'ui.pause.title',
  'ui.pause.quip_1',
  'ui.pause.quip_2',
  'ui.pause.quip_3',
  'ui.pause.quip_4',
  'ui.pause.quip_5',
  'ui.pause.quip_6',
  'ui.pause.resume',
  'ui.pause.keys_resume',
  'ui.pause.passives_heading',
  'ui.pause.elite_affix_heading',
  'ui.pause.quit',
  'ui.common.on',
  'ui.common.off',
] as const;

const MAIN_MENU_AND_PAUSE_DYNAMIC: ReadonlyArray<
  readonly [string, Record<string, string | number>]
> = [
  ['ui.menu.kill_credits', { count: 0 }],
  [
    'ui.menu.stats_short',
    {
      bestTime: '0:00',
      bestKills: 0,
      bestCombo: 0,
      totalRuns: 0,
      victories: 0,
      gold: 0,
    },
  ],
  [
    'ui.menu.history_summary',
    { totalRuns: 1, winRate: 0, avgTime: '0:00', trend: 'x' },
  ],
  ['ui.menu.daily_fresh', { code: 'AAAAAAA' }],
  ['ui.menu.daily_cleared', { code: 'AAAAAAA' }],
  ['ui.menu.daily_attempts', { code: 'AAAAAAA', attempts: 1 }],
  ['ui.menu.challenges', { n: 3 }],
  ['ui.menu.challenges_beat', { time: '12:34' }],
  ['ui.menu.challenges_outlast', { time: '8:45' }],
  ['ui.menu.challenges_attempts', { n: 2 }],
  ['ui.pause.time_line', { time: '0:00' }],
  ['ui.pause.stats_mid', { kills: 0, level: 1 }],
  ['ui.pause.stats_loadout', { w: 0, c: 0 }],
  ['ui.pause.stats_gold', { gold: 0 }],
  ['ui.pause.stats_streak', { current: 5, best: 12 }],
  ['ui.pause.stats_dps', { dps: 420 }],
  ['ui.pause.stats_damage', { dmg: 99999 }],
  [
    'ui.loadout.sfx_toggle',
    { state: t('ui.common.on') },
  ],
  [
    'ui.loadout.music_toggle',
    { state: t('ui.common.off') },
  ],
];

describe('Main menu / pause menu i18n smoke', () => {
  it('resolves every static key (no missing copy)', () => {
    for (const key of MAIN_MENU_AND_PAUSE_STATIC_KEYS) {
      const resolved = t(key);
      expect(resolved, key).not.toBe(key);
      expect(resolved.length, key).toBeGreaterThan(0);
    }
  });

  it('resolves every interpolated key with minimal args', () => {
    for (const [key, vars] of MAIN_MENU_AND_PAUSE_DYNAMIC) {
      const resolved = t(key, vars);
      expect(resolved, key).not.toBe(key);
      expect(resolved.length, key).toBeGreaterThan(0);
    }
  });
});
