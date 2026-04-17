import { t } from '../../core/i18n';

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
}

/**
 * Build the multiline stats block shown on the pause overlay. Returns
 * the raw array so tests can count lines without string-splitting;
 * the caller joins with '\n'.
 */
export function buildPauseStatsLines(input: PauseStatsInput): string[] {
  const safeTime = Math.max(0, Math.floor(input.timeSec));
  const mins = Math.floor(safeTime / 60);
  const secs = Math.floor(safeTime % 60);
  const lines: string[] = [
    t('ui.pause.time_line', { m: mins, s: secs.toString().padStart(2, '0') }),
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

  return lines;
}
