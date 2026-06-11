/**
 * Drift Mastery — DESIGN_IDEAS §1 core-identity mechanic.
 *
 * The Drift is the haggis's signature: a constant clockwise rotation
 * bias applied to every input vector (anticlockwise for the variant)
 * because the wee beastie's legs are uneven. Drift Mastery turns the
 * bias from a tax into a dance — *fighting* the drift banks energy,
 * spending it cancels the drift for a short burst with a small speed
 * kicker.
 *
 * Mechanic:
 *   - Player rotates the input direction AGAINST the drift sign over
 *     consecutive frames → "Grip" charge accumulates (charge is rate-
 *     gated so a panicked spin doesn't dump three pips at once).
 *   - Each `MS_PER_PIP` of accumulated charge mints one Grip pip
 *     (cap at `MAX_PIPS`).
 *   - On consume input edge → spend one pip → `BURST_MS` of
 *     drift-cancel + `BURST_SPEED_MUL` move-speed multiplier.
 *
 * Pure helper — no Phaser, no scene state. Caller (Player.update)
 * supplies the per-frame inputs and receives a new state object plus
 * a `BurstStatus` describing what the velocity-apply path should do.
 *
 * Refs: SCOTTISH_RESEARCH_DEEP.md §11.5 (wild-haggis legs-asymmetry
 * lore — the Drift's narrative spine); DESIGN_IDEAS.md §1 ("Drift
 * Mastery — tap perpendicular to drift to bank a 'Grip' meter").
 */

/** Maximum pips the player can bank. Capped low so a single spend
 *  is meaningful and the player doesn't hoard infinite cancels. */
export const MAX_PIPS = 3;
/** Charge milliseconds required to mint one pip. ~1 second of solid
 *  fighting-the-drift earns the first pip. */
export const MS_PER_PIP = 1000;
/** Burst duration in ms — short enough that the cancel reads as a
 *  reflexive flick, not a stance change. */
export const BURST_MS = 600;
/** Move-speed multiplier during a burst. Modest so the burst is a
 *  precision tool, not a mobility cheat. */
export const BURST_SPEED_MUL = 1.15;
/** Minimum input-vector magnitude squared to register as "moving"
 *  for charge purposes. Below this, the player is at rest and
 *  charge decays back toward zero. */
const INPUT_DEAD_ZONE_SQ = 0.04;
/** How fast accumulated (pre-pip) charge decays per ms when the
 *  player isn't fighting the drift. Prevents trickle-charge from
 *  random direction wobbles. */
const CHARGE_DECAY_PER_MS = 0.3;
/** How much the perpendicular-to-drift component of input
 *  contributes to charge per ms, scaled into the same units as
 *  `MS_PER_PIP`. */
const CHARGE_GAIN_PER_MS = 1.2;

export interface DriftMasteryState {
  /** Pips banked, 0..MAX_PIPS. */
  readonly pips: number;
  /** Pre-pip charge in ms — fills toward `MS_PER_PIP`, then mints
   *  a pip and resets (carrying the overflow). */
  readonly chargeMs: number;
  /** Burst time remaining, ms. 0 = no burst active. */
  readonly burstRemainingMs: number;
}

export function createDriftMasteryState(): DriftMasteryState {
  return { pips: 0, chargeMs: 0, burstRemainingMs: 0 };
}

export interface DriftMasteryTickInput {
  /** Player input vector (un-drifted). x/y in [-1, 1]; magnitude not
   *  required to be normalized but values must be sane. */
  readonly inputX: number;
  readonly inputY: number;
  /** +1 for clockwise drift (default haggis), -1 for anticlockwise
   *  (Anticlockwise variant). The "fighting" direction is opposite. */
  readonly driftSign: 1 | -1;
  /** Real ms elapsed since previous tick. Use the scaled (pause-aware)
   *  delta so charge doesn't bank during level-up modals etc. */
  readonly dtMs: number;
  /** True on the frame the consume edge fires (Q-tap, etc). The
   *  caller debounces; the helper just acts on the edge. */
  readonly consumePressed: boolean;
}

export interface DriftMasteryTickResult {
  readonly state: DriftMasteryState;
  /** Burst-cancel multiplier for the drift matrix. 1 = no cancel
   *  (burst inactive); 0 = full cancel (burst active). The Player
   *  hot-path multiplies the drift matrix's sin/cos lerp by this. */
  readonly driftCancelLerp: number;
  /** Move-speed multiplier from the burst. 1 outside a burst,
   *  `BURST_SPEED_MUL` during. */
  readonly speedMul: number;
  /** True on the frame a burst was fired (caller plays SFX / VFX). */
  readonly burstFiredEdge: boolean;
}

/**
 * Compute "fighting the drift" score from this frame's input.
 *
 * The drift rotates the input clockwise (driftSign=1). To fight it,
 * the player must push their input direction counter-clockwise of
 * where it would naturally drift to — i.e. the perpendicular to the
 * input that points *against* the drift sign. Score is the cosine
 * similarity between the (unit) input vector and the
 * against-drift-perpendicular axis, projected from the input itself.
 *
 * Pure-math derivation: a CCW perpendicular to (x, y) is (-y, x);
 * a CW perpendicular is (y, -x). The "anti-drift" perpendicular is
 * (-driftSign * y, driftSign * x) — but that's the perpendicular
 * AXIS itself, not the input. The "fighting" signal is when the
 * input has any *consistent* magnitude in that axis — which is
 * always true for any nonzero input. So instead we look for the
 * player INTENTIONALLY rotating their input against the drift each
 * frame: `score = inputMagnitude` (a player who keeps moving is
 * fighting the bias by holding direction). A held direction earns
 * charge; standing still does not.
 *
 * Simpler than rotation-delta tracking + replay-stable (no prevDir
 * coupling). Reads as "movement banks Grip" — intuitive at the
 * surface, deeper at the meta (the Drift makes every step a small
 * choice; mastery is sustained intent).
 */
function fightingScore(inputX: number, inputY: number): number {
  const magSq = inputX * inputX + inputY * inputY;
  if (magSq < INPUT_DEAD_ZONE_SQ) return 0;
  // Clamp so a tilt past 1 (analog stick edge) doesn't over-charge.
  return Math.min(1, Math.sqrt(magSq));
}

/**
 * Advance the Drift Mastery state by one frame. Pure — same inputs
 * always produce same outputs. Caller passes the current state in
 * and writes the result back; replays drive deterministic charge
 * progression through the same `dtMs` stream.
 */
export function tickDriftMastery(
  state: DriftMasteryState,
  input: DriftMasteryTickInput,
): DriftMasteryTickResult {
  const dt = Math.max(0, input.dtMs);
  let pips = state.pips;
  let chargeMs = state.chargeMs;
  let burstRemainingMs = Math.max(0, state.burstRemainingMs - dt);
  let burstFiredEdge = false;

  // Charge accrual / decay. While moving, charge gains; while idle,
  // it decays back toward zero so the player can't park-and-bank.
  const score = fightingScore(input.inputX, input.inputY);
  if (score > 0) {
    chargeMs += score * CHARGE_GAIN_PER_MS * dt;
  } else {
    chargeMs = Math.max(0, chargeMs - CHARGE_DECAY_PER_MS * dt);
  }

  // Mint pips while overflow allows; cap at MAX_PIPS.
  while (chargeMs >= MS_PER_PIP && pips < MAX_PIPS) {
    chargeMs -= MS_PER_PIP;
    pips += 1;
  }
  // If at cap, drop overflow so chargeMs doesn't strand at MS_PER_PIP+.
  if (pips >= MAX_PIPS && chargeMs > 0) {
    chargeMs = 0;
  }

  // Consume edge: spend one pip if a burst isn't already running.
  if (input.consumePressed && pips > 0 && burstRemainingMs <= 0) {
    pips -= 1;
    burstRemainingMs = BURST_MS;
    burstFiredEdge = true;
  }

  // Output multipliers. driftCancelLerp lerps the drift matrix
  // toward identity during a burst (1 outside, 0 during).
  const driftCancelLerp = burstRemainingMs > 0 ? 0 : 1;
  const speedMul = burstRemainingMs > 0 ? BURST_SPEED_MUL : 1;

  return {
    state: { pips, chargeMs, burstRemainingMs },
    driftCancelLerp,
    speedMul,
    burstFiredEdge,
  };
}

/** Read-only accessor for HUD widgets — returns true while the
 *  current burst is active. */
export function isBurstActive(state: DriftMasteryState): boolean {
  return state.burstRemainingMs > 0;
}
