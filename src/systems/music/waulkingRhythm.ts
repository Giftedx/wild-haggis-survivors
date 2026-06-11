/**
 * Waulking Mallet — soft rhythm bonus helper.
 *
 * Wild Living World Initiative Track 3 ("Rhythm-Coupled Weapon").
 * Goal: the music clock should *matter* in combat for the weapon,
 * without making muted / blocked audio create zero DPS.
 *
 * Shape:
 *   - `applyWaulkingRhythm(damage, aligned)` returns the rolled
 *     damage, optionally multiplied by `WAULKING_ALIGNED_MULT` when
 *     the hit lands inside the pibroch window.
 *   - Baseline damage is the weapon's "card" damage; this helper
 *     never *reduces* damage. Players who never hit a beat still
 *     get a functional weapon — they just don't get the bonus.
 *   - The aligned bonus is heavier than the global pibroch sting
 *     (`PIBROCH_DAMAGE_MULT` = 1.15) because the Waulking Mallet's
 *     identity is "the song hits with you". 1.30 keeps the
 *     ceiling well below "rhythm dominates the run".
 *
 * Framework-free so the math is unit-testable without booting
 * Phaser. `WeaponSystem.dealDamageToEnemy` queries the engine for
 * the alignment boolean and applies the right helper per weapon.
 */

/** Multiplier applied to a Waulking Mallet hit landed on a downbeat. */
export const WAULKING_ALIGNED_MULT = 1.3;

/** Same ±80 ms window the pibroch sting uses — kept consistent across rhythm features. */
export const WAULKING_WINDOW_MS = 80;

/**
 * Wild Living World Phase 2 — Pibroch Hammer evolution rhythm bonus.
 *
 * The Pibroch Hammer's identity is "the song already hit; the pibroch
 * is the echo coming back". Mechanically that lands as a heavier
 * aligned multiplier (+50 % vs base) AND a once-every-four-beats
 * crescendo: when the engine's beat counter rolls into a "downbeat
 * of the bar", the multiplier doubles further to +95 % over base.
 *
 * Both bonuses are gated on `aligned` — a player whose audio is
 * muted gets baseline damage and never sees the crescendo.
 *
 * Kept in the same module as Waulking Mallet so the rhythm-coupled
 * weapon family has one place to author multipliers and to lock the
 * "rhythm never reduces damage" promise.
 */
export const PIBROCH_ALIGNED_MULT = 1.5;
export const PIBROCH_CRESCENDO_MULT = 1.95;
/** Beats per crescendo cycle — every fourth beat lands the full pibroch hit. */
export const PIBROCH_CRESCENDO_PERIOD = 4;

/**
 * Wraps the engine's `isPibrochAligned` boolean. Splitting the API
 * so the weapon helper has an obvious "use this when aligned"
 * surface and the test suite can stub the boolean directly.
 */
export function applyWaulkingRhythm(damage: number, aligned: boolean): number {
  return aligned ? damage * WAULKING_ALIGNED_MULT : damage;
}

/**
 * Pibroch Hammer rhythm bonus. Caller passes the engine alignment
 * boolean AND the current beat index (modular into
 * `PIBROCH_CRESCENDO_PERIOD`). Beat indices < 0 collapse to "not a
 * crescendo" defensively so a malformed engine readout never blows
 * up the damage path. Same baseline-preserved promise as
 * `applyWaulkingRhythm` — unmuted but unaligned hits get full base
 * damage, never less.
 */
export function applyPibrochHammerRhythm(
  damage: number,
  aligned: boolean,
  beatIndex: number,
): number {
  if (!aligned) return damage;
  const isCrescendo =
    Number.isFinite(beatIndex) &&
    beatIndex >= 0 &&
    Math.floor(beatIndex) % PIBROCH_CRESCENDO_PERIOD === 0;
  return damage * (isCrescendo ? PIBROCH_CRESCENDO_MULT : PIBROCH_ALIGNED_MULT);
}

/**
 * Convenience predicate — wraps `isPibrochAligned` so callers don't
 * need to know about both rhythm features.
 *
 * Returning `false` when the engine's period is non-positive is the
 * crucial fallback: when audio is muted, the engine hasn't started,
 * or the user has disabled music, the period query degrades to 0
 * and the weapon falls through to baseline damage instead of
 * stalling waiting for a beat that never lands.
 */
export function isWaulkingBeatAligned(
  msSinceLastBeat: number,
  periodMs: number,
): boolean {
  if (!Number.isFinite(msSinceLastBeat) || !Number.isFinite(periodMs)) return false;
  if (periodMs <= 0) return false;
  if (msSinceLastBeat < 0 || msSinceLastBeat >= periodMs) return false;
  return msSinceLastBeat <= WAULKING_WINDOW_MS
    || msSinceLastBeat >= periodMs - WAULKING_WINDOW_MS;
}
