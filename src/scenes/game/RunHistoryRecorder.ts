/**
 * RunHistoryRecorder — captures a finished run into the meta save's
 * run-history log, plus the per-day Daily Challenge record when the
 * run was a daily attempt.
 *
 * Extracted from GameScene (buildRunHistoryContext + recordToHistory +
 * recordDailyChallengeResult). Doesn't own scene state — pure bridge
 * between scene counters and SaveManager writes.
 */
import type { SaveManager } from '../../core/SaveManager';
import type { XPSystem } from '../../systems/XPSystem';
import type { WeaponSystem } from '../../systems/WeaponSystem';
import type { VariantDef } from '../../data/variants';
import type { CurseKey } from '../../data/curses';
import type { RNG } from '../../utils/rng';
import type { RunSummary, RunResult, RunHistoryContext } from '../../utils/save';
import type { RoutePick } from '../../data/routes';
import type { ReplayBlobAny } from '../../replay/replayBlob';
import { currentDailyDateKey } from '../../utils/rng';

export interface RunHistoryHooks {
  getSaveManager(): SaveManager;
  getXPSystem(): XPSystem;
  getWeaponSystem(): WeaponSystem;
  getActiveVariant(): VariantDef;
  getActiveCurseKey(): CurseKey | null;
  getBossKillCount(): number;
  getRunRng(): RNG;
  isDailyRun(): boolean;
  /** W2 Moor Road: snapshot of picker resolutions for this run. */
  getRoutePicks(): readonly RoutePick[];
  /** W66 Ironmoor: true when this run had single-life mode on. */
  isIronmoor(): boolean;
  /**
   * T1 deterministic replay — snapshot of the run's captured replay blob,
   * if recording was active. Returns `null` when replay mode was off.
   * Hook is optional so tests that don't care about replay can omit it.
   */
  getReplayBlob?(): ReplayBlobAny | null;
  /**
   * LG T5 — cosmetic display name generated at run start. Optional so
   * existing tests that don't supply it keep compiling without change.
   */
  getRunName?(): string;
  /** Injected for test determinism; defaults to Date.now. */
  now?: () => number;
}

export class RunHistoryRecorder {
  constructor(private readonly hooks: RunHistoryHooks) {}

  /** Light context object used by live run-end UI (uses pre-summary data). */
  buildContext(): RunHistoryContext {
    const h = this.hooks;
    const curse = h.getActiveCurseKey();
    const routes = h.getRoutePicks();
    const replay = h.getReplayBlob?.() ?? null;
    const name = h.getRunName?.();
    return {
      level: h.getXPSystem().getLevel(),
      bossKills: h.getBossKillCount(),
      variantKey: h.getActiveVariant().key,
      weaponKeys: h.getWeaponSystem().getWeapons().map((w) => w.config.key),
      runSeed: h.getRunRng().seed,
      ...(curse ? { curseKey: curse } : {}),
      ...(routes.length > 0 ? { routes: routes.slice() } : {}),
      ...(h.isIronmoor() ? { ironmoor: true } : {}),
      ...(replay ? { replay } : {}),
      ...(name ? { name } : {}),
    };
  }

  /**
   * Append this run to the full run-history log. For daily runs, also
   * updates the per-day challenge record (best time / kills / attempts).
   */
  record(summary: RunSummary, runResult: RunResult): void {
    const h = this.hooks;
    const timestamp = (h.now ?? Date.now)();
    const routes = h.getRoutePicks();
    const name = h.getRunName?.();
    h.getSaveManager().recordRunToHistory({
      timestamp,
      timeSurvivedSec: summary.timeSurvivedSec,
      enemiesKilled: summary.enemiesKilled,
      level: h.getXPSystem().getLevel(),
      bossKills: h.getBossKillCount(),
      goldEarned: runResult.goldEarned,
      bestCombo: summary.bestCombo ?? 0,
      variantKey: h.getActiveVariant().key,
      isVictory: summary.victory ?? false,
      weaponKeys: h.getWeaponSystem().getWeapons().map((w) => w.config.key),
      runSeed: h.getRunRng().seed,
      isDaily: h.isDailyRun(),
      ...(routes.length > 0 ? { routes: routes.slice() } : {}),
      ...(name ? { name } : {}),
    });
    if (h.isDailyRun()) {
      this.recordDailyChallengeResult(summary);
    }
  }

  /**
   * Update the per-day Daily Challenge record. Bumps attempts, updates
   * best-time/kill records, and marks completion on the first victory
   * today. If the record is for a past date (e.g. player left the run
   * open overnight), start a fresh record for today.
   */
  private recordDailyChallengeResult(summary: RunSummary): void {
    const todayKey = currentDailyDateKey();
    this.hooks.getSaveManager().update((cur) => {
      const prior =
        cur.dailyChallenge && cur.dailyChallenge.dateKey === todayKey
          ? cur.dailyChallenge
          : {
              dateKey: todayKey,
              bestTimeSec: 0,
              bestEnemiesKilled: 0,
              attempts: 0,
              completedVictory: false,
            };
      return {
        ...cur,
        dailyChallenge: {
          dateKey: todayKey,
          bestTimeSec: Math.max(prior.bestTimeSec, summary.timeSurvivedSec),
          bestEnemiesKilled: Math.max(prior.bestEnemiesKilled, summary.enemiesKilled),
          attempts: prior.attempts + 1,
          completedVictory: prior.completedVictory || Boolean(summary.victory),
        },
      };
    });
  }
}
