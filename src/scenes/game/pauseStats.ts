import { t } from '../../core/i18n';
import { formatClockTime } from '../../utils/formatClockTime';

/**
 * Inputs for the Pause-menu stats panel.
 *
 * Three required lines (time, kills+level, loadout) always render.
 * Four optional lines (gold, dps, damage, streak) are gated by
 * `> 0` / `>= 2` thresholds so a fresh run (where these are 0 / 1)
 * doesn't pad the panel with noise.
 */
export interface PauseStatsInput {
  timeSec: number;
  killCount: number;
  level: number;
  weaponCount: number;
  passiveCount: number;
  /** 0 = omitted. */
  runGold?: number;
  /** 0 = omitted. */
  dps?: number;
  /** 0 = omitted. */
  dmgDealt?: number;
  /** Streak is only shown when current or best >= 2. */
  streak?: { current: number; best: number };
  /**
   * T402 — current Moor-Road act (1-3). Omitted when undefined or 1
   * (act 1 is the default state and printing it would clutter early
   * runs); shown as "Act 2 / 3" once the player crosses a picker.
   */
  currentAct?: 1 | 2 | 3;
  /**
   * T402 — picker history this run, in order. Each line shows the
   * route's display label. Omitted when empty (pre-picker runs).
   */
  routeLabels?: readonly string[];
  /**
   * T402 — relic keys currently held in the sporran, in slot order.
   * Resolved labels (already i18n-formatted) so this module stays
   * pure. Omitted when empty.
   */
  relicLabels?: readonly string[];
}

/**
 * Build the multiline stats block shown on the pause overlay. Returns
 * the raw array so tests can count lines without string-splitting;
 * the caller joins with '\n'.
 */
export function buildPauseStatsLines(input: PauseStatsInput): string[] {
  const lines: string[] = [
    t('ui.pause.time_line', { time: formatClockTime(input.timeSec) }),
    t('ui.pause.stats_mid', { kills: input.killCount, level: input.level }),
    t('ui.pause.stats_loadout', { w: input.weaponCount, c: input.passiveCount }),
  ];

  const runGold = input.runGold ?? 0;
  if (runGold > 0) {
    lines.push(t('ui.pause.stats_gold', { gold: runGold }));
  }
  const dps = input.dps ?? 0;
  if (dps > 0) {
    lines.push(t('ui.pause.stats_dps', { dps }));
  }
  const dmgDealt = input.dmgDealt ?? 0;
  if (dmgDealt > 0) {
    lines.push(t('ui.pause.stats_damage', { dmg: dmgDealt }));
  }
  const streak = input.streak;
  if (streak && (streak.best >= 2 || streak.current >= 2)) {
    lines.push(t('ui.pause.stats_streak', { current: streak.current, best: streak.best }));
  }

  // T402 — run identity radiator. Lines only render once the player
  // actually has the data to show: act 2+ (skipped on the default
  // act-1 state), at least one resolved picker, at least one relic.
  if (input.currentAct !== undefined && input.currentAct >= 2) {
    lines.push(t('ui.pause.stats_act', { act: input.currentAct }));
  }
  if (input.routeLabels && input.routeLabels.length > 0) {
    lines.push(t('ui.pause.stats_routes', { routes: input.routeLabels.join(', ') }));
  }
  if (input.relicLabels && input.relicLabels.length > 0) {
    lines.push(t('ui.pause.stats_relics', { relics: input.relicLabels.join(', ') }));
  }

  return lines;
}
