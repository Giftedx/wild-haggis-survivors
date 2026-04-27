/**
 * T401 slice — Replay bridge install/teardown for GameScene.
 *
 * Owns the one-shot wiring of the T1 deterministic-replay layer at run
 * start. The per-frame `pushFrame` / `advanceFrame` pumps stay inside
 * the scene's update loop because they're tightly tied to the live
 * Phaser tick — but the *setup* is a cohesive three-step orchestration
 * that benefits from being pure, testable, and Phaser-import-free:
 *
 *   1. `installReplayPlayback` — given the pending init blob and the
 *      resolved current mode, decide between playback / record / off,
 *      build a `ReplayInput` driver if a blob is present, and surface
 *      the v2 sub-shape so callers can use the recorded curse +
 *      composedStats + routes downstream. Mutually-exclusive modes
 *      with single-source decision logic.
 *   2. `installReplayRecording` — only when mode === 'record', build a
 *      `ReplayRecorder` with the live curse + composed stats so the
 *      v2 blob captures run-start metadata. Seeds `pendingReplayRoutes`
 *      from the playback blob (empty when not playing back).
 *   3. `resetReplayBridge` — drop-in for the 8-line block at the top of
 *      `GameScene.resetTransientRunState`: dispose any prior
 *      `ReplayInput` and clear the route queue so a recycled scene
 *      instance never bleeds replay state into a new run.
 *
 * Why the split into two installs rather than one? The `create()` flow
 * needs the playback driver + the v2 sub-shape *before* curse +
 * composedStats are resolved (Player gets `replayInput` at construction;
 * curse derivation reads `playbackV2.curseKey`; composedStats reads
 * `playbackV2.composedStats`). The recorder, by contrast, needs those
 * resolved values folded into its meta so the captured blob is a
 * faithful snapshot. Splitting keeps each helper a pure transform that
 * tests can drive in isolation.
 *
 * No Phaser imports — vitest under node-env breaks on Phaser eval (see
 * CLAUDE.md gotchas). The replay modules themselves are pure.
 *
 * Determinism contract (CLAUDE.md "Arcade fixed-step (T1 replay
 * contract)"): physics integration is `fps: 60, fixedStep: true`. This
 * helper does not touch the integrator — it only mediates the input
 * source and the blob capture. `replayDeterminism.test.ts` continues to
 * exercise the byte-identical replay contract via `ReplayInput` directly.
 */
import { ReplayInput } from '../../replay/ReplayInput';
import { ReplayRecorder } from '../../replay/ReplayRecorder';
import type { ReplayBlobAny } from '../../replay/replayBlob';
import type { ReplayBlobV2 } from '../../replay/replayBlobV2';
import { captureComposedStats } from '../../replay/composedStatsSnapshot';
import type { ComposedPlayerStats } from '../../core/StatComposer';
import type { RoutePick } from '../../data/routes';

export type ReplayBridgeMode = 'playback' | 'record' | 'off';

export interface InstallReplayPlaybackInput {
  /** Blob captured during `init(data)` — non-null when the scene was
   *  asked to play back a recorded run. The helper consumes it and
   *  signals the caller to clear the field via the returned
   *  `consumePending` flag. */
  pendingReplay: ReplayBlobAny | null;
  /** Live record-mode resolver result. The helper combines this with
   *  `pendingReplay` to pick the mutually-exclusive mode. */
  resolvedMode: 'record' | 'off';
}

export interface InstallReplayPlaybackResult {
  /** The mode the scene should observe for the rest of `create()`. */
  replayMode: ReplayBridgeMode;
  /** Non-null when `replayMode === 'playback'`. Pass to `Player`
   *  construction so the entity reads recorded frames instead of live
   *  input. */
  replayInput: ReplayInput | null;
  /** The blob the playback driver was built from, returned for
   *  downstream curse / composedStats / routes resolution. Null
   *  outside of playback. */
  playbackBlob: ReplayBlobAny | null;
  /** Same blob narrowed to v2 (and only v2) — null otherwise. v1
   *  blobs lack the metadata fields the curse + stats path needs. */
  playbackV2: ReplayBlobV2 | null;
  /** True when the helper consumed `pendingReplay`; the caller MUST
   *  null its own field so a recycled scene doesn't replay twice. */
  consumePending: boolean;
}

/**
 * Resolve replay mode and build the playback driver if one is needed.
 * Pure — same input always yields the same output. Caller is
 * responsible for assigning the returned `replayInput` to the scene
 * field and clearing `pendingReplay` when `consumePending === true`.
 */
export function installReplayPlayback(
  input: InstallReplayPlaybackInput,
): InstallReplayPlaybackResult {
  const replayMode: ReplayBridgeMode = input.pendingReplay
    ? 'playback'
    : input.resolvedMode === 'record'
      ? 'record'
      : 'off';

  const playbackBlob = replayMode === 'playback' ? input.pendingReplay : null;
  const replayInput = playbackBlob ? new ReplayInput(playbackBlob) : null;
  const playbackV2 =
    playbackBlob && playbackBlob.version === 2 ? playbackBlob : null;

  return {
    replayMode,
    replayInput,
    playbackBlob,
    playbackV2,
    consumePending: playbackBlob !== null,
  };
}

export interface InstallReplayRecordingInput {
  /** Resolved mode from `installReplayPlayback`. Only `'record'`
   *  builds a recorder; the other modes return a null recorder so the
   *  scene's null-checked finalize/pushFrame guards continue to work. */
  replayMode: ReplayBridgeMode;
  /** Same v2 sub-shape returned by `installReplayPlayback`. Used to
   *  seed `pendingReplayRoutes`; null in record / off mode → empty
   *  queue. */
  playbackV2: ReplayBlobV2 | null;
  /** Run RNG seed — folded into the recorder meta so the captured
   *  blob can re-establish RNG on playback. */
  seed: number;
  /** Variant key chosen for the run. */
  variantKey: string;
  /** Build identifier (`whs-prod` in production, `whs-dev` in dev). */
  build: string;
  /** Active curse key once resolved, or null when no curse. Folded
   *  into the v2 meta so playback re-applies the same curse. */
  curseKey: string | null;
  /** Composed player stats after curse + meta-upgrade application.
   *  Captured via `captureComposedStats` and frozen into the blob so
   *  playback uses the same starting sheet the recorder saw. */
  composedStats: ComposedPlayerStats;
}

export interface InstallReplayRecordingResult {
  /** Non-null only when `replayMode === 'record'`. */
  replayRecorder: ReplayRecorder | null;
  /** Snapshot of the playback route queue. Empty outside playback.
   *  `launchActIntermission` shifts one off the front per act
   *  boundary; the slice is so the helper owns the v2 → live array
   *  copy in one place rather than scattering `?? []` across the
   *  scene. */
  pendingReplayRoutes: RoutePick[];
}

/**
 * Build the recorder (when mode === 'record') and seed the playback
 * route queue (when v2 playback). Pure — caller assigns the returned
 * fields onto the scene.
 */
export function installReplayRecording(
  input: InstallReplayRecordingInput,
): InstallReplayRecordingResult {
  const replayRecorder =
    input.replayMode === 'record'
      ? new ReplayRecorder({
          seed: input.seed,
          variantKey: input.variantKey,
          build: input.build,
          curseKey: input.curseKey ?? undefined,
          composedStats: captureComposedStats(input.composedStats),
        })
      : null;

  const pendingReplayRoutes: RoutePick[] = input.playbackV2?.routes
    ? input.playbackV2.routes.slice()
    : [];

  return { replayRecorder, pendingReplayRoutes };
}

export interface ResetReplayBridgeInput {
  /** Existing playback driver — destroyed if non-null. */
  replayInput: ReplayInput | null;
}

export interface ResetReplayBridgeResult {
  /** Always null — the helper signals the scene to drop the reference
   *  so GC can reclaim the captured frame array. */
  replayInput: null;
  /** Always empty — fresh array, not the same reference (so a stale
   *  pop from the prior run can't leak). */
  pendingReplayRoutes: RoutePick[];
}

/**
 * Tear down any prior-run replay driver and signal an empty route
 * queue. Used in `resetTransientRunState`. `replayInput.destroy()` is
 * a no-op for the v1 driver (no live listeners) but kept for symmetry
 * with `IInput.destroy` and to match the pre-extraction call shape.
 */
export function resetReplayBridge(
  input: ResetReplayBridgeInput,
): ResetReplayBridgeResult {
  input.replayInput?.destroy();
  return { replayInput: null, pendingReplayRoutes: [] };
}

/**
 * One frame of input snapshot — matches `Player.peekReplayInputFrame`
 * shape. Helper takes the snapshot rather than the Player so the
 * pump stays Phaser-import-free.
 */
export interface ReplayFrameSnapshot {
  dx: number;
  dy: number;
  dash: boolean;
  menu: boolean;
}

export interface RecordReplayFrameInput {
  /** Recorder to push into; null when not recording. */
  recorder: ReplayRecorder | null;
  /** Per-tick snapshot from the Player (or null when no Player exists
   *  yet — e.g. early in `create()` before construction). */
  snapshot: ReplayFrameSnapshot | null;
  /** Wall-clock delta from the scene tick, already clamped to [0, 100]
   *  by the caller (matches GameScene's existing clamp). */
  dtMs: number;
}

/**
 * Push one frame into the recorder. No-op when either the recorder is
 * null OR the snapshot is null (mirrors the pre-extraction guard
 * `if (this.replayRecorder && this.player)`). Called once per scene
 * tick from the `update()` finally block so menu edges that toggle
 * pause are recorded at the game-time they fired.
 */
export function recordReplayFrame(input: RecordReplayFrameInput): void {
  if (!input.recorder || !input.snapshot) return;
  input.recorder.pushFrame({
    dtMs: input.dtMs,
    dx: input.snapshot.dx,
    dy: input.snapshot.dy,
    dash: input.snapshot.dash,
    menu: input.snapshot.menu,
  });
}

export interface TickReplayPlaybackInput {
  /** Playback driver; null when not in playback. */
  replayInput: ReplayInput | null;
}

export interface TickReplayPlaybackResult {
  /** True when the caller should bail out of `updateInner` for this
   *  tick. Either (a) playback is off (no advance needed; caller
   *  proceeds) — false; or (b) the cursor exhausted the blob and the
   *  caller should kick the scene to Chronicle — true. */
  exhausted: boolean;
}

/**
 * Advance the playback cursor one frame. Returns `{ exhausted: true }`
 * when the blob is past its final frame so the caller can hand off to
 * Chronicle. The caller still owns the `scene.start('Chronicle')`
 * call — keeping that on the scene side preserves Phaser-free purity
 * here. No-op (returns `{ exhausted: false }`) when not in playback.
 */
export function tickReplayPlayback(
  input: TickReplayPlaybackInput,
): TickReplayPlaybackResult {
  if (!input.replayInput) return { exhausted: false };
  const next = input.replayInput.advanceFrame();
  return { exhausted: next === null };
}
