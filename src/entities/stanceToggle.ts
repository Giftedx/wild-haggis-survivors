/**
 * Stance Toggle — DESIGN_IDEAS §1 skill-layer mechanic.
 *
 * The Drift is the haggis's signature; Drift Mastery turns it from a
 * tax into a dance via burst input; Whisky Breath rides kill-stacks
 * for an AOE burst. Stance is the *third* expression layer: a
 * persistent mode that biases speed and drift, cycled on a single key.
 *
 * Three discrete stances form a tight risk/reward loop:
 *   - **Loose**   — neutral, the haggis's natural state. Run default.
 *   - **Braced**  — surefoot precision. Slower, drift halved. The
 *                   stance for threading hazard fields and bosses.
 *   - **Reeling** — berserker rush. Faster, drift amplified. The
 *                   stance for chasing pickups and exit-vectoring
 *                   when the moor's filling up behind you.
 *
 * No charge meter, no consumable — stance is a *mode* the player
 * sets and forgets between encounters. The cost is the cycle itself
 * (you pay attention, you press the key, drift behaves differently
 * for the next stretch). That's the whole loop.
 *
 * Pure helper — no Phaser, no scene state. Caller (Player) reads
 * the modifiers in its hot path and applies them alongside the other
 * speed/drift multipliers (Drift Mastery burst, Burn Leap boost,
 * slick/stumble debuffs). Replay-deterministic given identical
 * input streams (the cycle is just an edge-driven enum step).
 *
 * Refs: DESIGN_IDEAS.md §1 ("Stance Toggle (Braced / Loose / Reeling)
 * — cycle with [key]. Modifies drift, speed, defence. Skill layer for
 * veterans."). The "defence" axis from the sketchpad collapsed to
 * pure speed/drift in v1: defence touches damage-taken plumbing in
 * many systems and would broaden the contract; speed/drift compose
 * cleanly with the existing multiplier chain. A future v2 can fold
 * defence in once the iframe / damage-taken path settles.
 */

/** The three stance keys. Cycle order: loose → braced → reeling → loose. */
export type Stance = 'loose' | 'braced' | 'reeling';

/** Default stance at run start. Loose = the haggis's natural gait. */
export const DEFAULT_STANCE: Stance = 'loose';

/** Cycle order — used for both the cycle helper and HUD pip layout. */
export const STANCE_ORDER: readonly Stance[] = ['loose', 'braced', 'reeling'];

export interface StanceModifiers {
  /** Multiplier on `Player.moveSpeed` in the velocity-apply line.
   *  Composes multiplicatively with edge / slick / leap / burst muls. */
  readonly speedMul: number;
  /** Multiplier on `Player.driftDegrees` before the drift-matrix
   *  precompute. 0.4 = drift roughly halved-and-then-some; 1.0 =
   *  natural drift; 1.6 = drift heavily amplified. */
  readonly driftMul: number;
}

/**
 * The modifier table. Numbers picked for clear feel rather than
 * fine-grained balance: ±20-25% on speed gives a felt change without
 * making braced unplayable or reeling broken; the drift swing is
 * larger because drift is the haggis's identity stat — fiddling with
 * it should *feel* like changing posture.
 */
const MODIFIERS: Record<Stance, StanceModifiers> = {
  loose:   { speedMul: 1.0,  driftMul: 1.0 },
  braced:  { speedMul: 0.80, driftMul: 0.4 },
  reeling: { speedMul: 1.25, driftMul: 1.6 },
};

/** Read the modifier table for a stance. Pure lookup. */
export function getStanceModifiers(stance: Stance): StanceModifiers {
  return MODIFIERS[stance];
}

/**
 * Advance to the next stance in cycle order. Wraps loose ← reeling.
 * Pure — same input always returns same output. Caller is responsible
 * for debouncing the input edge so a held key doesn't spin the cycle.
 */
export function cycleStance(current: Stance): Stance {
  const i = STANCE_ORDER.indexOf(current);
  // Defensive guard if a corrupted save somehow held a non-member
  // string; fall back to the start of the cycle so the player never
  // gets stuck on a stance that doesn't exist in the table.
  if (i < 0) return STANCE_ORDER[0];
  return STANCE_ORDER[(i + 1) % STANCE_ORDER.length];
}
