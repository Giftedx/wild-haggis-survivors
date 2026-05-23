/**
 * ReplayRecorder — per-run input / delta capture for T1.
 *
 * Captures one frame per GameScene update() tick. Values are clamped
 * through `clampReplayFrame` on push so the recorded stream matches the
 * playback contract (|dir| ≤ 1, dtMs ∈ [0, 100], boolean edges).
 *
 * The recorder is constructed by GameScene when `resolveReplayMode() ===
 * 'record'` and flushed into `RunHistoryContext.replay` at run end.
 * Metadata (seed, variantKey, build) is set once at construction.
 *
 * T1 Phase 3: optional v2 metadata (curseKey, composedStats) may be
 * passed at construction; route picks are captured via `pushRoute`.
 * `finalize()` emits a v1 blob when none of the v2 fields were ever set
 * (back-compat default) and a v2 blob when any of them were.
 */
import {
  clampReplayFrame,
  createEmptyReplayBlob,
  type ReplayBlob,
  type ReplayBlobMeta,
  type ReplayFrame,
} from './replayBlob';
import {
  createEmptyReplayBlobV2,
  type ReplayBlobV2,
} from './replayBlobV2';
import {
  createEmptyReplayBlobV3,
  type ReplayBlobV3,
} from './replayBlobV3';
import type { ComposedStatsSnapshot } from './composedStatsSnapshot';
import type { RoutePick } from '../data/routes';
import type { NodeOutcome } from '../data/nodeTypes';
import type { FallenCairn } from '../utils/save/fallenCairns';

/** Extended meta accepted at construction. v2 / v3 fields are optional. */
export interface ReplayRecorderMeta extends ReplayBlobMeta {
  /** Active curse key if the player took one for this run. */
  curseKey?: string;
  /** Snapshot of composed player stats at run start. */
  composedStats?: ComposedStatsSnapshot;
  /**
   * S1 Phase 2 — Sporran Deck picks (3 of 7 drawn cards) committed at
   * run start. Captured into the v3 blob so playback re-applies the
   * same modifier deltas without re-rolling. Empty / absent = the
   * player took the Curse / clean path; recorder needs the field at
   * construction (not per-frame) because picks are immutable post
   * run-start.
   */
  sporranPicks?: readonly string[];
  /**
   * T12 — The Moor Remembers cairn list captured at run-start (snapshot
   * of `saveManager.getFallenCairns()`). Stored in the v3 blob payload
   * so replays read this array rather than the live meta-save, preserving
   * the T1 determinism contract across FIFO rotations.
   *
   * Wired in GameScene.create() (T10): replay mode passes this list to
   * CairnOfEchoesScheduler.getCairns so FIFO-rotated cairns still replay.
   */
  cairns?: readonly FallenCairn[];
}

/**
 * T308 — soft cap on captured frames so a marathon run can't blow past
 * localStorage quota. 90,000 frames ≈ 25 minutes at 60fps; runs longer
 * than this are exceedingly rare (median run ≈ 8 min per RunStatsTracker
 * telemetry), so the cap chooses "preserve the early game completely"
 * over the alternative of sampling. Frames past the cap are dropped with
 * a single console warning; the recorded blob still finalises cleanly,
 * just with a truncated suffix. Replay playback degrades gracefully —
 * `ReplayInput.isComplete()` fires when the recorded frame stream ends,
 * after which the player drives manually.
 */
export const REPLAY_RECORDER_FRAME_CAP = 90_000;

export class ReplayRecorder {
  private readonly meta: ReplayRecorderMeta;
  private readonly sporranPicks: readonly string[];
  private readonly cairns: readonly FallenCairn[];
  private frames: ReplayFrame[] = [];
  private routes: RoutePick[] = [];
  private nodeOutcomes: NodeOutcome[] = [];
  private capWarned = false;

  constructor(meta: ReplayRecorderMeta) {
    this.meta = {
      build: meta.build,
      seed: meta.seed,
      variantKey: meta.variantKey,
      curseKey: meta.curseKey,
      composedStats: meta.composedStats,
    };
    // Snapshot at construction — picks are immutable post run-start.
    // Filtering empty strings here keeps `needsV3` honest if a caller
    // passes an array with bad shape.
    this.sporranPicks = meta.sporranPicks
      ? meta.sporranPicks.filter((id): id is string => typeof id === 'string' && id.length > 0)
      : [];
    // Snapshot cairns at construction. The live meta-save may FIFO-rotate
    // these out between now and replay time; the payload copy ensures
    // replays see the same world the original run saw (T1 contract).
    this.cairns = meta.cairns ? [...meta.cairns] : [];
  }

  /** Push a single frame; values are clamped by the schema. */
  pushFrame(frame: ReplayFrame): void {
    if (this.frames.length >= REPLAY_RECORDER_FRAME_CAP) {
      if (!this.capWarned) {
        this.capWarned = true;
        if (typeof console !== 'undefined' && console.warn) {
          console.warn(
            `[replay] frame cap reached (${REPLAY_RECORDER_FRAME_CAP}); subsequent frames dropped`,
          );
        }
      }
      return;
    }
    this.frames.push(clampReplayFrame(frame));
  }

  /**
   * Record a Moor Road route pick as the intermission resolves. Order
   * matters — the list is replayed in the same order by the playback
   * branch in GameScene.
   */
  pushRoute(pick: RoutePick): void {
    this.routes.push({
      slot: pick.slot,
      routeKey: pick.routeKey,
      atGameTimeSec: pick.atGameTimeSec,
      defaultedBySetting: pick.defaultedBySetting,
    });
  }

  /**
   * Record a resolved Moor Road node outcome (M1). Passive visits
   * still need recording so replay's chronological order matches the
   * live run's; interactive nodes additionally carry the player's
   * chosen reward key so playback reproduces the decision.
   */
  pushNodeOutcome(outcome: NodeOutcome): void {
    this.nodeOutcomes.push({
      nodeKey: outcome.nodeKey,
      ...(outcome.chosenRewardKey ? { chosenRewardKey: outcome.chosenRewardKey } : {}),
      visitedAtGameTimeSec: outcome.visitedAtGameTimeSec,
    });
  }

  /** Drop all captured frames + routes + node outcomes. Construction meta is preserved. */
  reset(): void {
    this.frames = [];
    this.routes = [];
    this.nodeOutcomes = [];
  }

  getFrameCount(): number {
    return this.frames.length;
  }

  /** True when run-start meta or captured routes require a v2 blob. */
  private needsV2(): boolean {
    return (
      this.meta.curseKey !== undefined ||
      this.meta.composedStats !== undefined ||
      this.routes.length > 0
    );
  }

  /** True when captured node outcomes, sporran picks, or cairns require a v3 blob. */
  private needsV3(): boolean {
    return this.nodeOutcomes.length > 0 || this.sporranPicks.length > 0 || this.cairns.length > 0;
  }

  /**
   * Build a blob snapshot. Frames / routes / node outcomes are copied
   * — callers may keep pushing into the recorder after finalize()
   * without mutating the returned blob. Emits the lowest-version blob
   * that still represents every captured field (v1 → v2 → v3), so
   * older saves that never walked a node path keep reading as v2.
   */
  finalize(): ReplayBlob | ReplayBlobV2 | ReplayBlobV3 {
    if (!this.needsV2() && !this.needsV3()) {
      const blob = createEmptyReplayBlob({
        build: this.meta.build,
        seed: this.meta.seed,
        variantKey: this.meta.variantKey,
      });
      blob.frames = this.frames.slice();
      blob.frameCount = blob.frames.length;
      return blob;
    }
    if (!this.needsV3()) {
      const blob = createEmptyReplayBlobV2({
        build: this.meta.build,
        seed: this.meta.seed,
        variantKey: this.meta.variantKey,
        curseKey: this.meta.curseKey,
        routes: this.routes.length > 0 ? this.routes.slice() : undefined,
        composedStats: this.meta.composedStats,
      });
      blob.frames = this.frames.slice();
      blob.frameCount = blob.frames.length;
      return blob;
    }
    const blob = createEmptyReplayBlobV3({
      build: this.meta.build,
      seed: this.meta.seed,
      variantKey: this.meta.variantKey,
      curseKey: this.meta.curseKey,
      routes: this.routes.length > 0 ? this.routes.slice() : undefined,
      composedStats: this.meta.composedStats,
      nodeOutcomes: this.nodeOutcomes.length > 0 ? this.nodeOutcomes.slice() : undefined,
      sporranPicks: this.sporranPicks.length > 0 ? this.sporranPicks.slice() : undefined,
      cairns: this.cairns.length > 0 ? [...this.cairns] : undefined,
    });
    blob.frames = this.frames.slice();
    blob.frameCount = blob.frames.length;
    return blob;
  }
}
