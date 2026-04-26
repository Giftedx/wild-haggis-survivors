/**
 * T401 slice — Run-start ceremony: Burns Night opening stinger + platter
 * spawn schedule. Was an inline block in `GameScene.create()` (lines
 * ~1282-1310 pre-extraction).
 *
 * What this owns:
 *   1. The Gran-opens-the-door delayedCall: fires `gran_commentary`
 *      banter (or the seasonal `seasonal_event` tag during Burns
 *      Night / Hogmanay etc.), with an audio stinger for events that
 *      ship one.
 *   2. The single-shot Burns Night haggis-platter pickup spawn,
 *      30 s into the run. Guarded against mid-flight scene reset by
 *      checking the `getBurnsPlatterSpawned()` accessor at fire-time
 *      — a stale future delayedCall from a prior run cannot double-
 *      fire because the reset block nulls the flag and the new
 *      ceremony schedule rebuilds the timer cleanly.
 *
 * Skipped entirely on replay playback (Gran does not narrate the
 * ghost run) and on resume (mid-run rehydration, not a new door).
 *
 * Why a thin adapter, not pure: the schedule must use the scene's
 * Phaser clock (`scene.time.delayedCall`) because the timer needs to
 * pause when the scene pauses (countdown overlay, level-up menu, etc.).
 * Wall-clock-timed `setTimeout` would slide past those gates and the
 * platter would spawn during a paused level-up screen. Phaser is *not*
 * imported at module top — the caller passes a `delayedCall` thunk so
 * this file stays vitest-node-env-safe.
 *
 * NOTE: The curse_start banter (lines ~1267-1273 in `create()`) is
 * deliberately NOT extracted by this slice. It is a pre-existing
 * delayedCall that runs regardless of replay/resume gating; merging
 * the two would change behavior. Future T401 work can fold it in if
 * the gating story converges.
 */
import {
  BURNS_PLATTER_SPAWN_MS,
  seasonalRunStartCeremony,
  shouldSpawnBurnsPlatter,
} from '../../systems/seasonal/burnsNightEffects';
import type { BanterContext } from '../../data/banter';

export interface RunStartCeremonyAudio {
  playBurnsPipesStinger(): void;
  playHogmanayBellsStinger(): void;
}

export interface RunStartCeremonyBanter {
  request(ctx: BanterContext, opts: { tag: string }): void;
}

export interface RunStartCeremonyPickupSpawner {
  spawnBurnsPlatter(): void;
}

export interface InstallRunStartCeremonyDeps {
  /** True when the scene is replaying a recorded run; ceremony is suppressed. */
  isReplayPlayback: boolean;
  /** True when the scene was started from a mid-run resume; ceremony is suppressed. */
  isResume: boolean;
  /** Resolved active curse key (null when no curse active); affects Gran-open delay. */
  activeCurseKey: string | null;
  /** User setting opt-out from seasonal events. */
  disableSeasonalEvents: boolean;
  /** Wall-clock now — pinned at call site so tests can clock-mock. */
  now: Date;
  /**
   * Schedule a callback against the scene's Phaser clock. Must be the
   * scene's own `scene.time.delayedCall` (or wrapper) so the timer
   * respects scene pause + timeScale.
   */
  scheduleSceneDelay: (delayMs: number, cb: () => void) => void;
  /** Flag accessor — `true` once the platter pickup has been spawned. */
  getBurnsPlatterSpawned: () => boolean;
  /** Flag mutator — flip to `true` once the platter is committed. */
  setBurnsPlatterSpawned: () => void;
  /** Pickup spawner singleton on the scene; may be null if not yet wired. */
  getPickupSpawner: () => RunStartCeremonyPickupSpawner | null;
  /** Banter façade; may be null in test scaffolding. */
  banter: RunStartCeremonyBanter | null;
  /** Audio façade — singleton on the scene side. */
  audio: RunStartCeremonyAudio;
}

/**
 * Schedules the run-start ceremony timers. Returns immediately when
 * gating suppresses the ceremony (replay, resume). Safe to call
 * multiple times across scene resets — each call schedules its own
 * timers; the spawned-flag guard prevents double-firing.
 */
export function installRunStartCeremony(deps: InstallRunStartCeremonyDeps): void {
  if (deps.isReplayPlayback || deps.isResume) return;

  const grandOpenMs = deps.activeCurseKey ? 2400 : 1200;
  const ceremony = seasonalRunStartCeremony(deps.now, deps.disableSeasonalEvents);

  deps.scheduleSceneDelay(grandOpenMs, () => {
    if (ceremony?.stingerId === 'burns_pipes_in') {
      deps.audio.playBurnsPipesStinger();
    } else if (ceremony?.stingerId === 'hogmanay_bells') {
      deps.audio.playHogmanayBellsStinger();
    }
    const ctx: BanterContext = ceremony ? ceremony.banterContext : 'gran_commentary';
    const tag = ceremony ? ceremony.banterTag : 'run_start';
    deps.banter?.request(ctx, { tag });
  });

  if (shouldSpawnBurnsPlatter(deps.now, deps.disableSeasonalEvents, deps.getBurnsPlatterSpawned())) {
    deps.scheduleSceneDelay(BURNS_PLATTER_SPAWN_MS, () => {
      if (deps.getBurnsPlatterSpawned()) return;
      const spawner = deps.getPickupSpawner();
      if (!spawner) return;
      deps.setBurnsPlatterSpawned();
      spawner.spawnBurnsPlatter();
    });
  }
}
