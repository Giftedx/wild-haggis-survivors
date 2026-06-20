/**
 * The Moor Remembers — persistent cross-run death markers.
 *
 * Each fallen run records a `FallenCairn` to `whs_meta_save.fallenCairns`.
 * On future runs the cairns materialise at their saved coords; walking
 * over one fires a whispered past-self line + a small inherited buff in
 * whichever stat that past-self was strongest in.
 *
 * Pure module — no Phaser, no scene state. Spec:
 * `docs/archive/superpowers/specs/2026-05-22-the-moor-remembers-design.md`.
 */

/** Stat the past-self leveled most — drives the +1 % inherited buff. */
export type InheritedStatKey =
  | 'damage'
  | 'speed'
  | 'pickupRadius'
  | 'critChance'
  | 'cooldown'
  | 'driftResist';

export interface FallenCairn {
  /** World X at the moment of death. */
  readonly x: number;
  /** World Y at the moment of death. */
  readonly y: number;
  /** Death cause string tag (matches `GameOverPayload.deathCause.tag`). */
  readonly cause: string;
  /** Variant the haggis was running. Routes variant-voiced whispers. */
  readonly variantKey: string;
  /** Time survived in ms. */
  readonly timeSurvivedMs: number;
  /** Best stat the past-self leveled. Drives the +1 % inherited buff. */
  readonly inheritedStat: InheritedStatKey;
  /** Unix ms timestamp — FIFO rotation order. */
  readonly savedAt: number;
  /** V2 (Cailleach Gauntlet) — gold-wreath visual + doubled inherited buff. */
  readonly wreathedAt?: number;
  /** V2 (Cailleach Gauntlet) — cold-extinguish visual; buff unchanged. */
  readonly extinguishedAt?: number;
}

export const FALLEN_CAIRN_CAP = 50;
export const CAIRN_RENDER_RADIUS_PX = 600;
export const CAIRN_TOUCH_RADIUS_PX = 42;
export const CAIRN_INHERITED_BUFF_PCT = 0.01;
export const GRANDFATHER_WHISPER_CHANCE = 0.01;
/** V2 — wreathed cairns confer double the V1 inherited buff. */
export const WREATHED_INHERITED_BUFF_PCT = 0.02;

/**
 * Append a cairn; FIFO-rotate oldest out when the list would exceed the
 * cap. Pure — does not mutate `existing`.
 */
export function recordFallenCairn(
  existing: readonly FallenCairn[],
  next: FallenCairn,
  cap: number = FALLEN_CAIRN_CAP,
): FallenCairn[] {
  const out = [...existing, next];
  if (out.length > cap) out.splice(0, out.length - cap);
  return out;
}

/**
 * V2 — return a new array with the named cairns wreathed. Any prior
 * `extinguishedAt` on a target cairn is cleared (a successful gauntlet
 * redeems a prior loss). Idempotent: already-wreathed cairns preserve
 * their original `wreathedAt`.
 *
 * Pure — does not mutate `cairns`.
 */
export function markWreathed(
  cairns: readonly FallenCairn[],
  savedAts: readonly number[],
  now: number,
): FallenCairn[] {
  const target = new Set(savedAts);
  return cairns.map((c) => {
    if (!target.has(c.savedAt)) return c;
    if (c.wreathedAt !== undefined) return c; // idempotent
    // Spread without `extinguishedAt` so the wreath supersedes a prior loss.
    const { extinguishedAt: _drop, ...rest } = c;
    return { ...rest, wreathedAt: now };
  });
}

/**
 * V2 — return a new array with the named cairns extinguished, UNLESS
 * the cairn is already wreathed (wreath wins — a permanent mark cannot
 * be un-marked by a later loss). Idempotent on already-extinguished
 * cairns.
 *
 * Pure — does not mutate `cairns`.
 */
export function markExtinguished(
  cairns: readonly FallenCairn[],
  savedAts: readonly number[],
  now: number,
): FallenCairn[] {
  const target = new Set(savedAts);
  return cairns.map((c) => {
    if (!target.has(c.savedAt)) return c;
    if (c.wreathedAt !== undefined) return c; // wreath wins precedence
    if (c.extinguishedAt !== undefined) return c; // idempotent
    return { ...c, extinguishedAt: now };
  });
}
