/**
 * Pibroch Crescendo — beat-aligned damage bonus.
 *
 * Per DESIGN_IDEAS §1: "firing within ±80 ms of a music downbeat gains
 * a small damage bonus and a sting. Rewards rhythm." The mechanic is
 * intentionally subtle — a 15% multiplier, not a build-around — so the
 * skill ceiling is "lock onto the moor's heartbeat" rather than "spam
 * exact beats". The pibroch (`pìobaireachd`, the high pipe-music form)
 * lends the name: a slow ground-tune (`ùrlar`) where every beat counts.
 *
 * This module is framework-free and side-effect-free: callers feed in
 * `msSinceLastBeat` + `periodMs` (queried from the music engine) and
 * receive an alignment boolean. WeaponSystem.dealDamageToEnemy applies
 * the damage multiplier AND fires a soft A5 grace-note chime
 * (`audio.playPibrochSting()`) on aligned hits — the SFXManager
 * `pibroch_sting` slot caps at one chime per quarter-note so AOE
 * bursts on a single downbeat collapse to a single sting.
 *
 * Practical note: the live wiring queries on hit, not on fire (the
 * spec wording). For melee / aoe / aura weapons the two are the same;
 * for projectile weapons there's a small flight-time desync. Players
 * still learn to time fire to the beat because BPM > flight-time
 * typically, and the cleaner integration point pays its dust off in
 * a single hot path. A per-projectile fire-stamp upgrade is a future
 * enhancement when the on-fire choke is convenient to hook.
 */

/** ±80 ms tolerance window around each quarter-note downbeat. */
export const PIBROCH_WINDOW_MS = 80;
/** Multiplicative damage bonus on aligned hits. 1.15 = +15%. */
export const PIBROCH_DAMAGE_MULT = 1.15;

/**
 * True when `msSinceLastBeat` falls within ±`windowMs` of a downbeat.
 *
 * `msSinceLastBeat` is in [0, periodMs); the window straddles 0 (just
 * after the beat) and periodMs (just before the next beat) so the
 * "near the next beat" half wraps. A non-positive period (engine
 * stopped) returns false — no music, no rhythm bonus.
 */
export function isPibrochAligned(
  msSinceLastBeat: number,
  periodMs: number,
  windowMs: number = PIBROCH_WINDOW_MS,
): boolean {
  if (periodMs <= 0) return false;
  if (msSinceLastBeat < 0 || msSinceLastBeat >= periodMs) return false;
  if (windowMs <= 0) return false;
  // A beat counts when we're within `windowMs` AFTER the previous beat,
  // OR within `windowMs` BEFORE the next one.
  return msSinceLastBeat <= windowMs
    || msSinceLastBeat >= periodMs - windowMs;
}

/** Returns `damage * PIBROCH_DAMAGE_MULT` when aligned, else `damage`. */
export function applyPibrochDamage(damage: number, aligned: boolean): number {
  return aligned ? damage * PIBROCH_DAMAGE_MULT : damage;
}
