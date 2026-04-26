/**
 * RunPersistenceCoordinator — thin replay-aware wrapper around the
 * run-end persistence calls (`RunHistoryRecorder.record` and
 * `recordRun` from `utils/save`). Pulled out of GameScene so the
 * replay-playback guard is unit-testable without bootstrapping a Phaser
 * scene.
 *
 * Why: triple-audit T401 P3 residual decomposition. The two inline
 * lambdas wired into `RunLifecycle` (T307 history no-op + T1 replay
 * recordRun no-op) carried real business rules — "during playback,
 * don't re-write history" — but lived as anonymous closures inside
 * `GameScene.create()`. Promoting them into a coordinator keeps the
 * scene shell focused on wiring and gives the replay/history contract
 * one named home.
 *
 * Pure module. Phaser-free. The coordinator takes a "isReplayPlayback"
 * predicate so the scene shell still owns the live `replayInput` field
 * (it's the source of truth for whether playback is active).
 */
import type { RunHistoryContext, RunResult, RunSummary } from '../../utils/save';

/**
 * Narrow slice of `RunHistoryRecorder` the coordinator needs. Avoids
 * pulling the whole class into tests; only the side-effect API used.
 */
export interface RunHistoryRecorderForCoordinator {
  record(summary: RunSummary, runResult: RunResult): void;
}

/**
 * Save-side recordRun signature (matches `utils/save#recordRun`).
 * Injected so tests can drive without touching localStorage.
 */
export type RecordRunFn = (
  summary: RunSummary,
  context?: RunHistoryContext,
) => RunResult;

/**
 * Save loader for the replay-no-op fallback. Matches `utils/save#loadSave`
 * shape. Only the bare object shape `recordRun` returns ({ save, goldEarned,
 * newlyUnlockedVariants }) is needed; the coordinator delegates the actual
 * load to the injected helper so the meta-progress payload stays current
 * even when a replay run can't write a new history entry.
 */
export type LoadSaveFn = () => RunResult['save'];

export interface RunPersistenceCoordinatorHooks {
  /** Live source of truth for playback mode — read at call time, not cached. */
  isReplayPlayback(): boolean;

  /** History recorder owned by the scene. Coordinator calls `.record()` on it. */
  getHistoryRecorder(): RunHistoryRecorderForCoordinator;

  /** Underlying save.recordRun (or test stub). */
  recordRun: RecordRunFn;

  /** Underlying utils/save#loadSave (or test stub). */
  loadSave: LoadSaveFn;
}

export class RunPersistenceCoordinator {
  constructor(private readonly hooks: RunPersistenceCoordinatorHooks) {}

  /**
   * T307 — write to run history unless we're replaying. During playback
   * the Chronicle already has the original entry, so re-recording would
   * double-count the attempt and drift achievement progress.
   */
  recordToHistory(summary: RunSummary, runResult: RunResult): void {
    if (this.hooks.isReplayPlayback()) return;
    this.hooks.getHistoryRecorder().record(summary, runResult);
  }

  /**
   * T1 replay playback — don't pollute run history with a replay run.
   * Returns a synthesised RunResult with the current saved meta-progress
   * snapshot so the Lifecycle's GameOver payload still has live state to
   * read, but no new gold is credited and no new variants unlock.
   *
   * On a normal (non-replay) run, defers entirely to the injected
   * recordRun fn (which is `utils/save#recordRun` in production).
   */
  recordRun(summary: RunSummary, context: RunHistoryContext): RunResult {
    if (this.hooks.isReplayPlayback()) {
      return {
        save: this.hooks.loadSave(),
        goldEarned: 0,
        newlyUnlockedVariants: [],
      };
    }
    return this.hooks.recordRun(summary, context);
  }
}
