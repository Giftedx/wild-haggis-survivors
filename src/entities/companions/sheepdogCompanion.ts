/**
 * Sheepdog companion — pure follow integrator.
 *
 * Pulled out as a framework-free helper so the math has unit-test
 * coverage independent of Phaser. The Phaser orchestrator
 * (`CompanionSystem`) reads the live player position, calls
 * `stepFollow`, then writes the sprite back. No randomness, no
 * timers, no allocations per frame.
 *
 * Behaviour shape:
 *   - The companion trails behind the player at `followDistance`, in
 *     the direction opposite to the player's motion vector. When the
 *     player stands still the companion drifts to a stop at the
 *     current tail position.
 *   - If the companion strays beyond `tetherDistance` (an off-screen
 *     teleport, a scene reuse, an unlucky pathing case), `stepFollow`
 *     yanks it back to the tail position next frame.
 *   - The integrator is a simple critically-damped spring (constant
 *     `damping` × distance-error), which keeps the curve readable
 *     without RK4 cost.
 *
 * Determinism contract: nothing in here calls Math.random or reads
 * wall-clock time. Same inputs → same outputs, frame-for-frame.
 */

import type { CompanionDef } from './companionTypes';

export interface SheepdogState {
  x: number;
  y: number;
  /** Animation phase — accumulator for two-frame idle wobble. */
  animPhaseSec: number;
}

export interface PlayerSnapshot {
  readonly x: number;
  readonly y: number;
  /** Player movement vector this frame (px/sec). Zeroes are fine. */
  readonly vx: number;
  readonly vy: number;
}

export interface StepFollowResult {
  /** Computed next position. */
  readonly x: number;
  readonly y: number;
  /** True if a tether snap fired this frame (used by orchestrator for FX). */
  readonly snapped: boolean;
  /** Animation frame index (0 or 1) given updated phase. */
  readonly frameIndex: 0 | 1;
}

/**
 * Compute the next sheepdog position for `dtSec` seconds of elapsed
 * gameplay. Caller is responsible for honouring scene-pause — when
 * the gameplay tick is paused (`tickFrameHeader` returned 'paused'),
 * skip the call entirely so the companion freezes with the rest of
 * the world.
 */
export function stepFollow(
  state: SheepdogState,
  player: PlayerSnapshot,
  def: CompanionDef,
  dtSec: number,
): StepFollowResult {
  // Compute the target tail position: `followDistance` pixels behind
  // the player in the opposite direction of motion. When the player
  // is essentially still, fall back to the +X tail vector (matches
  // the haggis idle facing).
  const speed = Math.hypot(player.vx, player.vy);
  let dirX = 1;
  let dirY = 0;
  if (speed > 1e-3) {
    dirX = player.vx / speed;
    dirY = player.vy / speed;
  }
  const targetX = player.x - dirX * def.followDistance;
  const targetY = player.y - dirY * def.followDistance;

  // Tether snap — if the dog is more than `tetherDistance` from the
  // player itself, yank it to the tail position rather than running
  // a slow follow across the map.
  const dxPlayer = state.x - player.x;
  const dyPlayer = state.y - player.y;
  const distFromPlayer = Math.hypot(dxPlayer, dyPlayer);
  if (distFromPlayer > def.tetherDistance) {
    return {
      x: targetX,
      y: targetY,
      snapped: true,
      frameIndex: 0,
    };
  }

  // Critically-damped spring toward the target — strength scales with
  // (target - state). 1/τ = 6 gives a ~0.17 s settle time.
  const tauInv = 6;
  const step = Math.min(1, dtSec * tauInv);
  let nx = state.x + (targetX - state.x) * step;
  let ny = state.y + (targetY - state.y) * step;

  // Cap velocity so a long teleport jump doesn't manifest as warp-speed
  // catch-up after a few frames. maxSpeed × dt is the per-frame budget.
  const moveDx = nx - state.x;
  const moveDy = ny - state.y;
  const moveDist = Math.hypot(moveDx, moveDy);
  const budget = def.maxSpeed * dtSec;
  if (moveDist > budget && moveDist > 0) {
    const k = budget / moveDist;
    nx = state.x + moveDx * k;
    ny = state.y + moveDy * k;
  }

  // Two-frame idle anim — phase wraps every 2*idleFrameSec.
  const period = def.idleFrameSec * 2;
  let phase = state.animPhaseSec + dtSec;
  if (period > 0) {
    while (phase >= period) phase -= period;
  }
  const frameIndex: 0 | 1 = phase < def.idleFrameSec ? 0 : 1;

  // The state mutation is the caller's responsibility — we hand back
  // the new values so unit tests can assert without spying on writes.
  return {
    x: nx,
    y: ny,
    snapped: false,
    frameIndex,
  };
}

/**
 * Place the companion at the canonical tail position for the given
 * player snapshot. Used on whistle-call / scene-reuse / tether snap
 * so the first frame doesn't start out of place.
 */
export function tailPosition(player: PlayerSnapshot, def: CompanionDef): { x: number; y: number } {
  const speed = Math.hypot(player.vx, player.vy);
  let dirX = 1;
  let dirY = 0;
  if (speed > 1e-3) {
    dirX = player.vx / speed;
    dirY = player.vy / speed;
  }
  return {
    x: player.x - dirX * def.followDistance,
    y: player.y - dirY * def.followDistance,
  };
}
