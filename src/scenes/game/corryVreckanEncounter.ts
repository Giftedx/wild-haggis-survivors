/**
 * Corryvreckan Encounter — pure state machine + whirlpool force math.
 *
 * The Cailleach's washing-pot: a hazard-arena encounter that fires once
 * per run when the player enters the corryvreckan biome past the 90 s
 * threshold. The whirlpool pulls the player and enemies radially toward
 * its centre (with a clockwise tangential spin that mirrors the haggis's
 * drift bias). Survive 45 s without entering the lethal inner radius and
 * the whirlpool collapses — yielding a legendary chest.
 *
 * No Phaser imports. The install wrapper (`installCorryVreckan.ts`) owns
 * the Graphics objects, tween, and physics side-effects. This file is
 * fully unit-testable in a Node environment.
 *
 * Ref: SCOTTISH_RESEARCH.md §1.8; DESIGN_IDEAS.md §3 "The Corryvreckan".
 */

// ── Constants ────────────────────────────────────────────────────────────────

/** Run-seconds that must elapse before the encounter can trigger. */
export const CORRYVRECKAN_TRIGGER_SEC = 90;

/** Warning phase: whirlpool visible, pull at 30 % strength. */
export const CORRYVRECKAN_WARN_DURATION_SEC = 10;

/** Survival phase: full pull; player must stay outside inner radius. */
export const CORRYVRECKAN_ACTIVE_DURATION_SEC = 45;

/** Pull force begins at this distance from centre (px). */
export const CORRYVRECKAN_OUTER_RADIUS = 360;

/**
 * Inner lethal radius (px). Entering this deals 35 % max-HP damage and
 * ends the encounter as 'failed'.
 */
export const CORRYVRECKAN_INNER_RADIUS = 55;

/**
 * Peak pull acceleration at the centre (px/s²). Drops linearly to 0 at
 * the outer radius. At 90 px from centre the acceleration is ~90 px/s²;
 * a player with base speed 140 can hold station by moving tangentially.
 */
export const CORRYVRECKAN_PULL_BASE = 120;

/**
 * Fraction of pull force applied as clockwise tangential spin (0..1).
 * 0.35 = 35 % spin, 65 % radial pull — matches the Cailleach's-plaid
 * washing motion and complements the haggis's own clockwise drift bias.
 */
export const CORRYVRECKAN_TANGENTIAL_RATIO = 0.35;

/**
 * Pull-force multiplier applied during the warning phase. Gives the player
 * 10 s to notice the whirlpool before full force engages.
 */
export const CORRYVRECKAN_WARN_PULL_MUL = 0.30;

// ── State machine ─────────────────────────────────────────────────────────────

export type CorryVreckanPhase =
  | 'idle'      // Waiting for trigger conditions
  | 'warning'   // Whirlpool visible, partial pull (WARN_DURATION_SEC)
  | 'active'    // Full pull; player must survive ACTIVE_DURATION_SEC
  | 'survived'  // Player survived — chest reward fires
  | 'failed';   // Player entered inner radius — HP damage fires

export interface CorryVreckanState {
  readonly phase: CorryVreckanPhase;
  /** World-space centre of the whirlpool. Only valid in warning/active/resolved. */
  readonly wx: number;
  readonly wy: number;
  /** Game-seconds at which the current phase started. */
  readonly phaseStartSec: number;
}

export function initialCorryVreckanState(): CorryVreckanState {
  return { phase: 'idle', wx: 0, wy: 0, phaseStartSec: 0 };
}

export interface CorryVreckanTickInput {
  readonly gameTimeSec: number;
  readonly currentBiomeId: string | null;
  readonly playerX: number;
  readonly playerY: number;
  /**
   * World-space spawn coordinates, pre-computed by the install wrapper
   * using seeded runRng. The state machine reads these once when it
   * transitions out of 'idle'; subsequent ticks ignore them.
   */
  readonly spawnX: number;
  readonly spawnY: number;
  readonly isPlayerDead: boolean;
  readonly isVictoryPending: boolean;
}

/**
 * Pure state transition. Returns the same reference if nothing changed
 * (allows cheap identity-equality checks in the scheduler).
 */
export function advanceCorryVreckan(
  state: CorryVreckanState,
  input: CorryVreckanTickInput,
): CorryVreckanState {
  // Terminal states — never leave once reached.
  if (state.phase === 'survived' || state.phase === 'failed') return state;

  // Gameplay-paused equivalents: don't advance if the run is over.
  if (input.isPlayerDead || input.isVictoryPending) return state;

  const { gameTimeSec, currentBiomeId, playerX, playerY } = input;

  // ── idle → warning ──────────────────────────────────────────────────
  if (state.phase === 'idle') {
    if (
      currentBiomeId === 'corryvreckan' &&
      gameTimeSec >= CORRYVRECKAN_TRIGGER_SEC
    ) {
      return {
        phase: 'warning',
        wx: input.spawnX,
        wy: input.spawnY,
        phaseStartSec: gameTimeSec,
      };
    }
    return state;
  }

  const elapsedSec = gameTimeSec - state.phaseStartSec;

  // ── warning → active ────────────────────────────────────────────────
  if (state.phase === 'warning') {
    if (elapsedSec >= CORRYVRECKAN_WARN_DURATION_SEC) {
      return { ...state, phase: 'active', phaseStartSec: gameTimeSec };
    }
    return state;
  }

  // ── active → survived | failed ──────────────────────────────────────
  if (state.phase === 'active') {
    const dist = Math.hypot(playerX - state.wx, playerY - state.wy);
    if (dist < CORRYVRECKAN_INNER_RADIUS) {
      return { ...state, phase: 'failed' };
    }
    if (elapsedSec >= CORRYVRECKAN_ACTIVE_DURATION_SEC) {
      return { ...state, phase: 'survived' };
    }
    return state;
  }

  return state;
}

// ── Force math ────────────────────────────────────────────────────────────────

export interface WhirlpoolForce {
  /** Acceleration in px/s² to add to the entity's velocity this frame. */
  readonly fx: number;
  readonly fy: number;
}

/**
 * Compute the whirlpool pull acceleration (px/s²) at position (px, py)
 * given a whirlpool centre at (wx, wy).
 *
 * - Radial component: pulls toward the centre.
 * - Tangential component: clockwise spin (complements the haggis drift).
 * - Linear falloff: zero at CORRYVRECKAN_OUTER_RADIUS, peak at centre.
 * - `strengthMul`: scale the whole result (0.30 during warning phase).
 *
 * Returns { fx:0, fy:0 } outside the outer radius or at the centre
 * (distance 0 guard avoids division-by-zero).
 */
export function computeWhirlpoolPull(
  px: number,
  py: number,
  wx: number,
  wy: number,
  strengthMul = 1.0,
): WhirlpoolForce {
  const dx = wx - px;
  const dy = wy - py;
  const dist = Math.hypot(dx, dy);

  if (dist <= 0 || dist >= CORRYVRECKAN_OUTER_RADIUS) {
    return { fx: 0, fy: 0 };
  }

  // Linear falloff: t = 1 at centre, 0 at outer edge.
  const t = 1 - dist / CORRYVRECKAN_OUTER_RADIUS;
  const strength = CORRYVRECKAN_PULL_BASE * t * strengthMul;

  // Radial unit vector (toward centre).
  const nx = dx / dist;
  const ny = dy / dist;

  // Tangential unit vector: 90° clockwise from radial.
  // For a vector (nx, ny) the 90° CW rotation is (ny, -nx).
  const tx = ny;
  const ty = -nx;

  const radialW = 1 - CORRYVRECKAN_TANGENTIAL_RATIO;
  const tangW = CORRYVRECKAN_TANGENTIAL_RATIO;

  return {
    fx: (nx * radialW + tx * tangW) * strength,
    fy: (ny * radialW + ty * tangW) * strength,
  };
}
