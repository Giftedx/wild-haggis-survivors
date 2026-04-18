/**
 * Memory Trail — DESIGN_IDEAS § 1 M16.
 *
 * "In fog, your last few seconds of path remain; enemies crossing
 * your trail are briefly slowed."
 *
 * Decomposed into two pure helpers so the cadence + overlap math
 * tests without Phaser:
 *  - `tickMemoryTrailEmit` decides when a new trail segment should
 *    drop, and how many the accumulator owes from one tick (a single
 *    long frame can emit multiple segments back-to-back so the trail
 *    stays continuous under a lag spike).
 *  - `memoryTrailOverlaps` checks whether a point is inside a trail
 *    segment's slow disc. Squared-compare — no sqrt per enemy × seg.
 *
 * HazardZones.tick glues both together with the enemy group and a
 * per-tick call to Enemy.applyFreeze.
 */

/** How often a new trail segment drops while in fog (ms). */
export const MEMORY_TRAIL_EMIT_INTERVAL_MS = 130;
/** Each segment's slow radius (px). */
export const MEMORY_TRAIL_RADIUS_PX = 28;
/** Each segment's lifetime (ms) before it fades + is culled. */
export const MEMORY_TRAIL_DURATION_MS = 2100;
/** Multiplier applied to enemy speed while they overlap a segment. */
export const MEMORY_TRAIL_SLOW_MUL = 0.55;
/** Duration of the slow applied per overlap tick (ms). */
export const MEMORY_TRAIL_SLOW_MS = 320;
/** Safety cap on segments dropped in a single frame (prevents a lag-spike
 *  runaway when `scaledDelta` momentarily spikes to multiple seconds). */
const MAX_EMITS_PER_TICK = 6;

export interface MemoryTrailEmitTickInput {
  /** True when the player is currently standing inside a fog zone. */
  readonly inFog: boolean;
  /** Time accumulator carried between ticks. */
  readonly accMs: number;
  /** Delta this tick (scaled time). */
  readonly scaledDelta: number;
}

export interface MemoryTrailEmitTickResult {
  /** Updated accumulator for the next tick. */
  readonly nextAccMs: number;
  /** How many segments to drop this tick, in [0, MAX_EMITS_PER_TICK]. */
  readonly emitCount: number;
}

/**
 * Tick the emit accumulator. Returns how many trail segments to drop
 * this frame and the accumulator value to carry forward. Resets to 0
 * when the player is out of fog so stepping back into the haar
 * starts a fresh cadence instead of dumping a cluster on re-entry.
 */
export function tickMemoryTrailEmit(input: MemoryTrailEmitTickInput): MemoryTrailEmitTickResult {
  if (!input.inFog) {
    return { nextAccMs: 0, emitCount: 0 };
  }
  if (input.scaledDelta <= 0) {
    return { nextAccMs: input.accMs, emitCount: 0 };
  }
  const acc = input.accMs + input.scaledDelta;
  let emits = Math.floor(acc / MEMORY_TRAIL_EMIT_INTERVAL_MS);
  if (emits > MAX_EMITS_PER_TICK) emits = MAX_EMITS_PER_TICK;
  const next = acc - emits * MEMORY_TRAIL_EMIT_INTERVAL_MS;
  return { nextAccMs: next, emitCount: emits };
}

/**
 * True when `(px, py)` lies inside a memory-trail segment's slow disc.
 * Squared-compare keeps the hot enemy-scan loop sqrt-free.
 */
export function memoryTrailOverlaps(
  segX: number,
  segY: number,
  segR: number,
  px: number,
  py: number,
): boolean {
  const dx = px - segX;
  const dy = py - segY;
  return dx * dx + dy * dy < segR * segR;
}
