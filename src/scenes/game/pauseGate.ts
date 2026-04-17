/**
 * Pause-menu open/close gating.
 *
 * A pause press is ignored when another modal already owns time:
 * level-up card picker, run-start countdown, run-end ceremony, or
 * the FTUE tutorial overlays (movement + gem). Collecting these
 * tokens in one list makes it obvious what competes with the pause
 * menu and gives tests a single surface to pin the set.
 */

/** TimeManager tokens that, if held, block opening the pause menu. */
export const PAUSE_BLOCKING_TOKENS: readonly string[] = [
  'LEVEL_UP',
  'COUNTDOWN',
  'RUN_END',
  'TUTORIAL_MOVE',
  'TUTORIAL_GEM',
];

/**
 * Returns true when the player can open the pause menu right now.
 * Caller supplies a `has(token)` predicate so the helper is
 * independent of the TimeManager class (pure, trivially testable).
 */
export function canOpenPauseMenu(has: (token: string) => boolean): boolean {
  for (const token of PAUSE_BLOCKING_TOKENS) {
    if (has(token)) return false;
  }
  return true;
}
