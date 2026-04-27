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
import type { RelicKey } from '../../data/relics';
import type { RNG } from '../../utils/rng';
import type { RunSummary, RunResult, RunHistoryContext } from '../../utils/save';
import type { RoutePick } from '../../data/routes';
import type { ReplayBlobAny } from '../../replay/replayBlob';
import { currentDailyDateKey } from '../../utils/rng';
import { getActiveSeasonalEventKey } from '../../systems/SeasonalEventManager';

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
  /**
   * R1 M4 T27 — snapshot of held Relic keys at run-end. Empty array
   * when the player held none or the relic system wasn't active.
   */
  getHeldRelicKeys?(): readonly RelicKey[];
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
  /**
   * E1 M4 — opt-out for seasonal events. Optional so tests that don't
   * exercise the seasonal path keep compiling; defaults to `false`.
   */
  areSeasonalEventsDisabled?(): boolean;
  /**
   * V2 Track 1 — true if the player ever received a heal-tick from a
   * healing circle this run. `applyRunSummary` increments the Doric
   * Quinie no-heal counter when this stays false through a victory.
   * Optional so tests that don't exercise the path keep compiling.
   */
  getEnteredHealingCircle?(): boolean;
  /**
   * V2 Track 2 — snapshot of biome IDs the player entered this run.
   * Passed through to `applyRunSummary` as `biomesVisited`; used to
   * decide the Peerie Shetlander coastal-only unlock. Optional so
   * tests that don't exercise the path keep compiling.
   */
  getBiomesVisited?(): readonly string[];
  /**
   * V2 Track 3 — number of weapons currently in evolved form. Read at
   * run-end to decide the Burns's Wee Beastie unlock (threshold 7).
   * Optional so tests that don't exercise the path keep compiling.
   */
  getEvolvedWeaponCount?(): number;
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
    const relics = h.getHeldRelicKeys?.() ?? [];
    const replay = h.getReplayBlob?.() ?? null;
    const name = h.getRunName?.();
    const enteredHealingCircle = h.getEnteredHealingCircle?.() ?? true;
    const biomesVisited = h.getBiomesVisited?.() ?? [];
    const evolvedWeaponCount = h.getEvolvedWeaponCount?.() ?? 0;
    // E1 M2 T11 — resolve active event at build-context time, same
    // opt-out semantics as the Chronicle stamp so the unlock gate
    // matches what the player sees in their run history. Thread the
    // optional `h.now` hook (same shape `record()` uses on line 125)
    // so unit tests can pin the clock — without this, the build-context
    // suite breaks whenever real-world date crosses an event window.
    const seasonalDisabled = h.areSeasonalEventsDisabled?.() ?? false;
    const nowMs = (h.now ?? Date.now)();
    const seasonalEventKey = getActiveSeasonalEventKey(new Date(nowMs), seasonalDisabled);
    return {
      level: h.getXPSystem().getLevel(),
      bossKills: h.getBossKillCount(),
      variantKey: h.getActiveVariant().key,
      weaponKeys: h.getWeaponSystem().getWeapons().map((w) => w.config.key),
      runSeed: h.getRunRng().seed,
      ...(curse ? { curseKey: curse } : {}),
      ...(routes.length > 0 ? { routes: routes.slice() } : {}),
      ...(relics.length > 0 ? { relics: [...relics] } : {}),
      ...(h.isIronmoor() ? { ironmoor: true } : {}),
      ...(replay ? { replay } : {}),
      ...(name ? { name } : {}),
      ...(seasonalEventKey ? { seasonalEventKey } : {}),
      enteredHealingCircle,
      biomesVisited: [...biomesVisited],
      evolvedWeaponCount,
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
    const relics = h.getHeldRelicKeys?.() ?? [];
    const name = h.getRunName?.();
    // E1 M4 — opt-out respects the setting: a player who's silenced
    // seasonal events gets no badge on their Chronicle row either.
    const seasonalDisabled = h.areSeasonalEventsDisabled?.() ?? false;
    const seasonalEvent = getActiveSeasonalEventKey(new Date(timestamp), seasonalDisabled);
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
      ...(relics.length > 0 ? { relics: [...relics] } : {}),
      ...(name ? { name } : {}),
      ...(seasonalEvent ? { seasonalEvent } : {}),
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
