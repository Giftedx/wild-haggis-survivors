/**
 * ReplayInput — playback-side façade that reads recorded frames back as if
 * the user were typing them live. Shape matches the `InputManager` read
 * surface Player / GameScene already use (`getDirection`, `consumeDash…`,
 * `consumeMenuPausePressed`), so a future "use replay input during
 * playback" wire-up can swap the concrete implementation behind an
 * interface without touching callers.
 *
 * This module ships ahead of the playback engine (no GameScene wiring
 * yet — see ADR-0002 follow-ups). It documents the playback contract and
 * is covered by pure tests: construct with a blob, consume frames in
 * order, verify `dash`/`menu` fire once per captured edge.
 *
 * Frame cursor advances when the playback driver calls `advanceFrame()`
 * (one call per game-loop tick). Between `advanceFrame` calls, calls to
 * `getDirection` / `consumeDashPressed` / `consumeMenuPausePressed`
 * return values for the *current* frame — `consume…` methods clear
 * their edge flag on first read so a caller that polls twice still
 * sees exactly one dash / pause fire per recorded frame.
 */
import type { IInput } from '../utils/iInput';
import type { ReplayBlobAny, ReplayFrame } from './replayBlob';

const DEFAULT_FRAME: ReplayFrame = { dtMs: 0, dx: 0, dy: 0, dash: false, menu: false };

export class ReplayInput implements IInput {
  private index = -1;
  private dashConsumed = false;
  private menuConsumed = false;

  constructor(private readonly blob: ReplayBlobAny) {}

  /**
   * Advance to the next recorded frame. Returns the frame the cursor
   * now points at, or `null` when the blob is exhausted (past the
   * final frame). Resets the per-frame edge-consume flags so the next
   * `consumeDashPressed()` / `consumeMenuPausePressed()` pair will
   * return true at most once each, matching the recording.
   */
  advanceFrame(): ReplayFrame | null {
    if (this.index + 1 >= this.blob.frames.length) {
      this.index = this.blob.frames.length;
      return null;
    }
    this.index += 1;
    this.dashConsumed = false;
    this.menuConsumed = false;
    return this.currentFrame();
  }

  /** True once the cursor is past the last recorded frame. */
  isExhausted(): boolean {
    return this.index >= this.blob.frames.length;
  }

  /** Frames consumed so far (equals `advanceFrame` call count while in-bounds). */
  getFrameIndex(): number {
    return this.index;
  }

  /** Total frames available in the blob. */
  getFrameCount(): number {
    return this.blob.frames.length;
  }

  /** Millisecond delta the recorder captured for the current frame. */
  getCurrentDeltaMs(): number {
    return this.currentFrame().dtMs;
  }

  // ── InputManager shape ───────────────────────────────────────────

  /** Direction vector recorded for the current frame. */
  getDirection(): { x: number; y: number } {
    const f = this.currentFrame();
    return { x: f.dx, y: f.dy };
  }

  consumeDashPressed(): boolean {
    if (this.dashConsumed) return false;
    const f = this.currentFrame();
    if (!f.dash) return false;
    this.dashConsumed = true;
    return true;
  }

  consumeMenuPausePressed(): boolean {
    if (this.menuConsumed) return false;
    const f = this.currentFrame();
    if (!f.menu) return false;
    this.menuConsumed = true;
    return true;
  }

  /**
   * Non-destructive view of the current frame's snapshot. Present so the
   * replay source satisfies the IInput contract — record-while-playback
   * (future ghost-chain feature) needs this path for pass-through.
   */
  peekReplayFrame(): { dx: number; dy: number; dash: boolean; menu: boolean } {
    const f = this.currentFrame();
    return {
      dx: f.dx,
      dy: f.dy,
      dash: f.dash && !this.dashConsumed,
      menu: f.menu && !this.menuConsumed,
    };
  }

  /** No listeners to tear down — the recorded blob is inert. IInput contract. */
  destroy(): void {
    /* no-op */
  }

  private currentFrame(): ReplayFrame {
    if (this.index < 0 || this.index >= this.blob.frames.length) return DEFAULT_FRAME;
    return this.blob.frames[this.index];
  }
}
