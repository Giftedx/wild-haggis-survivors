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

/** Extended meta accepted at construction. v2 fields are optional. */
export interface ReplayRecorderMeta extends ReplayBlobMeta {
  /** Active curse key if the player took one for this run. */
  curseKey?: string;
  /** Snapshot of composed player stats at run start. */
  composedStats?: ComposedStatsSnapshot;
}

export class ReplayRecorder {
  private readonly meta: ReplayRecorderMeta;
  private frames: ReplayFrame[] = [];
  private routes: RoutePick[] = [];
  private nodeOutcomes: NodeOutcome[] = [];

  constructor(meta: ReplayRecorderMeta) {
    this.meta = {
      build: meta.build,
      seed: meta.seed,
      variantKey: meta.variantKey,
      curseKey: meta.curseKey,
      composedStats: meta.composedStats,
    };
  }

  /** Push a single frame; values are clamped by the schema. */
  pushFrame(frame: ReplayFrame): void {
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

  /** True when captured node outcomes require a v3 blob. */
  private needsV3(): boolean {
    return this.nodeOutcomes.length > 0;
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
      nodeOutcomes: this.nodeOutcomes.slice(),
    });
    blob.frames = this.frames.slice();
    blob.frameCount = blob.frames.length;
    return blob;
  }
}
