/**
 * Burn Leap double-tap detector — pure evaluator.
 *
 * Given a per-frame snapshot of the player's direction input, decides
 * whether the player just completed a double-tap of the same cardinal /
 * diagonal direction within the tap window, and (if so) the normalized
 * direction the leap should fire in.
 *
 * Kept pure so replay-mode playback (ReplayInput feeding recorded
 * dx/dy into Player.update) re-detects the same leap deterministically
 * as live play — no hidden Phaser state, no Date.now, all timing
 * passed in from the caller.
 *
 * Signature inspired by `src/scenes/game/actIntermissionResolve.ts`
 * — the scene owns its ticker and calls this with (prev, curr, now).
 */

/** Max ms between direction release and the second press for a leap to arm. */
export const BURN_LEAP_DOUBLE_TAP_WINDOW_MS = 280;

/**
 * Dot-product threshold between the released direction and the re-press
 * direction. 0.85 ≈ 31.8° tolerance — tight enough that NE→N doesn't
 * chain a leap, loose enough that stick drift on a gamepad doesn't
 * eat the gesture.
 */
export const BURN_LEAP_DIR_DOT_THRESHOLD = 0.85;

/**
 * Minimum vector length that counts as a "press". Below this the
 * direction is treated as zero (idle / dead-zone).
 */
export const BURN_LEAP_DIR_MIN_LEN = 0.2;

export interface BurnLeapEvalInput {
  /** Direction vector from the previous frame (not normalized). */
  readonly prevDir: { x: number; y: number };
  /** Direction vector this frame (not normalized). */
  readonly currDir: { x: number; y: number };
  /** Monotonic game-time timestamp (ms) for this frame. */
  readonly nowMs: number;
  /** Timestamp of the last direction release, or a very negative sentinel if none. */
  readonly lastReleaseTimeMs: number;
  /** Normalized direction at the last release, or null if none / stale. */
  readonly lastReleaseDir: { x: number; y: number } | null;
  /** True when the Burn Leap cooldown is still ticking down. */
  readonly cooldownActive: boolean;
}

export interface BurnLeapEvalResult {
  /** True when this frame completes a valid double-tap. */
  readonly trigger: boolean;
  /** Normalized direction to leap in. Only non-null when `trigger` is true. */
  readonly triggerDir: { x: number; y: number } | null;
  /** Updated timestamp of the last direction release (pass through next frame). */
  readonly nextLastReleaseTimeMs: number;
  /** Updated normalized release direction (pass through next frame). */
  readonly nextLastReleaseDir: { x: number; y: number } | null;
}

/**
 * Evaluate whether this frame armed a Burn Leap and update the
 * release-edge tracking. Pure — no side effects.
 *
 * Rules:
 *  - Release edge (prev non-zero, curr zero) updates `nextLastReleaseDir` +
 *    `nextLastReleaseTimeMs` to the normalized prev.
 *  - Press edge (prev zero, curr non-zero) fires the leap when: a recent
 *    release exists within {@link BURN_LEAP_DOUBLE_TAP_WINDOW_MS}, the
 *    press direction aligns with the release direction (dot ≥
 *    {@link BURN_LEAP_DIR_DOT_THRESHOLD}), and cooldown is clear.
 *  - Holding a direction (prev non-zero, curr non-zero) never triggers.
 *  - Idle (both zero) never triggers.
 */
export function evaluateBurnLeap(input: BurnLeapEvalInput): BurnLeapEvalResult {
  const { prevDir, currDir, nowMs, lastReleaseTimeMs, lastReleaseDir, cooldownActive } = input;

  const prevLen = Math.hypot(prevDir.x, prevDir.y);
  const currLen = Math.hypot(currDir.x, currDir.y);

  const prevHeld = prevLen >= BURN_LEAP_DIR_MIN_LEN;
  const currHeld = currLen >= BURN_LEAP_DIR_MIN_LEN;

  let nextLastReleaseTimeMs = lastReleaseTimeMs;
  let nextLastReleaseDir = lastReleaseDir;

  // Release edge — remember when + where the player let go.
  if (prevHeld && !currHeld) {
    nextLastReleaseTimeMs = nowMs;
    nextLastReleaseDir = { x: prevDir.x / prevLen, y: prevDir.y / prevLen };
    return { trigger: false, triggerDir: null, nextLastReleaseTimeMs, nextLastReleaseDir };
  }

  // Press edge — potential leap arm.
  if (!prevHeld && currHeld) {
    if (cooldownActive || !lastReleaseDir) {
      return { trigger: false, triggerDir: null, nextLastReleaseTimeMs, nextLastReleaseDir };
    }
    const elapsed = nowMs - lastReleaseTimeMs;
    if (elapsed < 0 || elapsed > BURN_LEAP_DOUBLE_TAP_WINDOW_MS) {
      return { trigger: false, triggerDir: null, nextLastReleaseTimeMs, nextLastReleaseDir };
    }
    const nx = currDir.x / currLen;
    const ny = currDir.y / currLen;
    const dot = nx * lastReleaseDir.x + ny * lastReleaseDir.y;
    if (dot < BURN_LEAP_DIR_DOT_THRESHOLD) {
      return { trigger: false, triggerDir: null, nextLastReleaseTimeMs, nextLastReleaseDir };
    }
    // Consume the release — otherwise a single press could arm repeatedly
    // while the window is still open.
    return {
      trigger: true,
      triggerDir: { x: nx, y: ny },
      nextLastReleaseTimeMs: nowMs - (BURN_LEAP_DOUBLE_TAP_WINDOW_MS + 1),
      nextLastReleaseDir: null,
    };
  }

  // Hold / idle — pass through unchanged.
  return { trigger: false, triggerDir: null, nextLastReleaseTimeMs, nextLastReleaseDir };
}
