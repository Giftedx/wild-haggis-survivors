/**
 * ReplayRecorder — per-run input / delta capture for T1.
 *
 * Captures one frame per GameScene update() tick. Values are clamped
 * through `clampReplayFrame` on push so the recorded stream matches the
 * playback contract (|dir| ≤ 1, dtMs ∈ [0, 100], boolean edges).
 *
 * The recorder is constructed by GameScene when `resolveReplayMode() ===
 * 'record'` and flushed into `RunHistoryContext.replay` at run end.
 * Metadata (seed, variantKey, build) is set once at construction; only
 * frames are appended.
 */
import {
  clampReplayFrame,
  createEmptyReplayBlob,
  type ReplayBlob,
  type ReplayBlobMeta,
  type ReplayFrame,
} from './replayBlob';

export class ReplayRecorder {
  private readonly meta: ReplayBlobMeta;
  private frames: ReplayFrame[] = [];

  constructor(meta: ReplayBlobMeta) {
    this.meta = { build: meta.build, seed: meta.seed, variantKey: meta.variantKey };
  }

  /** Push a single frame; values are clamped by the schema. */
  pushFrame(frame: ReplayFrame): void {
    this.frames.push(clampReplayFrame(frame));
  }

  /** Drop all captured frames; keep metadata. */
  reset(): void {
    this.frames = [];
  }

  getFrameCount(): number {
    return this.frames.length;
  }

  /**
   * Build a ReplayBlob snapshot. Frames are copied — callers may keep
   * pushing into the recorder after finalize() without mutating the
   * returned blob.
   */
  finalize(): ReplayBlob {
    const blob = createEmptyReplayBlob(this.meta);
    blob.frames = this.frames.slice();
    blob.frameCount = blob.frames.length;
    return blob;
  }
}
