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
import type { NodeOutcome } from '../data/nodeTypes';

const DEFAULT_FRAME: ReplayFrame = { dtMs: 0, dx: 0, dy: 0, dash: false, menu: false };

export class ReplayInput implements IInput {
  private index = -1;
  private dashConsumed = false;
  private menuConsumed = false;

  /**
   * M1 F5 — cursor over recorded node outcomes. v3 blobs carry the
   * append-only outcome log; v1/v2 blobs report empty (the field doesn't
   * exist on those schemas). Scene pops the next outcome when an
   * interactive node triggers during playback, so shrine / trader /
   * bargain auto-apply the recorded pick instead of re-opening the
   * prompt.
   */
  private readonly nodeOutcomes: readonly NodeOutcome[];
  private nodeOutcomeIndex = 0;

  constructor(private readonly blob: ReplayBlobAny) {
    const maybe = (blob as { nodeOutcomes?: NodeOutcome[] }).nodeOutcomes;
    this.nodeOutcomes = maybe ?? [];
  }

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

  // ── Node-outcome cursor (M1 F5) ─────────────────────────────────

  /**
   * Non-destructive view of the next recorded node outcome, or null
   * when the log is empty / exhausted. Scene uses this to short-circuit
   * interactive node prompts during playback.
   */
  peekNextNodeOutcome(): NodeOutcome | null {
    if (this.nodeOutcomeIndex >= this.nodeOutcomes.length) return null;
    return this.nodeOutcomes[this.nodeOutcomeIndex]!;
  }

  /** Consume and return the next outcome; null + no-op once exhausted. */
  consumeNodeOutcome(): NodeOutcome | null {
    const outcome = this.peekNextNodeOutcome();
    if (outcome) this.nodeOutcomeIndex++;
    return outcome;
  }

  /** Count of outcomes remaining ahead of the cursor. */
  getRemainingNodeOutcomeCount(): number {
    return Math.max(0, this.nodeOutcomes.length - this.nodeOutcomeIndex);
  }

  // ────────────────────────────────────────────────────────────────

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
