/**
 * Detects the XP-bar wrap-around that signals a level-up.
 *
 * When the player levels up, `xpFraction` resets from near-full (just
 * before the level-up card popup) to near-empty (after the card
 * applies). We watch for that transition by requiring the previous
 * frame to be >0.8 and the current frame to be <0.2 — wide margins
 * so the gate never mis-fires on an XP-spend-on-reroll or a tiny
 * partial-level edge.
 */

/** Previous frame must be at least this full to count as "just levelled". */
export const XP_FLASH_PREV_HIGH_THRESHOLD = 0.8;
/** Current frame must be at most this to count as the post-level reset. */
export const XP_FLASH_CURR_LOW_THRESHOLD = 0.2;

/**
 * True when the HUD should fire the level-up flash on this frame.
 * Pure predicate — scene reads it, then records `xpFraction` as
 * `prevXpFraction` for the next frame's check.
 */
export function shouldTriggerXpLevelUpFlash(prevFrac: number, currFrac: number): boolean {
  return prevFrac > XP_FLASH_PREV_HIGH_THRESHOLD && currFrac < XP_FLASH_CURR_LOW_THRESHOLD;
}
