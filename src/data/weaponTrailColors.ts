/**
 * Weapon-specific projectile trail palettes. Each entry is a 3-color
 * gradient sampled randomly per particle — shades read as "heather" /
 * "ember" / "loch" etc rather than a flat hue.
 *
 * Evolved weapons override with a gold overlay regardless of family —
 * mastery visually outranks weapon identity.
 */
export const WEAPON_TRAIL_COLORS: Readonly<Record<string, readonly number[]>> = {
  thistle_shot: [0x9966cc, 0xaa77dd, 0x8855bb], // purple — heather
  caber_toss: [0xcc7733, 0xdd8844, 0xbb6622], // ember — burning wood
  haggis_hurler: [0x8b6914, 0x9a7822, 0x7a5a0a], // brown — haggis
  scotch_mist: [0x6699aa, 0x77aacc, 0x5588aa], // cyan — misty water
  nessie_tentacle: [0x226644, 0x338855, 0x1a5533], // murky green — loch
  claymore: [0x8899aa, 0x99aabb, 0x778899], // steel — metal
  bagpipe_blast: [0x4488ff, 0x5599ff, 0x3377ee], // blue — sonic
};

/** Shared palette for evolved-weapon trails (overrides family). */
export const EVOLVED_TRAIL_COLORS: readonly number[] = [0xffcc44, 0xffdd66, 0xd4a017];

/** Fallback palette when weaponKey is unknown. Matches thistle_shot (heather). */
export const DEFAULT_TRAIL_COLORS: readonly number[] = [0x9966cc, 0xaa77dd, 0x8855bb];

/**
 * Pick a trail color for a projectile. Pure function — callers supply their
 * own PRNG to keep determinism in seeded runs.
 */
export function pickTrailColor(
  weaponKey: string,
  evolved: boolean,
  randomUnitInterval: number,
): number {
  const palette = evolved
    ? EVOLVED_TRAIL_COLORS
    : WEAPON_TRAIL_COLORS[weaponKey] ?? DEFAULT_TRAIL_COLORS;
  const idx = Math.min(palette.length - 1, Math.max(0, Math.floor(randomUnitInterval * palette.length)));
  return palette[idx];
}
