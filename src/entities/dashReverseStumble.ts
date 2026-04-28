/**
 * Falls-If-Turning gag — DESIGN_IDEAS §1 wild-haggis-myth tribute.
 *
 * Per the long-told joke about the wild haggis: with one set of legs
 * shorter than the other, it always circles the hill in the same
 * direction. Try to reverse course mid-circle and the beast falls
 * over. In WHS this becomes: if the player dashes in one direction
 * and then dashes back in roughly the opposite direction within a
 * short window, the haggis stumbles — a 400 ms speed-half penalty.
 *
 * Pure comedy; the penalty is forgiving (50 % speed for 0.4 s) so
 * an accidental reverse-dash won't ruin a run, but skilled players
 * notice and learn to commit to the curve. Pairs with The Drift as
 * a second mechanical fingerprint of the wild-haggis fiction.
 *
 * Refs: SCOTTISH_RESEARCH_DEEP.md §11.5 (wild-haggis legs-asymmetry
 * myth, two subspecies clockwise / anticlockwise).
 *
 * Pure helper — no Phaser, no scene state. Caller (Player.tryDash)
 * supplies the previous-dash direction + timestamp + the new dash
 * direction + current time, and reads back `didReverse`.
 */

/** How long the previous dash counts as "recent" for the gag. */
export const DASH_REVERSE_WINDOW_MS = 2_000;
/** Dot-product threshold below which two unit dirs count as reversed.
 *  -0.3 corresponds to ~108 ° turn — wider than perpendicular,
 *  tighter than 180 ° so the gag fires on "back the way I came"
 *  rather than every wide arc. */
export const DASH_REVERSE_DOT_THRESHOLD = -0.3;
/** How long the stumble penalty lasts. */
export const STUMBLE_DURATION_MS = 400;
/** Movement multiplier applied while stumbling. */
export const STUMBLE_SPEED_MUL = 0.5;

export interface UnitDir {
  readonly x: number;
  readonly y: number;
}

export interface DashReverseInput {
  /** Last completed dash direction (unit vector), or null if no prior dash. */
  readonly prevDir: UnitDir | null;
  /** Time of last completed dash (ms, scaled clock). null = never. */
  readonly prevDashTimeMs: number | null;
  /** Direction of the new dash (unit vector). */
  readonly newDir: UnitDir;
  /** Current scaled time (ms). */
  readonly currentTimeMs: number;
}

/**
 * Returns true when the new dash direction reverses a previous one
 * fast enough to trigger the gag. Defensive against null/zero-vector
 * inputs — both cases return false.
 */
export function detectDashReverse(input: DashReverseInput): boolean {
  if (input.prevDir === null || input.prevDashTimeMs === null) return false;
  const elapsed = input.currentTimeMs - input.prevDashTimeMs;
  if (elapsed < 0 || elapsed > DASH_REVERSE_WINDOW_MS) return false;
  const newLen = Math.hypot(input.newDir.x, input.newDir.y);
  const prevLen = Math.hypot(input.prevDir.x, input.prevDir.y);
  if (newLen < 0.0001 || prevLen < 0.0001) return false;
  // Inputs may not be exactly unit length — normalise here so callers
  // don't have to. Cheap enough at one dash per ~600 ms.
  const dot =
    (input.prevDir.x / prevLen) * (input.newDir.x / newLen) +
    (input.prevDir.y / prevLen) * (input.newDir.y / newLen);
  return dot < DASH_REVERSE_DOT_THRESHOLD;
}
