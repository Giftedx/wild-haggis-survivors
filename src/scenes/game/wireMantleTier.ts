/**
 * Phase 5 Bucket 14 partial — wires the kill-count → mantle-tier
 * pipeline that GameScene used to host as a private method.
 *
 * Two responsibilities:
 *   1. Pre-seed the player's mantle tier from the current kill count
 *      so replays + save-mid-run starts at the correct tier with no
 *      reveal tween (`instant: true`).
 *   2. Subscribe to `runScore.onKillsChanged` so subsequent kills
 *      bump the tier — `instant` here follows the player's motion-
 *      scale comfort setting (motionScale === 0 means "skip tween").
 *
 * Pure helper — no Phaser imports. Owns the closure over `player`
 * for the kill-listener, but does not retain its own state.
 */
import type { Player } from '../../entities/Player';
import type { SettingsManager } from '../../core/SettingsManager';
import type { RunScoreState } from './RunScoreState';
import { computeMantleTier } from '../../animation/mantleTier';

export interface WireMantleTierOpts {
  player: Player;
  runScore: RunScoreState;
  settingsManager: SettingsManager;
}

export function wireMantleTier(opts: WireMantleTierOpts): void {
  const { player, runScore, settingsManager } = opts;
  const motionScale = settingsManager.load().motionScale;
  const instantForComfort = motionScale === 0;
  player.setMantleTier(
    computeMantleTier(runScore.killCount),
    { instant: true },
  );
  runScore.onKillsChanged = (kills: number) => {
    const nextTier = computeMantleTier(kills);
    if (nextTier === player.getMantleTier()) return;
    player.setMantleTier(nextTier, { instant: instantForComfort });
  };
}
